import * as ts from 'typescript';
import type {
  BehavioralSnapshot,
  RouteChange,
  ApiCall,
  TextNode,
  UiState,
} from './types';

const ROUTING_PROPS = new Set(['to', 'href']);
const ROUTER_METHODS = new Set(['push', 'replace', 'navigate']);
const API_PATTERNS = [
  'fetch',
  'axios',
  'axios.get',
  'axios.post',
  'axios.put',
  'axios.patch',
  'axios.delete',
  'apiClient',
  'api.',
  'trpc.',
  'useQuery',
  'useMutation',
];

function normalizePath(path: string): string {
  try {
    let s = path.trim();
    // Strip query string for grouping
    const q = s.indexOf('?');
    if (q !== -1) s = s.slice(0, q);
    // Normalize trailing slash
    if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
    return s || path;
  } catch {
    return path;
  }
}

function getTextOfNode(node: ts.Node, source: string): string {
  return source.slice(node.getStart(), node.getEnd()).trim();
}

function getStringLiteralValue(node: ts.Node, source: string): string | null {
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    const raw = source.slice(node.getStart(), node.getEnd());
    return raw; // keep template as "raw" for display
  }
  return null;
}

function inferMethodFromName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('get') || n.includes('fetch') || n.includes('query')) return 'GET';
  if (n.includes('post') || n.includes('create') || n.includes('add')) return 'POST';
  if (n.includes('put') || n.includes('update')) return 'PUT';
  if (n.includes('patch')) return 'PATCH';
  if (n.includes('delete') || n.includes('remove')) return 'DELETE';
  return 'GET';
}

export function parseToSnapshot(source: string, filename: string = 'file.tsx'): BehavioralSnapshot {
  const snapshot: BehavioralSnapshot = {
    routes: [],
    apiCalls: [],
    uiTexts: [],
    guardedStates: [],
  };

  const scriptKind =
    filename.endsWith('.tsx') || filename.endsWith('.jsx')
      ? ts.ScriptKind.TSX
      : filename.endsWith('.ts') || filename.endsWith('.js')
        ? ts.ScriptKind.TS
        : ts.ScriptKind.TSX;

  const sourceFile = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );

  function visit(node: ts.Node) {
    // JSX: text children, component names, props (to, href)
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.kind === ts.SyntaxKind.JsxElement
        ? (node as ts.JsxElement).openingElement.tagName.getText(sourceFile)
        : (node as ts.JsxSelfClosingElement).tagName.getText(sourceFile);
      const attrs = node.kind === ts.SyntaxKind.JsxElement
        ? (node as ts.JsxElement).openingElement.attributes
        : (node as ts.JsxSelfClosingElement).attributes;

      for (const prop of attrs.properties) {
        if (!ts.isJsxAttribute(prop)) continue;
        const name = prop.name.getText(sourceFile);
        if (ROUTING_PROPS.has(name) && prop.initializer) {
          const init = prop.initializer;
          if (ts.isStringLiteral(init)) {
            snapshot.routes.push({
              path: normalizePath(init.text),
              kind: name === 'to' ? 'Link' : 'href',
              raw: init.text,
            });
          } else if (ts.isJsxExpression(init) && init.expression) {
            const raw = getTextOfNode(init.expression, source);
            snapshot.routes.push({
              path: normalizePath(raw),
              kind: name === 'to' ? 'Link' : 'href',
              raw,
            });
          }
        }
      }

      if (node.kind === ts.SyntaxKind.JsxElement) {
        const jsxEl = node as ts.JsxElement;
        for (const child of jsxEl.children) {
          if (ts.isJsxText(child)) {
            const text = child.getText(sourceFile).trim();
            if (text && !/^\s*$/.test(text)) {
              snapshot.uiTexts.push({
                text,
                context: tagName,
                key: `${tagName}:${text.slice(0, 30)}`,
              });
            }
          } else if (ts.isJsxExpression(child) && child.expression && ts.isStringLiteral(child.expression)) {
            snapshot.uiTexts.push({
              text: (child.expression as ts.StringLiteral).text,
              context: tagName,
              key: `${tagName}:${(child.expression as ts.StringLiteral).text.slice(0, 30)}`,
            });
          }
        }
      }
    }

    // CallExpression: navigate(), router.push(), fetch(), axios(), trpc.*, apiClient.*
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      const fullText = expr.getText(sourceFile);
      const args = node.arguments;

      // navigate('/path') or router.push('/path')
      if (ts.isIdentifier(expr)) {
        const name = expr.text;
        if (name === 'navigate' && args.length > 0) {
          const pathArg = getStringLiteralValue(args[0], source);
          if (pathArg) {
            snapshot.routes.push({
              path: normalizePath(pathArg),
              kind: 'navigate',
              raw: pathArg,
            });
          }
        }
      } else if (ts.isPropertyAccessExpression(expr)) {
        const obj = expr.expression.getText(sourceFile);
        const method = expr.name.getText(sourceFile);
        if ((obj === 'router' || obj === 'history') && ROUTER_METHODS.has(method) && args.length > 0) {
          const pathArg = getStringLiteralValue(args[0], source);
          if (pathArg) {
            snapshot.routes.push({
              path: normalizePath(pathArg),
              kind: method === 'push' ? 'router.push' : method === 'replace' ? 'router.replace' : 'navigate',
              raw: pathArg,
            });
          }
        }

        // API: fetch(url), axios.get(url), apiClient.get(...), trpc.x.useQuery()
        const callSite = inferCallSite(node, sourceFile);
        if (fullText === 'fetch' && args.length > 0) {
          const url = getStringLiteralValue(args[0], source) ?? getTextOfNode(args[0], source);
          snapshot.apiCalls.push({
            method: 'GET',
            path: normalizePath(url),
            callSite,
            raw: url,
          });
        } else if (fullText.startsWith('axios.') && args.length > 0) {
          const method = fullText.split('.')[1]?.toUpperCase() ?? 'GET';
          const url = getStringLiteralValue(args[0], source) ?? getTextOfNode(args[0], source);
          snapshot.apiCalls.push({
            method,
            path: normalizePath(url),
            callSite,
            raw: url,
          });
        } else if (
          (fullText.includes('apiClient') || fullText.includes('api.') || fullText.includes('trpc.')) &&
          args.length > 0
        ) {
          const firstArg = getStringLiteralValue(args[0], source) ?? getTextOfNode(args[0], source);
          snapshot.apiCalls.push({
            method: inferMethodFromName(fullText),
            path: normalizePath(firstArg),
            callSite,
            raw: firstArg,
          });
        }
      }
    }

    // Conditional UI: if (x), ternary, logical && 
    if (ts.isIfStatement(node)) {
      const cond = getTextOfNode(node.expression, source);
      snapshot.guardedStates.push({
        condition: cond,
        label: cond.length > 60 ? cond.slice(0, 57) + '...' : cond,
      });
    }
    if (ts.isConditionalExpression(node)) {
      const cond = getTextOfNode(node.condition, source);
      snapshot.guardedStates.push({
        condition: cond,
        label: cond.length > 60 ? cond.slice(0, 57) + '...' : cond,
      });
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
      const left = node.left;
      if (ts.isBinaryExpression(left) || ts.isCallExpression(left) || ts.isIdentifier(left)) {
        const cond = getTextOfNode(left, source);
        snapshot.guardedStates.push({
          condition: cond,
          label: cond.length > 60 ? cond.slice(0, 57) + '...' : cond,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return snapshot;
}

function inferCallSite(node: ts.CallExpression, sourceFile: ts.SourceFile): string | undefined {
  let parent = node.parent;
  while (parent) {
    if (ts.isCallExpression(parent) && parent.expression.getText(sourceFile).includes('useEffect')) {
      return 'useEffect';
    }
    if (ts.isPropertyAssignment(parent)) {
      const name = (parent as ts.PropertyAssignment).name.getText(sourceFile);
      if (name.startsWith('on')) return name; // onClick, onSubmit, etc.
    }
    if (ts.isJsxAttribute(parent)) {
      return (parent as ts.JsxAttribute).name.getText(sourceFile);
    }
    parent = parent.parent;
  }
  return undefined;
}
