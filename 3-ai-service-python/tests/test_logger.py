import json
import logging
from utils.logger import JSONFormatter

def test_json_formatter():
    formatter = JSONFormatter()
    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname="",
        lineno=1,
        msg="Test message",
        args=(),
        exc_info=None
    )
    # Add mock module since we are constructing record manually
    record.module = "test_module"
    
    formatted_msg = formatter.format(record)
    parsed = json.loads(formatted_msg)
    
    assert parsed["level"] == "INFO"
    assert parsed["message"] == "Test message"
    assert parsed["module"] == "test_module"
    assert "timestamp" in parsed
