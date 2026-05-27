from repositories.feedback_repo import FeedbackRepository

class AdminFeedbackService:
    def __init__(self):
        self.feedback_repo = FeedbackRepository()
        
    def get_all_feedback(self):
        return self.feedback_repo.get_all_feedback()
