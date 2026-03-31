/**
 * Backup Service
 * خدمة النسخ الاحتياطي
 *
 * Handles automated and manual backups for:
 * - PostgreSQL database
 * - Uploaded files/documents
 * - Configuration data
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// ============================================
// Types
// ============================================

export interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  encryptionKey?: string;
  s3Enabled: boolean;
  s3Bucket?: string;
  s3Region?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  type: 'full' | 'database' | 'files';
  timestamp: Date;
  size: number;
  duration: number;
  location: string;
  error?: string;
}

export interface BackupInfo {
  id: string;
  type: 'full' | 'database' | 'files';
  timestamp: Date;
  size: number;
  location: string;
  status: 'completed' | 'failed' | 'in_progress';
}

export interface BackupSchedule {
  id: string;
  name: string;
  type: 'full' | 'database' | 'files';
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:mm
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  enabled: boolean;
  retentionDays: number;
  lastRun?: Date;
  nextRun?: Date;
}

// ============================================
// Backup Service Class
// ============================================

class BackupService {
  private config: BackupConfig;
  private backupDir: string;

  constructor() {
    this.backupDir = process.env.BACKUP_DIR || './backups';
    this.config = {
      databaseUrl: process.env.DATABASE_URL || '',
      backupDir: this.backupDir,
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
      compressionEnabled: process.env.BACKUP_COMPRESSION !== 'false',
      encryptionEnabled: process.env.BACKUP_ENCRYPTION === 'true',
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
      s3Enabled: process.env.BACKUP_S3_ENABLED === 'true',
      s3Bucket: process.env.BACKUP_S3_BUCKET,
      s3Region: process.env.BACKUP_S3_REGION,
      s3AccessKey: process.env.AWS_ACCESS_KEY_ID,
      s3SecretKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  // ============================================
  // Database Backup
  // ============================================

  /**
   * Create a database backup using pg_dump
   */
  async createDatabaseBackup(): Promise<BackupResult> {
    const backupId = this.generateBackupId('database');
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      // Ensure backup directory exists
      await this.ensureBackupDir();

      const filename = `database_${backupId}.sql${this.config.compressionEnabled ? '.gz' : ''}`;
      const filepath = path.join(this.backupDir, filename);

      // Build pg_dump command
      let command = `pg_dump "${this.config.databaseUrl}" --format=plain --no-owner --no-acl`;

      if (this.config.compressionEnabled) {
        command += ` | gzip > "${filepath}"`;
      } else {
        command += ` > "${filepath}"`;
      }

      // Execute backup
      await execAsync(command, { maxBuffer: 1024 * 1024 * 100 }); // 100MB buffer

      // Get file size
      const stats = await fs.stat(filepath);
      const size = stats.size;

      // Encrypt if enabled
      let finalPath = filepath;
      if (this.config.encryptionEnabled && this.config.encryptionKey) {
        finalPath = await this.encryptFile(filepath);
      }

      // Upload to S3 if enabled
      if (this.config.s3Enabled) {
        await this.uploadToS3(finalPath, `database/${filename}`);
      }

      // Log backup
      await this.logBackup({
        id: backupId,
        type: 'database',
        timestamp,
        size,
        location: finalPath,
        status: 'completed',
      });

      return {
        success: true,
        backupId,
        type: 'database',
        timestamp,
        size,
        duration: Date.now() - startTime,
        location: finalPath,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed backup
      await this.logBackup({
        id: backupId,
        type: 'database',
        timestamp,
        size: 0,
        location: '',
        status: 'failed',
      });

      return {
        success: false,
        backupId,
        type: 'database',
        timestamp,
        size: 0,
        duration: Date.now() - startTime,
        location: '',
        error: errorMessage,
      };
    }
  }

  // ============================================
  // Files Backup
  // ============================================

  /**
   * Create a backup of uploaded files
   */
  async createFilesBackup(filesDir: string = './uploads'): Promise<BackupResult> {
    const backupId = this.generateBackupId('files');
    const startTime = Date.now();
    const timestamp = new Date();

    // SECURITY: Validate filesDir contains only safe characters to prevent command injection
    if (!/^[\w./\-_]+$/.test(filesDir) || filesDir.includes('..')) {
      return {
        success: false,
        backupId,
        type: 'files',
        timestamp,
        size: 0,
        duration: Date.now() - startTime,
        location: '',
        error: 'Invalid files directory path: contains unsafe characters or path traversal',
      };
    }

    try {
      await this.ensureBackupDir();

      const filename = `files_${backupId}.tar.gz`;
      const filepath = path.join(this.backupDir, filename);

      // Create tar archive
      const command = `tar -czf "${filepath}" -C "${filesDir}" .`;
      await execAsync(command);

      // Get file size
      const stats = await fs.stat(filepath);
      const size = stats.size;

      // Encrypt if enabled
      let finalPath = filepath;
      if (this.config.encryptionEnabled && this.config.encryptionKey) {
        finalPath = await this.encryptFile(filepath);
      }

      // Upload to S3 if enabled
      if (this.config.s3Enabled) {
        await this.uploadToS3(finalPath, `files/${filename}`);
      }

      // Log backup
      await this.logBackup({
        id: backupId,
        type: 'files',
        timestamp,
        size,
        location: finalPath,
        status: 'completed',
      });

      return {
        success: true,
        backupId,
        type: 'files',
        timestamp,
        size,
        duration: Date.now() - startTime,
        location: finalPath,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.logBackup({
        id: backupId,
        type: 'files',
        timestamp,
        size: 0,
        location: '',
        status: 'failed',
      });

      return {
        success: false,
        backupId,
        type: 'files',
        timestamp,
        size: 0,
        duration: Date.now() - startTime,
        location: '',
        error: errorMessage,
      };
    }
  }

  // ============================================
  // Full Backup
  // ============================================

  /**
   * Create a full backup (database + files)
   */
  async createFullBackup(filesDir: string = './uploads'): Promise<BackupResult> {
    const backupId = this.generateBackupId('full');
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      await this.ensureBackupDir();

      const backupDir = path.join(this.backupDir, `full_${backupId}`);
      await fs.mkdir(backupDir, { recursive: true });

      // Backup database
      const dbResult = await this.createDatabaseBackup();
      if (!dbResult.success) {
        throw new Error(`Database backup failed: ${dbResult.error}`);
      }

      // Backup files
      const filesResult = await this.createFilesBackup(filesDir);
      if (!filesResult.success) {
        throw new Error(`Files backup failed: ${filesResult.error}`);
      }

      // Create combined archive
      const filename = `full_${backupId}.tar.gz`;
      const filepath = path.join(this.backupDir, filename);

      await execAsync(`tar -czf "${filepath}" -C "${backupDir}" .`);

      // Get total size
      const stats = await fs.stat(filepath);
      const size = stats.size;

      // Cleanup temporary directory
      await fs.rm(backupDir, { recursive: true, force: true });

      // Log backup
      await this.logBackup({
        id: backupId,
        type: 'full',
        timestamp,
        size,
        location: filepath,
        status: 'completed',
      });

      return {
        success: true,
        backupId,
        type: 'full',
        timestamp,
        size,
        duration: Date.now() - startTime,
        location: filepath,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.logBackup({
        id: backupId,
        type: 'full',
        timestamp,
        size: 0,
        location: '',
        status: 'failed',
      });

      return {
        success: false,
        backupId,
        type: 'full',
        timestamp,
        size: 0,
        duration: Date.now() - startTime,
        location: '',
        error: errorMessage,
      };
    }
  }

  // ============================================
  // Restore Operations
  // ============================================

  /**
   * Restore database from backup
   */
  async restoreDatabase(backupPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Decrypt if needed
      let filepath = backupPath;
      if (backupPath.endsWith('.enc')) {
        filepath = await this.decryptFile(backupPath);
      }

      // Build restore command
      let command: string;
      if (filepath.endsWith('.gz')) {
        command = `gunzip -c "${filepath}" | psql "${this.config.databaseUrl}"`;
      } else {
        command = `psql "${this.config.databaseUrl}" -f "${filepath}"`;
      }

      await execAsync(command, { maxBuffer: 1024 * 1024 * 100 });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Restore files from backup
   */
  async restoreFiles(backupPath: string, targetDir: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Decrypt if needed
      let filepath = backupPath;
      if (backupPath.endsWith('.enc')) {
        filepath = await this.decryptFile(backupPath);
      }

      // Extract files
      await fs.mkdir(targetDir, { recursive: true });
      await execAsync(`tar -xzf "${filepath}" -C "${targetDir}"`);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================
  // Backup Management
  // ============================================

  /**
   * List all backups
   */
  async listBackups(): Promise<BackupInfo[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups: BackupInfo[] = [];

      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = await fs.stat(filepath);

        if (stats.isFile()) {
          const type = this.getBackupType(file);
          if (type) {
            backups.push({
              id: this.extractBackupId(file),
              type,
              timestamp: stats.birthtime,
              size: stats.size,
              location: filepath,
              status: 'completed',
            });
          }
        }
      }

      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch {
      return [];
    }
  }

  /**
   * Delete old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<{ deleted: number; errors: string[] }> {
    let deleted = 0;
    const errors: string[] = [];

    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      for (const backup of backups) {
        if (backup.timestamp < cutoffDate) {
          try {
            await fs.unlink(backup.location);
            deleted++;  // FIX: Increment counter after successful deletion
          } catch (error) {
            errors.push(`Failed to delete ${backup.id}: ${error}`);
          }
        }
      }

      return { deleted, errors };
    } catch (error) {
      return { deleted: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const backups = await this.listBackups();
      const backup = backups.find((b) => b.id === backupId);

      if (!backup) {
        return { success: false, error: 'Backup not found' };
      }

      await fs.unlink(backup.location);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================
  // Scheduling
  // ============================================

  /**
   * Get default backup schedules
   */
  getDefaultSchedules(): BackupSchedule[] {
    return [
      {
        id: 'daily-database',
        name: 'Daily Database Backup',
        type: 'database',
        frequency: 'daily',
        time: '02:00',
        enabled: true,
        retentionDays: 7,
      },
      {
        id: 'weekly-full',
        name: 'Weekly Full Backup',
        type: 'full',
        frequency: 'weekly',
        time: '03:00',
        dayOfWeek: 0, // Sunday
        enabled: true,
        retentionDays: 30,
      },
      {
        id: 'monthly-archive',
        name: 'Monthly Archive Backup',
        type: 'full',
        frequency: 'monthly',
        time: '04:00',
        dayOfMonth: 1,
        enabled: true,
        retentionDays: 365,
      },
    ];
  }

  // ============================================
  // Helper Methods
  // ============================================

  private generateBackupId(type: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${type}_${timestamp}`;
  }

  private getBackupType(filename: string): 'full' | 'database' | 'files' | null {
    if (filename.startsWith('full_')) return 'full';
    if (filename.startsWith('database_')) return 'database';
    if (filename.startsWith('files_')) return 'files';
    return null;
  }

  private extractBackupId(filename: string): string {
    return filename.replace(/\.(sql|tar)\.gz(\.enc)?$/, '').replace(/\.(sql|tar)(\.enc)?$/, '');
  }

  private async ensureBackupDir(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch {
      // Directory already exists
    }
  }

  private async encryptFile(filepath: string): Promise<string> {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const encryptedPath = `${filepath}.enc`;
    // SECURITY: Pass encryption key via environment variable to avoid exposure in ps/process listings.
    // In production, prefer using the AWS Encryption SDK or a dedicated secrets manager.
    await execAsync(
      `openssl enc -aes-256-cbc -salt -pbkdf2 -in "${filepath}" -out "${encryptedPath}" -pass env:BACKUP_ENC_KEY`,
      { env: { ...process.env, BACKUP_ENC_KEY: this.config.encryptionKey } }
    );

    // Delete original file
    await fs.unlink(filepath);

    return encryptedPath;
  }

  private async decryptFile(filepath: string): Promise<string> {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const decryptedPath = filepath.replace('.enc', '');
    // SECURITY: Pass encryption key via environment variable to avoid exposure in ps/process listings.
    await execAsync(
      `openssl enc -aes-256-cbc -d -pbkdf2 -in "${filepath}" -out "${decryptedPath}" -pass env:BACKUP_ENC_KEY`,
      { env: { ...process.env, BACKUP_ENC_KEY: this.config.encryptionKey } }
    );

    return decryptedPath;
  }

  /**
   * SECURITY: Reject strings that contain shell metacharacters to prevent command injection.
   * In production, prefer using the AWS SDK (PutObjectCommand) instead of shell exec.
   */
  private validateNoShellMetacharacters(value: string, label: string): void {
    // Allow alphanumeric, dash, underscore, dot, forward slash, colon (for s3:// URIs)
    if (!/^[\w./:_-]+$/.test(value)) {
      throw new Error(
        `Security: ${label} contains disallowed characters. ` +
        `Only alphanumeric, dash, underscore, dot, slash, and colon are permitted.`
      );
    }
  }

  private async uploadToS3(filepath: string, key: string): Promise<void> {
    if (!this.config.s3Bucket || !this.config.s3AccessKey || !this.config.s3SecretKey) {
      return;
    }

    // SECURITY: Validate all interpolated values to prevent shell command injection.
    const region = this.config.s3Region || 'us-east-1';
    this.validateNoShellMetacharacters(this.config.s3Bucket, 's3Bucket');
    this.validateNoShellMetacharacters(region, 's3Region');
    this.validateNoShellMetacharacters(filepath, 'filepath');
    this.validateNoShellMetacharacters(key, 'key');

    const command = `aws s3 cp "${filepath}" "s3://${this.config.s3Bucket}/${key}" --region ${region}`;
    await execAsync(command);
  }

  private async logBackup(backup: BackupInfo): Promise<void> {
    try {
      // Could store in database for audit trail
      console.log(`[Backup] ${backup.type} backup ${backup.id}: ${backup.status}`);
    } catch (error) {
      console.error('Failed to log backup:', error);
    }
  }

  /**
   * Get backup statistics
   */
  async getStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup?: Date;
    newestBackup?: Date;
    backupsByType: { full: number; database: number; files: number };
  }> {
    const backups = await this.listBackups();

    const stats = {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, b) => sum + b.size, 0),
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : undefined,
      newestBackup: backups.length > 0 ? backups[0].timestamp : undefined,
      backupsByType: {
        full: backups.filter((b) => b.type === 'full').length,
        database: backups.filter((b) => b.type === 'database').length,
        files: backups.filter((b) => b.type === 'files').length,
      },
    };

    return stats;
  }
}

// Export singleton instance
export const backupService = new BackupService();
