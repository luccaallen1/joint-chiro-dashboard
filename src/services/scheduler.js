const cron = require('node-cron');
const ImportService = require('./importService');
const logger = require('../utils/logger');

class ImportScheduler {
  constructor() {
    this.importService = new ImportService();
    this.scheduledTasks = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the scheduler with cron jobs
   */
  initialize() {
    if (this.isInitialized) {
      logger.warn('Scheduler already initialized');
      return;
    }

    try {
      // Schedule imports for 6:00 AM and 6:00 PM every day
      const morningTask = cron.schedule('0 6 * * *', async () => {
        await this.runScheduledImport('morning');
      }, {
        scheduled: false,
        timezone: 'America/New_York' // Adjust timezone as needed
      });

      const eveningTask = cron.schedule('0 18 * * *', async () => {
        await this.runScheduledImport('evening');
      }, {
        scheduled: false,
        timezone: 'America/New_York' // Adjust timezone as needed
      });

      this.scheduledTasks.set('morning', morningTask);
      this.scheduledTasks.set('evening', eveningTask);

      this.isInitialized = true;

      logger.info('Import scheduler initialized', {
        morningSchedule: '6:00 AM daily',
        eveningSchedule: '6:00 PM daily',
        timezone: 'America/New_York'
      });

    } catch (error) {
      logger.error('Failed to initialize scheduler:', error);
      throw error;
    }
  }

  /**
   * Start all scheduled tasks
   */
  start() {
    if (!this.isInitialized) {
      this.initialize();
    }

    this.scheduledTasks.forEach((task, name) => {
      task.start();
      logger.info(`Started scheduled task: ${name}`);
    });

    logger.info('Import scheduler started - running at 6:00 AM and 6:00 PM daily');
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    this.scheduledTasks.forEach((task, name) => {
      task.stop();
      logger.info(`Stopped scheduled task: ${name}`);
    });

    logger.info('Import scheduler stopped');
  }

  /**
   * Destroy all scheduled tasks
   */
  destroy() {
    this.scheduledTasks.forEach((task, name) => {
      task.destroy();
      logger.info(`Destroyed scheduled task: ${name}`);
    });

    this.scheduledTasks.clear();
    this.isInitialized = false;

    logger.info('Import scheduler destroyed');
  }

  /**
   * Run a scheduled import
   */
  async runScheduledImport(scheduleType = 'scheduled') {
    try {
      logger.info(`Starting scheduled import (${scheduleType})`);

      const startTime = Date.now();

      // Determine if this should be incremental
      // After initial load, all scheduled imports are incremental
      const isIncremental = await this.shouldRunIncrementalImport();

      const result = await this.importService.runImport({
        triggeredBy: 'scheduler',
        incremental: isIncremental,
        notes: `Scheduled ${scheduleType} import${isIncremental ? ' (incremental)' : ' (full)'}`
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      logger.info(`Scheduled import (${scheduleType}) completed successfully`, {
        duration,
        totalProcessed: result.totalProcessed,
        incremental: isIncremental,
        importId: result.importId
      });

      return result;

    } catch (error) {
      logger.error(`Scheduled import (${scheduleType}) failed:`, error);

      // Don't throw - we don't want one failed import to crash the scheduler
      return {
        success: false,
        error: error.message,
        scheduleType
      };
    }
  }

  /**
   * Run initial import on startup
   */
  async runInitialImport() {
    try {
      logger.info('Starting initial import on server startup');

      const hasExistingData = await this.hasExistingConversations();

      const result = await this.importService.runImport({
        triggeredBy: 'startup',
        incremental: hasExistingData,
        notes: hasExistingData
          ? 'Initial startup import (incremental - existing data found)'
          : 'Initial startup import (full - no existing data)'
      });

      logger.info('Initial import completed successfully', {
        totalProcessed: result.totalProcessed,
        incremental: hasExistingData,
        importId: result.importId
      });

      return result;

    } catch (error) {
      logger.error('Initial import failed:', error);
      throw error;
    }
  }

  /**
   * Manually trigger an import
   */
  async triggerManualImport(options = {}) {
    try {
      const {
        incremental = true,
        notes = 'Manual import trigger'
      } = options;

      logger.info('Starting manual import trigger', { incremental, notes });

      const result = await this.importService.runImport({
        triggeredBy: 'manual',
        incremental,
        notes
      });

      logger.info('Manual import completed successfully', {
        totalProcessed: result.totalProcessed,
        incremental,
        importId: result.importId
      });

      return result;

    } catch (error) {
      logger.error('Manual import failed:', error);
      throw error;
    }
  }

  /**
   * Check if we should run incremental import
   */
  async shouldRunIncrementalImport() {
    try {
      // Check if we have any completed full imports
      const db = require('../db/connection');
      const result = await db.query(`
        SELECT COUNT(*) as count
        FROM import_logs
        WHERE status = 'completed' AND incremental = false
      `);

      const hasFullImports = parseInt(result.rows[0].count) > 0;
      return hasFullImports;

    } catch (error) {
      logger.error('Error checking for existing imports:', error);
      // Default to full import if we can't determine
      return false;
    }
  }

  /**
   * Check if there are existing conversations in the database
   */
  async hasExistingConversations() {
    try {
      const db = require('../db/connection');
      const result = await db.query('SELECT COUNT(*) as count FROM conversations LIMIT 1');
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      logger.error('Error checking for existing conversations:', error);
      return false;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    const taskStatuses = {};

    this.scheduledTasks.forEach((task, name) => {
      taskStatuses[name] = {
        running: task.running || false,
        scheduled: task.scheduled || false
      };
    });

    return {
      initialized: this.isInitialized,
      totalTasks: this.scheduledTasks.size,
      tasks: taskStatuses,
      importServiceStatus: this.importService.getStatus()
    };
  }

  /**
   * Get next scheduled run times
   */
  getNextScheduledRuns() {
    const nextRuns = {};

    this.scheduledTasks.forEach((task, name) => {
      if (task.scheduled) {
        // Get next execution time
        // Note: node-cron doesn't expose next execution time directly
        // This is a simplified approach
        const now = new Date();
        let nextRun;

        if (name === 'morning') {
          nextRun = new Date();
          nextRun.setHours(6, 0, 0, 0);
          if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 1);
          }
        } else if (name === 'evening') {
          nextRun = new Date();
          nextRun.setHours(18, 0, 0, 0);
          if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 1);
          }
        }

        nextRuns[name] = nextRun?.toISOString();
      }
    });

    return nextRuns;
  }

  /**
   * Validate cron expressions (useful for testing)
   */
  static validateCronExpression(expression) {
    return cron.validate(expression);
  }

  /**
   * Create a custom scheduled task (for testing or special cases)
   */
  addCustomTask(name, cronExpression, taskFunction, options = {}) {
    if (this.scheduledTasks.has(name)) {
      throw new Error(`Task ${name} already exists`);
    }

    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    const task = cron.schedule(cronExpression, taskFunction, {
      scheduled: false,
      ...options
    });

    this.scheduledTasks.set(name, task);

    logger.info(`Added custom scheduled task: ${name}`, {
      cronExpression,
      options
    });

    return task;
  }

  /**
   * Remove a custom task
   */
  removeCustomTask(name) {
    if (!this.scheduledTasks.has(name)) {
      throw new Error(`Task ${name} does not exist`);
    }

    const task = this.scheduledTasks.get(name);
    task.destroy();
    this.scheduledTasks.delete(name);

    logger.info(`Removed custom scheduled task: ${name}`);
  }
}

module.exports = ImportScheduler;