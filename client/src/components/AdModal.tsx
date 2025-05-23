import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function AdModal({ isOpen, onClose, onComplete }: AdModalProps) {
  const [countdown, setCountdown] = useState(30);
  const [isCountdownActive, setIsCountdownActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCountdown(30);
      setIsCountdownActive(true);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isCountdownActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsCountdownActive(false);
    }

    return () => clearInterval(interval);
  }, [isCountdownActive, countdown]);

  const handleComplete = () => {
    onComplete();
    setIsCountdownActive(false);
    setCountdown(30);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <div className="text-center p-2">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            月間利用制限に達しました
          </h3>
          <p className="text-text-secondary text-sm mb-6">
            継続して利用するには、以下の広告を視聴してください。
          </p>
          
          {/* Video Ad Placeholder */}
          <div className="bg-gray-200 rounded-lg p-8 mb-4 text-center">
            <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-500 text-sm">動画広告 (30秒)</div>
            <div className="text-primary font-semibold text-2xl mt-2">
              {countdown}
            </div>
          </div>
          
          <Button
            onClick={handleComplete}
            disabled={countdown > 0}
            className="w-full py-3"
          >
            {countdown > 0 ? `${countdown}秒後に閉じられます` : "広告を閉じて続行"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
