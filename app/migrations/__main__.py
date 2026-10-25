import argparse
from . import upgrade, assert_schema_ready

parser = argparse.ArgumentParser(description='Explicit BetTON schema maintenance; back up first')
parser.add_argument('action', choices=['upgrade', 'check'])
args = parser.parse_args()
if args.action == 'upgrade':
    upgrade()
else:
    assert_schema_ready()
print('Schema revision is compatible')
