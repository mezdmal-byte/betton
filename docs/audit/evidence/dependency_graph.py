"""Static local dependency graph, including delayed Python imports; no app import."""
import ast
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
py = {str(p.relative_to(ROOT).with_suffix('')).replace('/', '.'): p
      for folder in ('app', 'bot') for p in (ROOT / folder).rglob('*.py')}
edges = []
for mod, p in py.items():
    tree = ast.parse(p.read_text())
    parents = {c: n for n in ast.walk(tree) for c in ast.iter_child_nodes(n)}
    for node in ast.walk(tree):
        targets = []
        if isinstance(node, ast.Import):
            targets = [a.name for a in node.names]
        elif isinstance(node, ast.ImportFrom):
            base = node.module or ''
            if node.level:
                base = '.'.join(mod.split('.')[:-node.level] + ([base] if base else []))
            targets = [base] + [base + '.' + a.name for a in node.names]
        delayed = False
        parent = parents.get(node)
        while parent:
            delayed |= isinstance(parent, (ast.FunctionDef, ast.AsyncFunctionDef))
            parent = parents.get(parent)
        for target in targets:
            if target in py:
                edges.append(dict(source=mod, target=target, line=node.lineno, delayed=delayed))

def scc(nodes, links):
    graph = {n: set() for n in nodes}
    for e in links: graph[e['source']].add(e['target'])
    seen, stack, active, low, ix, found = {}, [], set(), {}, [0], []
    def visit(v):
        seen[v] = low[v] = ix[0]; ix[0] += 1; stack.append(v); active.add(v)
        for w in sorted(graph[v]):
            if w not in seen: visit(w); low[v] = min(low[v], low[w])
            elif w in active: low[v] = min(low[v], seen[w])
        if low[v] == seen[v]:
            group = []
            while True:
                w = stack.pop(); active.remove(w); group.append(w)
                if w == v: break
            if len(group) > 1 or v in graph[v]: found.append(sorted(group))
    for n in sorted(nodes):
        if n not in seen: visit(n)
    return found

ts = {str(p.relative_to(ROOT)): p for p in (ROOT / 'frontend/src').rglob('*') if p.suffix in ('.ts', '.tsx')}
tedges = []
for mod, p in ts.items():
    for m in re.finditer(r'(?:from\s*|import\s*\(\s*|import\s*)[\'\"](\.[^\'\"]+)[\'\"]', p.read_text()):
        base = p.parent / m.group(1)
        target = next((str(q.resolve().relative_to(ROOT)) for q in (Path(str(base)+'.ts'), Path(str(base)+'.tsx'), base/'index.ts', base/'index.tsx') if q.is_file()), None)
        if target in ts: tedges.append(dict(source=mod, target=target, line=p.read_text()[:m.start()].count('\n')+1))
result = dict(python_modules=len(py), python_edges=edges, python_all_cycles=scc(py,edges),
              python_eager_cycles=scc(py,[e for e in edges if not e['delayed']]),
              typescript_modules=len(ts), typescript_edges=tedges, typescript_cycles=scc(ts,tedges),
              limits='Python AST includes function-local edges; TS regex includes type/test/story edges; not runtime tracing or plugin/generated imports.')
(ROOT/'docs/audit/evidence/dependency-graph.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if 'edges' not in k},ensure_ascii=False,indent=2))
