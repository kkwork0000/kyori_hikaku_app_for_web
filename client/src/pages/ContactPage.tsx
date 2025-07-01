import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, User, Phone, MessageSquare, Check, Home } from "lucide-react";
import { Link } from "wouter";

// フォーム用のスキーマ
const contactFormSchema = z.object({
  name: z.string().min(1, "お名前は必須です"),
  email: z.string().email("正しいメールアドレスを入力してください"),
  phone: z.string().optional(),
  subject: z.string().min(1, "件名は必須です"),
  message: z.string().min(10, "お問い合わせ内容は10文字以上で入力してください"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const [step, setStep] = useState<"form" | "confirm" | "complete">("form");
  const [submittedData, setSubmittedData] = useState<ContactFormData | null>(null);
  const [inquiryNumber, setInquiryNumber] = useState<string>("");

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
      const response = await fetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "送信に失敗しました");
      }
      
      return await response.json();
    },
    onSuccess: (response: any) => {
      setInquiryNumber(response.inquiryNumber);
      setStep("complete");
    },
    onError: (error) => {
      console.error("Contact submission error:", error);
    },
  });

  const onSubmit = (data: ContactFormData) => {
    setSubmittedData(data);
    setStep("confirm");
  };

  const handleConfirmSubmit = () => {
    if (submittedData) {
      submitMutation.mutate(submittedData);
    }
  };

  const handleCancel = () => {
    setStep("form");
  };

  // 入力フォーム画面
  if (step === "form") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-5 w-5 mr-1" />
            トップページに戻る
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-blue-600" />
              お問い合わせフォーム
            </CardTitle>
            <p className="text-gray-600">
              ご質問やご要望がございましたら、以下のフォームからお気軽にお問い合わせください。
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        お名前（または社名） <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="田中太郎" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        メールアドレス <span className="text-red-500">*</span>
                      </FormLabel>
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
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        電話番号（任意）
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="03-1234-5678" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        件名 <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="お問い合わせの件名を入力してください" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        お問い合わせ内容 <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="お問い合わせ内容を詳しくご記入ください（10文字以上）"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" size="lg">
                  入力内容を確認する
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 確認画面
  if (step === "confirm" && submittedData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-5 w-5 mr-1" />
            トップページに戻る
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-6 w-6 text-green-600" />
              入力内容の確認
            </CardTitle>
            <p className="text-gray-600">
              以下の内容でお問い合わせを送信します。内容をご確認ください。
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <label className="font-medium text-gray-700">お名前</label>
                <p className="text-gray-900">{submittedData.name}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">メールアドレス</label>
                <p className="text-gray-900">{submittedData.email}</p>
              </div>
              {submittedData.phone && (
                <div>
                  <label className="font-medium text-gray-700">電話番号</label>
                  <p className="text-gray-900">{submittedData.phone}</p>
                </div>
              )}
              <div>
                <label className="font-medium text-gray-700">件名</label>
                <p className="text-gray-900">{submittedData.subject}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">お問い合わせ内容</label>
                <p className="text-gray-900 whitespace-pre-wrap">{submittedData.message}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
                disabled={submitMutation.isPending}
              >
                修正する
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
      </div>
    );
  }

  // 完了画面
  if (step === "complete") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              お問い合わせを受け付けました
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium text-blue-800">お問い合わせ番号</p>
              <p className="text-xl font-bold text-blue-900">{inquiryNumber}</p>
            </div>

            <div className="text-gray-600 space-y-2">
              <p>お問い合わせありがとうございました。</p>
              <p>
                入力いただいたメールアドレス宛に確認メールをお送りしました。
                <br />
                担当者よりご連絡いたしますので、今しばらくお待ちください。
              </p>
            </div>

            <Link href="/" className="inline-block">
              <Button className="flex items-center gap-2" size="lg">
                <Home className="h-5 w-5" />
                トップページに戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}