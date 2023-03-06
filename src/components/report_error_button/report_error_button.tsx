import { useState } from 'react';
import { confirmAndSendErrorReport, formatError } from '../../alt-model/errors/error_utils.js';
import { useSdk } from '../../alt-model/top_level_context/top_level_context_hooks.js';
import { Button, ButtonSize, ButtonTheme } from '../../ui-components/index.js';
import style from './report_error_button.module.scss';

interface ReportErrorButtonProps {
  error: unknown;
}

export function ReportErrorButton(props: ReportErrorButtonProps) {
  const sdk = useSdk();
  const [sent, setSent] = useState(false);
  const handleSend = () => {
    if (sent || !sdk) return;
    const confirmedAndSent = confirmAndSendErrorReport(sdk, formatError(props.error) ?? '');
    setSent(confirmedAndSent);
  };
  return (
    <Button
      className={style.button}
      theme={ButtonTheme.Primary}
      size={ButtonSize.Small}
      text={sent ? 'Error report sent' : 'Send error report'}
      onClick={handleSend}
      disabled={sent}
    />
  );
}
