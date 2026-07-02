"""
Test Suite: RiskAlertService (T13 - T15)
Covers: Triggers High-risk Alert, Sends Alert to Administration, Emergency Contact Info
"""
import sys
from unittest.mock import MagicMock
sys.modules['database'] = MagicMock()
# Mock heavy ML modules that are not needed for unit testing
sys.modules['spacy'] = MagicMock()
sys.modules['sentence_transformers'] = MagicMock()
sys.modules['sentence_transformers.SentenceTransformer'] = MagicMock()
sys.modules['sentence_transformers.util'] = MagicMock()
sys.modules['torch'] = MagicMock()
sys.modules['langchain_huggingface'] = MagicMock()
sys.modules['langchain_opengauss'] = MagicMock()

import pytest
from unittest.mock import patch, MagicMock as Mock


# =========================================
# T13: Triggers High-risk Alert (Flag Keywords)
# =========================================
@patch('services.risk_alert_service.RiskAlertRepository')
@patch('services.risk_alert_service.analyze_risk')
def test_high_risk_keyword_detected(mock_analyze_risk, MockRepo):
    """T13: Verify high-risk keywords trigger a crisis response."""
    mock_analyze_risk.return_value = (2, "suicide")
    
    from services.risk_alert_service import RiskAlertService
    service = RiskAlertService()
    
    result = service.check_and_generate_crisis_response("I want to commit suicide")
    
    assert result is not None
    assert result["risk_level"] == 2
    assert result["trigger_keyword"] == "suicide"
    assert "crisis" in result["response"].lower() or "danger" in result["response"].lower() or "distressing" in result["response"].lower()


@patch('services.risk_alert_service.RiskAlertRepository')
@patch('services.risk_alert_service.analyze_risk')
def test_medium_risk_keyword_detected(mock_analyze_risk, MockRepo):
    """T13b: Verify medium-risk keywords also trigger a response."""
    mock_analyze_risk.return_value = (1, "self-harm")
    
    from services.risk_alert_service import RiskAlertService
    service = RiskAlertService()
    
    result = service.check_and_generate_crisis_response("I have been self-harming")
    
    assert result is not None
    assert result["risk_level"] == 1
    assert result["trigger_keyword"] == "self-harm"


@patch('services.risk_alert_service.RiskAlertRepository')
@patch('services.risk_alert_service.analyze_risk')
def test_no_risk_detected(mock_analyze_risk, MockRepo):
    """T13c: Verify safe messages return None (no alert)."""
    mock_analyze_risk.return_value = (0, None)
    
    from services.risk_alert_service import RiskAlertService
    service = RiskAlertService()
    
    result = service.check_and_generate_crisis_response("We had a nice dinner together")
    
    assert result is None


# =========================================
# T14: Sends Alert to Administration
# =========================================
@patch('services.risk_alert_service.RiskAlertRepository')
@patch('services.risk_alert_service.analyze_risk')
def test_process_risk_alert_logs_to_db(mock_analyze_risk, MockRepo):
    """T14: Verify risk alerts are logged to DB and admin notification is triggered."""
    mock_repo_instance = MockRepo.return_value
    mock_repo_instance.log_risk_alert.return_value = True
    
    from services.risk_alert_service import RiskAlertService
    service = RiskAlertService()
    
    with patch('services.risk_alert_service.RiskAlertService.process_risk_alert', wraps=service.process_risk_alert):
        # Mock the notification service import inside process_risk_alert
        with patch.dict('sys.modules', {'services.notification_service': MagicMock()}):
            result = service.process_risk_alert(
                user_id=5, message_id=100, risk_level=2, trigger_keyword="suicide"
            )
    
    mock_repo_instance.log_risk_alert.assert_called_once_with(5, 100, 2, "suicide")


# =========================================
# T15: Provide Emergency Contact Information
# =========================================
@patch('services.risk_alert_service.RiskAlertRepository')
@patch('services.risk_alert_service.analyze_risk')
def test_crisis_response_contains_emergency_contacts(mock_analyze_risk, MockRepo):
    """T15: Verify crisis response includes emergency helpline information."""
    mock_analyze_risk.return_value = (2, "kill")
    
    from services.risk_alert_service import RiskAlertService, CRISIS_RESOURCES
    service = RiskAlertService()
    
    result = service.check_and_generate_crisis_response("I want to kill myself")
    
    assert result is not None
    # Verify the CRISIS_RESOURCES constant (Malaysian helpline) is in the response
    assert "15999" in result["response"] or "Talian Kasih" in result["response"] or CRISIS_RESOURCES in result["response"]


@patch('services.risk_alert_service.RiskAlertRepository')
@patch('services.risk_alert_service.analyze_risk')
def test_high_risk_adds_extra_urgency_message(mock_analyze_risk, MockRepo):
    """T15b: Verify high urgency (risk_level=2) adds extra safety message."""
    mock_analyze_risk.return_value = (2, "end my life")
    
    from services.risk_alert_service import RiskAlertService
    service = RiskAlertService()
    
    result = service.check_and_generate_crisis_response("I want to end my life")
    
    assert result is not None
    assert result["risk_level"] == 2
    # High urgency should include the extra "reach out" message
    assert "reach out" in result["response"].lower() or "physical support" in result["response"].lower()
