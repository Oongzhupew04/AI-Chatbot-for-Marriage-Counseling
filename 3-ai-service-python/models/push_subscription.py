# models/push_subscription.py
class PushSubscription:
    def __init__(self, id, user_id, endpoint, p256dh, auth, created_at=None):
        self.id = id
        self.user_id = user_id
        self.endpoint = endpoint
        self.p256dh = p256dh
        self.auth = auth
        self.created_at = created_at
