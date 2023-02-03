import { StepStatus, SubmissionFlow, ActiveSubmissionFlowItem } from '../../../../../../ui-components/index.js';
import { DefiComposerPhase, DefiComposerState } from '../../../../../../alt-model/defi/defi_form/index.js';
import { SubmissionItemPrompt } from '../../modal_molecules/submission_item_prompt/index.js';
import {
  SpendKeyGenerationStep,
  useSpendingKeyGenerationStep,
} from '../../modal_molecules/spending_key_generation_step_hooks/spending_key_generation_step_hooks.js';
import { ReportErrorButton } from '../../../../../../components/report_error_button/index.js';

interface DefiSubmissionStepsProps {
  composerState: DefiComposerState;
}

const steps = [
  { phase: DefiComposerPhase.GENERATING_KEY, label: 'Creating Spending Key' },
  { phase: DefiComposerPhase.CREATING_PROOF, label: 'Creating Proof' },
  { phase: DefiComposerPhase.SENDING_PROOF, label: 'Sending Proof' },
];

const labels = steps.map(x => x.label);

function getActiveItem(
  { phase, error }: DefiComposerState,
  spendKeyGenerationStep: SpendKeyGenerationStep,
): ActiveSubmissionFlowItem {
  if (error) {
    const idx = steps.findIndex(x => x.phase === error.phase);
    const expandedContent = (
      <SubmissionItemPrompt errored>
        {error.message}
        <ReportErrorButton error={error.raw} />
      </SubmissionItemPrompt>
    );
    return { idx, status: StepStatus.ERROR, expandedContent };
  }
  const idx = steps.findIndex(x => x.phase === phase);
  if (phase === DefiComposerPhase.GENERATING_KEY) {
    return { idx, ...spendKeyGenerationStep };
  }
  return { idx, status: StepStatus.RUNNING };
}

export function DefiSubmissionSteps({ composerState }: DefiSubmissionStepsProps) {
  const spendingKeyGenerationStep = useSpendingKeyGenerationStep();

  return <SubmissionFlow activeItem={getActiveItem(composerState, spendingKeyGenerationStep)} labels={labels} />;
}
