"""
Integration Test Layer 1: FastAPI /internal/ Routes
Tests the Python API endpoints that the Node.js Gateway calls.
Uses FastAPI's TestClient with mocked services (no real DB/AI needed).
"""
import sys
from unittest.mock import MagicMock

# Mock heavy modules before any import
sys.modules['database'] = MagicMock()
sys.modules['spacy'] = MagicMock()
sys.modules['sentence_transformers'] = MagicMock()
sys.modules['sentence_transformers.SentenceTransformer'] = MagicMock()
sys.modules['sentence_transformers.util'] = MagicMock()
sys.modules['torch'] = MagicMock()
sys.modules['langchain_huggingface'] = MagicMock()
sys.modules['langchain_opengauss'] = MagicMock()
sys.modules['chromadb'] = MagicMock()
sys.modules['pywebpush'] = MagicMock()

import pytest
from unittest.mock import patch, PropertyMock
from werkzeug.security import generate_password_hash


# --- Helper: Mock User Object ---
class MockUser:
    def __init__(self, id=1, email="test@test.com", password="password123",
                 username="testuser", role="user", status="active"):
        self.id = id
        self.email = email
        self.password_hash = generate_password_hash(password)
        self.username = username
        self.role = role
        self.status = status
        self.dark_mode_enabled = False
        self.push_notifications_enabled = False
        self.sex = "M"
        self.age = 30
        self.years_married = 5
        self.children_count = 2
        self.children_raised = 1
        self.education = "bachelor"
        self.religious_affiliation = "none"
        self.profile_pic = None
        self.marital_risk_percentage = 45.5
        self.q13 = "2"
        self.q17 = "1"
        self.q19 = "3"


# --- Fixture: Create TestClient with mocked services ---
# Pre-mock all repository/service dependencies via sys.modules patching
# to avoid Python's 20-level nesting limit for 'with' blocks.
_patches_to_apply = [
    'services.auth_service.UserRepository',
    'services.auth_service.EmailService',
    'services.chat_service.ChatRepository',
    'services.chat_service.RiskAlertService',
    'services.chat_service.HuggingFaceEmbeddings',
    'services.chat_service.OpenGauss',
    'services.chat_service.OpenGaussSettings',
    'services.chat_service.deepseek_ai_cloud',
    'services.checkin_service.CheckinRepository',
    'services.feedback_service.FeedbackRepository',
    'services.admin_dashboard_service.RiskAlertRepository',
    'services.admin_dashboard_service.ChatRepository',
    'services.admin_dashboard_service.FeedbackRepository',
    'services.admin_dashboard_service.UserRepository',
    'services.admin_high_risk_service.RiskAlertRepository',
    'services.admin_high_risk_service.UserRepository',
    'services.admin_feedback_service.FeedbackRepository',
    'services.notification_service.PushSubscriptionRepository',
    'services.notification_service.UserRepository',
    'services.notification_service.CheckinService',
    'repositories.chat_repo.db',
    'repositories.user_repo.db',
    'repositories.faq_repo.db',
    'repositories.push_subscription_repo.db',
    'scheduler.NotificationService',
    'scheduler.BackgroundScheduler',
]


@pytest.fixture
def client():
    """Create a FastAPI TestClient with all services mocked."""
    active_patches = [patch(target) for target in _patches_to_apply]
    mocks = [p.start() for p in active_patches]

    try:
        import importlib
        import main
        importlib.reload(main)

        from fastapi.testclient import TestClient
        test_client = TestClient(main.app)

        yield test_client, main
    finally:
        for p in active_patches:
            p.stop()


# =========================================
# T01: POST /internal/login - Success
# =========================================
def test_internal_login_success(client):
    """T01: Verify /internal/login returns user data on valid credentials."""
    test_client, main = client
    
    mock_user = MockUser()
    main.auth_service.login = MagicMock(return_value=(mock_user, None))
    
    response = test_client.post("/internal/login", json={
        "email": "test@test.com",
        "password": "password123"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["email"] == "test@test.com"
    assert data["user"]["username"] == "testuser"


# =========================================
# T02: POST /internal/login - Invalid Password
# =========================================
def test_internal_login_invalid_password(client):
    """T02: Verify /internal/login returns 401 on wrong password."""
    test_client, main = client
    
    main.auth_service.login = MagicMock(return_value=(None, "Invalid email or password"))
    
    response = test_client.post("/internal/login", json={
        "email": "test@test.com",
        "password": "wrongpassword"
    })
    
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]


# =========================================
# T03: POST /internal/register - Success
# =========================================
def test_internal_register_success(client):
    """T03: Verify /internal/register creates a new user."""
    test_client, main = client
    
    main.auth_service.register = MagicMock(
        return_value=({"success": True, "dishonesty_detected": False}, None)
    )
    
    response = test_client.post("/internal/register", json={
        "username": "newuser", "email": "new@test.com", "password": "Secure@123", "otp": "123456",
        "sex": "M", "age": 30, "years_married": 5, "children_count": 2,
        "children_raised": 1, "education": "bachelor", "material_situation": "good",
        "religious_affiliation": "none", "religiousness": 1,
        "q13": "2", "q17": "1", "q19": "3", "q20": "3"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "User registered successfully"


# =========================================
# T03b: POST /internal/register - Validation Error (missing fields)
# =========================================
def test_internal_register_validation_error(client):
    """T03b: Verify /internal/register rejects incomplete data (Pydantic validation)."""
    test_client, main = client
    
    response = test_client.post("/internal/register", json={
        "username": "newuser",
        "email": "new@test.com"
        # Missing required fields like password, otp, demographics...
    })
    
    assert response.status_code == 422  # Pydantic validation error


# =========================================
# T04: POST /internal/forgot-password & /internal/reset-password
# =========================================
def test_internal_forgot_password(client):
    """T04a: Verify /internal/forgot-password sends OTP."""
    test_client, main = client
    
    main.auth_service.request_password_reset_otp = MagicMock(
        return_value=(True, "If an account exists, an OTP has been sent.")
    )
    
    response = test_client.post("/internal/forgot-password", json={
        "email": "test@test.com"
    })
    
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_internal_reset_password(client):
    """T04b: Verify /internal/reset-password resets with valid OTP."""
    test_client, main = client
    
    main.auth_service.reset_password_via_otp = MagicMock(
        return_value=(True, "Password updated successfully")
    )
    
    response = test_client.post("/internal/reset-password", json={
        "email": "test@test.com", "otp": "123456", "new_password": "NewPass@456"
    })
    
    assert response.status_code == 200
    assert response.json()["success"] is True


# =========================================
# T05: GET /internal/users/{user_id}/profile
# =========================================
def test_internal_get_profile(client):
    """T05: Verify /internal/users/{id}/profile returns user profile."""
    test_client, main = client
    
    with patch('main.UserRepository') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_by_id.return_value = MockUser()
        
        response = test_client.get("/internal/users/1/profile")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["profile"]["email"] == "test@test.com"


def test_internal_get_profile_not_found(client):
    """T05b: Verify /internal/users/{id}/profile returns 404 for missing user."""
    test_client, main = client
    
    with patch('main.UserRepository') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_by_id.return_value = None
        
        response = test_client.get("/internal/users/999/profile")
    
    assert response.status_code == 404


# =========================================
# T12: POST /internal/checkin
# =========================================
def test_internal_checkin(client):
    """T12: Verify /internal/checkin processes daily check-in data."""
    test_client, main = client
    
    main.checkin_service.process_daily_checkin = MagicMock(
        return_value={"id": 1, "user_id": 1}
    )
    
    response = test_client.post("/internal/checkin", json={
        "user_id": 1,
        "coreMetric": 7,
        "rotational": {"question": "How connected do you feel?", "score": 6},
        "unmetNeeds": ["communication", "quality time"],
        "journalEntry": "Had a disagreement today.",
        "timestamp": "2026-07-01T10:00:00Z"
    })
    
    assert response.status_code == 200
    assert response.json()["success"] is True


# =========================================
# T11: POST /internal/feedback
# =========================================
def test_internal_feedback(client):
    """T11: Verify /internal/feedback saves user session feedback."""
    test_client, main = client
    
    main.feedback_service.process_feedback = MagicMock(return_value=True)
    
    response = test_client.post("/internal/feedback", json={
        "user_id": 1,
        "chatId": 101,
        "rating": "4",
        "workedWell": ["empathy", "actionable advice"],
        "issues": [],
        "comments": "Helpful session"
    })
    
    assert response.status_code == 200
    assert response.json()["success"] is True


# =========================================
# T16: GET /internal/admin/incidents
# =========================================
def test_internal_admin_incidents(client):
    """T16: Verify /internal/admin/incidents returns high-risk user data."""
    test_client, main = client
    
    main.admin_high_risk_service.get_recent_incidents = MagicMock(return_value=[
        {"id": 1, "user_id": 5, "risk_level": 2, "trigger_keyword": "suicide", "status": "open"}
    ])
    
    response = test_client.get("/internal/admin/incidents")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["incidents"]) == 1
    assert data["incidents"][0]["risk_level"] == 2


# =========================================
# T19: GET /internal/admin/feedbacks
# =========================================
def test_internal_admin_feedbacks(client):
    """T19: Verify /internal/admin/feedbacks returns all feedback entries."""
    test_client, main = client
    
    main.admin_feedback_service.get_all_feedback = MagicMock(return_value=[
        {"id": 1, "user_id": 1, "rating": 5, "comments": "Great session"}
    ])
    
    response = test_client.get("/internal/admin/feedbacks")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["feedbacks"]) == 1


# =========================================
# T17: PUT /internal/admin/users/{id}/freeze
# =========================================
def test_internal_admin_freeze_user(client):
    """T17: Verify admin can freeze a user account via API."""
    test_client, main = client
    
    main.admin_dashboard_service.freeze_user = MagicMock(return_value=(True, "frozen"))
    
    response = test_client.put("/internal/admin/users/3/freeze")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "frozen"


# =========================================
# T06: DELETE /internal/users/{user_id}
# =========================================
def test_internal_delete_user(client):
    """T06: Verify user account can be deleted via API."""
    test_client, main = client
    
    with patch('main.UserRepository') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_by_id.return_value = MockUser()
        mock_repo.delete_user.return_value = True
        
        response = test_client.delete("/internal/users/1")
    
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_internal_delete_user_not_found(client):
    """T06b: Verify deleting non-existent user returns 404."""
    test_client, main = client
    
    with patch('main.UserRepository') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_by_id.return_value = None
        
        response = test_client.delete("/internal/users/999")
    
    assert response.status_code == 404


# =========================================
# T09: GET /internal/users/{user_id}/chats (View Session History)
# =========================================
def test_internal_get_user_chats(client):
    """T09: Verify /internal/users/{id}/chats returns session list."""
    test_client, main = client
    
    main.chat_service.chat_repo.get_user_sessions = MagicMock(return_value=[
        {"id": 1, "created_at": "2026-07-01", "ended": False},
        {"id": 2, "created_at": "2026-06-30", "ended": True},
    ])
    
    response = test_client.get("/internal/users/1/chats")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["sessions"]) == 2


# =========================================
# GET /internal/faq (Public FAQ endpoint)
# =========================================
def test_internal_get_faqs(client):
    """Verify /internal/faq returns FAQ list."""
    test_client, main = client
    
    class MockFaq:
        def __init__(self, id, q, a):
            self.id = id
            self.question = q
            self.answer = a
    
    with patch('main.FaqRepository') as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_all_faqs.return_value = [
            MockFaq(1, "Is this secure?", "Yes."),
            MockFaq(2, "Is this free?", "Yes, completely free."),
        ]
        
        response = test_client.get("/internal/faq")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["faqs"]) == 2
