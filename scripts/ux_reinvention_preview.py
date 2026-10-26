"""Separate full-demo loopback runtime for the experimental UX branch.

Reuses the original sandbox's marked database, HMAC and origin boundaries.
It never starts a Telegram bot, tunnel or production application lifecycle.
"""
import argparse
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def create_ux_preview(state_dir, port=8890):
    if type(port) is not int or not 1024 <= port <= 65535:
        raise ValueError('Use an unprivileged local test port')
    from scripts.ux_v3_preview import create_preview
    application = create_preview(state_dir, full_demo=True)
    from app.config import settings
    settings.public_base_url = f'http://127.0.0.1:{port}'
    settings.mini_app_url = settings.public_base_url
    return application


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8890)
    parser.add_argument('--state-dir', type=Path, required=True)
    args = parser.parse_args()
    app = create_ux_preview(args.state_dir, args.port)
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=args.port, proxy_headers=False)


if __name__ == '__main__':
    main()
