const path = require('path');
const express = require('express');
const multer = require('multer');
const router = express.Router();
const fs = require('fs');
const sharp = require('sharp');
const { protect, admin } = require('../middleware/authMiddleware');

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  console.log('Uploading file:', file.originalname, 'mimetype:', file.mimetype);
  const filetypes = /jpg|jpeg|png|webp|gif|mp4|mov|webm/i;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  const isImage = file.mimetype && file.mimetype.startsWith('image/');
  const isVideo = file.mimetype && file.mimetype.startsWith('video/');

  if (extname && (isImage || isVideo)) {
    return cb(null, true);
  } else {
    console.error('File validation failed:', file.originalname, file.mimetype);
    cb(new Error('Images and Videos only!'));
  }
}

// Verify the file content matches its claimed type (mimetype is client-controlled).
// Images: JPEG/PNG/GIF/WebP magic bytes. Videos: MP4/MOV must start with an
// ftyp box, WebM/Matroska with the EBML magic — so an HTML/JS polyglot renamed
// to .mp4 (which serves fine as a static file and could be triggered through a
// misconfigured proxy/CDN) is rejected before it is stored.
function checkMagicBytes(filePath, ext, cb) {
  let header;
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    header = buf;
  } catch (err) {
    return cb(err);
  }

  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
  const isGif = header.toString('ascii', 0, 6) === 'GIF87a' || header.toString('ascii', 0, 6) === 'GIF89a';
  const isWebp = header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP';
  const isMp4 = header.toString('ascii', 4, 8) === 'ftyp'; // MP4/MOV both use ISO BMFF boxes
  const isWebm = header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3; // EBML

  const valid = /jpg|jpeg/.test(ext) ? isJpeg
    : ext === 'png' ? isPng
    : ext === 'gif' ? isGif
    : ext === 'webp' ? isWebp
    : ext === 'mp4' || ext === 'mov' ? isMp4
    : ext === 'webm' ? isWebm
    : false;

  if (!valid) {
    return cb(new Error('File content does not match its extension'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Convert JPEG/PNG to WebP. Returns the new file path (or original if skipped).
async function convertToWebp(filePath) {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const imageExts = ['jpg', 'jpeg', 'png'];
  if (!imageExts.includes(ext)) return filePath; // skip videos, gif, already-webp

  const webpPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  await sharp(filePath).webp({ quality: 82 }).toFile(webpPath);
  fs.unlinkSync(filePath); // remove original
  return webpPath;
}

// Wrap multer so its errors (e.g. file too big) return clean 400s
const handleUpload = (fields, handler) => (req, res, next) => {
  fields(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 25MB)' : err.message;
      return res.status(400).json({ message });
    }
    handler(req, res).catch(next);
  });
};

router.post('/', protect, admin, handleUpload(upload.single('image'), async (req, res) => {
  console.log('Route handler reached, file:', req.file?.originalname);
  if (!req.file) {
    return res.status(400).send('No file uploaded or validation failed');
  }
  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
  checkMagicBytes(req.file.path, ext, async (err) => {
    if (err) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: err.message });
    }
    try {
      const finalPath = await convertToWebp(req.file.path);
      res.send(`/${finalPath.replace(/\\/g, '/')}`);
    } catch (convErr) {
      console.error('WebP conversion failed:', convErr);
      // Fall back to original file if conversion fails
      res.send(`/${req.file.path.replace(/\\/g, '/')}`);
    }
  });
}));

router.post('/multiple', protect, admin, handleUpload(upload.array('images', 3), async (req, res) => {
  const checked = await Promise.all(req.files.map((file) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    return new Promise((resolve) => {
      checkMagicBytes(file.path, ext, (err) => {
        if (err) {
          fs.unlinkSync(file.path);
          return resolve({ file, error: err.message });
        }
        resolve({ file });
      });
    });
  }));

  const failed = checked.find((c) => c.error);
  if (failed) {
    checked.forEach((c) => c.file && c.file.path !== failed.file.path && fs.existsSync(c.file.path) && fs.unlinkSync(c.file.path));
    return res.status(400).json({ message: failed.error });
  }

  // Convert valid images to WebP
  const paths = await Promise.all(checked.map(async ({ file }) => {
    try {
      const finalPath = await convertToWebp(file.path);
      return `/${finalPath.replace(/\\/g, '/')}`;
    } catch {
      return `/${file.path.replace(/\\/g, '/')}`;
    }
  }));

  res.json(paths);
}));

module.exports = router;