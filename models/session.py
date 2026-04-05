# models/session.py
class SessionData:
    def __init__(self, id, user_id, date, score, topics):
        self.id = id
        self.user_id = user_id
        self.date = date
        self.score = score
        self.topics = topics