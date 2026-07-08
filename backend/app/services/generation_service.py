import json
import re
from typing import Dict, Optional
from openai import OpenAI

from ..config import settings

# Constants for default values
DEFAULT_TEMPLATE_NAME = "Default Template"


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
        template_name: str = DEFAULT_TEMPLATE_NAME
    ) -> Dict:
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

                examples = parsed.get("examples", "")
                if isinstance(examples, list):
                    examples = self._format_examples_list(examples)

                tests = parsed.get("tests", "")
                if isinstance(tests, list):
                    tests = self._format_tests_list(tests, language)

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
                return self._parse_raw_response(
                    result,
                    language,
                    concept,
                    difficulty,
                    template_name
                )

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
- All code must be properly formatted and escaped for JSON.
- Use \\n for newlines.
- Escape quotes when needed.
- The solution must be complete and working.
- Tests should cover multiple cases including edge cases.
- Match the difficulty level appropriately.
"""

        if language == "Java":
            base_prompt += """
STRICT JAVA OUTPUT RULES:
- The solution field MUST contain exactly one public class named Solution.
- The solution must start with: public class Solution
- Do NOT use another public class name.
- Do NOT generate public class names based on the task title.
- Helper classes must be non-public or nested inside Solution.

- The tests field MUST contain exactly one public class named TestSolution.
- The tests must start with: public class TestSolution OR import java.util.Arrays; followed by public class TestSolution.
- TestSolution MUST contain public static void main(String[] args).
- Do NOT use JUnit.
- Do NOT import org.junit.
- Do NOT use @Test.
- Do NOT use assertEquals or assertArrayEquals.
- Use plain Java assert statements only.
- If comparing arrays, use java.util.Arrays.equals().
- At the end of main, print exactly:
=== ALL TESTS PASSED ===

- The Java code must compile with:
javac Solution.java TestSolution.java

- The Java tests must run with:
java -ea -cp /app TestSolution
"""

        if language == "Python":
            base_prompt += """
STRICT PYTHON OUTPUT RULES:
- The solution field must contain valid Python code.
- Tests must use plain assert statements.
- Do not use pytest or unittest.
- The tests should be executable directly after importing the solution.
"""

        template_instructions = self._get_template_instructions(template_name, language)

        return base_prompt + "\n\n" + template_instructions

    def _get_template_instructions(self, template_name: str, language: str = None) -> str:
        templates = {
            "Default Template": "Create a standard programming exercise with clear instructions and examples.",

            "Algorithm Challenge": """Focus on algorithmic thinking. The task should:
- Require implementing a specific algorithm
- Include time/space complexity considerations
- Have clear input/output specifications
- Test problem-solving skills""",

            "Data Structure Practice": """Focus on data structure usage. The task should:
- Require using specific data structures such as arrays, lists, trees, maps, or sets
- Emphasize proper data structure operations
- Include edge cases related to the data structure""",

            "Real-World Problem": """Create a practical, real-world scenario. The task should:
- Present a realistic use case
- Include context about why this problem matters
- Have inputs/outputs that resemble real data""",

            "Code Optimization": """Focus on optimization. The task should:
- Start with a naive approach description
- Ask for an optimized solution
- Include performance requirements
- Mention specific complexity targets"""
        }

        return templates.get(template_name, templates[DEFAULT_TEMPLATE_NAME])

    def _get_user_prompt(
        self,
        language: str,
        concept: str,
        difficulty: str,
        template_name: str
    ) -> str:
        java_rules = ""

        if language == "Java":
            java_rules = """
JAVA REQUIREMENTS:
The generated Java solution MUST follow this structure:

public class Solution {
    // methods here
}

The generated Java tests MUST follow this structure:

public class TestSolution {
    public static void main(String[] args) {
        Solution s = new Solution();

        // plain assert tests here

        System.out.println("=== ALL TESTS PASSED ===");
    }
}

Rules for Java:
- Do NOT use JUnit.
- Do NOT use import org.junit.
- Do NOT use @Test.
- Do NOT use assertEquals.
- Do NOT use assertArrayEquals.
- Use Java built-in assert only.
- If the solution methods are static, call them as Solution.methodName(...).
- If the solution methods are not static, create Solution s = new Solution().
- If comparing arrays, include import java.util.Arrays; and use Arrays.equals(...).
- The solution class name must be Solution.
- The test class name must be TestSolution.
"""

        python_rules = ""

        if language == "Python":
            python_rules = """
PYTHON REQUIREMENTS:
- Use plain Python assert statements.
- Do NOT use pytest.
- Do NOT use unittest.
- Tests must be executable directly.
"""

        return f"""Create a {difficulty.lower()} difficulty programming exercise in {language} focusing on: {concept}.

Requirements:
- Language: {language}
- Concept: {concept}
- Difficulty: {difficulty}
- Template Style: {template_name}

For the solution code:
- Use proper {language} syntax and conventions.
- Include clear comments explaining the approach.
- Handle edge cases appropriately for the difficulty level.

{python_rules}{java_rules}

Generate a complete, self-contained exercise that a student could work on independently."""

    def _parse_raw_response(
        self,
        raw_text: str,
        language: str,
        concept: str,
        difficulty: str,
        template_name: str
    ) -> Dict:
        title = "Generated Task"
        description = raw_text
        examples = ""
        solution = ""
        tests = ""

        if "## Description" in raw_text or "**Description**" in raw_text:
            parts = self._extract_section(
                raw_text,
                ["Description", "Solution", "Tests", "Examples"]
            )
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

    def _format_tests_list(self, tests: list, language: Optional[str] = None) -> str:
        if not tests:
            return ""

        formatted_lines = []

        for i, test in enumerate(tests, 1):
            if isinstance(test, dict):
                description = test.get("description", "")
                code = test.get("code", test.get("test_code", ""))

                if description and language != "Java":
                    formatted_lines.append(f"# Test {i}: {description}")

                formatted_lines.append(code)
                formatted_lines.append("")
            else:
                formatted_lines.append(str(test))

        return "\n".join(formatted_lines).strip()

    def _get_test_rules(self, language: str) -> str:
        if language == "Java":
            return """Test rules (Java):
- Use exactly one public class named TestSolution with public static void main(String[] args)
- Do NOT use JUnit, @Test, assertEquals, or assertArrayEquals
- Use plain Java assert statements only (run with java -ea)
- If comparing arrays, use java.util.Arrays.equals()
- End main with: System.out.println("=== ALL TESTS PASSED ===");
- Include at least 3-5 assert statements
- Cover basic, edge, and error cases where appropriate"""

        return """Test rules (Python):
- Use plain assert statements at module level (NOT pytest, NOT unittest classes)
- Function names in tests must exactly match those in the solution
- Include at least 3-5 assert statements
- Cover basic, edge, and error cases where appropriate"""

    def _extract_section(self, text: str, section_names: list) -> dict:
        result = {}

        for i, section in enumerate(section_names):
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

                    while start_idx < len(text) and text[start_idx] in [":", " ", "\n", "\t"]:
                        start_idx += 1

                    break

            if start_idx != -1:
                end_idx = len(text)

                for next_section in section_names[i + 1:]:
                    for next_pattern in [
                        f"## {next_section}",
                        f"**{next_section}**",
                        f"### {next_section}"
                    ]:
                        next_idx = text.find(next_pattern, start_idx)

                        if next_idx != -1 and next_idx < end_idx:
                            end_idx = next_idx

                content = text[start_idx:end_idx].strip()
                result[section] = content

        return result
    
    def refine_section(
        self,
        field: str,
        instruction: str,
        content: str,
        selected_text: Optional[str] = None,
        context: Optional[Dict] = None,
    ) -> Dict:
        """Refine a task section with a professor's custom instruction."""
        context = context or {}
        language = context.get("language", "Python")
        selection_note = (
            f'The professor selected this exact portion to change:\n"""{selected_text}"""\n'
            if selected_text
            else "No text was selected — refine the entire section as needed.\n"
        )

        task_context = f"""Task title: {context.get('title', 'Untitled')}
Language: {language}
Concept: {context.get('concept', 'General')}
Difficulty: {context.get('difficulty', 'Basic')}

Current description:
{context.get('description', '')}

Current examples:
{context.get('examples', '')}

Current solution:
{context.get('solution', '')}

Current tests:
{context.get('tests', '')}"""

        if field == "solution":
            test_rules = self._get_test_rules(language)
            system_prompt = f"""You are an expert programming educator helping a professor fine-tune an exercise.
The professor gives precise instructions — follow them exactly while keeping code working.

When refining the solution you MUST also rewrite the unit tests so they pass against the new solution.
Return valid JSON with exactly:
{{
  "content": "the complete updated solution code",
  "tests": "complete updated test code"
}}

{test_rules}"""

            user_prompt = f"""{task_context}

Section being refined: reference solution
Professor's instruction: {instruction}

{selection_note}
Current solution content:
\"\"\"
{content}
\"\"\"

Apply the instruction. Return the full updated solution and matching tests."""

            response_format = {"type": "json_object"}
        elif field == "tests":
            test_rules = self._get_test_rules(language)
            system_prompt = f"""You are an expert programming educator helping a professor fine-tune unit tests.
Return valid JSON with exactly: {{"content": "the complete updated test code"}}

{test_rules}
- Tests must validate the existing solution correctly"""

            user_prompt = f"""{task_context}

Section being refined: unit tests
Professor's instruction: {instruction}

{selection_note}
Current tests:
\"\"\"
{content}
\"\"\"

Apply the instruction. Return the full updated tests."""

            response_format = {"type": "json_object"}
        else:
            system_prompt = """You are an expert programming educator helping a professor fine-tune exercise text.
Return valid JSON with exactly: {"content": "the complete updated section text"}
Keep the same language as the original. Preserve formatting where appropriate."""

            user_prompt = f"""{task_context}

Section being refined: {field}
Professor's instruction: {instruction}

{selection_note}
Current {field} content:
\"\"\"
{content}
\"\"\"

Apply the instruction. Return the full updated section."""

            response_format = {"type": "json_object"}

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.5,
                max_tokens=3000,
                response_format=response_format,
            )

            parsed = json.loads(response.choices[0].message.content)
            refined_content = parsed.get("content", content)
            updated_tests = parsed.get("tests") if field == "solution" else None

            return {
                "field": field,
                "content": refined_content,
                "tests": updated_tests,
            }
        except Exception as e:
            return {
                "field": field,
                "content": content,
                "tests": None,
                "error": str(e),
            }

    def fix_validation_failure(
        self,
        title: str,
        description: str,
        examples: str,
        language: str,
        concept: str,
        difficulty: str,
        solution: str,
        tests: str,
        validation_logs: str,
        failure_reason: str = "",
    ) -> Dict:
        """Rewrite solution and tests from scratch after a validation failure."""
        test_rules = self._get_test_rules(language)
        failure_summary = failure_reason or validation_logs[:1500]

        if language == "Java":
            solution_rules = """
Java solution rules:
- Exactly one public class named Solution
- Code must compile with: javac Solution.java TestSolution.java
"""
        else:
            solution_rules = """
Python solution rules:
- Valid Python module importable as solution.py
- Tests import with: from solution import *
"""

        system_prompt = f"""You are an expert programming educator fixing broken exercise code.
Validation failed in a sandbox. Rewrite the solution and tests from scratch so they work together.

Return valid JSON with exactly:
{{
  "solution": "complete working solution code",
  "tests": "complete working test code",
  "explanation": "brief plain-language summary of what was wrong and what you changed"
}}

{solution_rules}
{test_rules}"""

        user_prompt = f"""Task title: {title}
Language: {language}
Concept: {concept}
Difficulty: {difficulty}

Description:
{description}

Examples:
{examples}

Why validation failed:
{failure_summary}

Full validation logs:
{validation_logs[:4000]}

Current broken solution:
\"\"\"
{solution}
\"\"\"

Current broken tests:
\"\"\"
{tests}
\"\"\"

Rewrite both files from scratch. Keep the same educational goal, but make the code compile/run and pass all tests in the sandbox."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=4000,
                response_format={"type": "json_object"},
            )

            parsed = json.loads(response.choices[0].message.content)

            return {
                "solution": parsed.get("solution", solution),
                "tests": parsed.get("tests", tests),
                "explanation": parsed.get("explanation"),
            }
        except Exception as e:
            return {
                "solution": solution,
                "tests": tests,
                "explanation": None,
                "error": str(e),
            }

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
                    {
                        "role": "system",
                        "content": "You are a programming test generator."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
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

    _SERIES_DIFFICULTIES = ["Basic", "Intermediate", "Advanced", "Advanced", "Advanced"]

    def generate_exercise_series(
        self,
        language: str,
        concept: str,
        template_name: str = DEFAULT_TEMPLATE_NAME,
        exercise_count: int = 3,
    ) -> Dict:
        """Generate a progressive exercise series (Exercise 1 → 2 → 3…)."""
        exercise_count = max(2, min(5, exercise_count))
        exercises = []
        previous_summaries = []

        for i in range(exercise_count):
            exercise_num = i + 1
            difficulty = self._SERIES_DIFFICULTIES[i]
            prior_context = ""
            if previous_summaries:
                prior_context = (
                    "\n\nPrevious exercises in this series (build on these — do NOT repeat them):\n"
                    + "\n".join(previous_summaries)
                )

            system_prompt = self._get_system_prompt(language, template_name)
            system_prompt += """

EXERCISE SERIES RULES:
- This is one exercise in a progressive school/faculty exercise set on the SAME concept.
- Each exercise must be noticeably harder than the previous one.
- Exercise 1: warm-up / fundamentals. Exercise 2: moderate challenge. Exercise 3+: advanced application.
- Title MUST start with "Exercise N:" where N is the exercise number.
- Do not copy prior exercise scenarios — evolve the problem while staying on the same concept.
"""

            user_prompt = f"""Create Exercise {exercise_num} of {exercise_count} in a progressive programming exercise series.

- Language: {language}
- Concept: {concept}
- Difficulty for this exercise: {difficulty}
- Template Style: {template_name}
- Position: Exercise {exercise_num} of {exercise_count}{prior_context}

The student completes exercises in order during a class or lab session.
Make this exercise standalone but clearly part of the same learning arc.

Return valid JSON with exactly: title, description, examples, solution, tests."""

            try:
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.7,
                    max_tokens=3000,
                    response_format={"type": "json_object"},
                )

                parsed = json.loads(response.choices[0].message.content)

                examples = parsed.get("examples", "")
                if isinstance(examples, list):
                    examples = self._format_examples_list(examples)

                tests = parsed.get("tests", "")
                if isinstance(tests, list):
                    tests = self._format_tests_list(tests, language)

                title = parsed.get("title", f"Exercise {exercise_num}")
                if not title.lower().startswith(f"exercise {exercise_num}"):
                    title = f"Exercise {exercise_num}: {title.lstrip(': ')}"

                exercise = {
                    "exercise_number": exercise_num,
                    "title": title,
                    "description": parsed.get("description", ""),
                    "examples": examples,
                    "solution": parsed.get("solution", ""),
                    "tests": tests,
                    "difficulty": difficulty,
                }
                exercises.append(exercise)

                summary = f"- Exercise {exercise_num} ({difficulty}): {title} — {parsed.get('description', '')[:120]}..."
                previous_summaries.append(summary)

            except Exception as e:
                exercises.append({
                    "exercise_number": exercise_num,
                    "title": f"Exercise {exercise_num}: Error",
                    "description": f"Failed to generate exercise: {str(e)}",
                    "examples": "",
                    "solution": "",
                    "tests": "",
                    "difficulty": difficulty,
                })

        series_title = f"{concept} — Exercise Series ({language})"
        return {
            "series_title": series_title,
            "language": language,
            "concept": concept,
            "exercises": exercises,
        }


generation_service = GenerationService()

