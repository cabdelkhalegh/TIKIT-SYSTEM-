const express = require('express');
const router = express.Router();
const { upload, handleMulterError } = require('../middleware/upload-handler');
const fileUploadService = require('../services/file-upload-service');
const { requireAuthentication } = require('../middleware/access-control');
const { ValidationError } = require('../utils/error-types');

// All routes require authentication
router.use(requireAuthentication);

/**
 * Upload profile image
 */
router.post('/upload/profile', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    // Validate image dimensions
    await fileUploadService.validateImageDimensions(req.file.path);

    const media = await fileUploadService.processUpload(req.file, req.user.id, {
      purpose: 'profile',
      entityType: 'user',
      entityId: req.user.id,
      isPublic: true
    });

    res.status(201).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: media
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Upload campaign media
 */
router.post('/upload/campaign/:campaignId', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const { campaignId } = req.params;

    const media = await fileUploadService.processUpload(req.file, req.user.id, {
      purpose: 'campaign',
      entityType: 'campaign',
      entityId: campaignId,
      isPublic: false
    });

    res.status(201).json({
      success: true,
      message: 'Campaign media uploaded successfully',
      data: media
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Upload deliverable file
 */
router.post('/upload/deliverable/:collaborationId', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const { collaborationId } = req.params;

    const media = await fileUploadService.processUpload(req.file, req.user.id, {
      purpose: 'deliverable',
      entityType: 'collaboration',
      entityId: collaborationId,
      isPublic: false
    });

    res.status(201).json({
      success: true,
      message: 'Deliverable file uploaded successfully',
      data: media
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Upload general file
 */
router.post('/upload/general', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const media = await fileUploadService.processUpload(req.file, req.user.id, {
      purpose: 'general',
      isPublic: false
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: media
    });
  } catch (error) {
    next(error);
  }
});

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
