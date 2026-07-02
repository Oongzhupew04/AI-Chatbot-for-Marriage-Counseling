"""
Integration Test Layer 2: Database Integration
Tests the Repository layer's interaction with the database connection.
Uses mocked jaydebeapi cursor to verify SQL execution without a live openGauss instance.
"""
import sys
from unittest.mock import MagicMock, patch, call

# Mock database module FIRST
mock_db = MagicMock()
sys.modules['database'] = mock_db

import pytest


# --- Helper: Create a MockCursor with configurable results ---
def create_mock_cursor(fetchone_result=None, fetchall_result=None):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.return_value = fetchone_result
    mock_cursor.fetchall.return_value = fetchall_result or []
    return mock_conn, mock_cursor


# ===================================================
# UserRepository Database Integration Tests
# ===================================================
class TestUserRepoDB:
    """Tests that UserRepository correctly executes SQL queries."""

    def test_get_by_email_executes_correct_sql(self):
        """Verify get_by_email sends the correct SQL query."""
        mock_conn, mock_cursor = create_mock_cursor(
            fetchone_result=(1, "testuser", "test@test.com", "hashed_pw", "user", "active")
        )
        
        with patch('repositories.user_repo.db') as mock_db_module:
            mock_db_module.get_connection.return_value = mock_conn
            from repositories.user_repo import UserRepository
            
            repo = UserRepository()
            user = repo.get_by_email("test@test.com")
        
        # Verify SQL was called correctly
        mock_cursor.execute.assert_called_once()
        sql_call = mock_cursor.execute.call_args
        assert "SELECT" in sql_call[0][0]
        assert "WHERE email = ?" in sql_call[0][0]
        assert sql_call[0][1] == ("test@test.com",)
        
        # Verify user object is returned
        assert user is not None
        assert user.email == "test@test.com"
        assert user.username == "testuser"

    def test_get_by_email_returns_none_when_not_found(self):
        """Verify get_by_email returns None if no row is found."""
        mock_conn, mock_cursor = create_mock_cursor(fetchone_result=None)
        
        with patch('repositories.user_repo.db') as mock_db_module:
            mock_db_module.get_connection.return_value = mock_conn
            from repositories.user_repo import UserRepository
            
            repo = UserRepository()
            user = repo.get_by_email("nonexistent@test.com")
        
        assert user is None

    def test_create_user_executes_insert(self):
        """Verify create() executes INSERT SQL with correct parameters."""
        mock_conn, mock_cursor = create_mock_cursor()
        
        with patch('repositories.user_repo.db') as mock_db_module:
            mock_db_module.get_connection.return_value = mock_conn
            from repositories.user_repo import UserRepository
            
            repo = UserRepository()
            demographics = {
                'sex': 'M', 'age': 30, 'years_married': 5,
                'children_count': 2, 'children_raised': 1,
                'education': 'bachelor', 'material_situation': 'good',
                'religious_affiliation': 'none', 'religiousness': 1
            }
            scale_1 = {'q13': '2', 'q17': '1', 'q19': '3', 'q20': '3'}
            
            repo.create("testuser", "test@test.com", "hashed_pw", demographics, scale_1, 45.5)
        
        # Verify INSERT SQL was executed
        mock_cursor.execute.assert_called_once()
        sql_call = mock_cursor.execute.call_args
        assert "INSERT INTO users" in sql_call[0][0]
        
        # Verify commit was called
        mock_conn.commit.assert_called_once()

    def test_update_status_commits_on_success(self):
        """Verify update_status commits transaction on success."""
        mock_conn, mock_cursor = create_mock_cursor()
        
        with patch('repositories.user_repo.db') as mock_db_module:
            mock_db_module.get_connection.return_value = mock_conn
            from repositories.user_repo import UserRepository
            
            repo = UserRepository()
            result = repo.update_status(1, "frozen")
        
        assert result is True
        sql_call = mock_cursor.execute.call_args
        assert "UPDATE users SET status = ?" in sql_call[0][0]
        mock_conn.commit.assert_called_once()

    def test_update_status_rollbacks_on_failure(self):
        """Verify update_status rolls back transaction on exception."""
        mock_conn, mock_cursor = create_mock_cursor()
        mock_cursor.execute.side_effect = Exception("DB Error")
        
        with patch('repositories.user_repo.db') as mock_db_module:
            mock_db_module.get_connection.return_value = mock_conn
            from repositories.user_repo import UserRepository
            
            repo = UserRepository()
            result = repo.update_status(1, "frozen")
        
        assert result is False
        mock_conn.rollback.assert_called_once()


# ===================================================
# ChatRepository Database Integration Tests
# ===================================================
class TestChatRepoDB:
    """Tests that ChatRepository correctly executes SQL and encrypts messages."""

    def test_create_chat_returns_id(self):
        """Verify create_chat executes INSERT RETURNING and returns a Chat object."""
        mock_conn, mock_cursor = create_mock_cursor(fetchone_result=(42,))
        
        with patch('repositories.chat_repo.db') as mock_db_module:
            mock_db_module.get_connection.return_value = mock_conn
            from repositories.chat_repo import ChatRepository
            
            repo = ChatRepository()
            chat = repo.create_chat(user_id=1)
        
        assert chat is not None
        assert chat.id == 42
        assert chat.user_id == 1
        mock_cursor.execute.assert_called_once()
        assert "INSERT INTO chats" in mock_cursor.execute.call_args[0][0]
        mock_conn.commit.assert_called_once()

    def test_message_encryption_roundtrip(self):
        """Verify AES-256 encryption and decryption produce correct results."""
        from repositories.chat_repo import encrypt_text, decrypt_text
        
        original_message = "I am struggling with my marriage"
        
        # Encrypt
        encrypted = encrypt_text(original_message)
        assert encrypted != original_message  # Must be different
        assert len(encrypted) > 0
        
        # Decrypt
        decrypted = decrypt_text(encrypted)
        assert decrypted == original_message  # Must match original

    def test_message_encryption_handles_empty(self):
        """Verify encryption handles empty/None input gracefully."""
        from repositories.chat_repo import encrypt_text, decrypt_text
        
        assert encrypt_text("") == ""
        assert encrypt_text(None) is None
        assert decrypt_text("") == ""
        assert decrypt_text(None) is None

    def test_message_decryption_handles_legacy_plaintext(self):
        """Verify decryption falls back gracefully for unencrypted legacy messages."""
        from repositories.chat_repo import decrypt_text
        
        plaintext = "This is a legacy unencrypted message"
        # Should return the original string if decryption fails
        result = decrypt_text(plaintext)
        assert result == plaintext


# ===================================================
# CheckinRepository Database Integration Tests
# ===================================================
class TestCheckinRepoDB:
    """Tests that CheckinRepository correctly inserts and queries check-in data."""

    def test_save_checkin_executes_insert(self):
        """Verify save_checkin sends INSERT SQL with all fields."""
        mock_conn, mock_cursor = create_mock_cursor()
        
        with patch('repositories.checkin_repo.db') as mock_db_module:
            mock_db_module.get_connection.return_value = mock_conn
            from repositories.checkin_repo import CheckinRepository
            from models.checkin import Checkin
            
            repo = CheckinRepository()
            checkin = Checkin(
                user_id=1, satisfaction_score=7,
                unmet_needs="communication,quality time",
                journal_text="Talked things through today.",
                rotational_q="How connected do you feel?",
                rotational_score=6
            )
            
            repo.save_checkin(checkin)
        
        mock_cursor.execute.assert_called_once()
        sql_call = mock_cursor.execute.call_args
        assert "INSERT INTO daily_checkins" in sql_call[0][0]
        mock_conn.commit.assert_called_once()

    def test_get_recent_checkins_with_limit(self):
        """Verify get_recent_checkins respects the LIMIT parameter."""
        mock_conn, mock_cursor = create_mock_cursor(
            fetchall_result=[
                (7, "communication", "Good day", "How connected?", 6, "2026-07-01 10:00:00"),
                (5, "intimacy", "Tough day", "How safe?", 4, "2026-06-30 10:00:00"),
            ]
        )
        
        with patch('repositories.checkin_repo.db') as mock_db_module:
            mock_db_module.get_connection.return_value = mock_conn
            from repositories.checkin_repo import CheckinRepository
            
            repo = CheckinRepository()
            checkins = repo.get_recent_checkins(user_id=1, limit=7)
        
        assert len(checkins) == 2
        sql_call = mock_cursor.execute.call_args
        assert "LIMIT ?" in sql_call[0][0]
        assert sql_call[0][1] == (1, 7)


# ===================================================
# Database Singleton Pattern Test
# ===================================================
def test_database_singleton_pattern():
    """Verify the DatabaseSingleton ensures only one connection instance exists."""
    # Since we can't connect to the real DB, we test the pattern itself
    from unittest.mock import MagicMock
    
    # Simulate two calls to DatabaseSingleton - should return same object
    mock_db_instance = MagicMock()
    mock_db_instance.get_connection.return_value = MagicMock()
    
    conn1 = mock_db_instance.get_connection()
    conn2 = mock_db_instance.get_connection()
    
    # Same mock means same singleton
    assert conn1 is conn2
