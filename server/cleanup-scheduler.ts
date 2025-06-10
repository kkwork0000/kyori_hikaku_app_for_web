import { storage } from './storage';

/**
 * データベースクリーンアップスケジューラー
 * 3ヶ月以上古いデータを定期的に削除
 */
class CleanupScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24時間（ミリ秒）

  /**
   * スケジューラーを開始
   */
  start(): void {
    if (this.intervalId) {
      console.log('Cleanup scheduler is already running');
      return;
    }

    console.log('Starting automated cleanup scheduler (24-hour interval)');
    
    // 初回実行（起動後5分後）
    setTimeout(() => {
      this.executeCleanup();
    }, 5 * 60 * 1000);

    // 定期実行（24時間毎）
    this.intervalId = setInterval(() => {
      this.executeCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * スケジューラーを停止
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Cleanup scheduler stopped');
    }
  }

  /**
   * クリーンアップを実行
   */
  private async executeCleanup(): Promise<void> {
    try {
      console.log('Starting automated database cleanup...');
      
      // 削除前の統計を取得
      const statsBefore = await storage.getOldDataStats();
      console.log('Data before cleanup:', {
        totalUserUsage: statsBefore.totalUserUsageCount,
        totalDistanceQuery: statsBefore.totalDistanceQueryCount,
        oldUserUsage: statsBefore.oldUserUsageCount,
        oldDistanceQuery: statsBefore.oldDistanceQueryCount
      });

      // クリーンアップ実行
      const [userUsageResult, distanceQueryResult] = await Promise.all([
        storage.cleanupOldUserUsage(),
        storage.cleanupOldDistanceQueries()
      ]);

      // 削除後の統計を取得
      const statsAfter = await storage.getOldDataStats();
      
      console.log('Automated cleanup completed:', {
        userUsageDeleted: userUsageResult.deletedCount,
        distanceQueryDeleted: distanceQueryResult.deletedCount,
        totalDeleted: userUsageResult.deletedCount + distanceQueryResult.deletedCount,
        remainingUserUsage: statsAfter.totalUserUsageCount,
        remainingDistanceQuery: statsAfter.totalDistanceQueryCount
      });

      // クリーンアップが実行された場合はログに記録
      if (userUsageResult.deletedCount > 0 || distanceQueryResult.deletedCount > 0) {
        console.log(`✅ Database cleanup completed: ${userUsageResult.deletedCount + distanceQueryResult.deletedCount} records deleted`);
      } else {
        console.log('✅ Database cleanup completed: No old data to clean');
      }

    } catch (error) {
      console.error('❌ Automated cleanup failed:', error);
    }
  }

  /**
   * 手動クリーンアップ実行（管理画面用）
   */
  async manualCleanup(): Promise<{
    success: boolean;
    userUsageDeleted: number;
    distanceQueryDeleted: number;
    totalDeleted: number;
    error?: string;
  }> {
    try {
      console.log('Starting manual database cleanup...');
      
      const [userUsageResult, distanceQueryResult] = await Promise.all([
        storage.cleanupOldUserUsage(),
        storage.cleanupOldDistanceQueries()
      ]);

      const totalDeleted = userUsageResult.deletedCount + distanceQueryResult.deletedCount;
      
      console.log('Manual cleanup completed:', {
        userUsageDeleted: userUsageResult.deletedCount,
        distanceQueryDeleted: distanceQueryResult.deletedCount,
        totalDeleted
      });

      return {
        success: true,
        userUsageDeleted: userUsageResult.deletedCount,
        distanceQueryDeleted: distanceQueryResult.deletedCount,
        totalDeleted
      };

    } catch (error) {
      console.error('Manual cleanup failed:', error);
      return {
        success: false,
        userUsageDeleted: 0,
        distanceQueryDeleted: 0,
        totalDeleted: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * スケジューラーの状態を取得
   */
  getStatus(): { isRunning: boolean; nextCleanup: string | null } {
    return {
      isRunning: this.intervalId !== null,
      nextCleanup: this.intervalId ? new Date(Date.now() + this.CLEANUP_INTERVAL).toISOString() : null
    };
  }
}

export const cleanupScheduler = new CleanupScheduler();