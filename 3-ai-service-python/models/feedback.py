class Feedback:
    def __init__(self, id, user_id, chat_id, rating, worked_well, issues, comments, timestamp=None):
        self.id = id
        self.user_id = user_id
        self.chat_id = chat_id
        self.rating = rating
        self.worked_well = worked_well
        self.issues = issues
        self.comments = comments
        self.timestamp = timestamp
