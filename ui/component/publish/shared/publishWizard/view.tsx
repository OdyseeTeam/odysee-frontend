import React from 'react';
import classnames from 'classnames';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Button from 'component/button';
import Spinner from 'component/spinner';
import './style.scss';

type Step = {
  label: string;
  validate?: () => boolean;
  onInvalid?: () => void;
};

type StepChangeSource = 'next' | 'back' | 'step';

type Props = {
  steps: Step[];
  activeStep: number;
  onStepChange: (step: number, source: StepChangeSource) => void;
  uploadProgress?: number | null;
  children: React.ReactNode;
  onPublish?: () => void;
  publishLabel?: string | React.ReactNode;
  publishDisabled?: boolean;
  publishing?: boolean;
  publishFooterLeft?: React.ReactNode;
};

export default function PublishWizard(props: Props) {
  const {
    steps,
    activeStep,
    onStepChange,
    uploadProgress,
    children,
    onPublish,
    publishLabel,
    publishDisabled,
    publishing,
    publishFooterLeft,
  } = props;

  const isLastStep = activeStep === steps.length - 1;
  const isFirstStep = activeStep === 0;

  function handleNext() {
    if (isLastStep) return;
    const step = steps[activeStep];
    if (step.validate && !step.validate()) {
      step.onInvalid?.();
      return;
    }
    onStepChange(activeStep + 1, 'next');
  }

  function handleBack() {
    if (isFirstStep) return;
    onStepChange(activeStep - 1, 'back');
  }

  function handleStepClick(index: number) {
    if (index === activeStep) return;
    if (index < activeStep) {
      onStepChange(index, 'step');
      return;
    }
    for (let i = activeStep; i < index; i++) {
      const step = steps[i];
      if (step.validate && !step.validate()) {
        step.onInvalid?.();
        return;
      }
    }
    onStepChange(index, 'step');
  }

  const firstInvalidStep = React.useMemo(() => {
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].validate && !steps[i].validate()) return i;
    }
    return steps.length;
  }, [steps, activeStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const panels = React.Children.toArray(children);

  return (
    <div className="publish-wizard">
      <div className="publish-wizard__header">
        <div className="publish-wizard__steps">
          {steps.map((step, i) => {
            const isBlocked = i > activeStep && i > firstInvalidStep;
            return (
              <button
                key={i}
                type="button"
                className={classnames('publish-wizard__step', {
                  'publish-wizard__step--active': i === activeStep,
                  'publish-wizard__step--completed': i < activeStep,
                  'publish-wizard__step--upcoming': i > activeStep,
                  'publish-wizard__step--blocked': isBlocked,
                })}
                onClick={() => handleStepClick(i)}
                disabled={isBlocked}
              >
                <span className="publish-wizard__step-number">
                  {i < activeStep ? <Icon icon={ICONS.COMPLETE} size={12} /> : i + 1}
                </span>
                <span className="publish-wizard__step-label">{__(step.label)}</span>
              </button>
            );
          })}
        </div>

        {uploadProgress !== null && uploadProgress !== undefined && uploadProgress < 100 && (
          <div className="publish-wizard__upload-progress">
            <div className="publish-wizard__upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
      </div>

      <div className="publish-wizard__content">
        <React.Suspense
          fallback={
            <div className="publish-wizard__loading">
              <Spinner type="small" />
            </div>
          }
        >
          {panels[activeStep] || null}
        </React.Suspense>
      </div>

      <div className="publish-wizard__footer">
        <div className="publish-wizard__footer-left">
          {!isFirstStep && <Button button="alt" label={__('Back')} onClick={handleBack} />}
        </div>
        <div className="publish-wizard__footer-right">
          {isLastStep ? (
            <div className="publish-wizard__publish-group">
              {publishFooterLeft}
              <Button
                button="primary"
                label={publishing ? __('Publishing...') : publishLabel || __('Publish')}
                onClick={onPublish}
                disabled={publishDisabled || publishing}
              />
            </div>
          ) : (
            <Button button="primary" label={__('Next')} onClick={handleNext} />
          )}
        </div>
      </div>
    </div>
  );
}
