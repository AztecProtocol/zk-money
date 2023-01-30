import React from 'react';
import { bindStyle } from '../ui-components/index.js';
import style from './border_box.module.scss';

const cx = bindStyle(style);

interface BorderBoxProps {
  children: React.ReactNode;
  className?: string;
}

export function BorderBox({ children, className }: BorderBoxProps) {
  return <div className={cx(style.borderBox, className)}>{children}</div>;
}
