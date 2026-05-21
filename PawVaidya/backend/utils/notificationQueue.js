import { transporter } from '../config/nodemailer.js';

class NotificationQueue {
  constructor(concurrency = 3) {
    this.concurrency = concurrency;
    this.activeWorkers = 0;
    this.queue = [];
  }

  /**
   * Enqueues a notification job
   * @param {object} mailOptions Standard Nodemailer options (to, subject, html, etc.)
   * @param {object} retryOptions Configurations for retry behaviors
   * @param {number} retryOptions.maxRetries Max retry count (default 3)
   * @param {number} retryOptions.delayMs Initial delay before retry (default 1000ms)
   */
  enqueueMail(mailOptions, retryOptions = {}) {
    const job = {
      mailOptions,
      retries: 0,
      maxRetries: retryOptions.maxRetries || 3,
      delayMs: retryOptions.delayMs || 1000,
      timestamp: Date.now()
    };
    
    this.queue.push(job);
    console.log(`[Notification Queue] Enqueued mail job for ${mailOptions.to}. Queue length: ${this.queue.length}`);
    this.processQueue();
  }

  async processQueue() {
    if (this.activeWorkers >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.activeWorkers++;
    const job = this.queue.shift();

    try {
      await this.executeJobWithRetries(job);
    } catch (err) {
      console.error(`[Notification Queue] Critical failure: Job to ${job.mailOptions.to} failed permanently after max retries.`);
    } finally {
      this.activeWorkers--;
      // Proactively trigger the next job
      this.processQueue();
    }
  }

  async executeJobWithRetries(job) {
    try {
      const fromEmail = job.mailOptions.from || process.env.SENDER_EMAIL;
      const finalOptions = { ...job.mailOptions, from: fromEmail };
      
      await transporter.sendMail(finalOptions);
      console.log(`[Notification Queue] Email successfully dispatched to ${job.mailOptions.to} (Attempts: ${job.retries + 1})`);
    } catch (err) {
      job.retries++;
      console.warn(`[Notification Queue] Send failed to ${job.mailOptions.to} (Attempt ${job.retries}/${job.maxRetries + 1}). Error: ${err.message}`);
      
      if (job.retries <= job.maxRetries) {
        const backoffDelay = job.delayMs * Math.pow(2, job.retries - 1);
        console.log(`[Notification Queue] Scheduling retry in ${backoffDelay}ms for ${job.mailOptions.to}...`);
        
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this.executeJobWithRetries(job);
      } else {
        throw new Error('Max retries exceeded');
      }
    }
  }
}

// Global Singleton for notification queuing
const notificationQueue = new NotificationQueue();
export default notificationQueue;
