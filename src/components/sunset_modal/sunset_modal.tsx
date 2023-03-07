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
        <div className={style.title}>zk.money is shutting down</div>
        <div className={style.columns}>
          <div className={style.content}>
            <div className={style.subtitle}>What does this mean?</div>
            <div className={style.body}>
              Aztec Connect is the power behind zk.money’s private DeFi. As Aztec refocus their efforts to build the
              world’s first fully private decentralised network, Aztec Connect is to be discontinued.
              <br />
              <br />
              New Account Creation, new DeFi deposits & new ETH deposits on zk.money are to be frozen on the{' '}
              <b>20th March 2023.</b>
              <br />
              <br />
              <b>
                Current Funds in the system are safe, and withdrawals can be made as normal until 20th March 2024.
              </b>{' '}
              All existing DeFi positions will continue to run as normal.
            </div>
            <Button className={style.learnMoreButton} text="Learn More" />
          </div>
          <Graphic className={style.graphic} />
        </div>
      </div>
    </div>
  );
}
