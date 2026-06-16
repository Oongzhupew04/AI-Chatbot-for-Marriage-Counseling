import sys
from unittest.mock import MagicMock
sys.modules['database'] = MagicMock()

from unittest.mock import patch
from werkzeug.security import generate_password_hash
from services.auth_service import AuthService

class MockUser:
    def __init__(self, id, email, password, status="active"):
        self.id = id
        self.email = email
        self.password_hash = generate_password_hash(password)
        self.status = status

@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_login_success(MockEmailService, MockUserRepository):
    # Setup mocks
    mock_repo = MockUserRepository.return_value
    mock_user = MockUser(1, "test@test.com", "password123")
    mock_repo.get_by_email.return_value = mock_user
    
    auth_service = AuthService()
    
    # Test
    user, error = auth_service.login("test@test.com", "password123")
    
    # Verify
    assert error is None
    assert user.email == "test@test.com"
    mock_repo.get_by_email.assert_called_once_with("test@test.com")

@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_login_invalid_password(MockEmailService, MockUserRepository):
    mock_repo = MockUserRepository.return_value
    mock_repo.get_by_email.return_value = MockUser(1, "test@test.com", "password123")
    
    auth_service = AuthService()
    user, error = auth_service.login("test@test.com", "wrongpassword")
    
    assert user is None
    assert error == "Invalid email or password"

@patch('services.auth_service.UserRepository')
@patch('services.auth_service.EmailService')
def test_calculate_marital_risk_valid(MockEmailService, MockUserRepository):
    auth_service = AuthService()
    # Using typical scale_1 values
    scale_data = {'q13': '2', 'q17': '1', 'q19': '3'}
    
    risk_percentage = auth_service.calculate_marital_risk(scale_data)
    
    assert isinstance(risk_percentage, float)
    assert 0 <= risk_percentage <= 100
