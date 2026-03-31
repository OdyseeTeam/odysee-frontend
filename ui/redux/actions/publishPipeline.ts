import * as ACTIONS from 'constants/action_types';

export type PipelineStage =
  | 'idle'
  | 'queued'
  | 'converting'
  | 'optimizing'
  | 'uploading'
  | 'ready'
  | 'processing'
  | 'pausing'
  | 'paused'
  | 'published'
  | 'error';

export type PipelineItem = {
  id: string;
  filename: string;
  stage: PipelineStage;
  previousStage?: PipelineStage;
  progress: number; // 0-100
  steps?: PipelineStage[];
  uploadSpeed?: number; // bytes per second
  fileSize?: number; // bytes
  activeStep?: number;
  formId?: string;
  uri?: string;
  error?: string;
};

export function doAddPipelineItem(item: PipelineItem) {
  return {
    type: ACTIONS.PUBLISH_PIPELINE_ADD,
    data: item,
  };
}

export function doUpdatePipelineItem(id: string, updates: Partial<PipelineItem>) {
  return {
    type: ACTIONS.PUBLISH_PIPELINE_UPDATE,
    data: { id, updates },
  };
}

export function doRemovePipelineItem(id: string) {
  return {
    type: ACTIONS.PUBLISH_PIPELINE_REMOVE,
    data: { id },
  };
}
