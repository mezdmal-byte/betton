from pathlib import Path
import subprocess

from scripts import check_dev


def repository(tmp_path):
    subprocess.run(['git','init','-q',str(tmp_path)],check=True)
    return tmp_path


def stage(root, name, body):
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding='utf-8')
    subprocess.run(['git','-C',str(root),'add','--',name],check=True)
    return path


def secret():
    # Synthetic fixture assembled at runtime; no secret-shaped literal in the index.
    return '123456789:' + 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890'


def test_scans_staged_version_even_when_worktree_is_cleaned(tmp_path, capsys):
    root = repository(tmp_path)
    file = stage(root,'settings.py','BOT_TOKEN=' + secret())
    file.write_text('BOT_TOKEN=TEST_PLACEHOLDER',encoding='utf-8')
    assert check_dev.main(['--root',str(root)]) == 1
    output = capsys.readouterr()
    assert 'telegram-token' in output.err
    assert secret() not in output.err + output.out


def test_ignores_unstaged_secret_but_blocks_runtime_artifact(tmp_path):
    root = repository(tmp_path)
    file = stage(root,'settings.py','BOT_TOKEN=TEST_PLACEHOLDER\n')
    file.write_text('BOT_TOKEN=' + secret(),encoding='utf-8')
    assert not check_dev.staged_findings(root)
    stage(root,'.ux-preview/a.sqlite','synthetic data')
    assert ('.ux-preview/a.sqlite','private-or-runtime-artifact') in check_dev.staged_findings(root)


def test_example_env_is_allowed_but_real_env_and_key_are_blocked():
    assert check_dev.scan_blob('.env.example',b'BOT_TOKEN=YOUR_TEST_TOKEN\n') == []
    assert 'private-or-runtime-artifact' in check_dev.scan_blob('.env',b'KEY=anything')
    key = b'-----BEGIN ' + b'PRIVATE KEY-----'
    assert 'private-key' in check_dev.scan_blob('config.pem',key)


def test_opaque_token_is_not_exempt_because_it_contains_test_substring():
    value = b'123456789:' + b'abcdefgTESThijklmnopqrstuvwxyz1234567890'
    assert 'telegram-token' in check_dev.scan_blob('settings.py',value)


def test_failed_gate_never_launches_optional_tests(tmp_path, monkeypatch):
    root = repository(tmp_path)
    stage(root,'backups/history.dump','private')
    monkeypatch.setattr(check_dev,'run',lambda *_: (_ for _ in ()).throw(AssertionError('optional task ran')))
    assert check_dev.main(['--root',str(root),'--tests','tests/test_money.py']) == 1


def test_skill_gate_detects_missing_reference_and_changed_pin(tmp_path):
    canonical = tmp_path / '.cursor/skills/impeccable/SKILL.md'
    canonical.parent.mkdir(parents=True)
    canonical.write_text('canonical',encoding='utf-8')
    skill = tmp_path / '.agents/skills/example/SKILL.md'
    skill.parent.mkdir(parents=True)
    skill.write_text('---\nname: example\ndescription: Example task\n---\n[read](reference/missing.md)',encoding='utf-8')
    (tmp_path/'skills-lock.json').write_text('{"skills":{"example":{"hashKind":"skill-entry-sha256","computedHash":"wrong"}}}',encoding='utf-8')
    errors = check_dev.validate_skills(tmp_path)
    assert any('missing reference' in error for error in errors)
    assert any('hash differs' in error for error in errors)


def test_committed_project_skill_tree_has_valid_references_and_pins():
    assert check_dev.validate_skills(Path(__file__).resolve().parents[1]) == []


def test_skill_pin_survives_windows_checkout_line_endings(tmp_path):
    import hashlib
    import json
    canonical = tmp_path/'.cursor/skills/impeccable/SKILL.md'
    canonical.parent.mkdir(parents=True)
    canonical.write_text('canonical')
    entry = tmp_path/'.agents/skills/example/SKILL.md'
    entry.parent.mkdir(parents=True)
    source = b'---\nname: example\ndescription: Example task\n---\nBody\n'
    entry.write_bytes(source.replace(b'\n',b'\r\n'))
    (tmp_path/'skills-lock.json').write_text(json.dumps({'skills':{'example':{
        'hashKind':'skill-entry-sha256','normalization':'utf8-lf',
        'computedHash':hashlib.sha256(source).hexdigest()}}}))
    assert check_dev.validate_skills(tmp_path) == []


def test_own_skill_inline_repo_path_is_validated_but_templates_are_not(tmp_path):
    canonical = tmp_path/'.cursor/skills/impeccable/SKILL.md'
    canonical.parent.mkdir(parents=True)
    canonical.write_text('canonical')
    command = tmp_path/'scripts/check_dev.py'
    command.parent.mkdir()
    command.write_text('helper')
    (tmp_path/'app/migrations').mkdir(parents=True)
    entry = tmp_path/'.agents/skills/betton-example/SKILL.md'
    entry.parent.mkdir(parents=True)
    entry.write_text('---\nname: betton-example\ndescription: Local work\n---\n'
                     'Read `app/migrations/` and `app/missing.py`. '
                     'Run `python scripts/check_dev.py --tests tests/test_<target>.py`.')
    assert check_dev.validate_skills(tmp_path) == ['betton-example: missing repo reference app/missing.py']


def test_upstream_skill_inline_project_examples_do_not_require_repo_files(tmp_path):
    canonical = tmp_path/'.cursor/skills/impeccable/SKILL.md'
    canonical.parent.mkdir(parents=True)
    canonical.write_text('canonical')
    entry = tmp_path/'.agents/skills/upstream-example/SKILL.md'
    entry.parent.mkdir(parents=True)
    entry.write_text('---\nname: upstream-example\ndescription: Generic projects\n---\nRead `app/example.py`.')
    assert check_dev.validate_skills(tmp_path) == []
