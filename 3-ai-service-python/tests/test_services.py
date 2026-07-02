"""
Test Suite: CheckinService (T12), FeedbackService (T11), AdminDashboardService (T16-T19)
Covers: Daily Check-Ins, User Feedback, Admin Dashboard, High-risk Users, User Management
"""
import sys
from unittest.mock import MagicMock
sys.modules['database'] = MagicMock()

import pytest
from unittest.mock import patch, PropertyMock
from models.checkin import Checkin


# =========================================
# T12: Provide Daily Check-Ins
# =========================================
class MockCheckinRequest:
    """Simulates the Pydantic-style request object from FastAPI."""
    def __init__(self):
        self.user_id = 1
        self.coreMetric = 7
        self.unmetNeeds = ["communication", "quality time"]
        self.rotational = type('obj', (object,), {'question': 'How connected do you feel?', 'score': 6})()
        self.journalEntry = "Had a disagreement today but we talked it out."
        self.timestamp = "2026-07-01T10:00:00Z"


@patch('services.checkin_service.CheckinRepository')
def test_process_daily_checkin(MockCheckinRepo):
    """T12: Verify daily check-in data is processed and saved."""
    mock_repo = MockCheckinRepo.return_value
    mock_repo.save_checkin.return_value = {"id": 1, "user_id": 1, "satisfaction_score": 7}

    from services.checkin_service import CheckinService
    service = CheckinService()
    
    data = MockCheckinRequest()
    result = service.process_daily_checkin(data)

    assert result is not None
    mock_repo.save_checkin.assert_called_once()
    # Verify the Checkin model was constructed correctly
    call_args = mock_repo.save_checkin.call_args[0][0]
    assert isinstance(call_args, Checkin)
    assert call_args.user_id == 1
    assert call_args.satisfaction_score == 7
    assert "communication" in call_args.unmet_needs


# =========================================
# T11: Request User Feedback (FeedbackService)
# =========================================
class MockFeedbackRequest:
    """Simulates the Pydantic-style request object from FastAPI."""
    def __init__(self):
        self.user_id = 1
        self.chatId = 101
        self.rating = 4
        self.workedWell = "Felt heard and understood"
        self.issues = "None"
        self.comments = "Helpful session overall"


@patch('services.feedback_service.FeedbackRepository')
def test_process_feedback(MockFeedbackRepo):
    """T11: Verify user feedback is processed and saved after a session."""
    mock_repo = MockFeedbackRepo.return_value
    mock_repo.save_feedback.return_value = {"id": 1, "rating": 4}

    from services.feedback_service import FeedbackService
    service = FeedbackService()
    
    data = MockFeedbackRequest()
    result = service.process_feedback(data)

    assert result is not None
    mock_repo.save_feedback.assert_called_once_with(
        user_id=1,
        chat_id=101,
        rating=4,
        worked_well="Felt heard and understood",
        issues="None",
        comments="Helpful session overall"
    )


# =========================================
# T16: View High-risk Users (AdminHighRiskService)
# =========================================
@patch('services.admin_high_risk_service.RiskAlertRepository')
@patch('services.admin_high_risk_service.UserRepository')
def test_get_recent_incidents(MockUserRepo, MockRiskAlertRepo):
    """T16: Verify admin can retrieve recent high-risk incidents."""
    mock_risk_repo = MockRiskAlertRepo.return_value
    mock_risk_repo.get_recent_alerts.return_value = [
        {"id": 1, "user_id": 5, "risk_level": 2, "trigger_keyword": "suicide", "status": "open"},
        {"id": 2, "user_id": 8, "risk_level": 1, "trigger_keyword": "self-harm", "status": "open"},
    ]

    from services.admin_high_risk_service import AdminHighRiskService
    service = AdminHighRiskService()
    incidents = service.get_recent_incidents(limit=5)

    assert len(incidents) == 2
    assert incidents[0]["risk_level"] == 2
    mock_risk_repo.get_recent_alerts.assert_called_once_with(limit=5)


@patch('services.admin_high_risk_service.RiskAlertRepository')
@patch('services.admin_high_risk_service.UserRepository')
def test_resolve_incident(MockUserRepo, MockRiskAlertRepo):
    """T16b: Verify admin can resolve a high-risk incident."""
    mock_risk_repo = MockRiskAlertRepo.return_value
    mock_risk_repo.resolve_alert.return_value = True

    from services.admin_high_risk_service import AdminHighRiskService
    service = AdminHighRiskService()
    success, message = service.resolve_incident(incident_id=1)

    assert success is True
    assert "resolved" in message.lower()
    mock_risk_repo.resolve_alert.assert_called_once_with(1)


# =========================================
# T17: Manage User Roles & Permissions (AdminDashboardService)
# =========================================
class MockAdminUser:
    def __init__(self, id, status="active"):
        self.id = id
        self.status = status
        self.username = "testuser"
        self.email = "test@test.com"


@patch('services.admin_dashboard_service.RiskAlertRepository')
@patch('services.admin_dashboard_service.ChatRepository')
@patch('services.admin_dashboard_service.FeedbackRepository')
@patch('services.admin_dashboard_service.UserRepository')
def test_freeze_user(MockUserRepo, MockFeedbackRepo, MockChatRepo, MockRiskAlertRepo):
    """T17: Verify admin can freeze (deactivate) a user account."""
    mock_user_repo = MockUserRepo.return_value
    mock_user_repo.get_by_id.return_value = MockAdminUser(3, status="active")
    mock_user_repo.update_status.return_value = True

    from services.admin_dashboard_service import AdminDashboardService
    service = AdminDashboardService()
    success, new_status = service.freeze_user(user_id=3)

    assert success is True
    assert new_status == "frozen"
    mock_user_repo.update_status.assert_called_once_with(3, "frozen")


@patch('services.admin_dashboard_service.RiskAlertRepository')
@patch('services.admin_dashboard_service.ChatRepository')
@patch('services.admin_dashboard_service.FeedbackRepository')
@patch('services.admin_dashboard_service.UserRepository')
def test_unfreeze_user(MockUserRepo, MockFeedbackRepo, MockChatRepo, MockRiskAlertRepo):
    """T17b: Verify admin can unfreeze a previously frozen user."""
    mock_user_repo = MockUserRepo.return_value
    mock_user_repo.get_by_id.return_value = MockAdminUser(3, status="frozen")
    mock_user_repo.update_status.return_value = True

    from services.admin_dashboard_service import AdminDashboardService
    service = AdminDashboardService()
    success, new_status = service.freeze_user(user_id=3)

    assert success is True
    assert new_status == "active"


@patch('services.admin_dashboard_service.RiskAlertRepository')
@patch('services.admin_dashboard_service.ChatRepository')
@patch('services.admin_dashboard_service.FeedbackRepository')
@patch('services.admin_dashboard_service.UserRepository')
def test_freeze_nonexistent_user(MockUserRepo, MockFeedbackRepo, MockChatRepo, MockRiskAlertRepo):
    """T17c: Verify freezing a non-existent user returns an error."""
    mock_user_repo = MockUserRepo.return_value
    mock_user_repo.get_by_id.return_value = None

    from services.admin_dashboard_service import AdminDashboardService
    service = AdminDashboardService()
    success, message = service.freeze_user(user_id=999)

    assert success is False
    assert "not found" in message.lower()


# =========================================
# T09: View Dashboard Stats (AdminDashboardService)
# =========================================
@patch('services.admin_dashboard_service.RiskAlertRepository')
@patch('services.admin_dashboard_service.ChatRepository')
@patch('services.admin_dashboard_service.FeedbackRepository')
@patch('services.admin_dashboard_service.UserRepository')
def test_get_dashboard_stats(MockUserRepo, MockFeedbackRepo, MockChatRepo, MockRiskAlertRepo):
    """T09: Verify dashboard stats are aggregated correctly."""
    mock_risk = MockRiskAlertRepo.return_value
    mock_chat = MockChatRepo.return_value
    mock_feedback = MockFeedbackRepo.return_value
    mock_user = MockUserRepo.return_value

    mock_risk.get_pending_alerts_count.return_value = 3
    mock_chat.get_total_sessions_count.return_value = 150
    mock_chat.get_weekly_sessions_data.return_value = [10, 12, 8, 15, 20, 18, 25]
    mock_feedback.get_average_feedback.return_value = 4.2
    mock_feedback.get_feedback_distribution.return_value = {"1": 2, "2": 5, "3": 10, "4": 25, "5": 30}
    mock_user.get_total_users_count.return_value = 50

    from services.admin_dashboard_service import AdminDashboardService
    service = AdminDashboardService()
    stats = service.get_dashboard_stats()

    assert stats["active_risk_alerts"] == 3
    assert stats["total_sessions"] == 150
    assert stats["avg_feedback"] == 4.2
    assert stats["total_users"] == 50
    assert len(stats["weekly_sessions"]) == 7


# =========================================
# T19: View Users' Feedback (AdminFeedbackService)
# =========================================
@patch('services.admin_feedback_service.FeedbackRepository')
def test_get_all_feedback(MockFeedbackRepo):
    """T19: Verify admin can retrieve all user feedback entries."""
    mock_repo = MockFeedbackRepo.return_value
    mock_repo.get_all_feedback.return_value = [
        {"id": 1, "user_id": 1, "rating": 5, "comments": "Great"},
        {"id": 2, "user_id": 2, "rating": 3, "comments": "Average"},
    ]

    from services.admin_feedback_service import AdminFeedbackService
    service = AdminFeedbackService()
    feedbacks = service.get_all_feedback()

    assert len(feedbacks) == 2
    assert feedbacks[0]["rating"] == 5
    mock_repo.get_all_feedback.assert_called_once()
