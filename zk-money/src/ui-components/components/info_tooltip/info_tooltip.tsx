import { useState } from 'react';
import { bindStyle } from '../../util/classnames.js';
import { Tooltip } from '../index.js';
import style from './info_tooltip.module.scss';

const cx = bindStyle(style);

interface InfoTooltipProps {
  className?: string;
  text: string;
}

export function InfoTooltip({ className, text }: InfoTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseOver = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div className={style.infoWrapper}>
      {showTooltip && <Tooltip content={text} />}
      <div
        onMouseEnter={handleMouseOver}
        onMouseLeave={handleMouseLeave}
        className={cx(style.infoTooltipWrapper, className)}
      >
        <div className={style.infoTooltip} />
      </div>
    </div>
  );
}
