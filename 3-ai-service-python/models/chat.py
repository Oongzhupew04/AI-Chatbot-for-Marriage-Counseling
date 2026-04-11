class Chat:
    def __init__(self, id, user_id, created_at=None, updated_at=None):
        self.id = id
        self.user_id = user_id
        self.created_at = created_at
        self.updated_at = updated_at