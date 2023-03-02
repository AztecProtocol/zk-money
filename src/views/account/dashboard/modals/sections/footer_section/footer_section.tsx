import { Button } from '@aztec/aztec-ui';
import { useWalletInteractionIsOngoing } from '../../../../../../alt-model/wallet_interaction_hooks.js';
import { FaqHint } from '../../../../../../ui-components/index.js';
import style from './footer_section.module.scss';

interface FooterSectionProps {
  onNext: () => void;
  nextDisabled: boolean;
  feedback?: React.ReactNode;
}

export function FooterSection(props: FooterSectionProps) {
  const walletInteractionIsOngoing = useWalletInteractionIsOngoing();

  return (
    <>
      <div style={{ minHeight: '60px', width: '100%' }} />
      <div className={style.root}>
        <FaqHint className={style.faqHint} />
        {props.feedback && <div className={style.feedback}>{props.feedback}</div>}
        <div className={style.nextWrapper}>
          <Button
            className={style.nextButton}
            text="Next"
            onClick={props.onNext}
            disabled={props.nextDisabled || walletInteractionIsOngoing}
          />
        </div>
      </div>
    </>
  );
}
