import { BackButton } from '../../../../../ui-components/index.js';
import { DefiRecipe } from '../../../../../alt-model/defi/types.js';
import { CloseButtonWhite, CardAssetTag, CardTag } from '../../../../../components/index.js';
import style from './defi_modal_header.module.scss';

interface DefiModalHeaderProps {
  recipe: DefiRecipe;
  closeDisabled: boolean;
  onClose: () => void;
  onBack?: () => void;
  onForward?: () => void;
}

export function DefiModalHeader({ recipe, onClose, closeDisabled, onBack }: DefiModalHeaderProps) {
  const { logo, cardTag, flow } = recipe;
  return (
    <div className={style.root}>
      <div className={style.leftSegment}>
        {onBack && (
          <div className={style.navButtons}>
            <BackButton disabled={!onBack} onClick={onBack} />
          </div>
        )}
        <img alt={`${recipe.name} logo`} className={style.logo} src={logo} />
      </div>
      <div className={style.rightSegment}>
        <div className={style.tags}>
          <CardTag>{cardTag}</CardTag>
          <CardAssetTag asset={flow.enter.inA} />
        </div>
        <CloseButtonWhite disabled={closeDisabled} onClick={onClose} />
      </div>
    </div>
  );
}
