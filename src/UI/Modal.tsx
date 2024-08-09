import { useEffect, useState } from 'react';
import './Modal.css';

interface PropsModal {
  children: React.ReactNode;
  showModal?: Boolean;
  onClose?: () => void;
}
export const Modal: React.FC<PropsModal> = ({ children, showModal }) => {
  const [show, setShow] = useState<Boolean>(!showModal);

  useEffect(() => {
    setShow(!showModal);
  }, [showModal]);
  return (
    <div className={show ? 'active' : 'modal'} onClick={() => setShow(false)}>
      {children}
    </div>
  );
};
