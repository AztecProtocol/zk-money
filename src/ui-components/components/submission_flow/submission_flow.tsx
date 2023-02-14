import React from 'react';
import { bindStyle } from '../../util/classnames.js';
import { StepStatusIndicator, StepStatus } from '../../index.js';
import style from './submission_flow.module.scss';

const cx = bindStyle(style);

export interface ActiveSubmissionFlowItem {
  idx: number;
  status: StepStatus;
  fieldContent?: React.ReactNode;
  expandedContent?: React.ReactNode;
}

interface SubmissionFlowProps {
  labels: string[];
  activeItem: ActiveSubmissionFlowItem;
}

export function SubmissionFlow({ labels, activeItem }: SubmissionFlowProps) {
  return (
    <div className={style.root}>
      <div className={style.items}>
        {labels.map((label, idx) => {
          const isCurrent = idx === activeItem.idx;
          const prevIsCurrent = idx === activeItem.idx + 1;
          const prevIsExpanded = !!(prevIsCurrent && activeItem.expandedContent);
          const faded = prevIsCurrent && !prevIsExpanded && activeItem.status !== StepStatus.ERROR;
          const hidden = !faded && idx > activeItem.idx;
          const status = idx < activeItem.idx ? StepStatus.DONE : activeItem.status;
          return (
            <div key={idx} className={cx(style.item, { faded, hidden })}>
              <div className={cx(style.itemName, status === StepStatus.DONE && style.itemDone)}>{label}</div>
              <div className={cx(style.itemFieldContent, { faded })}>
                {isCurrent && activeItem.fieldContent}
                <StepStatusIndicator status={status} />
              </div>
              {isCurrent && <div className={style.itemExpandedContent}>{activeItem.expandedContent}</div>}
            </div>
          );
        })}
      </div>
      <div className={style.progress}>
        {activeItem.idx + 1} / {labels.length}
      </div>
    </div>
  );
}
