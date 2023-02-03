import React, { useEffect } from 'react';
import { default as styled } from 'styled-components';
import closeIcon from '../images/close.svg';
import closeIconWhite from '../images/close_white.svg';
import { Theme } from '../ui-components/index.js';
import { spacings } from '../ui-components/styles/layout.js';
import { Overlay } from './overlay.js';
import { Text } from './text.js';

const Header = styled.div`
  display: flex;
  align-items: flex-start;
`;

const TitleRoot = styled.div`
  flex: 1;
  padding-right: ${spacings.s};
`;

const Title = styled(Text)`
  display: inline-block;
`;

const CloseButton = styled.div`
  flex-shrink: 0;
  padding: ${spacings.xs};
  cursor: pointer;
`;

const ModalWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 950px;
  overflow-y: auto;
`;

interface ModalHeaderProps {
  theme?: Theme;
  title?: string | React.ReactNode;
  onClose?: () => void;
}

interface ModalProps extends ModalHeaderProps {
  children: React.ReactElement;
  noPadding?: boolean;
  className?: string;
}

export const ModalHeader: React.FunctionComponent<ModalHeaderProps> = ({ theme, title, onClose }) => (
  <Header>
    {!!title && (
      <TitleRoot>
        <Title color={theme === Theme.WHITE ? 'gradient' : 'white'} size="xl">
          {title}
        </Title>
      </TitleRoot>
    )}
    {!!onClose && (
      <CloseButton onClick={onClose}>
        <img src={theme === Theme.GRADIENT ? closeIconWhite : closeIcon} alt="close" width={40} />
      </CloseButton>
    )}
  </Header>
);

export const Modal: React.FunctionComponent<ModalProps> = props => {
  useEffect(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollBlocker = () => {
      window.scrollTo(scrollLeft, scrollTop);
    };
    window.addEventListener('scroll', scrollBlocker);
    return () => window.removeEventListener('scroll', scrollBlocker);
  }, []);

  const { onClose } = props;
  useEffect(() => {
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!props.children) return <></>;

  return (
    <Overlay>
      <ModalWrapper className={props.className}>{React.cloneElement(props.children, { inModal: true })}</ModalWrapper>
    </Overlay>
  );
};
