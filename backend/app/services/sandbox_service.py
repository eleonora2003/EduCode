import docker
import tarfile
import io
from typing import Dict

client = docker.from_env()

def run_python_validation(solution_code: str, test_code: str) -> Dict:
    container = None
    try:
        full_test_code = f"""from solution import *
{test_code}

if __name__ == "__main__":
    print("=== ALL TESTS PASSED ===")
    import sys
    sys.stdout.flush()
"""

        container = client.containers.run(
            image="python:3.12-slim",
            command="sleep 30",
            working_dir="/app",
            mem_limit="256m",
            cpu_shares=256,
            network_disabled=True,
            detach=True,
            remove=False,
        )

        def write_file(path: str, content: str):
            data = io.BytesIO()
            with tarfile.open(fileobj=data, mode='w') as tar:
                file_data = content.encode("utf-8")
                tarinfo = tarfile.TarInfo(name=path.split("/")[-1])
                tarinfo.size = len(file_data)
                tar.addfile(tarinfo, io.BytesIO(file_data))
            
            data.seek(0)
            container.put_archive(path="/app", data=data.getvalue())  # ← popravek tukaj

        write_file("/app/solution.py", solution_code)
        write_file("/app/test_solution.py", full_test_code)

        # Zaženemo teste
        exec_result = container.exec_run(
            cmd=["python", "-u", "/app/test_solution.py"],
            stdout=True,
            stderr=True,
            demux=True
        )

        logs = ""
        if exec_result.output:
            stdout, stderr = exec_result.output
            if stdout:
                logs += stdout.decode("utf-8", errors="replace")
            if stderr:
                logs += "\nSTDERR:\n" + stderr.decode("utf-8", errors="replace")

        exit_code = exec_result.exit_code
        passed = exit_code == 0 and "ALL TESTS PASSED" in logs

        total_tests = test_code.count("assert")

        return {
            "passed": passed,
            "logs": logs or "No output received",
            "passed_tests": total_tests if passed else 0,
            "total_tests": total_tests
        }

    except Exception as e:
        import traceback
        return {
            "passed": False,
            "logs": f"Error: {str(e)}\n{traceback.format_exc()}",
            "passed_tests": 0,
            "total_tests": 0
        }
    finally:
        if container:
            try:
                container.stop(timeout=5)
                container.remove(force=True)
            except:
                pass