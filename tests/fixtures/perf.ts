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
// PerfCollector — captures render data from the page
// ---------------------------------------------------------------------------

export class PerfCollector {
  constructor(private page: Page) {}

  /**
   * Inject a lightweight render-counting harness via React DevTools hook.
   * Works independently of React Scan — patches __REACT_DEVTOOLS_GLOBAL_HOOK__.
   */
  async install() {
    await this.page.evaluate(() => {
      const w = window as any;
      w.__PERF_RENDERS__ = {} as Record<string, number>;

      const hook = w.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!hook) return;

      const origOnCommitFiberRoot = hook.onCommitFiberRoot;
      hook.onCommitFiberRoot = function (rendererID: number, root: any, ...rest: any[]) {
        try {
          walkFiber(root.current);
        } catch {
          // swallow — never break the app
        }
        if (origOnCommitFiberRoot) {
          return origOnCommitFiberRoot.call(this, rendererID, root, ...rest);
        }
      };

      function walkFiber(fiber: any) {
        if (!fiber) return;
        if (fiber.type && typeof fiber.type === 'function') {
          const name = fiber.type.displayName || fiber.type.name || 'Anonymous';
          w.__PERF_RENDERS__[name] = (w.__PERF_RENDERS__[name] || 0) + 1;
        }
        walkFiber(fiber.child);
        walkFiber(fiber.sibling);
      }
    });
  }

  /** Reset counters to zero. */
  async reset() {
    await this.page.evaluate(() => {
      (window as any).__PERF_RENDERS__ = {};
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

  /** Return components that rendered more than `threshold` times. */
  async getSlowComponents(threshold: number): Promise<SlowComponent[]> {
    const snapshot = await this.captureRenderSnapshot();
    return Object.entries(snapshot.components)
      .filter(([, data]) => data.renderCount > threshold)
      .map(([name, data]) => ({ name, renderCount: data.renderCount, selfTime: data.selfTime }))
      .toSorted((a, b) => b.renderCount - a.renderCount);
  }

  /** Try reading React Scan data if it's available (dev mode). */
  async tryReactScanSnapshot(): Promise<Record<string, number> | null> {
    return this.page.evaluate(() => {
      const scan = (window as any).__REACT_SCAN__;
      if (!scan) return null;
      try {
        const report = scan.getReport?.() || scan.report?.();
        if (report && typeof report === 'object') return report;
      } catch {
        // React Scan not available
      }
      return null;
    });
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
