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


def _normalize_java_solution(solution_code: str) -> str:
    code = solution_code.strip()

    imports = """import java.util.*;
import java.io.*;
"""

    if "public class Solution" not in code:
        code = re.sub(
            r"public\s+class\s+\w+",
            "public class Solution",
            code,
            count=1
        )

    if "import java." not in code:
        code = imports + "\n" + code

    return code


def _normalize_java_tests(test_code: str) -> str:
    code = test_code.strip()

    imports = """import java.util.*;
import java.io.*;
"""

    code = re.sub(
        r"import\s+org\.junit\.[^;]+;",
        "",
        code
    )
    code = re.sub(r"@Test", "", code)

    if "public class TestSolution" not in code:
        code = re.sub(
            r"public\s+class\s+\w+",
            "public class TestSolution",
            code,
            count=1
        )

    if "public static void main" not in code:
        code = f"""
public class TestSolution {{
    public static void main(String[] args) {{
        {code}
    }}
}}
"""

    if "=== ALL TESTS PASSED ===" not in code:
        last_brace = code.rfind("}")
        second_last_brace = code.rfind("}", 0, last_brace)

        if second_last_brace != -1:
            code = (
                code[:second_last_brace]
                + '\n        System.out.println("=== ALL TESTS PASSED ===");\n'
                + code[second_last_brace:]
            )

    if "import java." not in code:
        code = imports + "\n" + code

    return code


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