const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');
const { ValidationError, NotFoundError } = require('../utils/error-types');

const prisma = new PrismaClient();

class FileUploadService {
  static instance;

  constructor() {
    if (FileUploadService.instance) {
      return FileUploadService.instance;
    }
    FileUploadService.instance = this;
  }

  /**
   * Process and save uploaded file
   */
  async processUpload(file, userId, options = {}) {
    const {
      purpose = 'general',
      entityType = null,
      entityId = null,
      isPublic = false,
      metadata = {}
    } = options;

    // Validate file exists
    if (!file) {
      throw new ValidationError('No file provided');
    }

    // Extract file info
    const filename = file.filename;
    const originalName = file.originalname;
    const mimeType = file.mimetype;
    const size = file.size;
    const filePath = file.path;

    // Generate URL
    const url = `/uploads/${path.basename(path.dirname(filePath))}/${filename}`;

    // Generate thumbnail for images
    let thumbnailUrl = null;
    if (mimeType.startsWith('image/')) {
      try {
        thumbnailUrl = await this.generateThumbnail(filePath, filename);
        
        // Get image dimensions
        const imageMetadata = await sharp(filePath).metadata();
        metadata.width = imageMetadata.width;
        metadata.height = imageMetadata.height;
        metadata.format = imageMetadata.format;
      } catch (error) {
        console.error('Thumbnail generation failed:', error);
        // Continue without thumbnail
      }
    }

    // Create database record
    const media = await prisma.media.create({
      data: {
        userId,
        filename,
        originalName,
        mimeType,
        size,
        url,
        thumbnailUrl,
        purpose,
        entityType,
        entityId,
        isPublic,
        metadata
      }
    });

    return media;
  }

  /**
   * Generate thumbnail for image
   */
  async generateThumbnail(filePath, filename) {
    const thumbnailDir = path.join(process.cwd(), 'uploads', 'thumbnails');
    const thumbnailFilename = `thumb_${filename.replace(/\.[^.]+$/, '')}.webp`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

    await sharp(filePath)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(thumbnailPath);

    return `/uploads/thumbnails/${thumbnailFilename}`;
  }

  /**
   * Get user's media files
   */
  async getUserMedia(userId, filters = {}) {
    const {
      purpose,
      entityType,
      entityId,
      mimeType,
      page = 1,
      limit = 20
    } = filters;

    const where = { userId };

    if (purpose) where.purpose = purpose;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (mimeType) where.mimeType = { contains: mimeType };

    const skip = (page - 1) * limit;

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.media.count({ where })
    ]);

    return {
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get media by ID
   */
  async getMediaById(id, userId = null) {
    const media = await prisma.media.findUnique({
      where: { id }
    });

    if (!media) {
      throw new NotFoundError('Media not found');
    }

    // Check ownership if userId provided
    if (userId && media.userId !== userId && !media.isPublic) {
      throw new NotFoundError('Media not found');
    }

    return media;
  }

  /**
   * Delete media file
   */
  async deleteMedia(id, userId) {
    const media = await this.getMediaById(id, userId);

    // Delete physical files
    try {
      const filePath = path.join(process.cwd(), media.url.replace(/^\//, ''));
      await fs.unlink(filePath);

      // Delete thumbnail if exists
      if (media.thumbnailUrl) {
        const thumbnailPath = path.join(process.cwd(), media.thumbnailUrl.replace(/^\//, ''));
        await fs.unlink(thumbnailPath).catch(() => {});
      }
    } catch (error) {
      console.error('Error deleting physical file:', error);
      // Continue with database deletion
    }

    // Delete database record
    await prisma.media.delete({
      where: { id }
    });

    return { success: true, message: 'Media deleted successfully' };
  }

  /**
   * Get media statistics for user
   */
  async getUserMediaStats(userId) {
    const media = await prisma.media.findMany({
      where: { userId },
      select: {
        size: true,
        mimeType: true,
        purpose: true
      }
    });

    const stats = {
      totalFiles: media.length,
      totalSize: media.reduce((sum, m) => sum + m.size, 0),
      byType: {},
      byPurpose: {}
    };

    media.forEach(m => {
      const type = m.mimeType.split('/')[0];
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      stats.byPurpose[m.purpose] = (stats.byPurpose[m.purpose] || 0) + 1;
    });

    return stats;
  }

  /**
   * Validate image dimensions
   */
  async validateImageDimensions(filePath, maxWidth = 4096, maxHeight = 4096) {
    try {
      const metadata = await sharp(filePath).metadata();
      
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        throw new ValidationError(
          `Image dimensions too large. Maximum: ${maxWidth}x${maxHeight}px, ` +
          `got: ${metadata.width}x${metadata.height}px`
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError('Invalid image file');
    }
  }
}

module.exports = new FileUploadService();
