// Notification Routes - API endpoints for notification management
// Phase 4.2: Notifications System

const express = require('express');
const router = express.Router();
const notificationService = require('../services/notification-service');
const { requireAuthentication } = require('../middleware/access-control');
const { ValidationError, NotFoundError } = require('../utils/error-types');

// All notification routes require authentication
router.use(requireAuthentication);

// Get user notifications
router.get('/', async (req, res, next) => {
  try {
    const userId = req.authenticatedUser.userId;
    const {
      unreadOnly = 'false',
      limit = '50',
      offset = '0',
      type,
    } = req.query;
    
    const result = await notificationService.getUserNotifications(userId, {
      unreadOnly: unreadOnly === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset),
      type,
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get unread count
router.get('/unread-count', async (req, res, next) => {
  try {
    const userId = req.authenticatedUser.userId;
    const count = await notificationService.getUnreadCount(userId);
    
    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const userId = req.authenticatedUser.userId;
    const { id } = req.params;
    
    const result = await notificationService.markAsRead(id, userId);
    
    if (result.count === 0) {
      throw new NotFoundError('Notification not found');
    }
    
    res.json({ message: 'Notification marked as read', success: true });
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.patch('/mark-all-read', async (req, res, next) => {
  try {
    const userId = req.authenticatedUser.userId;
    
    const result = await notificationService.markAllAsRead(userId);
    
    res.json({
      message: 'All notifications marked as read',
      count: result.count,
      success: true,
    });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.authenticatedUser.userId;
    const { id } = req.params;
    
    const result = await notificationService.deleteNotification(id, userId);
    
    if (result.count === 0) {
      throw new NotFoundError('Notification not found');
    }
    
    res.json({ message: 'Notification deleted', success: true });
  } catch (error) {
    next(error);
  }
});

// Clear all read notifications
router.delete('/clear-all', async (req, res, next) => {
  try {
    const userId = req.authenticatedUser.userId;
    
    const result = await notificationService.clearAllRead(userId);
    
    res.json({
      message: 'All read notifications cleared',
      count: result.count,
      success: true,
    });
  } catch (error) {
    next(error);
  }
});

// Get notification preferences
router.get('/preferences', async (req, res, next) => {
  try {
    const userId = req.authenticatedUser.userId;
    
    const preferences = await notificationService.getPreferences(userId);
    
    res.json(preferences);
  } catch (error) {
    next(error);
  }
});

// Update notification preferences
router.put('/preferences', async (req, res, next) => {
  try {
    const userId = req.authenticatedUser.userId;
    const updates = req.body;
    
    // Validate preference fields
    const validFields = [
      'emailCampaign', 'emailCollaboration', 'emailPayment', 'emailSystem',
      'inAppCampaign', 'inAppCollaboration', 'inAppPayment', 'inAppSystem',
    ];
    
    const invalidFields = Object.keys(updates).filter(key => !validFields.includes(key));
    if (invalidFields.length > 0) {
      throw new ValidationError(`Invalid preference fields: ${invalidFields.join(', ')}`);
    }
    
    // Validate boolean values
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value !== 'boolean') {
        throw new ValidationError(`${key} must be a boolean value`);
      }
    }
    
    const preferences = await notificationService.updatePreferences(userId, updates);
    
    res.json({
      message: 'Preferences updated successfully',
      preferences,
      success: true,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
