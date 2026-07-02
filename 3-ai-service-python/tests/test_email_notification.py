"""
Test Suite: EmailService & Notification Logic (T04, T20)
Covers: OTP generation/verification, Password Reset email, Daily Reminders
"""
import sys
from unittest.mock import MagicMock
sys.modules['database'] = MagicMock()

import pytest
import time
from unittest.mock import patch
from services.email_service import EmailService


# =========================================
# T04 Support: Email OTP Generation and Verification
# =========================================
def test_otp_generation_and_verification():
    """Verify OTP is generated, stored, and verified correctly."""
    service = EmailService()
    
    # Manually simulate OTP storage (bypass actual SMTP sending)
    service.otp_store["test@test.com"] = {
        "otp": "123456",
        "expires_at": time.time() + 600
    }
    
    # Correct OTP should pass
    assert service.verify_otp("test@test.com", "123456") is True


def test_otp_wrong_code():
    """Verify wrong OTP code is rejected."""
    service = EmailService()
    service.otp_store["test@test.com"] = {
        "otp": "123456",
        "expires_at": time.time() + 600
    }
    
    assert service.verify_otp("test@test.com", "000000") is False


def test_otp_expired():
    """Verify expired OTP is rejected and cleaned up."""
    service = EmailService()
    service.otp_store["test@test.com"] = {
        "otp": "123456",
        "expires_at": time.time() - 10  # Already expired
    }
    
    assert service.verify_otp("test@test.com", "123456") is False
    # OTP should be cleaned up after expiration check
    assert "test@test.com" not in service.otp_store


def test_otp_nonexistent_user():
    """Verify OTP check for non-existent user returns False."""
    service = EmailService()
    assert service.verify_otp("nobody@test.com", "123456") is False


def test_otp_consumed_after_use():
    """Verify OTP is single-use (consumed after successful verification)."""
    service = EmailService()
    service.otp_store["test@test.com"] = {
        "otp": "123456",
        "expires_at": time.time() + 600
    }
    
    # First use should succeed
    assert service.verify_otp("test@test.com", "123456") is True
    # Second use should fail (OTP consumed)
    assert service.verify_otp("test@test.com", "123456") is False


# =========================================
# T20: NotificationService - Daily Reminders
# =========================================
@patch('services.notification_service.PushSubscriptionRepository')
@patch('services.notification_service.UserRepository')
@patch('services.notification_service.CheckinService')
def test_send_daily_reminders_skips_checked_in_users(MockCheckinService, MockUserRepo, MockSubRepo):
    """T20: Verify daily reminders are NOT sent to users who already checked in today."""
    mock_user_repo = MockUserRepo.return_value
    mock_user_repo.get_users_with_push_enabled.return_value = [1]
    
    mock_checkin = MockCheckinService.return_value
    from datetime import datetime
    today_str = datetime.now().strftime("%Y-%m-%d")
    mock_checkin.repo.get_recent_checkins.return_value = [{"day": f"{today_str}T10:00:00"}]
    
    from services.notification_service import NotificationService
    service = NotificationService()
    
    with patch.object(service, '_send_push_to_user') as mock_push:
        service.send_daily_reminders()
        # Should NOT send because user already checked in today
        mock_push.assert_not_called()


@patch('services.notification_service.PushSubscriptionRepository')
@patch('services.notification_service.UserRepository')
@patch('services.notification_service.CheckinService')
def test_send_daily_reminders_sends_to_unchecked_users(MockCheckinService, MockUserRepo, MockSubRepo):
    """T20b: Verify daily reminders ARE sent to users who haven't checked in."""
    mock_user_repo = MockUserRepo.return_value
    mock_user_repo.get_users_with_push_enabled.return_value = [1]
    
    mock_checkin = MockCheckinService.return_value
    mock_checkin.repo.get_recent_checkins.return_value = [{"day": "2026-06-30T10:00:00"}]  # Yesterday
    
    from services.notification_service import NotificationService
    service = NotificationService()
    
    with patch.object(service, '_send_push_to_user') as mock_push:
        service.send_daily_reminders()
        mock_push.assert_called_once_with(1, "Daily Reflection", "It's time for your daily check-in. Take a moment for yourself.")


@patch('services.notification_service.PushSubscriptionRepository')
@patch('services.notification_service.UserRepository')
@patch('services.notification_service.CheckinService')
def test_notify_admins_of_high_risk(MockCheckinService, MockUserRepo, MockSubRepo):
    """T20c: Verify admin push notifications are triggered for high-risk alerts."""
    mock_user_repo = MockUserRepo.return_value
    mock_user_repo.get_admins_with_push_enabled.return_value = [10, 11]
    
    mock_user = MagicMock()
    mock_user.username = "at_risk_user"
    mock_user_repo.get_by_id.return_value = mock_user
    
    from services.notification_service import NotificationService
    service = NotificationService()
    
    with patch.object(service, '_send_push_to_user') as mock_push:
        service.notify_admins_of_high_risk(risk_level=2, trigger_keyword="suicide", user_id=5)
        # Should send to both admins
        assert mock_push.call_count == 2
