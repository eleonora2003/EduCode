import json
import re
from typing import Dict, Optional
from openai import OpenAI

from ..config import settings


class GenerationService:
    """Service for AI-powered task generation using OpenAI."""
    
    def __init__(self):
        """Initialize OpenAI client."""
        self.client = OpenAI(api_key=settings.openai_api_key)
    
    def generate_task(
        self,
        language: str,
        concept: str,
        difficulty: str,
        template_name: str = "Default Template"
    ) -> Dict:
        """
        Generate a programming task using AI.
        
        Args:
            language: Programming language (Python or Java)
            concept: Programming concept to focus on
            difficulty: Difficulty level
            template_name: Template style to use
            
        Returns:
            Dictionary with generated task components
        """
        system_prompt = self._get_system_prompt(language, template_name)
        user_prompt = self._get_user_prompt(language, concept, difficulty, template_name)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=3000,
                response_format={"type": "json_object"}
            )
            
            result = response.choices[0].message.content
            
            try:
                parsed = json.loads(result)
                # Convert examples to string if it's a list
                examples = parsed.get("examples", "")
                if isinstance(examples, list):
                    examples = self._format_examples_list(examples)
                # Convert tests to string if it's a list
                tests = parsed.get("tests", "")
                if isinstance(tests, list):
                    tests = self._format_tests_list(tests)
                return {
                    "title": parsed.get("title", "Generated Task"),
                    "description": parsed.get("description", ""),
                    "examples": examples,
                    "solution": parsed.get("solution", ""),
                    "tests": tests,
                    "concept": concept,
                    "language": language,
                    "difficulty": difficulty,
                    "template_name": template_name
                }
            except json.JSONDecodeError:
                # Fallback: try to extract sections from non-JSON response
                return self._parse_raw_response(result, language, concept, difficulty, template_name)
                
        except Exception as e:
            return {
                "title": "Error generating task",
                "description": f"Failed to generate task: {str(e)}",
                "examples": "",
                "solution": "",
                "tests": "",
                "concept": concept,
                "language": language,
                "difficulty": difficulty,
                "template_name": template_name
            }
    
    def _get_system_prompt(self, language: str, template_name: str) -> str:
        """Get the system prompt for task generation."""
        
        base_prompt = """You are an expert programming educator that creates comprehensive programming exercises.
Your task is to generate a complete programming exercise including:
1. A clear, descriptive title
2. A detailed task description with clear requirements
3. Example input/output pairs
4. A complete reference solution with well-commented code
5. Unit tests that validate the solution

IMPORTANT: Return your response as valid JSON with exactly these fields:
{
    "title": "A short descriptive title",
    "description": "Detailed task description",
    "examples": "Example input/output pairs",
    "solution": "Complete working code with comments",
    "tests": "Unit tests as executable code"
}

Rules:
- All code must be properly formatted and escaped for JSON (use \\n for newlines, escape quotes)
- The solution must be complete and working
- Tests should cover multiple cases including edge cases
- Match the difficulty level appropriately"""

        # Add template-specific instructions
        template_instructions = self._get_template_instructions(template_name, language)
        
        return base_prompt + "\n\n" + template_instructions
    
    def _get_template_instructions(self, template_name: str, language: str) -> str:
        """Get template-specific instructions."""
        
        templates = {
            "Default Template": "Create a standard programming exercise with clear instructions and examples.",
            
            "Algorithm Challenge": f"""Focus on algorithmic thinking. The task should:
- Require implementing a specific algorithm
- Include time/space complexity considerations
- Have clear input/output specifications
- Test problem-solving skills""",
            
            "Data Structure Practice": f"""Focus on data structure usage. The task should:
- Require using specific data structures (arrays, lists, trees, etc.)
- Emphasize proper data structure operations
- Include edge cases related to the data structure""",
            
            "Real-World Problem": f"""Create a practical, real-world scenario. The task should:
- Present a realistic use case
- Include context about why this problem matters
- Have inputs/outputs that resemble real data""",
            
            "Code Optimization": f"""Focus on optimization. The task should:
- Start with a naive approach description
- Ask for an optimized solution
- Include performance requirements
- Mention specific complexity targets"""
        }
        
        return templates.get(template_name, templates["Default Template"])
    
    def _get_user_prompt(self, language: str, concept: str, difficulty: str, template_name: str) -> str:
        """Get the user prompt for task generation."""
        return f"""Create a {difficulty.lower()} difficulty programming exercise in {language} focusing on: {concept}.

Requirements:
- Language: {language}
- Concept: {concept}
- Difficulty: {difficulty}
- Template Style: {template_name}

For the solution code:
- Use proper {language} syntax and conventions
- Include clear comments explaining the approach
- Handle edge cases appropriately for the difficulty level

For the tests:
- Write executable test code in {language}
- Include at least 3-5 test cases
- Cover basic cases, edge cases, and error handling if appropriate

Generate a complete, self-contained exercise that a student could work on independently."""
    
    def _parse_raw_response(self, raw_text: str, language: str, concept: str, difficulty: str, template_name: str) -> Dict:
        """Parse a non-JSON response into structured format."""
        
        # Try to extract sections using common patterns
        title = "Generated Task"
        description = raw_text
        examples = ""
        solution = ""
        tests = ""
        
        if "## Description" in raw_text or "**Description**" in raw_text:
            parts = self._extract_section(raw_text, ["Description", "Solution", "Tests", "Examples"])
            description = parts.get("Description", raw_text)
            solution = parts.get("Solution", "")
            tests = parts.get("Tests", "")
            examples = parts.get("Examples", "")
        
        return {
            "title": title,
            "description": description,
            "examples": examples,
            "solution": solution,
            "tests": tests,
            "concept": concept,
            "language": language,
            "difficulty": difficulty,
            "template_name": template_name
        }
    
    def _format_examples_list(self, examples: list) -> str:
        """Convert a list of example objects to a formatted string."""
        if not examples:
            return ""
        
        formatted_lines = []
        for i, example in enumerate(examples, 1):
            if isinstance(example, dict):
                input_val = example.get("input", "")
                output_val = example.get("output", "")
                formatted_lines.append(f"Example {i}:")
                formatted_lines.append(f"  Input: {input_val}")
                formatted_lines.append(f"  Output: {output_val}")
                formatted_lines.append("")
            else:
                formatted_lines.append(str(example))
        
        return "\n".join(formatted_lines).strip()
    
    def _format_tests_list(self, tests: list) -> str:
        """Convert a list of test objects to a formatted string."""
        if not tests:
            return ""
        
        formatted_lines = []
        for i, test in enumerate(tests, 1):
            if isinstance(test, dict):
                description = test.get("description", "")
                code = test.get("code", test.get("test_code", ""))
                if description:
                    formatted_lines.append(f"# Test {i}: {description}")
                formatted_lines.append(code)
                formatted_lines.append("")  
            else:
                formatted_lines.append(str(test))
        
        return "\n".join(formatted_lines).strip()
    
    def _extract_section(self, text: str, section_names: list) -> dict:
        """Extract sections from text based on headers."""
        result = {}
        
        for i, section in enumerate(section_names):
            # Try different header formats
            patterns = [
                f"## {section}",
                f"**{section}**",
                f"### {section}",
                f"{section}:",
                f"---\n{section}"
            ]
            
            start_idx = -1
            for pattern in patterns:
                idx = text.find(pattern)
                if idx != -1:
                    start_idx = idx + len(pattern)
                    # Skip any colons or whitespace after the header
                    while start_idx < len(text) and text[start_idx] in [':', ' ', '\n', '\t']:
                        start_idx += 1
                    break
            
            if start_idx != -1:
                # Find the end of this section (start of next section or end of text)
                end_idx = len(text)
                for next_section in section_names[i+1:]:
                    for next_pattern in [f"## {next_section}", f"**{next_section}**", f"### {next_section}"]:
                        next_idx = text.find(next_pattern, start_idx)
                        if next_idx != -1 and next_idx < end_idx:
                            end_idx = next_idx
                
                content = text[start_idx:end_idx].strip()
                result[section] = content
        
        return result
    
    def generate_test_variants(self, base_test: str, language: str, count: int = 3) -> list:
        """Generate variations of a test case."""
        
        prompt = f"""Given this {language} test code:
{base_test}

Generate {count} variations of this test with different inputs. 
Return as a JSON array of objects with 'description' and 'test_code' fields."""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a programming test generator."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            result = response.choices[0].message.content
            parsed = json.loads(result)
            return parsed.get("variants", [])
            
        except Exception:
            return []


generation_service = GenerationService()