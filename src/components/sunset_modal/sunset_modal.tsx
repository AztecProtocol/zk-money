import { useEffect, useState } from 'react';
import { Button, CloseMiniIcon } from '../../ui-components/index.js';
import { ReactComponent as Background } from './background.svg';
import { ReactComponent as Graphic } from './graphic.svg';
import style from './sunset_modal.module.scss';

const SUNSET_MESSAGE_DISMISSED = 'sunset_message_dismissed';

export function SunsetModal() {
  const [isSunsetMessageDismissed, setIsSunsetMessageDismissed] = useState(true);

  useEffect(() => {
    const sunsetMessageDismissed = !!localStorage.getItem(SUNSET_MESSAGE_DISMISSED);
    setIsSunsetMessageDismissed(sunsetMessageDismissed);
  }, []);

  function handleClose(e) {
    e.preventDefault();
    setIsSunsetMessageDismissed(true);
    localStorage.setItem(SUNSET_MESSAGE_DISMISSED, 'true');
  }

  if (isSunsetMessageDismissed) return null;

  return (
    <div className={style.overlay}>
      <div className={style.modal}>
        <Background className={style.background} />
        <div className={style.closeButton} onClick={handleClose}>
          <CloseMiniIcon />
        </div>
        <div className={style.title}>Aztec is sunsetting zk.money</div>
        <div className={style.columns}>
          <div className={style.content}>
            <div className={style.subtitle}>
              <b>What does this mean?</b>
            </div>
            <div className={style.body}>
              As of March 13th, 2023, we are sunsetting zk.money and Aztec Connect, the infrastructure that powers it.
              <br />
              <br />
              Deposits will remain open until <b>23:59 UTC on March 21st, 2023</b>, after which zk.money will enter
              withdrawal-only mode.
              <br />
              <br />
              New account creation, new ETH and DAI deposits, and new DeFi interactions on zk.money will be disabled on
              that date.
              <br />
              <br />
              Users should begin withdrawing funds immediately, though withdrawals can be made normally until 21st March
              2024. <b>All user deposits will remain safe.</b> Read our full announcement here.
            </div>
            <Button className={style.learnMoreButton} text="Withdraw Funds" />
          </div>
          <Graphic className={style.graphic} />
        </div>
      </div>
    </div>
  );
}
