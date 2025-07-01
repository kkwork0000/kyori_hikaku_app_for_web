import fs from 'fs';
import path from 'path';
import type { Contact } from '@shared/schema';

// ログディレクトリの設定
const logsDir = path.join(process.cwd(), 'contact_logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  inquiryNumber: string;
}

// 問い合わせ内容をログファイルに記録する関数
export async function logContactSubmission(data: ContactFormData): Promise<boolean> {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      inquiryNumber: data.inquiryNumber,
      name: data.name,
      email: data.email,
      phone: data.phone || '未入力',
      subject: data.subject,
      message: data.message,
      status: 'new'
    };

    // 日付別のログファイル
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `contacts_${today}.json`);
    
    let contacts = [];
    if (fs.existsSync(logFile)) {
      const existingData = fs.readFileSync(logFile, 'utf8');
      contacts = JSON.parse(existingData);
    }
    
    contacts.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(contacts, null, 2));

    // 管理者へのメール通知テキストファイルも作成
    const emailContent = `
【新しい問い合わせ通知】

受信日時: ${timestamp}
お問い合わせ番号: ${data.inquiryNumber}
お名前: ${data.name}
メールアドレス: ${data.email}
電話番号: ${data.phone || '未入力'}
件名: ${data.subject}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
お問い合わせ内容:
${data.message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

この内容を kk.work00124@gmail.com にお送りください。
    `;

    const emailFile = path.join(logsDir, `email_${data.inquiryNumber}.txt`);
    fs.writeFileSync(emailFile, emailContent);

    console.log(`📧 新しい問い合わせを受信しました: ${data.inquiryNumber}`);
    console.log(`📁 ログファイル: ${logFile}`);
    console.log(`📄 メール送信用ファイル: ${emailFile}`);
    console.log(`✉️ kk.work00124@gmail.com に以下の内容をお送りください:`);
    console.log(emailContent);
    
    return true;
  } catch (error) {
    console.error('問い合わせログ記録エラー:', error);
    return false;
  }
}

// 自動返信のシミュレーション（実際にはメールを送信しません）
export async function createAutoReplyContent(data: ContactFormData): Promise<string> {
  return `
※このメールはシステムからの自動返信です

${data.name}様（←問い合わせフォームより引用）

お世話になっております。
お問い合わせありがとうございました。

以下の内容でお問い合わせを受け付けました。
担当者よりご連絡いたしますので今しばらくお待ちくださいませ。

（以下の内容は問い合わせフォームより引用）
━━━━━━□■□　お問い合わせ内容　□■□━━━━━━
お名前：${data.name}
E-Mail：${data.email}
電話番号：${data.phone || '未入力'}

お問い合わせ番号：${data.inquiryNumber}
お問い合わせ内容：${data.message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;
}

// 問い合わせ処理のメイン関数
export async function processContactSubmission(data: ContactFormData): Promise<{ logged: boolean; autoReplyContent: string }> {
  const logged = await logContactSubmission(data);
  const autoReplyContent = await createAutoReplyContent(data);

  return { logged, autoReplyContent };
}