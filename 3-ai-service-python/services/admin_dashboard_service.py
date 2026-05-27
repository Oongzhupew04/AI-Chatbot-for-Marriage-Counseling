from repositories.risk_alert_repo import RiskAlertRepository
from repositories.chat_repo import ChatRepository
from repositories.feedback_repo import FeedbackRepository
from repositories.user_repo import UserRepository

class AdminDashboardService:
    def __init__(self):
        self.risk_alert_repo = RiskAlertRepository()
        self.chat_repo = ChatRepository()
        self.feedback_repo = FeedbackRepository()
        self.user_repo = UserRepository()
        
    def get_dashboard_stats(self):
        pending_alerts = self.risk_alert_repo.get_pending_alerts_count()
        total_sessions = self.chat_repo.get_total_sessions_count()
        avg_feedback = self.feedback_repo.get_average_feedback()
        weekly_sessions = self.chat_repo.get_weekly_sessions_data()
        feedback_dist = self.feedback_repo.get_feedback_distribution()
        total_users = self.user_repo.get_total_users_count()
        
        return {
            "active_risk_alerts": pending_alerts,
            "total_sessions": total_sessions,
            "weekly_sessions": weekly_sessions,
            "avg_feedback": round(avg_feedback, 1),
            "feedback_distribution": feedback_dist,
            "total_users": total_users
        }
        
    def get_user_management_data(self, limit=20):
        return self.user_repo.get_recent_users(limit=limit)

    def freeze_user(self, user_id):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return False, "User not found"
        
        new_status = 'frozen' if getattr(user, 'status', 'active') == 'active' else 'active'
        success = self.user_repo.update_status(user_id, new_status)
        return success, new_status

    def reset_user_password(self, user_id):
        import string
        import random
        from werkzeug.security import generate_password_hash
        from services.email_service import EmailService
        
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return False, "User not found"
            
        # Generate 8-character random password
        chars = string.ascii_letters + string.digits
        temp_pass = ''.join(random.choice(chars) for _ in range(8))
        
        hashed_pw = generate_password_hash(temp_pass)
        success = self.user_repo.update_password(user_id, hashed_pw)
        
        if success:
            email_service = EmailService()
            email_success = email_service.send_password_reset_email(user.email, temp_pass)
            if not email_success:
                return False, "Password updated in DB but failed to send email"
            return True, "Password reset successfully and email sent"
        
        return False, "Failed to update password in database"
