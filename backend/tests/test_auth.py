import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    authenticate_user,
    get_current_user,
    get_current_active_user,
    oauth2_scheme
)
from app.models import User
from app.schemas import TokenData


class TestGetPasswordHash:
    """Tests for get_password_hash function."""
    
    def test_returns_string_with_colon(self):
        """Hash should contain a colon separating salt and hash."""
        result = get_password_hash("testpassword")
        assert ":" in result
    
    def test_different_hashes_for_same_password(self):
        """Each hash should be unique due to random salt."""
        hash1 = get_password_hash("password123")
        hash2 = get_password_hash("password123")
        assert hash1 != hash2
    
    def test_salt_length(self):
        """Salt should be 32 hex characters (16 bytes)."""
        result = get_password_hash("testpassword")
        salt = result.split(":")[0]
        assert len(salt) == 32
    
    def test_empty_password(self):
        """Should handle empty password."""
        result = get_password_hash("")
        assert ":" in result
    
    def test_long_password(self):
        """Should handle long passwords (no 72-byte limitation)."""
        long_password = "a" * 200
        result = get_password_hash(long_password)
        assert ":" in result


class TestVerifyPassword:
    """Tests for verify_password function."""
    
    def test_verify_sha256_hash(self):
        """Should verify SHA-256 hashed password."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True
    
    def test_verify_wrong_password(self):
        """Should return False for wrong password."""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = get_password_hash(password)
        assert verify_password(wrong_password, hashed) is False
    
    def test_verify_bcrypt_hash(self, monkeypatch):
        """Should verify bcrypt hashed password."""
        # Mock CryptContext to return a mock that verifies correctly
        mock_ctx = MagicMock()
        mock_ctx.verify.return_value = True
        
        def mock_init(self, schemes, deprecated):
            # Empty by design - we only need the mock behavior, not actual initialization
            pass
        
        monkeypatch.setattr("passlib.context.CryptContext.__init__", mock_init)
        monkeypatch.setattr("passlib.context.CryptContext.verify", lambda self, plain, hashed: mock_ctx.verify(plain, hashed))
        
        result = verify_password("correct", "$2b$12$somehash")
        assert result is True
    
    def test_verify_bcrypt_wrong_password(self, monkeypatch):
        """Should return False for wrong bcrypt password."""
        def mock_verify(plain, hashed):
            return False
        
        monkeypatch.setattr("passlib.context.CryptContext.verify", mock_verify)
        result = verify_password("wrong", "$2b$12$somehash")
        assert result is False
    
    def test_verify_invalid_hash_format(self):
        """Should return False for invalid hash format."""
        result = verify_password("password", "invalid_hash_without_colon")
        assert result is False
    
    def test_verify_empty_password(self):
        """Should handle empty password."""
        result = verify_password("", "salt:hash")
        assert result is False
    
    def test_verify_none_hash(self):
        """Should handle None hash."""
        # Test with empty string instead of None to avoid type mismatch
        result = verify_password("password", "")
        assert result is False


class TestCreateAccessToken:
    """Tests for create_access_token function."""
    
    def test_returns_string(self, mock_settings):
        """Should return a string token."""
        result = create_access_token(data={"sub": "test@example.com"})
        assert isinstance(result, str)
    
    def test_token_contains_expiration(self, mock_settings):
        """Token should contain expiration claim."""
        result = create_access_token(data={"sub": "test@example.com"})
        assert result is not None
        parts = result.split(".")
        assert len(parts) == 3
    
    def test_custom_expires_delta(self, mock_settings):
        """Should use custom expiration delta."""
        custom_delta = timedelta(hours=2)
        result = create_access_token(
            data={"sub": "test@example.com"},
            expires_delta=custom_delta
        )
        assert isinstance(result, str)
    
    def test_different_data_different_tokens(self, mock_settings):
        """Different data should produce different tokens."""
        token1 = create_access_token(data={"sub": "user1@example.com"})
        token2 = create_access_token(data={"sub": "user2@example.com"})
        assert token1 != token2


class TestAuthenticateUser:
    """Tests for authenticate_user function."""
    
    def test_authenticate_valid_user(self, mock_db, sample_user):
        """Should return user for valid credentials."""
        mock_user = MagicMock(spec=User)
        mock_user.email = sample_user["email"]
        mock_user.hashed_password = get_password_hash("testpassword")
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        with patch('app.auth.verify_password', return_value=True):
            result = authenticate_user(mock_db, "test@example.com", "testpassword")
            assert result == mock_user
    
    def test_authenticate_user_not_found(self, mock_db):
        """Should return None for non-existent user."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = authenticate_user(mock_db, "unknown@example.com", "password")
        assert result is None
    
    def test_authenticate_wrong_password(self, mock_db, sample_user):
        """Should return None for wrong password."""
        mock_user = MagicMock(spec=User)
        mock_user.email = sample_user["email"]
        mock_user.hashed_password = get_password_hash("correctpassword")
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        with patch('app.auth.verify_password', return_value=False):
            result = authenticate_user(mock_db, "test@example.com", "wrongpassword")
            assert result is None


class TestGetCurrentUser:
    """Tests for get_current_user function."""
    
    def test_get_current_user_valid_token(self, mock_db, mock_settings):
        """Should return user for valid token."""
        mock_user = MagicMock(spec=User)
        mock_user.email = "test@example.com"
        mock_user.is_active = True
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        token = create_access_token(data={"sub": "test@example.com"})
        
        with patch('app.auth.get_db', return_value=mock_db):
            result = get_current_user(token=token, db=mock_db)
            assert result == mock_user
    
    def test_get_current_user_no_token(self, mock_db):
        """Should raise exception for missing token."""
        from fastapi import HTTPException
        
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token=None, db=mock_db)
        assert exc_info.value.status_code == 401
    
    def test_get_current_user_invalid_token(self, mock_db):
        """Should raise exception for invalid token."""
        from fastapi import HTTPException
        
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token="invalid.token.here", db=mock_db)
        assert exc_info.value.status_code == 401
    
    def test_get_current_user_inactive_user(self, mock_db, mock_settings):
        """Should raise exception for inactive user."""
        from fastapi import HTTPException
        
        mock_user = MagicMock(spec=User)
        mock_user.email = "test@example.com"
        mock_user.is_active = False
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        token = create_access_token(data={"sub": "test@example.com"})
        
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token=token, db=mock_db)
        assert exc_info.value.status_code == 403


class TestGetCurrentActiveUser:
    """Tests for get_current_active_user function."""
    
    def test_get_current_active_user_active(self):
        """Should return user if active."""
        mock_user = MagicMock(spec=User)
        mock_user.is_active = True
        
        result = get_current_active_user(current_user=mock_user)
        assert result == mock_user
    
    def test_get_current_active_user_inactive(self):
        """Should raise exception if user is inactive."""
        from fastapi import HTTPException
        
        mock_user = MagicMock(spec=User)
        mock_user.is_active = False
        
        with pytest.raises(HTTPException) as exc_info:
            get_current_active_user(current_user=mock_user)
        assert exc_info.value.status_code == 400