class Checkin:
    def __init__(self, user_id, satisfaction_score, unmet_needs,
                 rotational_q=None, rotational_score=None, journal_text=None, 
                 id=None, timestamp=None):
        self.id = id
        self.user_id = user_id
        self.satisfaction_score = satisfaction_score
        self.rotational_q = rotational_q
        self.rotational_score = rotational_score
        self.unmet_needs = unmet_needs
        self.journal_text = journal_text
        self.timestamp = timestamp

    def to_dict(self):
        """Optional: A handy helper method if you need to quickly return this via JSON"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "satisfaction_score": self.satisfaction_score,
            "rotational_q": self.rotational_q,
            "rotational_score": self.rotational_score,
            "unmet_needs": self.unmet_needs,
            "journal_text": self.journal_text,
            "timestamp": self.timestamp
        }