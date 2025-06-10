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
        
        // Hide close button initially
        closeBtn.style.display = 'none';
        
        // Show close button after 5 seconds
        const timer = setTimeout(() => {
          closeBtn.style.display = 'flex';
        }, 5000);

        const handleClose = () => {
          onComplete();
        };

        closeBtn.addEventListener('click', handleClose);
        modalBackdrop.addEventListener('click', onClose);

        return () => {
          clearTimeout(timer);
          closeBtn.removeEventListener('click', handleClose);
          modalBackdrop.removeEventListener('click', onClose);
        };
      } else {
        modalContainer.style.display = 'none';
        modalBackdrop.style.display = 'none';
        closeBtn.style.display = 'none';
      }
    }
  }, [isOpen, onClose, onComplete]);

  // This component doesn't render anything directly since the modal is in HTML
  return null;
}