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
    
    def log_message(self, chat_id, user_msg, bot_msg, risk_level):
        """Log a message to an existing chat."""
        conn = None
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            msg_query = """
                INSERT INTO messages (chat_id, timestamp, user_message, bot_response, risk_level)
                VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?)
            """
            cursor.execute(msg_query, (chat_id, user_msg, bot_msg, risk_level))
            conn.commit()
            cursor.close()
            
            return True
        except Exception as e:
            if conn:
                conn.rollback()

            print(f"Error logging message: {e}")
            return False
    
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