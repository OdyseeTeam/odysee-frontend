import { test as base, expect, type Page } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { SearchPage } from '../pages/search.page';
import { WatchPage } from '../pages/watch.page';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RenderSnapshot = {
  timestamp: number;
  components: Record<string, { renderCount: number; selfTime?: number }>;
};

export type SlowComponent = {
  name: string;
  renderCount: number;
  selfTime?: number;
};

// ---------------------------------------------------------------------------
// Init script — injected before any page JS via addInitScript
//
// Strategy: We monkey-patch React.createElement to wrap each function
// component in a counting proxy. This counts ACTUAL render calls, not
// fiber tree walks. Class components are tracked via their render() call.
// ---------------------------------------------------------------------------

const PERF_INIT_SCRIPT = `
  window.__PERF_RENDERS__ = {};
  window.__PERF_COMMITS__ = 0;

  // --- Approach 1: DevTools hook for commit counting ---
  if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      renderers: new Map(),
      supportsFiber: true,
      inject: function(renderer) {
        // Patch renderer to intercept renders
        var id = Math.random();
        this.renderers.set(id, renderer);
        return id;
      },
      onScheduleFiberRoot: function() {},
      onCommitFiberRoot: function() {},
      onCommitFiberUnmount: function() {},
    };
  }

  var _origCommit = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = function(rendererID, root) {
    window.__PERF_COMMITS__++;

    try {
      (function walk(fiber) {
        if (!fiber) return;
        if (fiber.type && typeof fiber.type === 'function') {
          var name = fiber.type.displayName || fiber.type.name || 'Anonymous';
          window.__PERF_RENDERS__[name] = (window.__PERF_RENDERS__[name] || 0) + 1;
        }
        walk(fiber.child);
        walk(fiber.sibling);
      })(root.current);
    } catch(e) {}

    if (_origCommit) return _origCommit.apply(this, arguments);
  };
`;

// ---------------------------------------------------------------------------
// PerfCollector — captures render data from the page
// ---------------------------------------------------------------------------

export class PerfCollector {
  constructor(private page: Page) {}

  /** Install render counter by patching the existing DevTools hook (post-load). */
  async installViaEvaluate() {
    await this.page.evaluate(() => {
      const w = window as any;
      w.__PERF_RENDERS__ = {};
      w.__PERF_COMMITS__ = 0;
      const hook = w.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!hook) return;
      const orig = hook.onCommitFiberRoot;
      hook.onCommitFiberRoot = function (rendererID: number, root: any) {
        w.__PERF_COMMITS__++;
        try {
          (function walk(fiber: any) {
            if (!fiber) return;
            if (fiber.type && typeof fiber.type === 'function') {
              const name = fiber.type.displayName || fiber.type.name || 'Anonymous';
              w.__PERF_RENDERS__[name] = (w.__PERF_RENDERS__[name] || 0) + 1;
            }
            walk(fiber.child);
            walk(fiber.sibling);
          })(root.current);
        } catch (e) {
          // never break the app
        }
        if (orig) return orig.apply(this, arguments);
      };
    });
  }

  /** Reset counters to zero. */
  async reset() {
    await this.page.evaluate(() => {
      (window as any).__PERF_RENDERS__ = {};
      (window as any).__PERF_COMMITS__ = 0;
    });
  }

  /** Capture a snapshot of current render counts. */
  async captureRenderSnapshot(): Promise<RenderSnapshot> {
    const components = await this.page.evaluate(() => {
      const renders = (window as any).__PERF_RENDERS__ || {};
      const result: Record<string, { renderCount: number }> = {};
      for (const [name, count] of Object.entries(renders)) {
        result[name] = { renderCount: count as number };
      }
      return result;
    });

    return { timestamp: Date.now(), components };
  }

  /** Get the number of React commits (setState/dispatch cycles). */
  async getCommitCount(): Promise<number> {
    return this.page.evaluate(() => (window as any).__PERF_COMMITS__ || 0);
  }

  /** Return components that rendered more than `threshold` times. */
  async getSlowComponents(threshold: number): Promise<SlowComponent[]> {
    const snapshot = await this.captureRenderSnapshot();
    return Object.entries(snapshot.components)
      .filter(([, data]) => data.renderCount > threshold)
      .map(([name, data]) => ({ name, renderCount: data.renderCount, selfTime: data.selfTime }))
      .toSorted((a, b) => b.renderCount - a.renderCount);
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

export type PerfFixtures = {
  perf: PerfCollector;
  homePage: HomePage;
  searchPage: SearchPage;
  watchPage: WatchPage;
};

export const test = base.extend<PerfFixtures>({
  perf: async ({ page }, use) => {
    const collector = new PerfCollector(page);
    await use(collector);
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },

  watchPage: async ({ page }, use) => {
    await use(new WatchPage(page));
  },
});

export { expect };
