import { BorderBox } from '../../../../../../components/index.js';
import style from './split_section.module.scss';

interface SplitSectionProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  className?: string;
}

export function SplitSection(props: SplitSectionProps) {
  return (
    <BorderBox className={props.className}>
      <div className={style.splitSectionWrapper}>
        <div className={style.leftPanel}>{props.leftPanel}</div>
        <div className={style.rightPanel}>{props.rightPanel}</div>
      </div>
    </BorderBox>
  );
}
