import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, Check } from "lucide-react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface ContactFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  recaptcha?: string;
}

const steps = {
  INPUT: 'input',
  CONFIRM: 'confirm',
  COMPLETE: 'complete'
} as const;

type Step = typeof steps[keyof typeof steps];

export default function Contact() {
  const [currentStep, setCurrentStep] = useState<Step>(steps.INPUT);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [inquiryNumber, setInquiryNumber] = useState<string>('');
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { toast } = useToast();

  // Get reCAPTCHA site key
  const { data: recaptchaConfig } = useQuery({
    queryKey: ['/api/recaptcha-config'],
    retry: false,
  }) as { data: { siteKey?: string } | undefined };

  const validateForm = (): boolean => {
    const newErrors: ContactFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'お名前または社名を入力してください';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '正しいメールアドレス形式で入力してください';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = '件名を入力してください';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'お問い合わせ内容を入力してください';
    }

    // reCAPTCHA v3では自動でトークンを生成するため、手動チェックは不要

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      if (!executeRecaptcha) {
        throw new Error('reCAPTCHAが初期化されていません');
      }

      const recaptchaToken = await executeRecaptcha('contact_form');
      
      const response = await apiRequest('POST', '/api/contacts', { ...data, recaptchaToken });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setInquiryNumber(data.inquiryNumber);
      setCurrentStep(steps.COMPLETE);
      toast({
        title: "送信完了",
        description: "お問い合わせを受け付けました。",
      });
    },
    onError: (error) => {
      toast({
        title: "送信エラー",
        description: "お問い合わせの送信に失敗しました。しばらく後にもう一度お試しください。",
        variant: "destructive",
      });
      console.error('Contact form error:', error);
    },
  });

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      setCurrentStep(steps.CONFIRM);
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate(formData);
  };

  const handleBack = () => {
    setCurrentStep(steps.INPUT);
  };

  const renderInputStep = () => (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">お名前または社名 *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="山田太郎"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="example@email.com"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">電話番号（任意）</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="090-1234-5678"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">件名 *</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            placeholder="お問い合わせの件名"
            className={errors.subject ? "border-red-500" : ""}
          />
          {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">お問い合わせ内容 *</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="お問い合わせ内容をご記入ください"
            rows={6}
            className={errors.message ? "border-red-500" : ""}
          />
          {errors.message && <p className="text-sm text-red-500">{errors.message}</p>}
        </div>

        {/* reCAPTCHA v3は背景で自動実行されるため、ユーザーが見えるコンポーネントは不要 */}
      </div>

      <div className="flex gap-4">
        <Link href="/">
          <Button variant="outline" className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
        </Link>
        <Button onClick={handleNext} className="flex-1">
          確認画面へ
        </Button>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="font-semibold">お名前または社名</Label>
            <p className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">{formData.name}</p>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">メールアドレス</Label>
            <p className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">{formData.email}</p>
          </div>

          {formData.phone && (
            <div className="space-y-2">
              <Label className="font-semibold">電話番号</Label>
              <p className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">{formData.phone}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="font-semibold">件名</Label>
            <p className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">{formData.subject}</p>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">お問い合わせ内容</Label>
            <p className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md whitespace-pre-wrap">{formData.message}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={handleBack} className="flex-1">
          修正する
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="flex-1"
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? (
            "送信中..."
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              送信する
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
          送信完了
        </h2>
        <p className="text-lg">
          お問い合わせを受け付けました。
        </p>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="font-semibold">お問い合わせ番号</p>
          <p className="text-xl font-mono">{inquiryNumber}</p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          内容を確認次第、ご連絡いたします。<br />
          お問い合わせ番号は控えておいてください。
        </p>
      </div>

      <Link href="/">
        <Button className="w-full">
          ホームに戻る
        </Button>
      </Link>
    </div>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case steps.INPUT:
        return 'お問い合わせフォーム';
      case steps.CONFIRM:
        return 'お問い合わせ内容確認';
      case steps.COMPLETE:
        return 'お問い合わせ完了';
      default:
        return 'お問い合わせ';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {getStepTitle()}
            </CardTitle>
            {currentStep !== steps.COMPLETE && (
              <div className="flex justify-center mt-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep === steps.INPUT 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white'
                  }`}>
                    1
                  </div>
                  <div className={`w-12 h-0.5 ${
                    currentStep === steps.CONFIRM ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep === steps.CONFIRM 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    2
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {currentStep === steps.INPUT && renderInputStep()}
            {currentStep === steps.CONFIRM && renderConfirmStep()}
            {currentStep === steps.COMPLETE && renderCompleteStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}