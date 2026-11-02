# Обновить Visual V1 в существующей тестовой копии

Кандидат: `fix/visual-v1-compact-fullscreen-20261102`, поверх PR #33.
Это инструкция, **не утверждение, что Windows-копия уже обновлена**.
Команды ниже не выполнялись на компьютере владельца. Визуальная приёмка кандидата ещё не завершена.

## Что сохранять

`.ux-preview`, `.local-preserve`, `.env`, `.venv`, локальные launcher/QA-файлы и browser storage
сохраняются. Нельзя использовать `git clean`, `git reset --hard`, reset-simulation BAT,
удалять active.json или очищать данные Telegram. Не применять migration/seed/replay.

Этот пакет меняет frontend и документацию. Если ваша текущая копия содержит более старый
backend, автоматическое переключение может захватить накопленные серверные изменения;
поэтому ниже предусмотрена остановка при любом diff вне frontend/docs.

## Порядок

1. Закрыть окно Mini App на время сборки, чтобы старый JS не запрашивал уже сменившиеся assets.
   Backend и Telegram launcher для обновления статических файлов перезапускать не требуется:
   `app/main.py` раздаёт `frontend/dist`, для HTML задан no-cache/no-store.
   Не запускать start/stop-telegram BAT: они могут менять персональное меню тестового бота.
2. Сделать SQLite online backup активных баз и копию прежней frontend-сборки.
   Пример для PowerShell ниже работает с локальными путями и не отправляет данные в сеть.
   Если резервирование или `quick_check` завершились ошибкой — не продолжать.
3. Проверить чистоту tracked-файлов, получить целевую ветку и проверить состав diff.
4. Сохранить прежний HEAD отдельной локальной веткой, переключиться на отдельную review-ветку,
   выполнить `npm ci`, `npm test`, `npm run build`.
5. Открыть Mini App заново и проверить новую версию. Хэш в `/simulation/status` может быть
   прежним: launcher вычисляет его при своём запуске. Он не заменяет проверку реально
   загруженного HTML и его asset-имён после frontend-only обновления.

## Резервирование без остановки SQLite

Из PowerShell в корне `C:\Users\1\betton-v1-test`:

```powershell
@'
import json, shutil, sqlite3
from datetime import datetime
from pathlib import Path

root = Path.cwd().resolve()
runtime = root / '.ux-preview'
backup = root.parent / ('betton-v1-backup-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
backup.mkdir(exist_ok=False)
actives = sorted(runtime.glob('*-runtime/active.json'))
if not actives:
    raise RuntimeError('No active SIM manifest found; locate the actual data before updating')
for active in actives:
    state = Path(json.loads(active.read_text(encoding='utf-8'))['state_dir']).resolve()
    if not state.is_relative_to(runtime.resolve()):
        raise RuntimeError('State is outside .ux-preview; stop and inspect locally')
    if not state.is_dir():
        raise RuntimeError('Active state directory is missing')
    marker = backup / active.relative_to(root)
    marker.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(active, marker)
    target = backup / state.relative_to(root)
    shutil.copytree(state, target, ignore=shutil.ignore_patterns(
        '*.db', '*.sqlite', '*.sqlite3', '*-wal', '*-shm'))
    databases = sorted(p for p in state.iterdir() if p.suffix in {'.db', '.sqlite', '.sqlite3'})
    if not databases:
        raise RuntimeError('No SQLite database in active state; do not continue automatically')
    for database in databases:
        with sqlite3.connect(database.as_uri() + '?mode=ro', uri=True) as source:
            with sqlite3.connect(target / database.name) as destination:
                source.backup(destination)
                if destination.execute('PRAGMA quick_check').fetchall() != [('ok',)]:
                    raise RuntimeError('Backup quick_check failed')
if (root / 'frontend/dist').is_dir():
    shutil.copytree(root / 'frontend/dist', backup / 'frontend-dist')
print('Backup created:', backup)
'@ | .\.venv\Scripts\python.exe -
if ($LASTEXITCODE -ne 0) { throw 'Backup failed; update stopped' }
```

Это сохраняет снимок БД, active.json и локальные state-файлы. Backup остаётся приватным
на том же компьютере; не добавлять его в Git и не отправлять в отчёт.
Online backup не требует копирования живых WAL/SHM как самостоятельного снимка базы.
При нескольких active.json, указывающих на один state, `copytree` безопасно остановится
из-за уже существующей папки; такой случай надо разобрать перед обновлением.

## Получение и сборка

```powershell
Set-Location C:\Users\1\betton-v1-test
$tracked = git status --porcelain --untracked-files=no
if ($LASTEXITCODE -ne 0 -or $tracked) { throw 'Tracked changes exist; preserve and review them first' }

git fetch origin fix/visual-v1-compact-fullscreen-20261102
if ($LASTEXITCODE -ne 0) { throw 'Fetch failed' }
$candidate = git rev-parse FETCH_HEAD
if ($LASTEXITCODE -ne 0) { throw 'Candidate not resolved' }
$changed = git diff --name-only HEAD $candidate
if ($LASTEXITCODE -ne 0) { throw 'Cannot compare revisions' }
$outside = $changed | Where-Object { $_ -notmatch '^(frontend/|docs/)' }
if ($outside) { throw 'The update includes backend or runtime changes relative to this copy; stop for review' }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
git branch "backup/before-visual-v1-$stamp" HEAD
if ($LASTEXITCODE -ne 0) { throw 'Cannot preserve previous HEAD' }
git switch --create "review/visual-v1-$stamp" $candidate
if ($LASTEXITCODE -ne 0) { throw 'Switch failed; do not reset files' }

Push-Location frontend
try {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'Dependency install failed' }
    npm test
    if ($LASTEXITCODE -ne 0) { throw 'Frontend tests failed' }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
} finally { Pop-Location }
```

Не запускать install-simulation как замену этим frontend-командам и не создавать новую генерацию SIM.
При проблемах UI можно переключиться на сохранённую `backup/before-visual-v1-*` ветку
и восстановить прежний `frontend/dist` из резервной папки. Базы назад не копировать:
в них после snapshot могла появиться новая история. Откат frontend не требует отката данных.

Проверить в Telegram: menu/Back; отсутствие горизонтального сдвига; доступность нижних кнопок;
fullscreen и отказ от него; ввод с клавиатурой; выбор вкладок; согласование и отказ гаранта.
Для обычного браузерного preview localhost-инструкция не является проверкой настоящего Telegram.
