"""Run Node harness scripts from a temp file so Windows accepts large JS."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


def node_bin() -> str | None:
    return shutil.which("node")


def run_node_script(
    script: str,
    tmp_path: Path,
    *,
    name: str = "harness.js",
    timeout: int = 20,
) -> subprocess.CompletedProcess[str] | None:
    node = node_bin()
    if not node:
        return None
    path = tmp_path / name
    path.write_text(script, encoding="utf-8")
    return subprocess.run(
        [node, str(path)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        timeout=timeout,
    )
