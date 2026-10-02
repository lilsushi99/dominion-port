// backend/src/routes/admin/media.routes.ts — Admin Media API Routes
import { Router, Response } from 'express';
import multer from 'multer';
import {
  uploadMedia,
  listMedia,
  getMediaById,
  updateMediaAlt,
  deleteMediaSafely
} from '../../services/media.service';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { requireCsrf } from '../../middleware/csrf.middleware';

export const adminMediaRouter = Router();

// Store files in memory buffer before validating magic bytes & saving to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024 // 200 MB max
  }
});

adminMediaRouter.use(requireAuth);

/**
 * GET /api/v1/admin/media
 */
adminMediaRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const kind = req.query.kind as 'image' | 'video' | undefined;
    const search = req.query.search as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = await listMedia({ kind, search, limit, offset });
    res.json({ data: result.items, total: result.total });
  } catch (err) {
    console.error('[ADMIN MEDIA LIST ERROR]', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to list media items.' } });
  }
});

/**
 * POST /api/v1/admin/media/upload
 */
adminMediaRouter.post(
  '/upload',
  requireCsrf,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No file provided in form-data key "file".' } });
        return;
      }

      const alt = (req.body.alt as string) || '';
      const media = await uploadMedia(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        alt
      );

      res.status(201).json({ data: media });
    } catch (err: any) {
      console.error('[ADMIN MEDIA UPLOAD ERROR]', err);
      res.status(400).json({ error: { code: 'UPLOAD_FAILED', message: err.message || 'File upload failed.' } });
    }
  }
);

/**
 * GET /api/v1/admin/media/:id
 */
adminMediaRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const media = await getMediaById(id);
    if (!media) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Media asset not found.' } });
      return;
    }
    res.json({ data: media });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get media asset.' } });
  }
});

/**
 * PATCH /api/v1/admin/media/:id
 */
adminMediaRouter.patch('/:id', requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { alt } = req.body;
    if (typeof alt !== 'string') {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Alt text string is required.' } });
      return;
    }

    const updated = await updateMediaAlt(id, alt);
    if (!updated) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Media asset not found.' } });
      return;
    }

    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update alt text.' } });
  }
});

/**
 * DELETE /api/v1/admin/media/:id
 */
adminMediaRouter.delete('/:id', requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteMediaSafely(id);

    if (!result.success) {
      if (result.references && result.references.length > 0) {
        res.status(409).json({
          error: {
            code: 'MEDIA_IN_USE',
            message: `This media item cannot be deleted because it is in use by: ${result.references.join(', ')}. Remove it from these items first.`,
            references: result.references
          }
        });
        return;
      }

      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Media item not found or could not be deleted.' } });
      return;
    }

    res.json({ data: { success: true, message: 'Media deleted successfully.' } });
  } catch (err) {
    console.error('[ADMIN MEDIA DELETE ERROR]', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to delete media asset.' } });
  }
});
