import { Router } from 'express';
import {
  getProfile,
  getCategories,
  getItems,
  getProjectBySlug,
  getArticleBySlug,
  getSitemapData
} from '../controllers/publicController';

const router = Router();

router.get('/profile', getProfile);
router.get('/categories', getCategories);
router.get('/items', getItems);
router.get('/projects/:slug', getProjectBySlug);
router.get('/articles/:slug', getArticleBySlug);
router.get('/sitemap', getSitemapData);

export default router;
