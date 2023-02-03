import { Retryable } from '../../../../../../app/util/promises/retryable.js';
import { Button } from '../../../../../../ui-components/index.js';

interface RetrySigningButtonProps {
  signingRetryable: Retryable<unknown>;
  disabled: boolean;
}

const WARNING_TEXT =
  'You should only request another signature from your wallet if you are confident that the previous request has been lost for good. This could occur for some wallets on an unstable network connection. Continue?';

export function RetrySigningButton(props: RetrySigningButtonProps) {
  const handleClick = () => {
    const confirmed = window.confirm(WARNING_TEXT);
    if (confirmed) props.signingRetryable.retry();
  };
  return <Button text="Try Signing Again" onClick={handleClick} disabled={props.disabled} />;
}
