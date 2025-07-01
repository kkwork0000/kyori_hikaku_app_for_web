import nodemailer from 'nodemailer';
import type { Contact } from '@shared/schema';

// メール送信設定（Gmail SMTP使用）
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'kk.work00124@gmail.com',
      pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD
    }
  });
};

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  inquiryNumber: string;
}

export async function sendContactNotification(data: ContactFormData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    // 管理者宛通知メール
    const adminMailOptions = {
      from: process.env.EMAIL_USER || 'kk.work00124@gmail.com',
      to: 'kk.work00124@gmail.com',
      subject: `【問い合わせ通知】${data.subject}`,
      html: `
        <h2>新しい問い合わせが届きました</h2>
        <div style="border: 1px solid #ddd; padding: 20px; margin: 10px 0;">
          <h3>問い合わせ詳細</h3>
          <p><strong>お問い合わせ番号:</strong> ${data.inquiryNumber}</p>
          <p><strong>お名前:</strong> ${data.name}</p>
          <p><strong>メールアドレス:</strong> ${data.email}</p>
          <p><strong>電話番号:</strong> ${data.phone || '未入力'}</p>
          <p><strong>件名:</strong> ${data.subject}</p>
          <h4>お問い合わせ内容:</h4>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
            ${data.message.replace(/\n/g, '<br>')}
          </div>
        </div>
      `
    };

    await transporter.sendMail(adminMailOptions);
    return true;
  } catch (error) {
    console.error('管理者宛メール送信エラー:', error);
    return false;
  }
}

export async function sendAutoReplyEmail(data: ContactFormData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    // 自動返信メール
    const autoReplyOptions = {
      from: process.env.EMAIL_USER || 'kk.work00124@gmail.com',
      to: data.email,
      subject: 'お問い合わせ完了のお知らせ',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p>※このメールはシステムからの自動返信です</p>
          
          <p>${data.name}様（←問い合わせフォームより引用）</p>
          
          <p>お世話になっております。<br>
          お問い合わせありがとうございました。</p>
          
          <p>以下の内容でお問い合わせを受け付けました。<br>
          担当者よりご連絡いたしますので今しばらくお待ちくださいませ。</p>
          
          <p>（以下の内容は問い合わせフォームより引用）</p>
          <div style="border: 2px solid #333; padding: 20px; margin: 20px 0;">
            <h3 style="text-align: center; margin: 0 0 20px 0;">━━━━━━□■□　お問い合わせ内容　□■□━━━━━━</h3>
            <p><strong>お名前：</strong>${data.name}</p>
            <p><strong>E-Mail：</strong>${data.email}</p>
            <p><strong>電話番号：</strong>${data.phone || '未入力'}</p>
            <p><strong>お問い合わせ番号：</strong>${data.inquiryNumber}</p>
            <p><strong>お問い合わせ内容：</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 10px;">
              ${data.message.replace(/\n/g, '<br>')}
            </div>
            <p style="text-align: center; margin: 20px 0 0 0;">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(autoReplyOptions);
    return true;
  } catch (error) {
    console.error('自動返信メール送信エラー:', error);
    return false;
  }
}

// 両方のメールを送信する関数
export async function sendContactEmails(data: ContactFormData): Promise<{ adminSent: boolean; autoReplySent: boolean }> {
  const [adminSent, autoReplySent] = await Promise.all([
    sendContactNotification(data),
    sendAutoReplyEmail(data)
  ]);

  return { adminSent, autoReplySent };
}