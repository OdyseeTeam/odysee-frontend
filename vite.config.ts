import { defineConfig, type Plugin } from 'vite-plus';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Load environment variables from .env.defaults and .env
import dotenvDefaults from 'dotenv-defaults';
dotenvDefaults.config({ silent: false, defaults: '.env.defaults' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_ROOT = path.resolve(__dirname, 'ui');
const WEB_ROOT = path.resolve(__dirname, 'web');

// Resolve pnpm's nested node_modules directories for SCSS loadPaths
function resolvePnpmNodeModules(): string[] {
  const pnpmDir = path.resolve(__dirname, 'node_modules/.pnpm');
  if (!fs.existsSync(pnpmDir)) return [path.resolve(__dirname, 'node_modules')];
  try {
    return fs
      .readdirSync(pnpmDir)
      .filter((d) => fs.existsSync(path.join(pnpmDir, d, 'node_modules')))
      .map((d) => path.join(pnpmDir, d, 'node_modules'));
  } catch {
    return [path.resolve(__dirname, 'node_modules')];
  }
}

// Build all process.env.* replacements for the define option
function buildEnvDefines(): Record<string, string> {
  const defines: Record<string, string> = {};
  const envFile = path.resolve(__dirname, '.env.defaults');
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf-8');
    const keys = content
      .split('\n')
      .filter((line) => line.match(/^[A-Z_]+=/) && !line.startsWith('#'))
      .map((line) => line.split('=')[0]);

    for (const key of keys) {
      defines[`process.env.${key}`] = JSON.stringify(process.env[key] ?? '');
    }
  }
  defines['process.env.NODE_ENV'] = JSON.stringify(process.env.NODE_ENV || 'development');
  defines['process.env.COMMIT_ID'] = JSON.stringify(process.env.COMMIT_ID || '');
  defines['process.env.SENTRY_AUTH_TOKEN'] = JSON.stringify(process.env.SENTRY_AUTH_TOKEN || '');
  defines['process.env.MOONPAY_SECRET_KEY'] = JSON.stringify(process.env.MOONPAY_SECRET_KEY || '');
  defines['process.env.SDK_API_URL'] = JSON.stringify(process.env.SDK_API_URL || process.env.LBRY_WEB_API || '');
  defines['process.env.BUILD_REV'] = JSON.stringify(process.env.BUILD_REV || '');
  defines['process.env.SEARCH_API_URL'] = JSON.stringify(process.env.SEARCH_API_URL || '');
  return defines;
}

// Plugin to handle @if preprocessor directives:
// - @if TARGET='web' / @if TARGET='app'
// - @if process.env.VAR='value' (evaluated against actual env vars)
function preprocessPlugin(): Plugin {
  // Process nested @if/@endif blocks by finding matching pairs with depth tracking
  function processIfBlocks(code: string): string {
    const IF_RE = /\/\/\s*@if\s+/;
    const lines = code.split('\n');
    const blocks: Array<{ start: number; end: number; condition: string }> = [];
    const stack: Array<{ line: number; condition: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (IF_RE.test(trimmed) && trimmed.startsWith('//')) {
        stack.push({ line: i, condition: trimmed });
      } else if (/\/\/\s*@endif/.test(trimmed)) {
        // Also handle inline @endif like `} // @endif`
        if (stack.length > 0) {
          const open = stack.pop()!;
          blocks.push({ start: open.line, end: i, condition: open.condition });
        }
      }
    }

    // Process blocks from innermost to outermost (reverse order by start position to avoid index shifts)
    blocks.sort((a, b) => b.start - a.start);

    for (const block of blocks) {
      const { start, end, condition } = block;
      let keep: boolean | null = null;

      // TARGET conditions
      const targetMatch = condition.match(/@if\s+TARGET='(\w+)'/);
      if (targetMatch) {
        const target = targetMatch[1];
        keep = target === 'web'; // web build keeps web blocks, removes app blocks
      }

      // process.env conditions: @if process.env.X='val' or @if process.env.X!='val'
      const envEqMatch = condition.match(/@if\s+process\.env\.(\w+)='([^']*)'/);
      const envNeqMatch = condition.match(/@if\s+process\.env\.(\w+)!='([^']*)'/);
      const envBareMatch = condition.match(/@if\s+process\.env\.(\w+)\s*$/);

      if (envEqMatch) {
        const actual = process.env[envEqMatch[1]] || '';
        keep = actual === envEqMatch[2];
      } else if (envNeqMatch) {
        const actual = process.env[envNeqMatch[1]] || '';
        keep = actual !== envNeqMatch[2];
      } else if (envBareMatch) {
        keep = !!process.env[envBareMatch[1]];
      }

      if (keep === null) continue; // Unknown condition, leave as-is

      if (keep) {
        // Keep content, remove @if and @endif markers
        // Handle inline @endif (e.g., `} // @endif`)
        lines[end] = lines[end].replace(/\/\/\s*@endif\s*$/, '').trimEnd();
        if (lines[end].trim() === '') lines[end] = '';
        lines[start] = ''; // Remove @if line
      } else {
        // Remove entire block including @if and @endif lines
        for (let i = start; i <= end; i++) {
          lines[i] = '';
        }
      }
    }

    return lines.filter((l, i) => {
      // Remove completely empty lines that were preprocessor artifacts
      // but keep intentional empty lines (check if line was blanked by us)
      return true; // Keep all lines, empty ones are fine
    }).join('\n');
  }

  return {
    name: 'preprocess-target',
    enforce: 'pre',
    transform(code, id) {
      if (!id.match(/\.(tsx?|jsx?)($|\?)/)) return null;
      if (id.includes('node_modules')) return null;
      if (!code.includes('@if')) return null;

      let result = processIfBlocks(code);

      // Handle JSX-style comments: {/* @if process.env.VAR */}...{/* @endif */}
      result = result.replace(
        /\{\/\*\s*@if\s+process\.env\.(\w+)\s*\*\/\}([\s\S]*?)\{\/\*\s*@endif\s*\*\/\}/g,
        (_match, envVar, content) => {
          return process.env[envVar] ? content : '';
        }
      );

      if (result !== code) {
        return { code: result, map: null };
      }
      return null;
    },
  };
}

// Plugin to provide global variables (replaces webpack ProvidePlugin)
function providePlugin(): Plugin {
  return {
    name: 'provide-globals',
    transform(code, id) {
      // Normalize backslashes for Windows compatibility
      const nid = id.replace(/\\/g, '/');
      if (nid.includes('node_modules')) return null;
      if (!nid.match(/\.(tsx?|jsx?)$/)) return null;

      const imports: string[] = [];
      if (code.includes('Buffer') && !code.includes("from 'buffer'") && !code.includes('import { Buffer')) {
        imports.push("import { Buffer } from 'buffer';");
      }
      if (
        code.includes('__(') &&
        !code.includes("from 'i18n'") &&
        !code.includes('import { __ }') &&
        !nid.includes('/i18n.')
      ) {
        imports.push("import { __ } from 'i18n';");
      }
      if (
        /\bassert\(/.test(code) &&
        !code.includes("from 'asserts'") &&
        !code.includes("from 'ui/asserts'") &&
        !nid.includes('/asserts.')
      ) {
        imports.push("import { assert } from 'asserts';");
      }

      if (imports.length > 0) {
        return { code: imports.join('\n') + '\n' + code, map: null };
      }
      return null;
    },
  };
}

// Plugin to resolve imports from ui/ directory (like webpack resolve.modules: [UI_ROOT])
// Only resolves path-like imports (with /) to ui/ directory, not bare module names
function uiModuleResolverPlugin(): Plugin {
  // These are the directories inside ui/ that can be imported as bare names
  // e.g. `import X from 'component/foo'` resolves to `ui/component/foo`
  const uiDirs = new Set(
    fs.readdirSync(UI_ROOT).filter((f) => {
      try {
        return fs.statSync(path.join(UI_ROOT, f)).isDirectory();
      } catch {
        return false;
      }
    })
  );

  // Top-level files in ui/ that can be imported as bare names
  // e.g. `import X from 'lbry'` resolves to `ui/lbry.ts`
  const uiFiles = new Set(
    fs
      .readdirSync(UI_ROOT)
      .filter((f) => f.match(/\.(ts|tsx)$/) && !f.startsWith('index.'))
      .map((f) => f.replace(/\.(ts|tsx)$/, ''))
  );

  const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

  function tryResolve(basePath: string): string | null {
    // Try direct file
    for (const ext of EXTENSIONS) {
      const filePath = basePath + ext;
      if (fs.existsSync(filePath)) return filePath;
    }
    // Try directory index
    for (const ext of EXTENSIONS) {
      const indexPath = path.join(basePath, 'index' + ext);
      if (fs.existsSync(indexPath)) return indexPath;
    }
    // Try exact path (already has extension)
    if (fs.existsSync(basePath)) {
      const stat = fs.statSync(basePath);
      if (stat.isFile()) return basePath;
    }
    return null;
  }

  return {
    name: 'ui-module-resolver',
    enforce: 'pre',
    resolveId(source, importer) {
      // Skip node_modules, relative, and absolute paths
      if (!importer || importer.includes('node_modules')) return null;
      if (source.startsWith('.') || source.startsWith('/') || source.startsWith('\0')) return null;

      // Get the top-level segment of the import
      const segments = source.split('/');
      const topLevel = segments[0];

      // Check if this is a ui/ directory import (e.g. 'component/foo', 'redux/actions/app')
      if (uiDirs.has(topLevel)) {
        const resolved = tryResolve(path.join(UI_ROOT, source));
        if (resolved) return resolved;
      }

      // Check if this is a ui/ file import (e.g. 'lbry', 'rewards', 'store')
      if (segments.length === 1 && uiFiles.has(topLevel)) {
        const resolved = tryResolve(path.join(UI_ROOT, source));
        if (resolved) return resolved;
      }

      return null;
    },
  };
}

const isProduction = process.env.NODE_ENV === 'production';

// Post-build plugin: injects Vite-built asset tags into the SSR template (index-web.html)
// so the Koa web server can serve pages with the correct JS/CSS references.
function ssrTemplatePlugin(): Plugin {
  return {
    name: 'ssr-template-inject',
    writeBundle: {
      sequential: true,
      handler(options) {
        const outDir = options.dir || path.resolve(__dirname, 'web/dist/public');
        const builtHtml = path.join(outDir, 'index.html');
        const templateHtml = path.join(outDir, 'index-web.html');

        if (!fs.existsSync(builtHtml) || !fs.existsSync(templateHtml)) return;

        const built = fs.readFileSync(builtHtml, 'utf8');
        const template = fs.readFileSync(templateHtml, 'utf8');

        // Extract all <script>, <link rel="modulepreload">, and <link rel="stylesheet"> tags from built HTML
        const assetTags: string[] = [];
        const scriptRe = /<script\b[^>]*src="[^"]*"[^>]*><\/script>/g;
        const modulepreloadRe = /<link\s+rel="modulepreload"[^>]*>/g;
        const stylesheetRe = /<link\s+rel="stylesheet"[^>]*>/g;

        let m;
        while ((m = scriptRe.exec(built)) !== null) assetTags.push(m[0]);
        while ((m = modulepreloadRe.exec(built)) !== null) assetTags.push(m[0]);
        while ((m = stylesheetRe.exec(built)) !== null) assetTags.push(m[0]);

        if (assetTags.length === 0) return;

        // Insert asset tags before </head> in the SSR template
        const injected = template.replace('</head>', `    ${assetTags.join('\n    ')}\n  </head>`);
        fs.writeFileSync(templateHtml, injected, 'utf8');
      },
    },
  };
}

export default defineConfig({
  root: __dirname,
  publicDir: 'static',
  base: '/public/',

  define: {
    ...buildEnvDefines(),
    IS_WEB: JSON.stringify(true),
    __static: JSON.stringify(path.join(__dirname, 'static')),
    'process.platform': JSON.stringify('browser'),
    global: 'globalThis',
  },

  resolve: {
    conditions: ['browser', 'development'],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.scss'],
    alias: {
      // Explicit aliases for things that aren't in ui/
      config: path.resolve(__dirname, 'config.ts'),
      lbryinc: path.resolve(__dirname, 'extras/lbryinc'),
      recsys: path.resolve(__dirname, 'extras/recsys'),
      homepage: path.resolve(UI_ROOT, 'util/homepage'),
      homepages:
        process.env.CUSTOM_HOMEPAGE === 'true'
          ? path.resolve(__dirname, 'custom/homepages/v2')
          : path.resolve(__dirname, 'homepages'),
      memes:
        process.env.CUSTOM_HOMEPAGE === 'true'
          ? path.resolve(__dirname, 'custom/homepages/meme/index')
          : path.resolve(__dirname, 'homepages/meme/index'),

      // Web platform
      web: WEB_ROOT,
      $web: WEB_ROOT,
      $ui: UI_ROOT,

      // Web stubs for electron/fs
      'electron-is-dev': path.resolve(WEB_ROOT, 'stubs/electron-is-dev.ts'),
      electron: path.resolve(WEB_ROOT, 'stubs/electron.ts'),
      fs: path.resolve(WEB_ROOT, 'stubs/fs.ts'),

      // Lodash optimizations
      'lodash.get': 'lodash-es/get',
      'lodash.set': 'lodash-es/set',
      'lodash.unset': 'lodash-es/unset',
      'lodash.pickby': 'lodash-es/pickBy',
      'lodash.isempty': 'lodash-es/isEmpty',
      'lodash.forin': 'lodash-es/forIn',
      'lodash.clonedeep': 'lodash-es/cloneDeep',

      // Force @emotion ESM entries (their exports map 'import' points to broken .cjs.mjs wrappers)
      '@emotion/styled': path.resolve(__dirname, 'node_modules/@emotion/styled/dist/emotion-styled.esm.js'),
      '@emotion/react': path.resolve(__dirname, 'node_modules/@emotion/react/dist/emotion-react.esm.js'),

      // Force @mui/system to use ESM (root files are CJS, esm/ dir has proper ESM)
      // Resolve via @mui/material's sibling since pnpm doesn't hoist @mui/system
      '@mui/system': path.join(path.dirname(require.resolve('@mui/material/package.json')), '..', 'system', 'esm'),

      // Build optimization
      'redux-persist-transform-filter': 'redux-persist-transform-filter/index.js',
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin'],
        loadPaths: [path.resolve(__dirname, 'ui/scss'), ...resolvePnpmNodeModules()],
      },
    },
  },

  plugins: [uiModuleResolverPlugin(), preprocessPlugin(), providePlugin(), react(), ssrTemplatePlugin()],

  server: {
    port: parseInt(process.env.WEBPACK_WEB_PORT || '9090', 10),
    open: true,
  },

  build: {
    outDir: 'web/dist/public',
    sourcemap: isProduction ? true : 'inline',
    rolldownOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        // Prevent 'buffer' from being split into its own chunk.
        // Rolldown rc.10 has a CJS interop bug where the __commonJS helper
        // is emitted after the code that calls it when buffer is isolated.
        manualChunks(id) {
          if (id.includes('node_modules/buffer/')) {
            return 'vendor';
          }
        },
      },
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-redux',
      'redux',
      'reselect',
      '@emotion/styled',
      '@emotion/react',
      'prop-types',
      'react-router',
      'react-router-dom',
      'connected-react-router',
      'react-top-loading-bar',
      'classnames',
      'moment',
      'uuid',
      'localforage',
      'redux-thunk',
      'redux-persist',
      'redux-persist/integration/react',
      'redux-persist/lib/stateReconciler/autoMergeLevel2',
      'redux-persist-transform-compress',
      'redux-persist-transform-filter',
      'redux-state-sync',
      'history',
      're-reselect',
      'buffer',
      'proxy-polyfill',
      'tus-js-client',
    ],
  },

  lint: {
    categories: {
      correctness: 'error',
      suspicious: 'warn',
    },
    rules: {
      // Suppress migration noise — revisit when adding strict types
      'no-unused-vars': 'off',
      'no-shadow': 'off',
      'no-unused-expressions': 'off',
    },
    // tsgo type checking available via: pnpm typecheck
    // Enable typeAware + typeCheck here once strict types are added
    ignorePatterns: ['node_modules', 'web/dist', 'dist', 'build', 'static', 'flow-typed'],
  },
});
