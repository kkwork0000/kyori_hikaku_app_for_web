import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface TravelModeChangeConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  newTravelMode: string;
}

export default function TravelModeChangeConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  newTravelMode
}: TravelModeChangeConfirmDialogProps) {
  const getTravelModeText = (mode: string) => {
    switch (mode) {
      case 'driving': return '車';
      case 'walking': return '徒歩';
      case 'bicycling': return '自転車';
      case 'transit': return '公共交通機関';
      default: return mode;
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>移動手段の変更確認</AlertDialogTitle>
          <AlertDialogDescription>
            現在、いくつかの目的地にはカスタムルート設定が適用されています。
            移動手段を「{getTravelModeText(newTravelMode)}」に変更すると、これらの設定はすべて解除されます。
            よろしいですか？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
            変更する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}