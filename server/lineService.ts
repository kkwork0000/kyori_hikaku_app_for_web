interface LineMessage {
  type: "text";
  text: string;
}

interface LinePayload {
  to?: string;
  messages: LineMessage[];
}

export interface ContactNotificationData {
  inquiryNumber: string;
  name: string;
  email: string;
  subject: string;
  createdAt: Date;
}

export async function sendLineNotification(data: ContactNotificationData): Promise<boolean> {
  try {
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error("LINE_CHANNEL_ACCESS_TOKEN is not configured");
      return false;
    }

    const message = `【新しいお問い合わせ】
問い合わせ番号: ${data.inquiryNumber}
日時: ${data.createdAt.toLocaleString('ja-JP')}
お名前: ${data.name}
件名: ${data.subject}
メールアドレス: ${data.email}

管理画面で詳細を確認してください。`;

    const payload: LinePayload = {
      messages: [
        {
          type: "text",
          text: message
        }
      ]
    };

    // LINE Messaging APIを使用してプッシュメッセージを送信
    // 実際のユーザーIDが必要ですが、今回はブロードキャストAPIを使用
    const response = await fetch("https://api.line.me/v2/bot/message/broadcast", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LINE API Error:", response.status, errorText);
      return false;
    }

    console.log("✅ LINE notification sent successfully");
    return true;
  } catch (error) {
    console.error("Failed to send LINE notification:", error);
    return false;
  }
}

export async function verifyLineWebhook(body: string, signature: string): Promise<boolean> {
  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    if (!channelSecret) {
      return false;
    }

    const crypto = require("crypto");
    const hash = crypto
      .createHmac("SHA256", channelSecret)
      .update(body)
      .digest("base64");

    return hash === signature;
  } catch (error) {
    console.error("LINE webhook verification failed:", error);
    return false;
  }
}