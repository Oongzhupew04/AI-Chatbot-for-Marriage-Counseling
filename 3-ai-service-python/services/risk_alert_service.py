from repositories.risk_alert_repo import RiskAlertRepository
from deepseek_ai_cloud import analyze_risk, CRISIS_RESOURCES

class RiskAlertService:
    """Handles business logic for risk alerts."""
    
    def __init__(self):
        self.repo = RiskAlertRepository()

    def check_and_generate_crisis_response(self, user_input: str):
        """Evaluates user input for risk and generates a crisis response if needed."""
        risk_level, trigger_keyword = analyze_risk(user_input)
        if risk_level >= 1:
            urgency = "high" if risk_level == 2 else "moderate"
            bot_reply = f"I am hearing that you are in a very distressing and potentially unsafe situation. {CRISIS_RESOURCES}"
            if urgency == "high":
                bot_reply += "\n*Please* reach out to someone for physical support right now."
            
            return {
                "response": bot_reply, 
                "action": "none", 
                "risk_level": risk_level, 
                "trigger_keyword": trigger_keyword
            }
        return None

    def process_risk_alert(self, user_id: int, message_id: int, risk_level: int, trigger_keyword: str):
        """
        Process a detected risk alert. 
        Currently logs to DB, but can be extended to send emails, notify admins, etc.
        """
        print(f"[Risk Alert] Detected risk level {risk_level} for user {user_id}. Keyword: {trigger_keyword}")
        return self.repo.log_risk_alert(user_id, message_id, risk_level, trigger_keyword)
