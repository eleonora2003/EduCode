import docker
import tarfile
import io
import re
from typing import Dict, Tuple

client = docker.from_env()

TIMEOUT_SECONDS = 10


def _make_tar_file(filename: str, content: str) -> bytes:
    data = io.BytesIO()

    with tarfile.open(fileobj=data, mode="w") as tar:
        file_data = content.encode("utf-8")
        tarinfo = tarfile.TarInfo(name=filename)
        tarinfo.size = len(file_data)
        tar.addfile(tarinfo, io.BytesIO(file_data))

    data.seek(0)
    return data.getvalue()


def _write_file(container, filename: str, content: str):
    container.put_archive(path="/app", data=_make_tar_file(filename, content))


def _decode_exec_output(output) -> str:
    logs = ""

    if not output:
        return logs

    if isinstance(output, tuple):
        stdout, stderr = output

        if stdout:
            logs += stdout.decode("utf-8", errors="replace")

        if stderr:
            if logs:
                logs += "\n"
            logs += "STDERR:\n" + stderr.decode("utf-8", errors="replace")
    else:
        logs += output.decode("utf-8", errors="replace")

    return logs.strip()


def _count_python_tests(test_code: str) -> int:
    assert_count = len(re.findall(r"^\s*assert\s+", test_code, flags=re.MULTILINE))
    unittest_count = len(re.findall(r"^\s*def\s+test_", test_code, flags=re.MULTILINE))
    return max(assert_count, unittest_count, 1)


def _count_java_tests(test_code: str) -> int:
    assert_count = len(re.findall(r"\bassert\s+", test_code))
    helper_count = len(re.findall(r"\bcheck\s*\(", test_code))
    return max(assert_count, helper_count, 1)


def run_python_validation(solution_code: str, test_code: str) -> Dict:
    container = None
    total_tests = _count_python_tests(test_code)

    try:
        wrapped_test_code = f"""
from solution import *

{test_code}

print("=== ALL TESTS PASSED ===")
"""

        container = client.containers.run(
            image="python:3.12-slim",
            command="sleep 60",
            working_dir="/app",
            mem_limit="256m",
            cpu_shares=256,
            network_disabled=True,
            detach=True,
            remove=False,
        )

        _write_file(container, "solution.py", solution_code)
        _write_file(container, "test_solution.py", wrapped_test_code)

        exec_result = container.exec_run(
            cmd=[
                "python",
                "-u",
                "-c",
                (
                    "import subprocess, sys; "
                    "p = subprocess.run("
                    "['python', '-u', '/app/test_solution.py'], "
                    f"capture_output=True, text=True, timeout={TIMEOUT_SECONDS}"
                    "); "
                    "sys.stdout.write(p.stdout); "
                    "sys.stderr.write(p.stderr); "
                    "sys.exit(p.returncode)"
                )
            ],
            stdout=True,
            stderr=True,
            demux=True,
        )

        logs = _decode_exec_output(exec_result.output)
        passed = exec_result.exit_code == 0

        return {
            "passed": passed,
            "logs": logs or "No output received",
            "passed_tests": total_tests if passed else 0,
            "total_tests": total_tests,
        }

    except Exception as e:
        import traceback

        return {
            "passed": False,
            "logs": f"Error: {str(e)}\n{traceback.format_exc()}",
            "passed_tests": 0,
            "total_tests": total_tests,
        }

    finally:
        if container:
            try:
                container.stop(timeout=5)
                container.remove(force=True)
            except Exception:
                pass


def _java_default_imports(code: str) -> str:
    imports = []
    if "import java." not in code:
        imports.extend(["import java.util.*;", "import java.io.*;"])
    if "Arrays." in code and "import java.util.Arrays" not in code:
        imports.append("import java.util.Arrays;")
    if not imports:
        return code
    return "\n".join(imports) + "\n\n" + code


def _inject_java_success_marker(code: str) -> str:
    if "=== ALL TESTS PASSED ===" in code:
        return code

    main_match = re.search(
        r"public\s+static\s+void\s+main\s*\([^)]*\)\s*\{",
        code,
    )
    if not main_match:
        return code + '\nSystem.out.println("=== ALL TESTS PASSED ===");'

    start = main_match.end()
    depth = 1
    index = start
    while index < len(code) and depth > 0:
        char = code[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                marker = '\n        System.out.println("=== ALL TESTS PASSED ===");\n    '
                return code[:index] + marker + code[index:]
        index += 1

    return code


def _normalize_java_solution(solution_code: str) -> str:
    code = solution_code.strip()

    code = re.sub(r"import\s+org\.junit\.[^;]+;", "", code)
    code = re.sub(r"@Test\s*", "", code)

    if "public class Solution" not in code:
        if re.search(r"public\s+class\s+\w+", code):
            code = re.sub(
                r"public\s+class\s+\w+",
                "public class Solution",
                code,
                count=1,
            )
        else:
            code = f"public class Solution {{\n{code}\n}}"

    return _java_default_imports(code)


def _normalize_java_tests(test_code: str) -> str:
    code = test_code.strip()

    code = re.sub(r"import\s+org\.junit\.[^;]+;", "", code)
    code = re.sub(r"import\s+static\s+org\.junit\.[^;]+;", "", code)
    code = re.sub(r"@Test\s*", "", code)

    has_test_class = re.search(r"public\s+class\s+TestSolution\b", code)
    has_main = "public static void main" in code

    if not has_test_class:
        if re.search(r"public\s+class\s+\w+", code):
            code = re.sub(
                r"public\s+class\s+\w+",
                "public class TestSolution",
                code,
                count=1,
            )
            has_test_class = True
        else:
            code = f"""public class TestSolution {{
    public static void main(String[] args) {{
        {code}
    }}
}}"""
            has_test_class = True
            has_main = True

    if has_test_class and not has_main:
        class_match = re.search(
            r"public\s+class\s+TestSolution\s*\{([\s\S]*)\}\s*$",
            code,
        )
        inner = class_match.group(1).strip() if class_match else code
        code = f"""public class TestSolution {{
    public static void main(String[] args) {{
        {inner}
    }}
}}"""

    code = _inject_java_success_marker(code)
    return _java_default_imports(code)


def summarize_validation_failure(logs: str, language: str = "Python") -> str:
    if not logs or logs.strip() == "No output received":
        return "Validation failed with no output from the sandbox."

    if logs.startswith("Compilation failed:"):
        detail = logs[len("Compilation failed:"):].strip()
        return detail.split("\n")[0][:500] or "Java compilation failed."

    if "AssertionError" in logs:
        for line in logs.split("\n"):
            if "AssertionError" in line:
                return line.strip()[:500]

    if "SyntaxError" in logs:
        for line in logs.split("\n"):
            if "SyntaxError" in line or "File " in line:
                return line.strip()[:500]

    if "Exception in thread" in logs or "Exception:" in logs:
        for line in logs.split("\n"):
            if "Exception" in line:
                return line.strip()[:500]

    if "STDERR:" in logs:
        stderr = logs.split("STDERR:", 1)[1].strip()
        meaningful = [line for line in stderr.split("\n") if line.strip()]
        if meaningful:
            return "\n".join(meaningful[:5])[:500]

    if logs.startswith("Error:"):
        return logs.split("\n")[0][:500]

    meaningful = [line for line in logs.split("\n") if line.strip()]
    if meaningful:
        return "\n".join(meaningful[:6])[:500]

    return f"{language} validation failed. See full logs for details."


def run_java_validation(solution_code: str, test_code: str) -> Dict:
    container = None
    total_tests = _count_java_tests(test_code)

    try:
        solution_code = _normalize_java_solution(solution_code)
        test_code = _normalize_java_tests(test_code)

        container = client.containers.run(
            image="eclipse-temurin:21-jdk",
            command="sleep 60",
            working_dir="/app",
            mem_limit="256m",
            cpu_shares=256,
            network_disabled=True,
            detach=True,
            remove=False,
        )

        _write_file(container, "Solution.java", solution_code)
        _write_file(container, "TestSolution.java", test_code)

        compile_result = container.exec_run(
            cmd=["javac", "/app/Solution.java", "/app/TestSolution.java"],
            stdout=True,
            stderr=True,
            demux=True,
        )

        compile_logs = _decode_exec_output(compile_result.output)

        if compile_result.exit_code != 0:
            return {
                "passed": False,
                "logs": f"Compilation failed:\n{compile_logs}",
                "passed_tests": 0,
                "total_tests": total_tests,
            }

        exec_result = container.exec_run(
            cmd=["java", "-ea", "-cp", "/app", "TestSolution"],
            stdout=True,
            stderr=True,
            demux=True,
        )

        logs = _decode_exec_output(exec_result.output)
        passed = exec_result.exit_code == 0

        return {
            "passed": passed,
            "logs": logs or "No output received",
            "passed_tests": total_tests if passed else 0,
            "total_tests": total_tests,
        }

    except Exception as e:
        import traceback

        return {
            "passed": False,
            "logs": f"Error: {str(e)}\n{traceback.format_exc()}",
            "passed_tests": 0,
            "total_tests": total_tests,
        }

    finally:
        if container:
            try:
                container.stop(timeout=5)
                container.remove(force=True)
            except Exception:
                pass