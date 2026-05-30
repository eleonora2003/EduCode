import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

from app.services.export_service import ExportService
from app.models import Task


class TestExportServiceExportToMarkdown:
    """Tests for ExportService.export_to_markdown method."""
    
    def test_export_empty_list(self):
        """Should handle empty task list."""
        result = ExportService.export_to_markdown([])
        
        assert "# Programming Tasks Export" in result
        assert "Total tasks: 0" in result
    
    def test_export_single_task(self):
        """Should export single task to markdown."""
        mock_task = MagicMock(spec=Task)
        mock_task.title = "Test Task"
        mock_task.language = "Python"
        mock_task.concept = "Loops"
        mock_task.difficulty = "Basic"
        mock_task.description = "Task description"
        mock_task.examples = "Example: input -> output"
        mock_task.solution = "def solution(): pass"
        mock_task.tests = "assert True"
        mock_task.template_name = None
        mock_task.is_validated = False
        
        result = ExportService.export_to_markdown([mock_task])
        
        assert "## Task 1: Test Task" in result
        assert "**Language:** Python" in result
        assert "**Concept:** Loops" in result
        assert "**Difficulty:** Basic" in result
        assert "### Description" in result
        assert "Task description" in result
    
    def test_export_with_template_name(self):
        """Should include template name if present."""
        mock_task = MagicMock(spec=Task)
        mock_task.title = "Test Task"
        mock_task.language = "Python"
        mock_task.concept = "Loops"
        mock_task.difficulty = "Basic"
        mock_task.description = "Description"
        mock_task.examples = None
        mock_task.solution = None
        mock_task.tests = None
        mock_task.template_name = "Custom Template"
        mock_task.is_validated = False
        
        result = ExportService.export_to_markdown([mock_task])
        
        assert "**Template:** Custom Template" in result
    
    def test_export_multiple_tasks(self):
        """Should export multiple tasks."""
        tasks = []
        for i in range(3):
            mock_task = MagicMock(spec=Task)
            mock_task.title = f"Task {i+1}"
            mock_task.language = "Python"
            mock_task.concept = "Loops"
            mock_task.difficulty = "Basic"
            mock_task.description = f"Description {i+1}"
            mock_task.examples = None
            mock_task.solution = None
            mock_task.tests = None
            mock_task.template_name = None
            mock_task.is_validated = False
            tasks.append(mock_task)
        
        result = ExportService.export_to_markdown(tasks)
        
        assert "## Task 1: Task 1" in result
        assert "## Task 2: Task 2" in result
        assert "## Task 3: Task 3" in result
    
    def test_export_with_validation_status(self):
        """Should include validation status if validated."""
        mock_task = MagicMock(spec=Task)
        mock_task.title = "Test Task"
        mock_task.language = "Python"
        mock_task.concept = "Loops"
        mock_task.difficulty = "Basic"
        mock_task.description = "Description"
        mock_task.examples = None
        mock_task.solution = None
        mock_task.tests = None
        mock_task.template_name = None
        mock_task.is_validated = True
        mock_task.validation_result = {"status": "passed"}
        
        result = ExportService.export_to_markdown([mock_task])
        
        assert "✅" in result or "PASSED" in result
    
    def test_export_with_code_blocks(self):
        """Should format solution and tests as code blocks."""
        mock_task = MagicMock(spec=Task)
        mock_task.title = "Test Task"
        mock_task.language = "Python"
        mock_task.concept = "Loops"
        mock_task.difficulty = "Basic"
        mock_task.description = "Description"
        mock_task.examples = None
        mock_task.solution = "def solution():\n    return True"
        mock_task.tests = "assert solution() == True"
        mock_task.template_name = None
        mock_task.is_validated = False
        
        result = ExportService.export_to_markdown([mock_task])
        
        assert "```python" in result
        assert "def solution():" in result
        assert "```" in result


class TestExportServiceGetExportFilename:
    """Tests for ExportService.get_export_filename method."""
    
    def test_pdf_extension(self):
        """Should return .pdf extension for pdf format."""
        result = ExportService.get_export_filename("pdf")
        
        assert result.endswith(".pdf")
    
    def test_markdown_extension(self):
        """Should return .md extension for markdown format."""
        result = ExportService.get_export_filename("markdown")
        
        assert result.endswith(".md")
    
    def test_moodle_xml_extension(self):
        """Should return .xml extension for moodle_xml format."""
        result = ExportService.get_export_filename("moodle_xml")
        
        assert result.endswith(".xml")
    
    def test_unknown_format_extension(self):
        """Should return .txt for unknown format."""
        result = ExportService.get_export_filename("unknown")
        
        assert result.endswith(".txt")
    
    def test_filename_contains_timestamp(self):
        """Should include timestamp in filename."""
        result = ExportService.get_export_filename("pdf")
        
        assert "edocode_tasks_" in result
        # The filename format is: edocode_tasks_YYYYMMDD_HHMMSS.pdf
        # So we check that it contains a date-like pattern
        parts = result.replace(".pdf", "").split("_")
        assert len(parts) >= 3  # edocode, tasks, date, time


class TestExportServiceExportToMoodleXml:
    """Tests for ExportService.export_to_moodle_xml method."""
    
    def test_export_empty_list(self):
        """Should handle empty task list."""
        result = ExportService.export_to_moodle_xml([])
        
        assert '<?xml version="1.0" encoding="UTF-8"?>' in result
        assert "<quiz" in result
    
    def test_export_single_task(self):
        """Should export single task to Moodle XML."""
        mock_task = MagicMock(spec=Task)
        mock_task.title = "Test Task"
        mock_task.language = "Python"
        mock_task.concept = "Loops"
        mock_task.difficulty = "Basic"
        mock_task.description = "Task description"
        mock_task.examples = "Example input/output"
        mock_task.solution = "def solution(): pass"
        
        result = ExportService.export_to_moodle_xml([mock_task])
        
        assert "Test Task" in result
        assert 'type="essay"' in result
        # XML may use self-closing or separate open/close tags
        assert "<question" in result
        assert "Python" in result
        assert "Loops" in result
        assert "Basic" in result
    
    def test_export_multiple_tasks(self):
        """Should export multiple tasks."""
        tasks = []
        for i in range(2):
            mock_task = MagicMock(spec=Task)
            mock_task.title = f"Task {i+1}"
            mock_task.language = "Python"
            mock_task.concept = "Loops"
            mock_task.difficulty = "Basic"
            mock_task.description = f"Description {i+1}"
            mock_task.examples = None
            mock_task.solution = "pass"
            tasks.append(mock_task)
        
        result = ExportService.export_to_moodle_xml(tasks)
        
        assert result.count('<question ') + result.count('<question>') >= 2
        assert "Task 1" in result
        assert "Task 2" in result
    
    def test_export_includes_solution_as_feedback(self):
        """Should include solution as general feedback."""
        mock_task = MagicMock(spec=Task)
        mock_task.title = "Test"
        mock_task.language = "Python"
        mock_task.concept = "Loops"
        mock_task.difficulty = "Basic"
        mock_task.description = "Desc"
        mock_task.examples = None
        mock_task.solution = "def solution(): return 42"
        
        result = ExportService.export_to_moodle_xml([mock_task])
        
        assert "<generalfeedback>" in result
        assert "Reference Solution:" in result
    
    def test_export_without_solution(self):
        """Should handle task without solution."""
        mock_task = MagicMock(spec=Task)
        mock_task.title = "Test"
        mock_task.language = "Python"
        mock_task.concept = "Loops"
        mock_task.difficulty = "Basic"
        mock_task.description = "Desc"
        mock_task.examples = None
        mock_task.solution = None
        
        result = ExportService.export_to_moodle_xml([mock_task])
        
        assert "<generalfeedback>" not in result
    
    def test_export_contains_xml_header(self):
        """Should include proper XML header."""
        mock_task = MagicMock(spec=Task)
        mock_task.title = "Test"
        mock_task.language = "Python"
        mock_task.concept = "Loops"
        mock_task.difficulty = "Basic"
        mock_task.description = "Desc"
        mock_task.examples = None
        mock_task.solution = None
        
        result = ExportService.export_to_moodle_xml([mock_task])
        
        assert '<?xml version="1.0" encoding="UTF-8"?>' in result
        assert '<!-- Moodle XML Export from EduCode -->' in result
        assert '<!-- Generated:' in result
        assert '<!-- Total tasks:' in result