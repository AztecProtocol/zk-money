import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { bindStyle } from '../../util/classnames.js';
import style from './link.module.scss';

const cx = bindStyle(style);

interface LinkProps {
  className?: string;
  to?: string;
  href?: string;
  target?: '_blank';
  onClick?: () => void;
  children: React.ReactNode;
}

export const Link: React.FunctionComponent<LinkProps> = ({ className, to, href, target, onClick, children }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement, MouseEvent>) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  if (to) {
    return (
      <RouterLink className={className} to={to} onClick={handleClick}>
        {children}
      </RouterLink>
    );
  }

  if (href) {
    return (
      <a className={className} href={href} target={target} onClick={handleClick}>
        {children}
      </a>
    );
  }

  return (
    <div className={cx(style.link, className)} onClick={handleClick}>
      {children}
    </div>
  );
};
