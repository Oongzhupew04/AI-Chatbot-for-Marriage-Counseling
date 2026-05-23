from repositories.feedback_repo import FeedbackRepository

class FeedbackService:
    """Handles feedback business logic."""
    
    def __init__(self):
        self.repo = FeedbackRepository()
        
    def process_feedback(self, data):
        """Process and save feedback data."""
        return self.repo.save_feedback(
            user_id=data.user_id,
            chat_id=data.chatId,
            rating=data.rating,
            worked_well=data.workedWell,
            issues=data.issues,
            comments=data.comments
        )
