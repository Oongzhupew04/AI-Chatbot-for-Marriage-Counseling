from database import db
from models.chat import Chat
from models.message import Message

class ChatRepository:
    """Handles all chat and message database operations."""
    
    def create_chat(self, user_id):
        """Create a new chat session and return the chat_id."""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            chat_query = "INSERT INTO chats (user_id) VALUES (?) RETURNING id"
            cursor.execute(chat_query, (user_id,))
            
            chat_id = cursor.fetchone()[0]
            conn.commit()
            cursor.close()
            
            return Chat(id=chat_id, user_id=user_id)
        except Exception as e:
            print(f"Error creating chat: {e}")
            return None
    
    def log_message(self, chat_id, user_msg, bot_msg):
        """Log a message to an existing chat and return message_id."""
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            msg_query = """
                INSERT INTO messages (chat_id, timestamp, user_message, bot_response)
                VALUES (?, CURRENT_TIMESTAMP, ?, ?) RETURNING id
            """
            cursor.execute(msg_query, (chat_id, user_msg, bot_msg))
            message_id = cursor.fetchone()[0]
            conn.commit()
            cursor.close()
            
            return message_id
        except Exception as e:
            if conn:
                conn.rollback()

            print(f"Error logging message: {e}")
            return None

    
    def get_chat_history(self, chat_id: int):
        """Fetch all messages for a specific chat ID."""
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            query = """
                SELECT user_message, bot_response
                FROM messages
                WHERE chat_id = ?
                ORDER BY timestamp ASC
            """
            cursor.execute(query, (chat_id,))
            rows = cursor.fetchall()
            
            # Transform the DB rows into the exact format React expects!
            history = []
            for row in rows:
                if row[0]: # user_message
                    history.append({"sender": "user", "text": row[0]})
                if row[1]: # bot_response
                    history.append({"sender": "bot", "text": row[1]})
                    
            cursor.close()
            return history
        except Exception as e:
            print(f"Error fetching history: {e}")
            return []

    def get_user_sessions(self, user_id: int):
        """Fetch all chat sessions for a user, sorted by newest first."""
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            # Get the chat ID and the first user message to act as the "Title" of the chat
            query = """
                SELECT c.id, c.updated_at, 
                    (SELECT m.user_message FROM messages m WHERE m.chat_id = c.id ORDER BY m.timestamp ASC LIMIT 1) as title
                FROM chats c
                WHERE c.user_id = ?
                ORDER BY c.updated_at DESC
            """
            cursor.execute(query, (user_id,))
            
            # Format into a nice dictionary list
            columns = [column[0] for column in cursor.description]
            sessions = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            cursor.close()
            return sessions
        except Exception as e:
            print(f"Error fetching chats: {e}")
            return []
        
    def delete_user_session(self, chat_id: int):
        """Deletes a chat session and all its associated messages."""
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            # 1. Delete messages first (to avoid foreign key constraint errors)
            cursor.execute("DELETE FROM messages WHERE chat_id = ?", (chat_id,))
            
            # 2. Delete the chat session itself
            cursor.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
            
            conn.commit()
            cursor.close()
            return True
        except Exception as e:
            if conn:
                conn.rollback() # Undo the deletion if something crashes
            print(f"Error deleting chat session: {e}")
            return False

    def get_total_sessions_count(self):
        """Fetch total count of all chat sessions."""
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            query = "SELECT COUNT(*) FROM chats"
            cursor.execute(query)
            count = cursor.fetchone()[0]
            cursor.close()
            return count
        except Exception as e:
            print(f"Error getting total sessions count: {e}")
            return 0

    def get_weekly_sessions_data(self):
        """Fetch total count of chat sessions grouped by week for the last 6 weeks."""
        import datetime
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            # Fetch data from DB from 5 weeks ago Monday up to now
            query = """
                SELECT DATE_TRUNC('week', updated_at) AS week_start, COUNT(*) AS count
                FROM chats
                WHERE updated_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '5 weeks'
                GROUP BY week_start
                ORDER BY week_start ASC
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            cursor.close()
            
            # Map DB results by date string
            db_results = {str(row[0])[:10]: row[1] for row in rows}
            
            # Generate the last 6 Mondays in Python to ensure 0s are filled
            today = datetime.date.today()
            current_monday = today - datetime.timedelta(days=today.weekday())
            
            weekly_data = []
            for i in range(5, -1, -1):
                monday = current_monday - datetime.timedelta(weeks=i)
                monday_str = monday.strftime('%Y-%m-%d')
                
                # Check if this Monday exists in DB results
                count = 0
                for db_date, db_count in db_results.items():
                    if db_date.startswith(monday_str):
                        count = db_count
                        break
                        
                weekly_data.append({
                    "week": monday_str,
                    "count": count
                })
                
            return weekly_data
        except Exception as e:
            print(f"Error getting weekly sessions count: {e}")
            return []