import { defineConfig } from 'vite';
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
// Resolve pnpm's nested node_modules directories for SCSS loadPaths.
// Only include directories that actually contain SCSS files to avoid
// inflating the Sass resolver's search space with 800 irrelevant paths.
function resolvePnpmNodeModules() {
  const base = path.resolve(__dirname, 'node_modules');
  const pnpmDir = path.join(base, '.pnpm');
  if (!fs.existsSync(pnpmDir)) return [base];
  try {
    return fs
      .readdirSync(pnpmDir)
      .filter((d) => {
        const nm = path.join(pnpmDir, d, 'node_modules');
        if (!fs.existsSync(nm)) return false;
        // Quick check: only include if a nested package contains .scss files
        try {
          return fs.readdirSync(nm).some((pkg) => {
            const pkgPath = path.join(nm, pkg);
            try {
              if (!fs.statSync(pkgPath).isDirectory()) return false;
              return fs.readdirSync(pkgPath).some((f) => f.endsWith('.scss'));
            } catch {
              return false;
            }
          });
        } catch {
          return false;
        }
      })
      .map((d) => path.join(pnpmDir, d, 'node_modules'));
  } catch {
    return [base];
  }
}

function readEnvKeys(filePath) {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.match(/^[A-Z_][A-Z0-9_]*=/) && !line.startsWith('#'))
    .map((line) => line.split('=')[0]);
}

// Build all process.env.* replacements for the define option.
// Root `.env` keys should be injectable even if they are not mirrored in `.env.defaults`.
function buildEnvDefines() {
  const defines = {};
  const envKeys = new Set([
    ...readEnvKeys(path.resolve(__dirname, '.env.defaults')),
    ...readEnvKeys(path.resolve(__dirname, '.env')),
  ]);

  for (const key of envKeys) {
    defines[`process.env.${key}`] = JSON.stringify(process.env[key] ?? '');
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

function processIfBlocks(code) {
  const ifPattern = /\/\/\s*@if\s+/;
  const lines = code.split('\n');
  const blocks = [];
  const stack = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (ifPattern.test(trimmed) && trimmed.startsWith('//')) {
      stack.push({ line: i, condition: trimmed });
    } else if (/\/\/\s*@endif/.test(trimmed) && stack.length > 0) {
      const open = stack.pop();
      if (open) {
        blocks.push({ start: open.line, end: i, condition: open.condition });
      }
    }
  }

  // Process blocks from innermost to outermost (reverse order by start position to avoid index shifts)
  blocks.sort((a, b) => b.start - a.start);

  for (const block of blocks) {
    const { start, end, condition } = block;
    let keep = null;

    // TARGET conditions
    const targetMatch = condition.match(/@if\s+TARGET='(\w+)'/);
    if (targetMatch) {
      keep = targetMatch[1] === 'web'; // web build keeps web blocks, removes app blocks
    }

    // process.env conditions: @if process.env.X='val' or @if process.env.X!='val'
    const envEqMatch = condition.match(/@if\s+process\.env\.(\w+)='([^']*)'/);
    const envNeqMatch = condition.match(/@if\s+process\.env\.(\w+)!='([^']*)'/);
    const envBareMatch = condition.match(/@if\s+process\.env\.(\w+)\s*$/);

    if (envEqMatch) {
      keep = (process.env[envEqMatch[1]] || '') === envEqMatch[2];
    } else if (envNeqMatch) {
      keep = (process.env[envNeqMatch[1]] || '') !== envNeqMatch[2];
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

  return lines.join('\n');
}

// Plugin to handle @if preprocessor directives:
// - @if TARGET='web' / @if TARGET='app'
// - @if process.env.VAR='value' (evaluated against actual env vars)
function preprocessPlugin() {
  return {
    name: 'preprocess-target',
    enforce: 'pre',
    transform(code, id) {
      if (!id.match(/\.(tsx?|jsx?)($|\?)/)) return null;
      if (id.includes('node_modules')) return null;
      if (!code.includes('@if')) return null;

      let result = processIfBlocks(code);

      // Handle JSX-style comments: {/* @if TARGET='web'/'app' */}...{/* @endif */}
      result = result.replace(
        /\{\/\*\s*@if\s+TARGET='(\w+)'\s*\*\/\}([\s\S]*?)\{\/\*\s*@endif\s*\*\/\}/g,
        (_match, target, content) => {
          return target === 'web' ? content : '';
        }
      );

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
function providePlugin() {
  return {
    name: 'provide-globals',
    transform(code, id) {
      // Normalize backslashes for Windows compatibility
      const nid = id.replace(/\\/g, '/');
      if (nid.includes('node_modules')) return null;
      if (!nid.match(/\.(tsx?|jsx?)$/)) return null;

      const imports = [];
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
function uiModuleResolverPlugin() {
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
  const resolveCache = new Map();

  function tryResolve(basePath) {
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

      // Return cached resolution if available
      if (resolveCache.has(source)) return resolveCache.get(source);

      // Get the top-level segment of the import
      const segments = source.split('/');
      const topLevel = segments[0];

      let result = null;

      // Check if this is a ui/ directory import (e.g. 'component/foo', 'redux/actions/app')
      if (uiDirs.has(topLevel)) {
        result = tryResolve(path.join(UI_ROOT, source));
      }

      // Check if this is a ui/ file import (e.g. 'lbry', 'rewards', 'store')
      if (!result && segments.length === 1 && uiFiles.has(topLevel)) {
        result = tryResolve(path.join(UI_ROOT, source));
      }

      resolveCache.set(source, result);
      return result;
    },
  };
}

const isProduction = process.env.NODE_ENV === 'production';
const isServeCommand = process.argv.some((arg) => arg === 'dev' || arg === 'serve');

// Post-build plugin: injects Vite-built asset tags into the SSR template (`index-web.html`)
// so the Koa web server can serve pages with the correct JS/CSS references.
function ssrTemplatePlugin() {
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
        const assetTags = [];
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

const codeSplittingGroups = [
  {
    name: 'vendor-react',
    test: /node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
    priority: 100,
    entriesAware: true,
  },
  {
    name: 'vendor-state',
    test: /node_modules[\\/](redux|react-redux|@reduxjs[\\/]toolkit|reselect|re-reselect|redux-persist|redux-state-sync)[\\/]/,
    priority: 90,
    entriesAware: true,
  },
  {
    name: 'vendor-markdown',
    test: /node_modules[\\/](react-markdown|remark(?:-.+)?|rehype-.+|hast-util-sanitize|unist-util-visit|parse-entities|strip-markdown|remove-markdown)[\\/]/,
    priority: 80,
    entriesAware: true,
  },
  {
    name: 'vendor-video-core',
    test: /node_modules[\\/]video\.js[\\/]/,
    priority: 70,
    entriesAware: true,
  },
  {
    name: 'vendor-video-streaming',
    test: /node_modules[\\/](@videojs|mux\.js|m3u8-parser|mpd-parser|aes-decrypter|videojs-vtt\.js|hls\.js|p2p-media-loader-hlsjs)[\\/]/,
    priority: 65,
    entriesAware: true,
  },
  {
    name: 'vendor-video-cast',
    test: /node_modules[\\/](@silvermine|player\.js)[\\/]/,
    priority: 60,
    entriesAware: true,
  },
  {
    name: 'vendor-video-plugins',
    test: /node_modules[\\/](videojs-vtt-thumbnails|videojs-contrib-quality-levels|videojs-event-tracking|videojs-.+)[\\/]/,
    priority: 55,
    entriesAware: true,
  },
  {
    name: 'vendor-codemirror',
    test: /node_modules[\\/](@codemirror|codemirror)[\\/]/,
    priority: 50,
    entriesAware: true,
  },
  {
    name: 'vendor-ui',
    test: /node_modules[\\/](@mui|@emotion)[\\/]/,
    priority: 40,
    entriesAware: true,
  },
  {
    name: 'vendor-dnd',
    test: /node_modules[\\/]@hello-pangea[\\/]dnd[\\/]/,
    priority: 30,
    entriesAware: true,
  },
];

export default defineConfig({
  root: __dirname,
  publicDir: 'static',
  base: isServeCommand ? '/' : '/public/',

  define: {
    ...buildEnvDefines(),
    IS_WEB: JSON.stringify(true),
    __static: JSON.stringify(path.join(__dirname, 'static')),
    'process.platform': JSON.stringify('browser'),
    'process.browser': JSON.stringify(true),
    'process.cwd': '(() => "/")',
    global: 'globalThis',
  },

  resolve: {
    conditions: ['browser', ...(isProduction ? ['production'] : ['development'])],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.cjs', '.json', '.scss'],
    // Ensure a single copy of React across all packages (pnpm can nest duplicates)
    dedupe: ['react', 'react-dom'],
    alias: {
      // Explicit aliases for things that aren't in ui/
      config: path.resolve(__dirname, 'config.ts'),
      lbryinc: path.resolve(__dirname, 'extras/lbryinc'),
      recsys: path.resolve(__dirname, 'extras/recsys'),
      '__router-dom-real__': path.resolve(__dirname, 'node_modules/react-router-dom/dist/index.js'),
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

      // Web stubs for node/fs
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

      // Pre-bundled ESM buffer to work around Rolldown CJS interop chunk ordering bug
      buffer: path.resolve(__dirname, 'web/stubs/buffer-esm.js'),

      // Node.js polyfills for browser (needed by p2p-media-loader)
      events: 'events',

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

  plugins: [
    uiModuleResolverPlugin(),
    preprocessPlugin(),
    providePlugin(),
    // React Scan is opt-in in dev. Always injecting it proved too expensive on some heavy claim pages.
    // Set REACT_SCAN=1 when you explicitly want the overlay/instrumentation.
    {
      name: 'react-scan-dev',
      transformIndexHtml: {
        order: 'pre',
        handler(html, ctx) {
          if (!ctx.server) return html;
          if (!process.env.REACT_SCAN) return html;
          return html.replace(
            '<head>',
            `<head>\n    <script>window.__REACT_SCAN__ = { enabled: true, showToolbar: true };</script>` +
              `\n    <script src="https://unpkg.com/react-scan/dist/auto.global.js" crossorigin="anonymous"></script>`
          );
        },
      },
    },
    // Transform local .cjs files to ESM for the dev server only.
    // Build mode uses Rolldown which handles CJS interop natively.
    {
      name: 'cjs-to-esm-dev',
      enforce: 'pre',
      apply: 'serve',
      transform(code, id) {
        if (!id.endsWith('.cjs') || id.includes('node_modules')) return null;
        return {
          code: `var module = { exports: {} }; var exports = module.exports;\n${code}\nexport default module.exports;\n`,
          map: null,
        };
      },
    },
    react(),
    ssrTemplatePlugin(),
  ],

  server: {
    port: parseInt(process.env.WEB_SERVER_PORT || process.env.WEBPACK_WEB_PORT || '9090', 10),
    open: false,
    warmup: {
      clientFiles: [
        'ui/index.tsx',
        'ui/component/app/view.tsx',
        'ui/component/router/view.tsx',
        'ui/store.ts',
        'ui/redux/selectors/claims.ts',
      ],
    },
  },

  build: {
    outDir: 'web/dist/public',
    sourcemap: isProduction ? true : 'inline',
    minify: isProduction,
    rolldownOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        codeSplitting: {
          minSize: 20_000,
          groups: codeSplittingGroups,
        },
      },
    },
  },

  optimizeDeps: {
    entries: ['index.html'],
    include: [
      'react',
      'react-dom',
      'react-redux',
      'redux',
      '@reduxjs/toolkit',
      'reselect',
      '@emotion/styled',
      '@emotion/react',
      'react-router',
      'react-router-dom',
      'react-top-loading-bar',
      'classnames',
      'dayjs',
      'uuid',
      'localforage',
      'redux-persist',
      'redux-persist/integration/react',
      'redux-persist/lib/stateReconciler/autoMergeLevel2',
      'redux-persist-transform-compress',
      'redux-persist-transform-filter',
      'redux-state-sync',
      're-reselect',
      'buffer',
      'proxy-polyfill',
      'tus-js-client',
      'remark',
      'react-datepicker',
      'events',
      'p2p-media-loader-hlsjs',
    ],
  },

  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
    categories: {
      correctness: 'error',
      suspicious: 'warn',
    },
    rules: {
      // Suppress migration noise — revisit when adding strict types
      'no-unused-vars': 'off',
      'no-shadow': 'off',
      'no-unused-expressions': 'off',
      'typescript/no-floating-promises': 'off',
      'typescript/no-redundant-type-constituents': 'off',
      'typescript/no-unnecessary-boolean-literal-compare': 'off',
      'typescript/no-unsafe-type-assertion': 'off',
    },
    ignorePatterns: [
      'node_modules',
      'web/dist',
      'dist',
      'build',
      'static',
      'flow-typed',
      'web/stubs/buffer-esm.js',
      'tests',
      'playwright.config.ts',
      'vite.config.ts',
      '**/*.js',
      '**/*.mjs',
    ],
  },
});
