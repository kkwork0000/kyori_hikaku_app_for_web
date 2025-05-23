import DistanceForm from "@/components/DistanceForm";
import { getUserId, getCurrentMonth, getUserUsage } from "@/lib/userTracking";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";

export default function HomePage() {
  const userId = getUserId();
  const currentMonth = getCurrentMonth();

  const { data: usageData } = useQuery({
    queryKey: ["/api/usage", userId, currentMonth],
    queryFn: async () => {
      const response = await fetch(`/api/usage/${userId}/${currentMonth}`);
      if (!response.ok) throw new Error("Failed to fetch usage data");
      return response.json();
    },
  });

  const remainingUses = Math.max(0, 3 - (usageData?.usageCount || 0));

  return (
    <div className="space-y-6">
      <DistanceForm />
      
      {/* Usage Limit Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">利用制限について</h4>
            <p className="text-sm text-yellow-700">
              今月の残り利用回数: <span className="font-semibold">{remainingUses}回</span><br />
              制限に達した場合は広告視聴で継続利用できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
