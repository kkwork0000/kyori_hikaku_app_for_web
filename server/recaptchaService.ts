interface RecaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  score?: number;
  action?: string;
  "error-codes"?: string[];
}

export async function verifyRecaptcha(token: string, remoteip?: string): Promise<boolean> {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY is not configured");
      return false;
    }

    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', token);
    if (remoteip) {
      params.append('remoteip', remoteip);
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      console.error("reCAPTCHA API request failed:", response.status);
      return false;
    }

    const data: RecaptchaResponse = await response.json();
    
    if (!data.success) {
      console.error("reCAPTCHA verification failed:", data["error-codes"]);
      return false;
    }

    // reCAPTCHA v3では、スコアが0.5以上であることを確認
    if (data.score !== undefined && data.score < 0.5) {
      console.warn("reCAPTCHA score too low:", data.score);
      return false;
    }

    console.log("✅ reCAPTCHA verification passed", { score: data.score });
    return true;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}