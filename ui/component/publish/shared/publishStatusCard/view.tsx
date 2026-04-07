import React from 'react';
import classnames from 'classnames';
import './style.scss';

type Variant = 'error' | 'mandatory' | 'recommended';

type Props = {
  variant: Variant;
  icon: React.ReactNode;
  title: string;
  description: string | React.ReactNode;
  checkboxLabel?: string;
  checked?: boolean;
  onCheck?: () => void;
  children?: React.ReactNode;
};

export default function PublishStatusCard(props: Props) {
  const { variant, icon, title, description, checkboxLabel, checked, onCheck, children } = props;

  return (
    <div className={classnames('publish-status-card', `publish-status-card--${variant}`)}>
      <div className="publish-status-card__header">
        <div className="publish-status-card__icon">{icon}</div>
        <div className="publish-status-card__text">
          <h3 className="publish-status-card__title">{title}</h3>
          <p className="publish-status-card__description">{description}</p>
        </div>
        {checkboxLabel && onCheck && (
          <label className="publish-status-card__action">
            <input type="checkbox" checked={checked} onChange={onCheck} />
            <span>{checkboxLabel}</span>
          </label>
        )}
      </div>
      {children && <div className="publish-status-card__body">{children}</div>}
    </div>
  );
}
