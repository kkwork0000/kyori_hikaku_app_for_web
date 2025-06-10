import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
  const adContainerRef = useRef<HTMLDivElement>(null);

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
        <DialogTitle className="text-lg font-semibold text-text-primary text-center">
          月間利用制限に達しました
        </DialogTitle>
        <div className="text-center p-2">
          <p className="text-text-secondary text-sm mb-6">
            継続して利用するには、以下の広告を視聴してください。
          </p>
          
          {/* 利用制限適用時の広告表示エリア */}
          <div 
            ref={adContainerRef}
            className="bg-white border border-gray-200 rounded-lg p-4 mb-4 min-h-[200px] flex items-center justify-center"
            id="zucks-ad-container"
            dangerouslySetInnerHTML={{
              __html: '<script type="text/javascript" src="https://j.zucks.net.zimg.jp/j?f=693608"></script>'
            }}
          >
          </div>
          
          {/* カウントダウン表示 */}
          <div className="mb-4">
            {isCountdownActive ? (
              <div className="space-y-2 text-gray-500">
                <Play className="h-8 w-8 mx-auto text-primary" />
                <p className="text-sm">広告表示中...</p>
                <p className="text-xs">残り {countdown}秒</p>
              </div>
            ) : (
              <div className="space-y-2 text-gray-500">
                <p className="text-sm font-medium">広告視聴完了</p>
                <p className="text-xs text-green-600">継続利用が可能になりました</p>
              </div>
            )}
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
