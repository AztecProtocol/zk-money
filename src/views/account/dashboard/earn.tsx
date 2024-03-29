import { DefiInvestmentsSection } from '../../../components/defi_investments/defi_investments_section.js';
import { DefiRecipe } from '../../../alt-model/defi/types.js';
import style from './earn.module.scss';

interface EarnProps {
  onOpenDefiEnterModal: (recipe: DefiRecipe) => void;
  onOpenDefiExitModal: (recipe: DefiRecipe) => void;
  isLoggedIn: boolean;
}

export function Earn(props: EarnProps) {
  const { onOpenDefiExitModal, isLoggedIn } = props;
  return (
    <div className={style.earnWrapper}>
      {isLoggedIn && <DefiInvestmentsSection onOpenDefiExitModal={onOpenDefiExitModal} />}
    </div>
  );
}
