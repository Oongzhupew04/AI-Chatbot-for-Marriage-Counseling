class RiskAlert:
    def __init__(self, id, user_id, message_id, risk_level, trigger_keyword, timestamp=None, status="open"):
        self.id = id
        self.user_id = user_id
        self.message_id = message_id
        self.risk_level = risk_level
        self.trigger_keyword = trigger_keyword
        self.timestamp = timestamp
        self.status = status
