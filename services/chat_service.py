# services/chat_service.py
from repositories.chat_repo import ChatRepository

class ChatService:
    """Handles chat business logic and session management."""
    
    def __init__(self):
        self.chat_repo = ChatRepository()
    
    def get_or_create_chat(self, user_id, chat_id):
        """Get existing chat_id or create a new one."""
        if not chat_id:
            chat = self.chat_repo.create_chat(user_id)
            if chat:
                return chat.id
        return chat_id
    
    def log_message(self, chat_id, user_msg, bot_msg, risk_level):
        """Log a conversation message."""
        return self.chat_repo.log_message(chat_id, user_msg, bot_msg, risk_level)
    
    def get_chat_history(self, chat_id):
        """Retrieve chat history."""
        return self.chat_repo.get_chat_history(chat_id)