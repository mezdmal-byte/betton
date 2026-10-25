"""Fast, explicit developer gates. Defaults inspect the staged index only.

No dotenv, app startup, migration, dependency installation or network operation.
Secret findings print rule/path, never the matched text. This complements review;
it is not a claim that arbitrary secrets can be detected automatically.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BLOCKED_SUFFIXES = {'.db', '.sqlite', '.sqlite3', '.dump', '.bak', '.zip', '.log'}
PRIVATE_PARTS = {'.local-preserve', '.ux-preview', '.ux-audit', 'backups'}
PATTERNS = {
    'telegram-token': re.compile(rb'\b\d{5,}:[A-Za-z0-9_-]{30,}\b'),
    'github-token': re.compile(rb'\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b'),
    'private-key': re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    'credential-assignment': re.compile(
        rb'(?im)^\s*(?:export\s+)?[A-Z_]*(?:BOT_TOKEN|API_KEY|SECRET|PASSWORD)[A-Z_]*\s*=\s*[\"\x27]?([^\s\"\x27]+)'),
}


def _placeholder(value):
    text = value.upper().strip()
    if b':' in text and text.split(b':', 1)[0].isdigit():
        text = text.split(b':', 1)[1]
    return (text.startswith((b'TEST_', b'EXAMPLE_', b'DUMMY_', b'PLACEHOLDER', b'CHANGEME',
                             b'YOUR_', b'${', b'OS.ENVIRON', b'GETENV(', b'SECRETS.'))
            or text == b'BETTON_TEST_ONLY')


def scan_blob(filename, data):
    path = Path(filename)
    issues = []
    if (path.suffix.lower() in BLOCKED_SUFFIXES or any(p in PRIVATE_PARTS for p in path.parts)
            or (path.name.startswith('.env') and path.name != '.env.example')):
        issues.append('private-or-runtime-artifact')
    for rule, pattern in PATTERNS.items():
        for match in pattern.finditer(data):
            value = match.group(1) if rule == 'credential-assignment' else match.group()
            if rule != 'private-key' and (_placeholder(value) or value in (b'', b'"', b"'", b'None', b'null')):
                continue
            issues.append(rule)
            break
    return sorted(set(issues))


def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args], stderr=subprocess.PIPE)


def staged_findings(root):
    names = git(root, 'diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR').split(b'\0')
    result = []
    for raw in filter(None, names):
        name = raw.decode('utf-8')
        blob = git(root, 'show', ':' + name)
        result.extend((name, rule) for rule in scan_blob(name, blob))
    return result


def validate_skills(root):
    issues = []
    skills = root / '.agents/skills'
    lock_path = root / 'skills-lock.json'
    lock = json.loads(lock_path.read_text(encoding='utf-8')) if lock_path.exists() else {'skills':{}}
    for directory in sorted(skills.iterdir()):
        if not directory.is_dir():
            continue
        entry = directory / 'SKILL.md'
        if not entry.exists():
            issues.append(f'{directory.name}: missing SKILL.md')
            continue
        source = entry.read_text(encoding='utf-8')
        frontmatter = re.match(r'^---\r?\n(.*?)\r?\n---', source, re.S)
        if not frontmatter:
            issues.append(f'{directory.name}: missing frontmatter')
            continue
        header = frontmatter.group(1)
        name = re.search(r'^name:\s*(\S+)\s*$', header, re.M)
        description = re.search(r'^description:\s*\S', header, re.M)
        if not name or name.group(1) != directory.name or not description:
            issues.append(f'{directory.name}: invalid name/description')
        if 'disable-model-invocation:' in header:
            issues.append(f'{directory.name}: use agents/openai.yaml for invocation policy')
        for target in re.findall(r'\]\(([^)#]+)(?:#[^)]*)?\)', source):
            if '://' in target or target.startswith('/'):
                continue
            if not (directory / target).exists():
                issues.append(f'{directory.name}: missing reference {target}')
        recorded = lock.get('skills', {}).get(directory.name, {})
        # Existing npm-skills tree hashes are not hashes of one entry point.
        if recorded.get('hashKind') == 'skill-entry-sha256':
            content = entry.read_bytes()
            if recorded.get('normalization') == 'utf8-lf':
                content = content.replace(b'\r\n', b'\n')
            digest = hashlib.sha256(content).hexdigest()
            if digest != recorded.get('computedHash'):
                issues.append(f'{directory.name}: entry hash differs from reviewed lock')
    if not (root / '.cursor/skills/impeccable/SKILL.md').is_file():
        issues.append('impeccable: canonical .cursor skill is missing')
    return issues


def run(command, cwd):
    print('RUN ' + ' '.join(map(str, command)), flush=True)
    subprocess.run(command, cwd=cwd, check=True)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT, help='repository root (useful for isolated gate tests)')
    parser.add_argument('--skills', action='store_true', help='validate project skill entry points, references and reviewed hashes')
    parser.add_argument('--tests', nargs='+', metavar='TEST', help='explicit pytest targets; no app server is started')
    parser.add_argument('--frontend', action='store_true', help='existing frontend unit tests and TypeScript/Vite build')
    parser.add_argument('--types', action='store_true', help='TypeScript build only, omitted when --frontend is used')
    args = parser.parse_args(argv)
    root = args.root.resolve()
    try:
        subprocess.run(['git','-C',str(root),'diff','--cached','--check'], check=True)
        findings = staged_findings(root)
        for path, rule in findings:
            print(f'BLOCKED {path}: {rule}', file=sys.stderr)
        if findings:
            return 1
        print('Staged diff/artifact/secret-pattern checks passed.', flush=True)
        if args.skills:
            issues = validate_skills(root)
            for issue in issues:
                print('SKILL ' + issue, file=sys.stderr)
            if issues:
                return 1
            print('Project skill checks passed.', flush=True)
        if args.tests:
            run([sys.executable, '-m', 'pytest', *args.tests], root)
        if args.frontend or args.types:
            npm = shutil.which('npm.cmd') or shutil.which('npm')
            if not npm:
                raise RuntimeError('npm is unavailable; install the project-supported Node runtime')
            if args.frontend:
                run([npm, 'test'], root / 'frontend')
                run([npm, 'run', 'build'], root / 'frontend')
            else:
                npx = shutil.which('npx.cmd') or shutil.which('npx')
                if not npx:
                    raise RuntimeError('npx is unavailable')
                run([npx, '--no-install', 'tsc', '-b'], root / 'frontend')
        return 0
    except (OSError, RuntimeError, ValueError, subprocess.CalledProcessError) as exc:
        # Do not print command output: future commands may contain sensitive data.
        print('Developer check failed: ' + type(exc).__name__, file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
