import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import { BackIcon, CloseMiniIcon, ForwardIcon } from '../icons/index.js';
import style from './icon_buttons.module.css';

type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

export function CloseMiniButton(props: ButtonProps) {
  return (
    <button {...props} className={style.iconButton}>
      <CloseMiniIcon />
    </button>
  );
}

export function BackButton(props: ButtonProps) {
  return (
    <button {...props} className={style.iconButton}>
      <BackIcon />
    </button>
  );
}

export function ForwardButton(props: ButtonProps) {
  return (
    <button {...props} className={style.iconButton}>
      <ForwardIcon />
    </button>
  );
}
