"""Run the existing loopback recovery sandbox on a separate local test port.

Keeps the original sandbox's HMAC, marker, data and origin guards unchanged.
No production config, bot, tunnel or global menu is initialized.
"""
import argparse
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def create_recovery_preview(state_dir, port=8887):
    if type(port) is not int or not 1024 <= port <= 65535:
        raise ValueError('Use an unprivileged local test port between 1024 and 65535')
    from scripts.ux_v3_preview import create_preview
    application = create_preview(state_dir)
    # The sandbox has already replaced inherited secrets and moved cwd to its
    # guarded test directory. Update only URLs before any lifespan/seed runs.
    from app.config import settings
    settings.public_base_url = f'http://127.0.0.1:{port}'
    settings.mini_app_url = settings.public_base_url
    return application


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8887)
    parser.add_argument('--state-dir', type=Path, required=True)
    args = parser.parse_args()
    try:
        app = create_recovery_preview(args.state_dir, args.port)
    except ValueError as exc:
        parser.error(str(exc))
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=args.port, proxy_headers=False)


if __name__ == '__main__':
    main()
