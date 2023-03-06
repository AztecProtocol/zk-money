import { ActiveSubmissionFlowItem, StepStatus, SubmissionFlow, ToastType } from '../../../../../ui-components/index.js';
import {
  SpendKeyGenerationStep,
  useSpendingKeyGenerationStep,
} from '../modal_molecules/spending_key_generation_step_hooks/index.js';
import { SendComposerPhase, SendComposerState } from '../../../../../alt-model/send/send_composer_state_obs.js';
import { ReportErrorButton } from '../../../../../components/report_error_button/index.js';
import { useContext, useEffect } from 'react';
import { TopLevelContext } from '../../../../../alt-model/top_level_context/top_level_context.js';

interface SendSubmissionStepsProps {
  composerState: SendComposerState;
}

const steps = [
  { phase: SendComposerPhase.GENERATING_KEY, label: 'Creating Spending Key' },
  { phase: SendComposerPhase.CREATING_PROOF, label: 'Creating Proof' },
  { phase: SendComposerPhase.SENDING_PROOF, label: 'Sending Proof' },
];
const labels = steps.map(x => x.label);

function getActiveItem(
  { phase, error }: SendComposerState,
  spendKeyGenerationStep: SpendKeyGenerationStep,
): ActiveSubmissionFlowItem {
  if (error) {
    const idx = steps.findIndex(x => x.phase === error.phase);
    return { idx, status: StepStatus.ERROR };
  }
  const idx = steps.findIndex(x => x.phase === phase);
  if (phase === SendComposerPhase.GENERATING_KEY) {
    return { idx, ...spendKeyGenerationStep };
  }
  return { idx, status: StepStatus.RUNNING };
}

export function SendSubmissionSteps({ composerState }: SendSubmissionStepsProps) {
  const { toastsObs } = useContext(TopLevelContext);
  const { error } = composerState;
  const spendingKeyGenerationStep = useSpendingKeyGenerationStep();

  useEffect(() => {
    if (!error) return;
    toastsObs.addToast({
      closable: true,
      text: error.message,
      type: ToastType.ERROR,
      components: <ReportErrorButton error={error.raw} />,
    });
  }, [error, toastsObs]);

  return <SubmissionFlow activeItem={getActiveItem(composerState, spendingKeyGenerationStep)} labels={labels} />;
}
