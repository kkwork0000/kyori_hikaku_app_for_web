import { Lightbulb } from "lucide-react";

export default function HowToPage() {
  const steps = [
    {
      title: "1. 出発地を入力",
      description: "まず、出発地となる場所を入力してください。住所、施設名、駅名などが利用できます。"
    },
    {
      title: "2. 目的地を追加",
      description: "比較したい目的地を最大5箇所まで追加できます。「目的地を追加」ボタンで入力欄を増やせます。"
    },
    {
      title: "3. 移動手段を選択",
      description: "車、徒歩、公共交通機関、自転車から移動手段を選択してください。"
    },
    {
      title: "4. 結果を比較",
      description: "「距離と時間を比較」ボタンを押すと、各目的地への距離と所要時間が表示されます。"
    },
    {
      title: "5. 目的地を決定",
      description: "「この場所に決定」ボタンを押すと、その場所をナビゲーション先としたGoogleマップが開きます。"
    }
  ];

  const features = [
    "比較結果をコピーしてスプレッドシートに貼り付けできます",
    "月3回まで無料で利用できます",
    "制限後は広告視聴で継続利用可能です"
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-text-primary mb-6">使い方</h2>
      
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="border-l-4 border-primary pl-4">
            <h3 className="font-semibold text-text-primary mb-2">{step.title}</h3>
            <p className="text-text-secondary text-sm">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          便利な機能
        </h4>
        <ul className="text-sm text-text-secondary space-y-1">
          {features.map((feature, index) => (
            <li key={index}>• {feature}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
