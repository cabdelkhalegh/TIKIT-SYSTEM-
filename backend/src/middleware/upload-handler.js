const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ValidationError } = require('../utils/error-types');

// Ensure upload directories exist
const uploadDirs = [
  'uploads/profiles',
  'uploads/campaigns',
  'uploads/deliverables',
  'uploads/general',
  'uploads/thumbnails'
];

uploadDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/general';
    
    // Determine upload path based on route
    if (req.path.includes('/profile')) {
      uploadPath = 'uploads/profiles';
    } else if (req.path.includes('/campaign')) {
      uploadPath = 'uploads/campaigns';
    } else if (req.path.includes('/deliverable')) {
      uploadPath = 'uploads/deliverables';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, '_')
      .substring(0, 50);
    
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'video/mp4': ['.mp4'],
    'video/x-msvideo': ['.avi'],
    'video/quicktime': ['.mov'],
    'video/x-ms-wmv': ['.wmv'],
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar']
  };
  
  const ext = path.extname(file.originalname).toLowerCase();
  const isAllowed = allowedTypes[file.mimetype] && 
                    allowedTypes[file.mimetype].includes(ext);
  
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new ValidationError(`File type not allowed: ${file.mimetype}. Allowed: images, PDFs, documents, videos, archives`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  next(err);
};

module.exports = {
  upload,
  handleMulterError
};
