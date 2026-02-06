// Notification Service - Handles in-app and email notifications
// Phase 4.2: Notifications System

const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class NotificationService {
  constructor() {
    // Singleton pattern
    if (NotificationService.instance) {
      return NotificationService.instance;
    }
    
    // Configure email transporter (will be initialized when needed)
    this.emailTransporter = null;
    
    NotificationService.instance = this;
  }
  
  // Initialize email transporter on demand
  getEmailTransporter() {
    if (!this.emailTransporter && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
    return this.emailTransporter;
  }
  
  // Create an in-app notification
  async createNotification({ userId, type, category, title, message, metadata = null, actionUrl = null, priority = 'normal' }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          notificationType: type,
          category,
          title,
          message,
          metadata: metadata ? JSON.stringify(metadata) : null,
          actionUrl,
          priority,
        },
      });
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
  
  // Send email notification
  async sendEmailNotification({ to, subject, htmlBody, textBody }) {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('⚠️  Email not sent - SMTP not configured');
      return { sent: false, reason: 'SMTP not configured' };
    }
    
    try {
      const transporter = this.getEmailTransporter();
      if (!transporter) {
        return { sent: false, reason: 'Email transporter not available' };
      }
      
      const mailOptions = {
        from: process.env.SMTP_FROM || '"TIKIT Platform" <no-reply@tikit.com>',
        to,
        subject,
        text: textBody,
        html: htmlBody,
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log('📧 Email sent:', info.messageId);
      return { sent: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { sent: false, error: error.message };
    }
  }
  
  // Send notification based on user preferences
  async notify({ userId, type, category, title, message, metadata = null, actionUrl = null, priority = 'normal' }) {
    try {
      // Get user and preferences
      const user = await prisma.user.findUnique({
        where: { userId },
        include: { notificationPreferences: true },
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Create notification preferences if they don't exist
      let preferences = user.notificationPreferences;
      if (!preferences) {
        preferences = await prisma.notificationPreferences.create({
          data: { userId },
        });
      }
      
      const results = {};
      
      // Check if in-app notification should be sent
      const inAppPrefKey = `inApp${type.charAt(0).toUpperCase() + type.slice(1)}`;
      if (preferences[inAppPrefKey]) {
        const notification = await this.createNotification({
          userId,
          type,
          category,
          title,
          message,
          metadata,
          actionUrl,
          priority,
        });
        results.inApp = notification;
      }
      
      // Check if email notification should be sent
      const emailPrefKey = `email${type.charAt(0).toUpperCase() + type.slice(1)}`;
      if (preferences[emailPrefKey]) {
        const emailHtml = this.generateEmailTemplate({ title, message, actionUrl, category });
        const emailText = `${title}\n\n${message}${actionUrl ? `\n\nView: ${actionUrl}` : ''}`;
        
        const emailResult = await this.sendEmailNotification({
          to: user.email,
          subject: title,
          htmlBody: emailHtml,
          textBody: emailText,
        });
        results.email = emailResult;
      }
      
      return results;
    } catch (error) {
      console.error('Error in notify:', error);
      throw error;
    }
  }
  
  // Bulk notify multiple users
  async notifyMultiple(userIds, notificationData) {
    const results = [];
    for (const userId of userIds) {
      try {
        const result = await this.notify({ userId, ...notificationData });
        results.push({ userId, success: true, result });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }
    return results;
  }
  
  // Get user notifications
  async getUserNotifications(userId, { unreadOnly = false, limit = 50, offset = 0, type = null } = {}) {
    const where = { userId };
    
    if (unreadOnly) {
      where.isRead = false;
    }
    
    if (type) {
      where.notificationType = type;
    }
    
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);
    
    return {
      notifications: notifications.map(n => ({
        ...n,
        metadata: n.metadata ? JSON.parse(n.metadata) : null,
      })),
      total,
      limit,
      offset,
    };
  }
  
  // Get unread count
  async getUnreadCount(userId) {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
  
  // Mark notification as read
  async markAsRead(notificationId, userId) {
    return await prisma.notification.updateMany({
      where: { notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }
  
  // Mark all as read
  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
  
  // Delete notification
  async deleteNotification(notificationId, userId) {
    return await prisma.notification.deleteMany({
      where: { notificationId, userId },
    });
  }
  
  // Clear all read notifications
  async clearAllRead(userId) {
    return await prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
  }
  
  // Get/Update user preferences
  async getPreferences(userId) {
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId },
    });
    
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: { userId },
      });
    }
    
    return preferences;
  }
  
  async updatePreferences(userId, updates) {
    return await prisma.notificationPreferences.upsert({
      where: { userId },
      update: updates,
      create: { userId, ...updates },
    });
  }
  
  // Event-specific notification helpers
  
  // Campaign notifications
  async notifyCampaignStatusChange(campaignId, newStatus) {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { campaignId },
        include: { client: true },
      });
      
      if (!campaign) return;
      
      // Notify client managers
      const clientManagers = await prisma.user.findMany({
        where: { managedClientId: campaign.clientId },
      });
      
      for (const manager of clientManagers) {
        await this.notify({
          userId: manager.userId,
          type: 'campaign',
          category: 'info',
          title: `Campaign ${newStatus}`,
          message: `Campaign "${campaign.campaignName}" has been ${newStatus}.`,
          metadata: { campaignId, campaignName: campaign.campaignName, status: newStatus },
          actionUrl: `/campaigns/${campaignId}`,
          priority: 'normal',
        });
      }
    } catch (error) {
      console.error('Error in notifyCampaignStatusChange:', error);
    }
  }
  
  // Collaboration notifications
  async notifyCollaborationInvitation(collaborationId) {
    try {
      const collaboration = await prisma.campaignInfluencer.findUnique({
        where: { collaborationId },
        include: {
          campaign: { include: { client: true } },
          influencer: true,
        },
      });
      
      if (!collaboration) return;
      
      // Notify influencer managers
      const influencerManagers = await prisma.user.findMany({
        where: { managedInfluencerId: collaboration.influencerId },
      });
      
      for (const manager of influencerManagers) {
        await this.notify({
          userId: manager.userId,
          type: 'collaboration',
          category: 'info',
          title: 'New Collaboration Invitation',
          message: `You've been invited to collaborate on "${collaboration.campaign.campaignName}".`,
          metadata: {
            collaborationId,
            campaignId: collaboration.campaignId,
            campaignName: collaboration.campaign.campaignName,
          },
          actionUrl: `/collaborations/${collaborationId}`,
          priority: 'high',
        });
      }
    } catch (error) {
      console.error('Error in notifyCollaborationInvitation:', error);
    }
  }
  
  async notifyCollaborationAccepted(collaborationId) {
    try {
      const collaboration = await prisma.campaignInfluencer.findUnique({
        where: { collaborationId },
        include: {
          campaign: { include: { client: true } },
          influencer: true,
        },
      });
      
      if (!collaboration) return;
      
      // Notify client managers
      const clientManagers = await prisma.user.findMany({
        where: { managedClientId: collaboration.campaign.clientId },
      });
      
      for (const manager of clientManagers) {
        await this.notify({
          userId: manager.userId,
          type: 'collaboration',
          category: 'success',
          title: 'Collaboration Accepted',
          message: `${collaboration.influencer.fullName} accepted the collaboration for "${collaboration.campaign.campaignName}".`,
          metadata: {
            collaborationId,
            campaignId: collaboration.campaignId,
            influencerId: collaboration.influencerId,
          },
          actionUrl: `/collaborations/${collaborationId}`,
          priority: 'normal',
        });
      }
    } catch (error) {
      console.error('Error in notifyCollaborationAccepted:', error);
    }
  }
  
  async notifyDeliverableSubmitted(collaborationId) {
    try {
      const collaboration = await prisma.campaignInfluencer.findUnique({
        where: { collaborationId },
        include: {
          campaign: { include: { client: true } },
          influencer: true,
        },
      });
      
      if (!collaboration) return;
      
      // Notify client managers
      const clientManagers = await prisma.user.findMany({
        where: { managedClientId: collaboration.campaign.clientId },
      });
      
      for (const manager of clientManagers) {
        await this.notify({
          userId: manager.userId,
          type: 'collaboration',
          category: 'info',
          title: 'Deliverable Submitted',
          message: `${collaboration.influencer.fullName} submitted deliverables for "${collaboration.campaign.campaignName}".`,
          metadata: {
            collaborationId,
            campaignId: collaboration.campaignId,
          },
          actionUrl: `/collaborations/${collaborationId}/deliverables`,
          priority: 'high',
        });
      }
    } catch (error) {
      console.error('Error in notifyDeliverableSubmitted:', error);
    }
  }
  
  // Payment notifications
  async notifyPaymentUpdate(collaborationId, paymentStatus) {
    try {
      const collaboration = await prisma.campaignInfluencer.findUnique({
        where: { collaborationId },
        include: {
          campaign: true,
          influencer: true,
        },
      });
      
      if (!collaboration) return;
      
      // Notify influencer managers
      const influencerManagers = await prisma.user.findMany({
        where: { managedInfluencerId: collaboration.influencerId },
      });
      
      for (const manager of influencerManagers) {
        await this.notify({
          userId: manager.userId,
          type: 'payment',
          category: paymentStatus === 'paid' ? 'success' : 'info',
          title: `Payment ${paymentStatus}`,
          message: `Payment for "${collaboration.campaign.campaignName}" is now ${paymentStatus}.`,
          metadata: {
            collaborationId,
            campaignId: collaboration.campaignId,
            paymentStatus,
            amount: collaboration.agreedPayment,
          },
          actionUrl: `/collaborations/${collaborationId}`,
          priority: paymentStatus === 'paid' ? 'high' : 'normal',
        });
      }
    } catch (error) {
      console.error('Error in notifyPaymentUpdate:', error);
    }
  }
  
  // Generate email HTML template
  generateEmailTemplate({ title, message, actionUrl, category }) {
    const categoryColors = {
      info: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    };
    
    const color = categoryColors[category] || categoryColors.info;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; }
          .footer { background-color: #e5e7eb; padding: 15px; border-radius: 0 0 5px 5px; text-align: center; font-size: 12px; color: #6b7280; }
          .button { display: inline-block; padding: 12px 24px; background-color: ${color}; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${title}</h2>
          </div>
          <div class="content">
            <p>${message}</p>
            ${actionUrl ? `<a href="${actionUrl}" class="button">View Details</a>` : ''}
          </div>
          <div class="footer">
            <p>This is an automated notification from TIKIT Platform</p>
            <p>&copy; 2026 TIKIT. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
module.exports = new NotificationService();
