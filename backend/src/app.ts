import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import publicRouter from './routes/public';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false
}));

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

app.use(express.json());

// Static uploads with range request support for self-hosted videos
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
app.use('/media', express.static(uploadDir, {
  setHeaders: (res) => {
    res.set('Accept-Ranges', 'bytes');
  }
}));

// Versioned public API
app.use('/api/v1', publicRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

export default app;
