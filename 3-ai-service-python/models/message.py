class Message:
    def __init__(self, id, chat_id, user_message, bot_response, timestamp=None):
        self.id = id
        self.chat_id = chat_id
        self.user_message = user_message
        self.bot_response = bot_response
        self.timestamp = timestamp