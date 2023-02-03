import { Card, CardHeaderSize } from '../../../../../ui-components/index.js';
import { useShieldForm, ShieldComposerPhase } from '../../../../../alt-model/shield/index.js';
import { Modal } from '../../../../../components/index.js';
import { ShieldConfirmationPage } from './shield_confirmation_page/index.js';
import { ShieldPage1 } from './shield_page1.js';
import { ShieldModalHeader } from './shield_modal_header.js';
import { useEffect, useState } from 'react';

interface ShieldModalProps {
  preselectedAmount?: string;
  preselectedAssetId?: number;
  preselectedRecipient?: string;
  onClose: () => void;
  onShieldComplete?: () => void;
}

export function ShieldModal(props: ShieldModalProps) {
  const [shouldAttemptAutomaticLock, setShouldAttemptAutomaticLock] = useState(!!props.preselectedAmount);
  const { onClose } = props;
  const {
    fields,
    setters,
    validationResult,
    composerState,
    lockedComposerPayload,
    locked,
    feedback,
    attemptedLock,
    attemptLock,
    submit,
    unlock,
  } = useShieldForm(
    props.preselectedAssetId,
    props.preselectedRecipient,
    props.preselectedAmount,
    props.onShieldComplete,
  );

  useEffect(() => {
    if (shouldAttemptAutomaticLock) attemptLock();
  }, [shouldAttemptAutomaticLock, attemptLock]);

  const phase = composerState?.phase;
  const isIdle = phase === ShieldComposerPhase.IDLE;
  const canClose = phase === undefined || isIdle || phase === ShieldComposerPhase.DONE;
  const canGoBack = locked && isIdle;

  const handleBack = () => {
    if (canGoBack) {
      setShouldAttemptAutomaticLock(false);
      unlock();
    }
  };

  const cardContent =
    locked && composerState && lockedComposerPayload ? (
      <ShieldConfirmationPage
        composerState={composerState}
        validationResult={validationResult}
        lockedComposerPayload={lockedComposerPayload}
        onSubmit={submit}
        onClose={onClose}
        onBack={handleBack}
      />
    ) : (
      <ShieldPage1
        fields={fields}
        feedback={feedback}
        attemptedLock={attemptedLock}
        validationResult={validationResult}
        onNext={attemptLock}
        onChangeAmountStrOrMax={setters.amountStrOrMax}
        onChangeAsset={setters.assetId}
        onChangeRecipientAlias={setters.recipientAlias}
        onChangeSpeed={setters.speed}
      />
    );

  return (
    <Modal onClose={onClose}>
      <Card
        cardHeader={
          <ShieldModalHeader backDisabled={canGoBack} closeDisabled={!canClose} onClose={onClose} onBack={handleBack} />
        }
        cardContent={cardContent}
        headerSize={CardHeaderSize.LARGE}
      />
    </Modal>
  );
}
