/**
 * Notification Adapter Interface
 *
 * Implement this interface to send notifications via different channels
 * (Slack, Email, Webhook, etc.)
 */

export interface NotificationMessage {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, any>;
}

export interface INotificationAdapter {
  /**
   * Send a notification
   */
  send(message: NotificationMessage): Promise<void>;

  /**
   * Test the connection/configuration
   */
  test(): Promise<boolean>;
}

/**
 * Console Notification Adapter (Default)
 * Logs notifications to console
 */
export class ConsoleNotificationAdapter implements INotificationAdapter {
  async send(message: NotificationMessage): Promise<void> {
    const emoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      success: '✅',
    }[message.severity];

    console.log(`${emoji} [NOTIFICATION] ${message.title}`);
    console.log(`   ${message.message}`);

    if (message.metadata) {
      console.log('   Metadata:', JSON.stringify(message.metadata, null, 2));
    }
  }

  async test(): Promise<boolean> {
    console.log('✓ Console notification adapter is working');
    return true;
  }
}

/**
 * Webhook Notification Adapter
 * Sends notifications to a webhook URL
 */
export class WebhookNotificationAdapter implements INotificationAdapter {
  constructor(private webhookUrl: string) {}

  async send(message: NotificationMessage): Promise<void> {
    const axios = require('axios');

    try {
      await axios.post(this.webhookUrl, {
        ...message,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error.message);
      throw error;
    }
  }

  async test(): Promise<boolean> {
    try {
      await this.send({
        title: 'Test Notification',
        message: 'This is a test notification',
        severity: 'info',
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Slack Notification Adapter (Stub)
 * TODO: Implement actual Slack integration
 */
export class SlackNotificationAdapter implements INotificationAdapter {
  constructor(private webhookUrl: string) {}

  async send(message: NotificationMessage): Promise<void> {
    const axios = require('axios');

    const color = {
      info: '#0099ff',
      warning: '#ffaa00',
      error: '#ff0000',
      success: '#00ff00',
    }[message.severity];

    const payload = {
      attachments: [
        {
          color,
          title: message.title,
          text: message.message,
          fields: message.metadata
            ? Object.entries(message.metadata).map(([key, value]) => ({
                title: key,
                value: String(value),
                short: true,
              }))
            : [],
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await axios.post(this.webhookUrl, payload);
  }

  async test(): Promise<boolean> {
    try {
      await this.send({
        title: 'Test Notification',
        message: 'Slack integration is working!',
        severity: 'success',
      });
      return true;
    } catch {
      return false;
    }
  }
}
