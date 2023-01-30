import { bindStyle } from '../../util/classnames.js';
import style from './form_warning.module.scss';
const cx = bindStyle(style);

interface FormWarningProps {
  text: React.ReactNode;
  className?: string;
}

export function FormWarning(props: FormWarningProps) {
  return <div className={cx(style.warning, props.className)}>{props.text}</div>;
}
