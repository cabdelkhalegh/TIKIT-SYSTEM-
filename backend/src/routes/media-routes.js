const express = require('express');
const router = express.Router();
const { upload, handleMulterError } = require('../middleware/upload-handler');
const fileUploadService = require('../services/file-upload-service');
const { requireAuthentication } = require('../middleware/access-control');
const { createUploadHandler } = require('../utils/upload-handler-factory');

// All routes require authentication
router.use(requireAuthentication);

/**
 * Upload profile image
 */
router.post('/upload/profile', upload.single('file'), createUploadHandler({
  fileUploadService,
  purpose: 'profile',
  entityType: 'user',
  getEntityId: (req) => req.user.id,
  isPublic: true,
  successMessage: 'Profile image uploaded successfully',
  validateDimensions: true
}));

/**
 * Upload campaign media
 */
router.post('/upload/campaign/:campaignId', upload.single('file'), createUploadHandler({
  fileUploadService,
  purpose: 'campaign',
  entityType: 'campaign',
  getEntityId: (req) => req.params.campaignId,
  isPublic: false,
  successMessage: 'Campaign media uploaded successfully'
}));

/**
 * Upload deliverable file
 */
router.post('/upload/deliverable/:collaborationId', upload.single('file'), createUploadHandler({
  fileUploadService,
  purpose: 'deliverable',
  entityType: 'collaboration',
  getEntityId: (req) => req.params.collaborationId,
  isPublic: false,
  successMessage: 'Deliverable file uploaded successfully'
}));

/**
 * Upload general file
 */
router.post('/upload/general', upload.single('file'), createUploadHandler({
  fileUploadService,
  purpose: 'general',
  entityType: 'general',
  getEntityId: (req) => req.user.id,
  isPublic: false,
  successMessage: 'File uploaded successfully'
}));

/**
 * Get user's media files
 */
router.get('/', async (req, res, next) => {
  try {
    const { purpose, entityType, entityId, mimeType, page, limit } = req.query;

    const result = await fileUploadService.getUserMedia(req.user.id, {
      purpose,
      entityType,
      entityId,
      mimeType,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });

    res.json({
      success: true,
      data: result.media,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get media file details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const media = await fileUploadService.getMediaById(req.params.id, req.user.id);

    res.json({
      success: true,
      data: media
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete media file
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await fileUploadService.deleteMedia(req.params.id, req.user.id);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

// Apply multer error handling
router.use(handleMulterError);

module.exports = router;
