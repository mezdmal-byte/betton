"""Read-only, explicit-file financial inventory. Default output is anonymous."""
import argparse
import json
from pathlib import Path
import sys

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from app.financial_diagnostics import inspect_database


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('database',type=Path,help='Existing SQLite snapshot/file; never DATABASE_URL or .env')
    parser.add_argument('--details',action='store_true',help='Include local numeric IDs; do not publish detailed output')
    parser.add_argument('--output',type=Path,help='New output JSON file; refuses overwrite and source path')
    args=parser.parse_args(argv)
    try:
        report=inspect_database(args.database,details=args.details)
        content=json.dumps(report,ensure_ascii=False,indent=2,allow_nan=False)+'\n'
        if args.output:
            if args.output.resolve()==args.database.resolve():
                raise ValueError('Output cannot be the source database')
            with args.output.open('x',encoding='utf-8') as output: output.write(content)
        else:
            print(content,end='')
        return report['exit_code']
    except Exception:
        # Never expose connection strings, filesystem paths or driver/source text.
        print('Financial inspection failed; verify source schema and read-only access. No repair was attempted.',file=sys.stderr)
        return 2


if __name__=='__main__':
    raise SystemExit(main())
