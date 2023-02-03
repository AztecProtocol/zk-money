import { Hyperlink, HyperlinkIcon } from '../../../../../../ui-components/index.js';
import style from './information_section.module.scss';

interface InformationSectionProps {
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  buttonLabel: string;
  helpLink: string;
}

export function InformationSection(props: InformationSectionProps) {
  return (
    <div className={style.informationWrapper}>
      <div className={style.titleWrapper}>
        <div className={style.title}>{props.title}</div>
        <div className={style.subtitle}>{props.subtitle}</div>
      </div>
      <div className={style.content}>{props.content}</div>
      <Hyperlink label={props.buttonLabel} icon={HyperlinkIcon.Info} href={props.helpLink} />
    </div>
  );
}
