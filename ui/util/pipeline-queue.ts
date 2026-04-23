import { PIPELINE_CONCURRENCY } from 'constants/publish';
import type { PipelineStage } from 'redux/actions/publishPipeline';

type QueuedItem = {
  id: string;
  stage: PipelineStage;
  start: () => void;
};

type ConcurrencyStage = keyof typeof PIPELINE_CONCURRENCY;

const active: Record<string, Set<string>> = {
  converting: new Set(),
  optimizing: new Set(),
  uploading: new Set(),
};

const queue: QueuedItem[] = [];

function isConcurrencyStage(stage: string): stage is ConcurrencyStage {
  return stage in PIPELINE_CONCURRENCY;
}

function slotsAvailable(stage: ConcurrencyStage): number {
  return PIPELINE_CONCURRENCY[stage] - active[stage].size;
}

export function enqueue(id: string, stage: PipelineStage, start: () => void): boolean {
  if (!isConcurrencyStage(stage)) {
    start();
    return true;
  }

  if (slotsAvailable(stage) > 0) {
    active[stage].add(id);
    start();
    return true;
  }

  queue.push({ id, stage, start });
  return false;
}

export function promote(id: string, fromStage: PipelineStage, toStage: PipelineStage) {
  if (isConcurrencyStage(fromStage)) {
    active[fromStage].delete(id);
  }
  if (isConcurrencyStage(toStage)) {
    active[toStage].add(id);
  }
  flush();
}

export function release(id: string, stage?: PipelineStage) {
  if (stage && isConcurrencyStage(stage)) {
    active[stage].delete(id);
  } else {
    for (const s of Object.keys(active)) {
      active[s].delete(id);
    }
  }
  flush();
}

function flush() {
  let i = 0;
  while (i < queue.length) {
    const item = queue[i];
    if (!isConcurrencyStage(item.stage) || slotsAvailable(item.stage) > 0) {
      queue.splice(i, 1);
      if (isConcurrencyStage(item.stage)) {
        active[item.stage].add(item.id);
      }
      item.start();
    } else {
      i++;
    }
  }
}

export function dequeue(id: string) {
  const idx = queue.findIndex((item) => item.id === id);
  if (idx !== -1) queue.splice(idx, 1);
  release(id);
}
