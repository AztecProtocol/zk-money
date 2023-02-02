import type { DefiRecipe } from '../../alt-model/defi/types.js';
import { useState } from 'react';
import { Pagination } from '../index.js';
import { DefiInvestmentRow } from './defi_investment_row/index.js';
import { DefiPosition } from '../../alt-model/defi/open_position_hooks.js';
import style from './defi_investments.module.scss';

const INVESTMENTS_PER_PAGE = 5;

function getKey(position: DefiPosition) {
  if (position.type === 'sync-open') return `interactable-${position.handleValue.assetId}`;
  else return `non-interactable-${position.tx.txId.toString()}`;
}

interface DefiInvestmentsProps {
  onOpenDefiExitModal: (recipe: DefiRecipe) => void;
  positions: DefiPosition[] | undefined;
}

export function DefiInvestments(props: DefiInvestmentsProps) {
  const [page, setPage] = useState(1);
  const { positions } = props;

  if (!positions) return <></>;
  if (!positions.length) return <div className={style.noHoldings}>You haven't made any investments yet</div>;

  return (
    <>
      {positions?.slice((page - 1) * INVESTMENTS_PER_PAGE, page * INVESTMENTS_PER_PAGE).map(position => (
        <DefiInvestmentRow key={getKey(position)} position={position} onOpenDefiExitModal={props.onOpenDefiExitModal} />
      ))}
      <Pagination
        totalItems={positions.length}
        itemsPerPage={INVESTMENTS_PER_PAGE}
        page={page}
        onChangePage={setPage}
      />
    </>
  );
}
