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
            print(f"Error logging message: {e}")
            return False
    
    def get_chat_history(self, chat_id):
        """Retrieve all messages for a chat."""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            query = "SELECT id, chat_id, timestamp, user_message, bot_response, risk_level FROM messages WHERE chat_id = ? ORDER BY id"
            cursor.execute(query, (chat_id,))
            
            rows = cursor.fetchall()
            cursor.close()
            
            messages = [Message(row[0], row[1], row[2], row[3], row[4], row[5]) for row in rows]
            return messages
        except Exception as e:
            print(f"Error fetching chat history: {e}")
            return []