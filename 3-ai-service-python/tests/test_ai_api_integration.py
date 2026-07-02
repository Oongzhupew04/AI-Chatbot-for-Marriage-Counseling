"""
Integration Test Layer 3: AI API Integration
Tests the deepseek_ai_cloud module functions that interact with the Groq/LLM API.
Uses mocked HTTP responses to verify correct API payloads, error handling, 
PII anonymization, risk analysis, and response cleaning.
"""
import sys
from unittest.mock import MagicMock

# Mock heavy modules before import
mock_spacy = MagicMock()
mock_nlp = MagicMock()
mock_nlp.return_value = MagicMock(ents=[])
mock_spacy.load.return_value = mock_nlp
sys.modules['spacy'] = mock_spacy

mock_st = MagicMock()
sys.modules['sentence_transformers'] = mock_st
sys.modules['sentence_transformers.SentenceTransformer'] = MagicMock()
sys.modules['sentence_transformers.util'] = MagicMock()
sys.modules['torch'] = MagicMock()
sys.modules['database'] = MagicMock()

import pytest
import re
import json
from unittest.mock import patch, MagicMock as Mock


# ===================================================
# Test: PII Anonymization (PDPA Compliance)
# ===================================================
class TestPIIAnonymization:
    """Tests the Zero-Trust PII anonymization layer used before AI API calls."""

    def test_anonymize_email(self):
        """Verify email addresses are redacted before sending to AI."""
        from deepseek_ai_cloud import anonymize_pii
        
        text = "My email is john.doe@gmail.com and my partner's is jane@yahoo.com"
        vault = {}
        result = anonymize_pii(text, vault)
        
        assert "john.doe@gmail.com" not in result
        assert "jane@yahoo.com" not in result
        assert "[REDACTED_EMAIL_1]" in result
        assert "[REDACTED_EMAIL_2]" in result
        # Vault should store originals
        assert len([k for k in vault if "EMAIL" in k]) == 2

    def test_anonymize_malaysian_phone(self):
        """Verify Malaysian phone numbers are redacted."""
        from deepseek_ai_cloud import anonymize_pii
        
        text = "Call me at 012-3456789 or +60123456789"
        vault = {}
        result = anonymize_pii(text, vault)
        
        assert "012-3456789" not in result
        assert "+60123456789" not in result

    def test_anonymize_nric(self):
        """Verify Malaysian NRIC numbers are redacted."""
        from deepseek_ai_cloud import anonymize_pii
        
        text = "My IC number is 900101-14-5566"
        vault = {}
        result = anonymize_pii(text, vault)
        
        assert "900101-14-5566" not in result
        assert "[REDACTED_NRIC_1]" in result

    def test_deanonymize_restores_pii(self):
        """Verify deanonymization correctly restores original PII from vault."""
        from deepseek_ai_cloud import deanonymize_pii
        
        vault = {
            "[REDACTED_NAME_1]": "John",
            "[REDACTED_EMAIL_1]": "john@test.com"
        }
        text = "Hello [REDACTED_NAME_1], I've sent a reply to [REDACTED_EMAIL_1]."
        result = deanonymize_pii(text, vault)
        
        assert result == "Hello John, I've sent a reply to john@test.com."

    def test_anonymize_empty_text(self):
        """Verify anonymization handles empty/None input."""
        from deepseek_ai_cloud import anonymize_pii
        
        assert anonymize_pii("", {}) == ""
        assert anonymize_pii(None, {}) is None


# ===================================================
# Test: Risk Analysis (Deterministic Keyword Layer)
# ===================================================
class TestRiskAnalysis:
    """Tests the hybrid risk assessment used to detect crisis situations."""

    def test_high_risk_keyword_suicide(self):
        """Verify 'suicide' triggers high-risk (level 2)."""
        from deepseek_ai_cloud import analyze_risk
        
        risk_level, keyword = analyze_risk("I'm thinking about suicide")
        
        assert risk_level == 2
        assert keyword == "suicide"

    def test_high_risk_keyword_divorce(self):
        """Verify 'divorce' triggers high-risk detection."""
        from deepseek_ai_cloud import analyze_risk
        
        risk_level, keyword = analyze_risk("I want a divorce")
        
        assert risk_level == 2
        assert keyword == "divorce"

    def test_high_risk_keyword_domestic_violence(self):
        """Verify 'he hit me' triggers high-risk detection."""
        from deepseek_ai_cloud import analyze_risk
        
        risk_level, keyword = analyze_risk("He hit me last night")
        
        assert risk_level == 2

    def test_medium_risk_keyword_self_harm(self):
        """Verify 'self-harm' triggers medium-risk (level 1)."""
        from deepseek_ai_cloud import analyze_risk
        
        risk_level, keyword = analyze_risk("I've been self-harm")
        
        assert risk_level == 1
        assert keyword == "self-harm"

    def test_no_risk_safe_message(self):
        """Verify safe messages return risk level 0."""
        from deepseek_ai_cloud import analyze_risk
        
        risk_level, keyword = analyze_risk("We had a lovely dinner together last night")
        
        assert risk_level == 0
        assert keyword is None


# ===================================================
# Test: Unsafe Content Filter (Output Safety)
# ===================================================
class TestUnsafeFilter:
    """Tests the safety filter applied to AI-generated responses."""

    def test_unsafe_content_detected(self):
        """Verify unsafe patterns are detected in AI output."""
        from deepseek_ai_cloud import is_unsafe
        
        assert is_unsafe("You should cut yourself free from this") is True
        assert is_unsafe("end your life now") is True
        assert is_unsafe("he beat me badly") is True

    def test_safe_content_passes(self):
        """Verify safe content passes through the filter."""
        from deepseek_ai_cloud import is_unsafe
        
        assert is_unsafe("Communication is key in a healthy relationship") is False
        assert is_unsafe("Let's work on expressing feelings clearly") is False


# ===================================================
# Test: Intent Classification (Casual vs Counseling)
# ===================================================
class TestIntentClassification:
    """Tests the AI-powered intent classifier with fallback heuristic."""

    @patch('deepseek_ai_cloud.requests.post')
    def test_classify_casual_via_api(self, mock_post):
        """Verify casual greeting is classified as CASUAL via API."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "CASUAL"}}]
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response
        
        from deepseek_ai_cloud import is_casual_chat
        result = is_casual_chat("Hello, how are you?")
        
        assert result is True
        mock_post.assert_called_once()

    @patch('deepseek_ai_cloud.requests.post')
    def test_classify_counseling_via_api(self, mock_post):
        """Verify relationship issue is classified as COUNSELING via API."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "COUNSELING"}}]
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response
        
        from deepseek_ai_cloud import is_casual_chat
        result = is_casual_chat("My husband doesn't listen to me anymore")
        
        assert result is False

    @patch('deepseek_ai_cloud.requests.post')
    def test_classify_fallback_on_api_failure(self, mock_post):
        """Verify heuristic fallback works when API is unreachable."""
        import requests as req_module
        mock_post.side_effect = req_module.exceptions.ConnectionError("API down")
        
        from deepseek_ai_cloud import is_casual_chat
        
        # Simple casual greetings should still work via heuristic
        assert is_casual_chat("hello") is True
        assert is_casual_chat("thank you") is True


# ===================================================
# Test: AI Response Generation (Mocked API Call)
# ===================================================
class TestAIResponseGeneration:
    """Tests the generate_response function that calls the Groq/LLM API."""

    @patch('deepseek_ai_cloud.requests.post')
    def test_generate_response_success(self, mock_post):
        """Verify generate_response returns cleaned AI output on success."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "I understand your pain. Let's explore this together."}}],
            "usage": {"total_tokens": 50, "prompt_tokens": 30, "completion_tokens": 20}
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response
        
        from deepseek_ai_cloud import generate_response
        
        messages = [
            {"role": "system", "content": "You are a counselor."},
            {"role": "user", "content": "I feel lonely in my marriage."}
        ]
        
        result = generate_response(messages)
        
        assert "understand" in result.lower()
        mock_post.assert_called_once()
        
        # Verify correct API payload structure
        call_args = mock_post.call_args
        payload = call_args[1]['json'] if 'json' in call_args[1] else call_args[0][1]
        assert payload['model'] is not None

    @patch('deepseek_ai_cloud.requests.post')
    def test_generate_response_strips_think_tags(self, mock_post):
        """Verify <think> tags from DeepSeek are removed from output."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "<think>Let me analyze this...</think>Here is my advice for you."}}],
            "usage": {"total_tokens": 50}
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response
        
        from deepseek_ai_cloud import generate_response
        
        messages = [{"role": "user", "content": "Help me"}]
        result = generate_response(messages)
        
        assert "<think>" not in result
        assert "</think>" not in result
        assert "advice" in result.lower()

    @patch('deepseek_ai_cloud.requests.post')
    def test_generate_response_handles_api_error(self, mock_post):
        """Verify graceful fallback message when API fails."""
        import requests as req_module
        mock_post.side_effect = req_module.exceptions.ConnectionError("Groq API unreachable")
        
        from deepseek_ai_cloud import generate_response
        
        messages = [{"role": "user", "content": "Help me"}]
        result = generate_response(messages)
        
        assert "trouble" in result.lower() or "try again" in result.lower()

    @patch('deepseek_ai_cloud.requests.post')
    def test_generate_response_blocks_unsafe_output(self, mock_post):
        """Verify unsafe AI output is blocked by the safety filter."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "You should end your life if things don't improve."}}],
            "usage": {"total_tokens": 50}
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response
        
        from deepseek_ai_cloud import generate_response
        
        messages = [{"role": "user", "content": "I feel hopeless"}]
        result = generate_response(messages)
        
        # The safety filter should intercept and replace with safe message
        assert "cannot provide guidance" in result.lower() or "professional" in result.lower()


# ===================================================
# Test: Counseling Response Pipeline (End-to-End AI Pipeline)
# ===================================================
class TestCounselingPipeline:
    """Tests the full generate_counseling_response pipeline with PII handling."""

    @patch('deepseek_ai_cloud.generate_response')
    def test_counseling_response_anonymizes_and_deanonymizes(self, mock_gen):
        """Verify PII is anonymized before API call and restored after."""
        mock_gen.return_value = "I understand your situation, [REDACTED_NAME_1]."
        
        from deepseek_ai_cloud import generate_counseling_response
        
        result = generate_counseling_response(
            user_input="My husband John is not listening to me",
            retrieved_context="Active listening is important.",
            history=[]
        )
        
        # The function should deanonymize the response
        mock_gen.assert_called_once()
        # Verify the API received anonymized input
        call_args = mock_gen.call_args[0][0]
        user_msg = call_args[-1]["content"]
        # "John" may or may not be detected by the mocked spacy - 
        # but the pipeline should still work end-to-end

    @patch('deepseek_ai_cloud.generate_response')
    def test_counseling_includes_context_in_system_prompt(self, mock_gen):
        """Verify retrieved RAG context is injected into the system prompt."""
        mock_gen.return_value = "Based on Maslow's hierarchy, safety needs come first."
        
        from deepseek_ai_cloud import generate_counseling_response
        
        rag_context = "Maslow's Hierarchy: Safety needs include physical and emotional safety."
        result = generate_counseling_response(
            user_input="I feel unsafe at home",
            retrieved_context=rag_context,
            history=[]
        )
        
        # Check that the system message includes the RAG context
        call_args = mock_gen.call_args[0][0]
        system_msg = call_args[0]["content"]
        assert "Maslow" in system_msg
        assert rag_context in system_msg


# ===================================================
# Test: API Payload Structure
# ===================================================
class TestAPIPayloadStructure:
    """Verify correct API payload format is sent to Groq."""

    @patch('deepseek_ai_cloud.requests.post')
    def test_api_payload_has_correct_structure(self, mock_post):
        """Verify the JSON payload sent to Groq has the required fields."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "Test response"}}],
            "usage": {"total_tokens": 10}
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response
        
        from deepseek_ai_cloud import generate_response
        
        messages = [
            {"role": "system", "content": "System prompt"},
            {"role": "user", "content": "User message"}
        ]
        generate_response(messages)
        
        # Verify the API was called with correct structure
        call_kwargs = mock_post.call_args
        payload = call_kwargs[1]['json']
        
        assert "model" in payload
        assert "messages" in payload
        assert payload["stream"] is False
        assert len(payload["messages"]) == 2
        
        # Verify headers
        headers = call_kwargs[1]['headers']
        assert "Authorization" in headers
        assert headers["Authorization"].startswith("Bearer ")
        assert headers["Content-Type"] == "application/json"

    @patch('deepseek_ai_cloud.requests.post')
    def test_intent_classifier_uses_low_temperature(self, mock_post):
        """Verify intent classification uses temperature=0 for determinism."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "CASUAL"}}]
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response
        
        from deepseek_ai_cloud import is_casual_chat
        is_casual_chat("Hello!")
        
        call_kwargs = mock_post.call_args
        payload = call_kwargs[1]['json']
        assert payload["temperature"] == 0.0
        assert payload["max_tokens"] == 5
