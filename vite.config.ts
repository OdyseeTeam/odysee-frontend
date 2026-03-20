import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.defaults and .env
import dotenvDefaults from 'dotenv-defaults';
dotenvDefaults.config({ silent: false, defaults: '.env.defaults' });

const UI_ROOT = path.resolve(__dirname, 'ui');
const WEB_ROOT = path.resolve(__dirname, 'web');
const PROJECT_ROOT = __dirname;

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
  defines['process.env.SDK_API_URL'] = JSON.stringify(
    process.env.SDK_API_URL || process.env.LBRY_WEB_API || ''
  );
  defines['process.env.BUILD_REV'] = JSON.stringify(process.env.BUILD_REV || '');
  defines['process.env.SEARCH_API_URL'] = JSON.stringify(process.env.SEARCH_API_URL || '');
  return defines;
}

// Plugin to handle @if TARGET='web' / @if TARGET='app' preprocessor directives
function preprocessPlugin(): Plugin {
  return {
    name: 'preprocess-target',
    enforce: 'pre',
    transform(code, id) {
      if (!id.match(/\.(tsx?|jsx?)$/)) return null;
      if (id.includes('node_modules')) return null;
      if (!code.includes('@if TARGET') && !code.includes('// @endif')) return null;

      let result = code;
      // Remove app-only blocks: // @if TARGET='app' ... // @endif
      result = result.replace(
        /\/\/\s*@if\s+TARGET='app'[\s\S]*?\/\/\s*@endif/g,
        ''
      );
      // Remove the @if TARGET='web' and @endif markers but keep the content
      result = result.replace(/\/\/\s*@if\s+TARGET='web'\s*\n?/g, '');
      result = result.replace(/\/\/\s*@endif\s*\n?/g, '');

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
      if (id.includes('node_modules')) return null;
      if (!id.match(/\.(tsx?|jsx?)$/)) return null;

      const imports: string[] = [];
      if (code.includes('Buffer') && !code.includes("from 'buffer'") && !code.includes('import { Buffer')) {
        imports.push("import { Buffer } from 'buffer';");
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
    fs.readdirSync(UI_ROOT)
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

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    root: __dirname,
    publicDir: 'static',

    define: {
      ...buildEnvDefines(),
      IS_WEB: JSON.stringify(true),
      __static: JSON.stringify(path.join(__dirname, 'static')),
      'process.platform': JSON.stringify('browser'),
    },

    resolve: {
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

        // Build optimization
        'redux-persist-transform-filter': 'redux-persist-transform-filter/index.js',
      },
    },

    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api', 'import'],
          loadPaths: [
            path.resolve(__dirname, 'ui/scss'),
            ...resolvePnpmNodeModules(),
          ],
        },
      },
    },

    plugins: [
      uiModuleResolverPlugin(),
      preprocessPlugin(),
      providePlugin(),
      react(),
    ],

    server: {
      port: parseInt(process.env.WEBPACK_WEB_PORT || '9090', 10),
      open: true,
    },

    build: {
      outDir: 'web/dist/public',
      sourcemap: isProduction ? true : 'inline',
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
      },
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'react-redux', 'redux', 'reselect'],
    },
  };
});
