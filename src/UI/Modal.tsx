import { CSSProperties, useEffect, useState } from 'react';
import './Modal.css';

interface PropsModal {
  children: React.ReactNode;
  showModal: Boolean;
  style: {
    position?: string;
    left?: number | string;
    top?: number | string;
    width?: number;
    height?: number;
  };
}
export const Modal: React.FC<PropsModal> = ({ children, showModal, style }) => {
  const [show, setShow] = useState<Boolean>(showModal);

  useEffect(() => {
    setShow(showModal);
  }, [showModal]);
  return (
    <div className={show ? 'active' : 'modal'} style={style as CSSProperties}>
      {children}
    </div>
  );
};
