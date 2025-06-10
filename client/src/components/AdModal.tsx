import { useEffect } from "react";

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function AdModal({ isOpen, onClose, onComplete }: AdModalProps) {
  useEffect(() => {
    const modalContainer = document.getElementById('modal-ad-container');
    const modalBackdrop = document.getElementById('modal-ad-backdrop');
    const closeBtn = document.getElementById('modal-ad-close-btn');

    if (modalContainer && modalBackdrop && closeBtn) {
      if (isOpen) {
        modalContainer.style.display = 'block';
        modalBackdrop.style.display = 'block';
      } else {
        modalContainer.style.display = 'none';
        modalBackdrop.style.display = 'none';
      }

      const handleClose = () => {
        onComplete();
      };

      closeBtn.addEventListener('click', handleClose);
      modalBackdrop.addEventListener('click', onClose);

      return () => {
        closeBtn.removeEventListener('click', handleClose);
        modalBackdrop.removeEventListener('click', onClose);
      };
    }
  }, [isOpen, onClose, onComplete]);

  // This component doesn't render anything directly since the modal is in HTML
  return null;
}