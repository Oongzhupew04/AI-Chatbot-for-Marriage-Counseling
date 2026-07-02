"""
Test Suite: AuthService (T01 - T04)
Covers: Login, Registration, Password Reset, Marital Risk Calculation
"""
import sys
from unittest.mock import MagicMock
# Mock the database module before any service import
sys.modules['database'] = MagicMock()

import pytest
from unittest.mock import patch, PropertyMock
from werkzeug.security import generate_password_hash
from services.auth_service import AuthService


# --- Helper: Mock User Object ---
class MockUser:
    def __init__(self, id, email, password, username="testuser", role="user", status="active"):
        self.id = id
        self.email = email
        self.password_hash = generate_password_hash(password)
        self.username = username
        self.role = role
        self.status = status


# =========================================
# T01: Login - Success
# =========================================
@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_login_success(MockEmailService, MockUserRepository):
    """T01: Verify successful login with correct credentials."""
    mock_repo = MockUserRepository.return_value
    mock_user = MockUser(1, "test@test.com", "password123")
    mock_repo.get_by_email.return_value = mock_user

    auth_service = AuthService()
    user, error = auth_service.login("test@test.com", "password123")

    assert error is None
    assert user is not None
    assert user.email == "test@test.com"
    mock_repo.get_by_email.assert_called_once_with("test@test.com")


# =========================================
# T02: Login - Invalid Password
# =========================================
@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_login_invalid_password(MockEmailService, MockUserRepository):
    """T02: Verify login rejection for incorrect password."""
    mock_repo = MockUserRepository.return_value
    mock_repo.get_by_email.return_value = MockUser(1, "test@test.com", "password123")

    auth_service = AuthService()
    user, error = auth_service.login("test@test.com", "wrongpassword")

    assert user is None
    assert error == "Invalid email or password"


@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_login_user_not_found(MockEmailService, MockUserRepository):
    """T02b: Verify login rejection when email does not exist."""
    mock_repo = MockUserRepository.return_value
    mock_repo.get_by_email.return_value = None

    auth_service = AuthService()
    user, error = auth_service.login("nonexistent@test.com", "password123")

    assert user is None
    assert error == "Invalid email or password"


@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_login_frozen_account(MockEmailService, MockUserRepository):
    """T02c: Verify login rejection for a frozen/deactivated account."""
    mock_repo = MockUserRepository.return_value
    mock_repo.get_by_email.return_value = MockUser(
        1, "frozen@test.com", "password123", status="frozen"
    )

    auth_service = AuthService()
    user, error = auth_service.login("frozen@test.com", "password123")

    assert user is None
    assert "frozen" in error.lower()


# =========================================
# T03: User Registration
# =========================================
@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_register_success(MockEmailService, MockUserRepository):
    """T03: Verify new user registration with valid data."""
    mock_repo = MockUserRepository.return_value
    mock_repo.get_by_email.return_value = None  # No existing user

    mock_email = MockEmailService.return_value
    mock_email.verify_otp.return_value = True

    auth_service = AuthService()
    demographics = {
        'sex': 'M', 'age': 30, 'years_married': 5,
        'children_count': 2, 'children_raised': 1,
        'education': 'bachelor', 'material_situation': 'good',
        'religious_affiliation': 'none', 'religiousness': 1
    }
    scale_1 = {'q13': '2', 'q17': '1', 'q19': '3', 'q20': '3'}

    result, error = auth_service.register(
        "newuser", "new@test.com", "Secure@123",
        demographics, scale_1, "123456"
    )

    assert error is None
    assert result is not None
    assert result["success"] is True
    mock_repo.create.assert_called_once()


@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_register_duplicate_email(MockEmailService, MockUserRepository):
    """T03b: Verify registration is rejected when email already exists."""
    mock_repo = MockUserRepository.return_value
    mock_repo.get_by_email.return_value = MockUser(1, "existing@test.com", "pass123")

    auth_service = AuthService()
    result, error = auth_service.register(
        "newuser", "existing@test.com", "Secure@123",
        {}, {}, "123456"
    )

    assert result is None
    assert error == "Email already registered"


@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_register_invalid_otp(MockEmailService, MockUserRepository):
    """T03c: Verify registration is rejected with wrong OTP."""
    mock_repo = MockUserRepository.return_value
    mock_repo.get_by_email.return_value = None

    mock_email = MockEmailService.return_value
    mock_email.verify_otp.return_value = False  # Bad OTP

    auth_service = AuthService()
    result, error = auth_service.register(
        "newuser", "new@test.com", "Secure@123",
        {}, {'q13': '2', 'q17': '1', 'q19': '3', 'q20': '3'}, "000000"
    )

    assert result is None
    assert error == "Invalid or expired OTP"


# =========================================
# T04: Password Reset
# =========================================
@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_password_reset_request_otp(MockEmailService, MockUserRepository):
    """T04a: Verify OTP is sent for password reset request."""
    mock_email = MockEmailService.return_value
    mock_email.generate_and_send_otp.return_value = True

    auth_service = AuthService()
    success, message = auth_service.request_password_reset_otp("test@test.com")

    assert success is True
    assert "OTP" in message
    mock_email.generate_and_send_otp.assert_called_once_with("test@test.com", "test@test.com")


@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_password_reset_via_otp_success(MockEmailService, MockUserRepository):
    """T04b: Verify password is reset with valid OTP."""
    mock_repo = MockUserRepository.return_value
    mock_repo.get_by_email.return_value = MockUser(1, "test@test.com", "oldpass")
    mock_repo.update_password.return_value = True

    mock_email = MockEmailService.return_value
    mock_email.verify_otp.return_value = True

    auth_service = AuthService()
    success, message = auth_service.reset_password_via_otp(
        "test@test.com", "123456", "NewPass@456"
    )

    assert success is True
    assert "Password updated" in message
    mock_repo.update_password.assert_called_once()


@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_password_reset_via_otp_invalid(MockEmailService, MockUserRepository):
    """T04c: Verify password reset fails with invalid OTP."""
    mock_repo = MockUserRepository.return_value
    mock_repo.get_by_email.return_value = MockUser(1, "test@test.com", "oldpass")

    mock_email = MockEmailService.return_value
    mock_email.verify_otp.return_value = False

    auth_service = AuthService()
    success, message = auth_service.reset_password_via_otp(
        "test@test.com", "000000", "NewPass@456"
    )

    assert success is False
    assert "Invalid" in message or "expired" in message


# =========================================
# T22: Calculate Marital Risk Score
# =========================================
@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_calculate_marital_risk_valid(MockEmailService, MockUserRepository):
    """T22: Verify marital risk calculation returns a valid percentage."""
    auth_service = AuthService()
    scale_data = {'q13': '2', 'q17': '1', 'q19': '3'}

    risk_percentage = auth_service.calculate_marital_risk(scale_data)

    assert isinstance(risk_percentage, float)
    assert 0 <= risk_percentage <= 100


@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_calculate_marital_risk_high_values(MockEmailService, MockUserRepository):
    """T22b: Verify high risk input produces higher percentage."""
    auth_service = AuthService()
    low_risk_data = {'q13': '5', 'q17': '5', 'q19': '5'}
    high_risk_data = {'q13': '0', 'q17': '0', 'q19': '0'}

    low_risk = auth_service.calculate_marital_risk(low_risk_data)
    high_risk = auth_service.calculate_marital_risk(high_risk_data)

    assert isinstance(low_risk, float)
    assert isinstance(high_risk, float)
    # Higher q values (satisfaction) should lead to LOWER risk
    assert low_risk < high_risk


@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_calculate_marital_risk_missing_keys(MockEmailService, MockUserRepository):
    """T22c: Verify marital risk handles missing keys gracefully."""
    auth_service = AuthService()
    incomplete_data = {'q13': '2'}  # Missing q17 and q19

    risk_percentage = auth_service.calculate_marital_risk(incomplete_data)

    assert isinstance(risk_percentage, (float, int))
    assert 0 <= risk_percentage <= 100
