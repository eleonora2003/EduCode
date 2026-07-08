import pytest
from unittest.mock import MagicMock, patch

from app.services.sandbox_service import run_python_validation

# Constant for the docker patch path
DOCKER_PATCH = 'app.services.sandbox_service.docker.from_env'


class TestRunPythonValidation:
    """Core tests for run_python_validation function."""
    
    def test_successful_validation(self):
        """Should return passed=True when all tests pass."""
        solution_code = "def add(a, b): return a + b"
        test_code = "assert add(2, 3) == 5"
        
        mock_container = MagicMock()
        mock_client = MagicMock()
        mock_client.containers.run.return_value = mock_container
        
        mock_exec_result = MagicMock()
        mock_exec_result.exit_code = 0
        mock_exec_result.output = (b"=== ALL TESTS PASSED ===", b"")
        
        mock_container.exec_run.return_value = mock_exec_result
        
        with patch(DOCKER_PATCH, return_value=mock_client):
            result = run_python_validation(solution_code, test_code)
            
            assert result["passed"] is True
            assert "=== ALL TESTS PASSED ===" in result["logs"]
            assert result["passed_tests"] == 1
            assert result["total_tests"] == 1
    
    def test_failed_validation(self):
        """Should return passed=False when tests fail."""
        solution_code = "def add(a, b): return a - b"  # Wrong implementation
        test_code = "assert add(2, 3) == 5"
        
        mock_container = MagicMock()
        mock_client = MagicMock()
        mock_client.containers.run.return_value = mock_container
        
        mock_exec_result = MagicMock()
        mock_exec_result.exit_code = 1
        mock_exec_result.output = (b"AssertionError", b"")
        
        mock_container.exec_run.return_value = mock_exec_result
        
        with patch(DOCKER_PATCH, return_value=mock_client):
            result = run_python_validation(solution_code, test_code)
            
            assert result["passed"] is False
            assert "AssertionError" in result["logs"]
            assert result["passed_tests"] == 0
            assert result["total_tests"] == 1
    
    def test_multiple_tests(self):
        """Should count multiple assert statements."""
        solution_code = "def multiply(a, b): return a * b"
        test_code = """
assert multiply(2, 3) == 6
assert multiply(4, 5) == 20
assert multiply(0, 100) == 0
"""
        
        mock_container = MagicMock()
        mock_client = MagicMock()
        mock_client.containers.run.return_value = mock_container
        
        mock_exec_result = MagicMock()
        mock_exec_result.exit_code = 0
        mock_exec_result.output = (b"=== ALL TESTS PASSED ===", b"")
        
        mock_container.exec_run.return_value = mock_exec_result
        
        with patch(DOCKER_PATCH, return_value=mock_client):
            result = run_python_validation(solution_code, test_code)
            
            assert result["passed"] is True
            assert result["total_tests"] == 3
            assert result["passed_tests"] == 3
    
    def test_partial_failure(self):
        """Should return passed=False if any test fails."""
        solution_code = "def divide(a, b): return a / b"
        test_code = """
assert divide(10, 2) == 5
assert divide(9, 3) == 3
assert divide(10, 0) == float('inf')  # This will fail
"""
        
        mock_container = MagicMock()
        mock_client = MagicMock()
        mock_client.containers.run.return_value = mock_container
        
        mock_exec_result = MagicMock()
        mock_exec_result.exit_code = 1
        mock_exec_result.output = (b"ZeroDivisionError", b"")
        
        mock_container.exec_run.return_value = mock_exec_result
        
        with patch(DOCKER_PATCH, return_value=mock_client):
            result = run_python_validation(solution_code, test_code)
            
            assert result["passed"] is False
            assert result["total_tests"] == 3
            assert result["passed_tests"] == 0
    
    def test_syntax_error_in_solution(self):
        """Should handle syntax errors in solution code."""
        solution_code = "def broken(: # Invalid syntax"
        test_code = "assert True"
        
        mock_container = MagicMock()
        mock_client = MagicMock()
        mock_client.containers.run.return_value = mock_container
        
        mock_exec_result = MagicMock()
        mock_exec_result.exit_code = 1
        mock_exec_result.output = (b"SyntaxError", b"")
        
        mock_container.exec_run.return_value = mock_exec_result
        
        with patch(DOCKER_PATCH, return_value=mock_client):
            result = run_python_validation(solution_code, test_code)
            
            assert result["passed"] is False
            assert "SyntaxError" in result["logs"]