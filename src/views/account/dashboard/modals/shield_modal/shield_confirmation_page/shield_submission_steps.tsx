import {
  StepStatus,
  SubmissionFlow,
  ActiveSubmissionFlowItem,
  ToastType,
} from '../../../../../../ui-components/index.js';
import { ShieldComposerPhase, ShieldComposerState } from '../../../../../../alt-model/shield/index.js';
import { SubmissionItemPrompt } from '../../modal_molecules/submission_item_prompt/index.js';
import { ReportErrorButton } from '../../../../../../components/report_error_button/index.js';
import { useContext, useEffect } from 'react';
import { TopLevelContext } from '../../../../../../alt-model/top_level_context/top_level_context.js';

const STEPS = [
  { phase: ShieldComposerPhase.GENERATE_SPENDING_KEY, label: 'Generating Spending Key' },
  { phase: ShieldComposerPhase.CREATE_PROOF, label: 'Creating Proof' },
  { phase: ShieldComposerPhase.DEPOSIT, label: 'Depositing Funds' },
  { phase: ShieldComposerPhase.APPROVE_PROOF, label: 'Approving Proof' },
  { phase: ShieldComposerPhase.SEND_PROOF, label: 'Sending Proof' },
];
const STEPS_WITHOUT_SPENDING_KEY = STEPS.slice(1);
const LABELS = STEPS.map(x => x.label);
const LABELS_WITHOUT_SPENDING_KEY = STEPS_WITHOUT_SPENDING_KEY.map(x => x.label);

interface ShieldSubmissionStepsProps {
  composerState: ShieldComposerState;
  requiresSpendingKey?: boolean;
}

function getActiveItem({ composerState, requiresSpendingKey }: ShieldSubmissionStepsProps): ActiveSubmissionFlowItem {
  const { phase, error, prompt } = composerState;
  const steps = requiresSpendingKey ? STEPS : STEPS_WITHOUT_SPENDING_KEY;
  if (error) {
    const idx = steps.findIndex(x => x.phase === error.phase);
    return { idx, status: StepStatus.ERROR };
  }
  const idx = steps.findIndex(x => x.phase === phase);
  const expandedContent = prompt && <SubmissionItemPrompt>{prompt}</SubmissionItemPrompt>;
  return { idx, status: StepStatus.RUNNING, expandedContent };
}

export function ShieldSubmissionSteps(props: ShieldSubmissionStepsProps) {
  const { toastsObs } = useContext(TopLevelContext);
  const { error } = props.composerState;
  const labels = props.requiresSpendingKey ? LABELS : LABELS_WITHOUT_SPENDING_KEY;

  useEffect(() => {
    if (!error) return;
    toastsObs.addToast({
      closable: true,
      text: error.message,
      type: ToastType.ERROR,
      components: <ReportErrorButton error={error.raw} />,
    });
  }, [error, toastsObs]);

  return <SubmissionFlow activeItem={getActiveItem(props)} labels={labels} />;
}
