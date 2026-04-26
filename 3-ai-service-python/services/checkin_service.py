from models.checkin import Checkin
from repositories.checkin_repo import CheckinRepository

class CheckinService:
    def __init__(self):
        self.repo = CheckinRepository()

    def process_daily_checkin(self, data):

        # 2. Instantiate your new Domain Model
        new_checkin = Checkin(
            user_id=data.user_id,
            satisfaction_score=data.coreMetric,
            unmet_needs=", ".join(data.unmetNeeds),
            rotational_q=data.rotational.question,
            rotational_score=data.rotational.score,
            journal_text=data.journalEntry,
            timestamp=data.timestamp
        )

        # 3. Pass the structured object to the repo
        saved_record = self.repo.save_checkin(new_checkin)
        
        return saved_record