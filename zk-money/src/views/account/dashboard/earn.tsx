import { DefiInvestmentsSection } from '../../../components/defi_investments/defi_investments_section.js';
import { DefiCardsList } from './defi_cards_list.js';
import { DefiRecipe } from '../../../alt-model/defi/types.js';
import style from './earn.module.scss';

interface EarnProps {
  onOpenDefiEnterModal: (recipe: DefiRecipe) => void;
  onOpenDefiExitModal: (recipe: DefiRecipe) => void;
  isLoggedIn: boolean;
}

export function Earn(props: EarnProps) {
  const { onOpenDefiEnterModal, onOpenDefiExitModal, isLoggedIn } = props;
  return (
    <div className={style.earnWrapper}>
      <DefiCardsList onSelect={onOpenDefiEnterModal} isLoggedIn={isLoggedIn} />
      {isLoggedIn && <DefiInvestmentsSection onOpenDefiExitModal={onOpenDefiExitModal} />}
    </div>
  );
}
