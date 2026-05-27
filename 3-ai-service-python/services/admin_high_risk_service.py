from repositories.risk_alert_repo import RiskAlertRepository
from repositories.user_repo import UserRepository

class AdminHighRiskService:
    def __init__(self):
        self.risk_alert_repo = RiskAlertRepository()
        self.user_repo = UserRepository()
        
    def get_recent_incidents(self, limit=5):
        return self.risk_alert_repo.get_recent_alerts(limit=limit)
        
    def get_all_incidents(self):
        return self.risk_alert_repo.get_all_alerts()
        
    def send_high_risk_email(self, user_id, message):
        from services.email_service import EmailService
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return False, "User not found"
            
        email_service = EmailService()
        success = email_service.send_email(
            to_email=user.email,
            subject="Checking In - Counselor.AI",
            body=f"Hello {user.username},\n\nWe wanted to reach out and check in on you.\n\n{message}\n\nWarmly,\nThe Counselor.AI Team"
        )
        if not success:
            return False, "Failed to send email"
        
        return True, "Email sent successfully"

    def resolve_incident(self, incident_id):
        success = self.risk_alert_repo.resolve_alert(incident_id)
        if not success:
            return False, "Failed to resolve incident"
        return True, "Incident resolved successfully"
