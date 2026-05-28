import pytest
from unittest.mock import MagicMock, patch
import json

from app.services.generation_service import GenerationService


class TestGenerationServiceInit:
    """Tests for GenerationService initialization."""
    
    def test_init_creates_openai_client(self):
        """Should initialize with OpenAI client."""
        with patch('app.services.generation_service.OpenAI') as mock_openai:
            service = GenerationService()
            
            mock_openai.assert_called_once()
            assert service.client is not None


class TestGenerationServiceGenerateTask:
    """Tests for GenerationService.generate_task method."""
    
    def test_generate_task_success(self):
        """Should generate task from AI response."""
        mock_response = {
            "title": "Test Task",
            "description": "Test Description",
            "examples": "Example 1: input -> output",
            "solution": "def solution(): pass",
            "tests": "assert solution() == True"
        }
        
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            mock_completion = MagicMock()
            mock_completion.choices = [MagicMock()]
            mock_completion.choices[0].message.content = json.dumps(mock_response)
            service.client.chat.completions.create.return_value = mock_completion
            
            result = service.generate_task(
                language="Python",
                concept="Loops",
                difficulty="Basic"
            )
            
            assert result["title"] == "Test Task"
            assert result["description"] == "Test Description"
            assert result["solution"] == "def solution(): pass"
            assert result["tests"] == "assert solution() == True"
            assert result["language"] == "Python"
            assert result["concept"] == "Loops"
            assert result["difficulty"] == "Basic"
    
    def test_generate_task_with_template(self):
        """Should include template name in generation."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            mock_completion = MagicMock()
            mock_completion.choices = [MagicMock()]
            mock_completion.choices[0].message.content = json.dumps({
                "title": "Test",
                "description": "Test",
                "examples": "",
                "solution": "pass",
                "tests": ""
            })
            service.client.chat.completions.create.return_value = mock_completion
            
            result = service.generate_task(
                language="Python",
                concept="Loops",
                difficulty="Basic",
                template_name="Algorithm Challenge"
            )
            
            assert result["template_name"] == "Algorithm Challenge"
    
    def test_generate_task_handles_json_decode_error(self):
        """Should handle non-JSON response gracefully."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            mock_completion = MagicMock()
            mock_completion.choices = [MagicMock()]
            mock_completion.choices[0].message.content = "Not JSON response"
            service.client.chat.completions.create.return_value = mock_completion
            
            with patch.object(service, '_parse_raw_response') as mock_parse:
                mock_parse.return_value = {
                    "title": "Parsed Task",
                    "description": "Parsed",
                    "examples": "",
                    "solution": "",
                    "tests": "",
                    "concept": "Loops",
                    "language": "Python",
                    "difficulty": "Basic",
                    "template_name": "Default Template"
                }
                
                result = service.generate_task(
                    language="Python",
                    concept="Loops",
                    difficulty="Basic"
                )
                
                assert result["title"] == "Parsed Task"
                mock_parse.assert_called_once()
    
    def test_generate_task_handles_exception(self):
        """Should return error response on exception."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            service.client.chat.completions.create.side_effect = Exception("API Error")
            
            result = service.generate_task(
                language="Python",
                concept="Loops",
                difficulty="Basic"
            )
            
            assert result["title"] == "Error generating task"
            assert "Failed to generate task" in result["description"]
    
    def test_generate_task_converts_examples_list_to_string(self):
        """Should convert examples list to formatted string."""
        mock_response = {
            "title": "Test",
            "description": "Test",
            "examples": [
                {"input": "1", "output": "2"},
                {"input": "3", "output": "4"}
            ],
            "solution": "pass",
            "tests": ""
        }
        
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            mock_completion = MagicMock()
            mock_completion.choices = [MagicMock()]
            mock_completion.choices[0].message.content = json.dumps(mock_response)
            service.client.chat.completions.create.return_value = mock_completion
            
            result = service.generate_task(
                language="Python",
                concept="Loops",
                difficulty="Basic"
            )
            
            # Should be a formatted string, not a list
            assert isinstance(result["examples"], str)
            assert "Example 1:" in result["examples"]
    
    def test_generate_task_converts_tests_list_to_string(self):
        """Should convert tests list to formatted string."""
        mock_response = {
            "title": "Test",
            "description": "Test",
            "examples": "",
            "solution": "pass",
            "tests": [
                {"description": "Test 1", "code": "assert True"},
                {"description": "Test 2", "code": "assert 1 == 1"}
            ]
        }
        
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            mock_completion = MagicMock()
            mock_completion.choices = [MagicMock()]
            mock_completion.choices[0].message.content = json.dumps(mock_response)
            service.client.chat.completions.create.return_value = mock_completion
            
            result = service.generate_task(
                language="Python",
                concept="Loops",
                difficulty="Basic"
            )
            
            # Should be a formatted string, not a list
            assert isinstance(result["tests"], str)
            assert "# Test 1:" in result["tests"]


class TestGenerationServiceGetSystemPrompt:
    """Tests for GenerationService._get_system_prompt method."""
    
    def test_system_prompt_contains_base_instructions(self):
        """Should include base system prompt."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            prompt = service._get_system_prompt("Python", "Default Template")
            
            assert "expert programming educator" in prompt
            assert "JSON" in prompt
    
    def test_system_prompt_includes_template_instructions(self):
        """Should include template-specific instructions."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            prompt = service._get_system_prompt("Python", "Algorithm Challenge")
            
            assert "algorithmic thinking" in prompt
    
    def test_system_prompt_default_template(self):
        """Should use default template instructions for unknown template."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            prompt = service._get_system_prompt("Python", "Unknown Template")
            
            assert "standard programming exercise" in prompt


class TestGenerationServiceGetUserPrompt:
    """Tests for GenerationService._get_user_prompt method."""
    
    def test_user_prompt_contains_parameters(self):
        """Should include all parameters in prompt."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            prompt = service._get_user_prompt(
                language="Python",
                concept="Loops",
                difficulty="Basic",
                template_name="Default"
            )
            
            assert "Python" in prompt
            assert "Loops" in prompt
            assert "Basic" in prompt
            assert "Default" in prompt


class TestGenerationServiceGetTemplateInstructions:
    """Tests for GenerationService._get_template_instructions method."""
    
    def test_default_template_instructions(self):
        """Should return default template instructions."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            instructions = service._get_template_instructions("Default Template", "Python")
            
            assert "standard programming exercise" in instructions
    
    def test_algorithm_challenge_instructions(self):
        """Should return algorithm challenge instructions."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            instructions = service._get_template_instructions("Algorithm Challenge", "Python")
            
            assert "algorithmic thinking" in instructions
            assert "time/space complexity" in instructions
    
    def test_data_structure_practice_instructions(self):
        """Should return data structure practice instructions."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            instructions = service._get_template_instructions("Data Structure Practice", "Python")
            
            assert "data structure" in instructions.lower()
    
    def test_real_world_problem_instructions(self):
        """Should return real-world problem instructions."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            instructions = service._get_template_instructions("Real-World Problem", "Python")
            
            assert "real-world" in instructions
            assert "practical" in instructions
    
    def test_code_optimization_instructions(self):
        """Should return code optimization instructions."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            instructions = service._get_template_instructions("Code Optimization", "Python")
            
            assert "optimization" in instructions.lower()
            assert "naive approach" in instructions.lower()
    
    def test_unknown_template_returns_default(self):
        """Should return default instructions for unknown template."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            instructions = service._get_template_instructions("Unknown", "Python")
            
            assert "standard programming exercise" in instructions


class TestGenerationServiceFormatExamplesList:
    """Tests for GenerationService._format_examples_list method."""
    
    def test_format_empty_list(self):
        """Should return empty string for empty list."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            result = service._format_examples_list([])
            
            assert result == ""
    
    def test_format_examples_with_dict(self):
        """Should format list of example dicts."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            examples = [
                {"input": "1", "output": "2"},
                {"input": "3", "output": "4"}
            ]
            
            result = service._format_examples_list(examples)
            
            assert "Example 1:" in result
            assert "Input: 1" in result
            assert "Output: 2" in result
            assert "Example 2:" in result
    
    def test_format_examples_with_strings(self):
        """Should handle list of strings."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            examples = ["Example 1", "Example 2"]
            
            result = service._format_examples_list(examples)
            
            assert "Example 1" in result
            assert "Example 2" in result


class TestGenerationServiceFormatTestsList:
    """Tests for GenerationService._format_tests_list method."""
    
    def test_format_empty_tests(self):
        """Should return empty string for empty list."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            result = service._format_tests_list([])
            
            assert result == ""
    
    def test_format_tests_with_description(self):
        """Should format tests with descriptions."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            tests = [
                {"description": "Test 1", "code": "assert True"},
                {"description": "Test 2", "code": "assert False"}
            ]
            
            result = service._format_tests_list(tests)
            
            assert "# Test 1: Test 1" in result
            assert "assert True" in result
            assert "# Test 2: Test 2" in result
            assert "assert False" in result
    
    def test_format_tests_without_description(self):
        """Should handle tests without description."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            tests = [
                {"code": "assert True"},
                {"test_code": "assert False"}
            ]
            
            result = service._format_tests_list(tests)
            
            assert "assert True" in result
            assert "assert False" in result


class TestGenerationServiceExtractSection:
    """Tests for GenerationService._extract_section method."""
    
    def test_extract_sections_with_markdown_headers(self):
        """Should extract sections with ## headers."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            text = """
## Description
This is the description.

## Solution
def solution(): pass

## Tests
assert True
"""
            
            result = service._extract_section(text, ["Description", "Solution", "Tests"])
            
            assert "Description" in result
            assert "Solution" in result
            assert "Tests" in result
            assert "This is the description" in result["Description"]
            assert "def solution(): pass" in result["Solution"]
            assert "assert True" in result["Tests"]
    
    def test_extract_sections_with_bold_headers(self):
        """Should extract sections with ** headers."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            text = """
**Description**
This is the description.

**Solution**
def solution(): pass
"""
            
            result = service._extract_section(text, ["Description", "Solution"])
            
            assert "This is the description" in result["Description"]
    
    def test_extract_sections_empty(self):
        """Should return empty dict if no sections found."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            text = "No sections here"
            
            result = service._extract_section(text, ["Description", "Solution"])
            
            assert result == {}
    
    def test_extract_sections_partial(self):
        """Should extract only found sections."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            text = """
## Description
Some description.
"""
            
            result = service._extract_section(text, ["Description", "Solution", "Tests"])
            
            assert "Description" in result
            assert "Solution" not in result
            assert "Tests" not in result


class TestGenerationServiceGenerateTestVariants:
    """Tests for GenerationService.generate_test_variants method."""
    
    def test_generate_variants_success(self):
        """Should generate test variants."""
        mock_response = {
            "variants": [
                {"description": "Variant 1", "test_code": "assert 1"},
                {"description": "Variant 2", "test_code": "assert 2"}
            ]
        }
        
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            mock_completion = MagicMock()
            mock_completion.choices = [MagicMock()]
            mock_completion.choices[0].message.content = json.dumps(mock_response)
            service.client.chat.completions.create.return_value = mock_completion
            
            result = service.generate_test_variants(
                base_test="assert True",
                language="Python",
                count=2
            )
            
            assert len(result) == 2
            assert result[0]["description"] == "Variant 1"
    
    def test_generate_variants_handles_exception(self):
        """Should return empty list on exception."""
        with patch('app.services.generation_service.OpenAI'):
            service = GenerationService()
            
            service.client.chat.completions.create.side_effect = Exception("API Error")
            
            result = service.generate_test_variants(
                base_test="assert True",
                language="Python",
                count=2
            )
            
            assert result == []