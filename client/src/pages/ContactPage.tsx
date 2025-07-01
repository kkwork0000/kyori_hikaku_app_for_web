import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ArrowRight, Check, Home } from "lucide-react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const contactFormSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  email: z.string().email("正しいメールアドレスを入力してください"),
  phone: z.string().optional(),
  subject: z.string().min(1, "件名は必須です"),
  message: z.string().min(10, "問い合わせ内容は10文字以上で入力してください"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

type ContactStep = "input" | "confirm" | "complete";

interface ContactResponse {
  success: boolean;
  inquiryNumber: string;
}

export default function ContactPage() {
  const [currentStep, setCurrentStep] = useState<ContactStep>("input");
  const [submittedData, setSubmittedData] = useState<ContactFormData | null>(null);
  const [inquiryNumber, setInquiryNumber] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return await response.json() as ContactResponse;
    },
    onSuccess: (response) => {
      setInquiryNumber(response.inquiryNumber);
      setCurrentStep("complete");
      toast({
        title: "送信完了",
        description: "お問い合わせを受け付けました。",
      });
    },
    onError: (error) => {
      toast({
        title: "送信エラー",
        description: "お問い合わせの送信に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
      console.error("Contact form error:", error);
    },
  });

  const handleInputNext = (data: ContactFormData) => {
    setSubmittedData(data);
    setCurrentStep("confirm");
  };

  const handleConfirmSubmit = () => {
    if (submittedData) {
      submitMutation.mutate(submittedData);
    }
  };

  const handleBack = () => {
    setCurrentStep("input");
  };

  const handleCancel = () => {
    setCurrentStep("input");
    setSubmittedData(null);
  };

  const renderInputForm = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">お問い合わせフォーム</CardTitle>
        <p className="text-center text-gray-600">
          ご不明な点やご質問がございましたら、お気軽にお問い合わせください。
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleInputNext)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>お名前（または社名）<span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="山田太郎" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス<span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="example@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>電話番号（任意）</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="090-1234-5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>件名<span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="お問い合わせの件名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>お問い合わせ内容<span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="お問い合わせ内容を詳しくお書きください"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" size="lg">
              確認画面へ進む
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderConfirmForm = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">入力内容の確認</CardTitle>
        <p className="text-center text-gray-600">
          以下の内容で送信してよろしいですか？
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700">お名前</h3>
            <p className="text-gray-900">{submittedData?.name}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">メールアドレス</h3>
            <p className="text-gray-900">{submittedData?.email}</p>
          </div>
          {submittedData?.phone && (
            <div>
              <h3 className="font-semibold text-gray-700">電話番号</h3>
              <p className="text-gray-900">{submittedData.phone}</p>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-700">件名</h3>
            <p className="text-gray-900">{submittedData?.subject}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">お問い合わせ内容</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{submittedData?.message}</p>
          </div>
        </div>
        
        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={handleBack} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <Button 
            onClick={handleConfirmSubmit} 
            className="flex-1"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? "送信中..." : "送信する"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompleteForm = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-green-600">
          <Check className="mx-auto h-8 w-8 mb-2" />
          送信完了
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-600">
          お問い合わせを受け付けました。<br />
          ご連絡いただきありがとうございます。
        </p>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">お問い合わせ番号</h3>
          <p className="text-lg font-mono text-blue-600">{inquiryNumber}</p>
          <p className="text-sm text-gray-500 mt-2">
            ※お問い合わせの際は、この番号をお知らせください
          </p>
        </div>
        <p className="text-gray-600">
          内容を確認次第、入力いただいたメールアドレスへご連絡いたします。<br />
          お急ぎの場合は、お問い合わせ番号をお知らせの上、直接ご連絡ください。
        </p>
        <Link href="/">
          <Button className="w-full" size="lg">
            <Home className="mr-2 h-4 w-4" />
            トップページに戻る
          </Button>
        </Link>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto">
        {currentStep === "input" && renderInputForm()}
        {currentStep === "confirm" && renderConfirmForm()}
        {currentStep === "complete" && renderCompleteForm()}
      </div>
    </div>
  );
}