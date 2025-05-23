// Generate or retrieve user ID
export function getUserId(): string {
  let userId = localStorage.getItem('distanceAppUserId');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('distanceAppUserId', userId);
  }
  return userId;
}

// Get current month string in MM_YYYY format
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getMonth() + 1}_${now.getFullYear()}`;
}

// Get user usage count for current month
export function getUserUsage(userId: string, month: string): number {
  const key = `usage_${month}_${userId}`;
  return parseInt(localStorage.getItem(key) || '0');
}

// Update user usage count
export function updateUserUsage(userId: string, month: string): void {
  const currentUsage = getUserUsage(userId, month);
  const newUsage = currentUsage + 1;
  const key = `usage_${month}_${userId}`;
  localStorage.setItem(key, newUsage.toString());
  
  // Also update server-side
  fetch('/api/usage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      month,
      usageCount: newUsage,
    }),
  }).catch(console.error);
}

// Check if user has exceeded monthly limit
export function hasExceededLimit(userId: string, month: string): boolean {
  return getUserUsage(userId, month) >= 3;
}
