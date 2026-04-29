import fs from 'fs/promises';
import path from 'path';

const uploadsDir = path.join(process.cwd(), 'uploads');

export const ensureUploadsDir = async () => {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch {
    // ignore
  }
};

export const buildPublicImageUrl = (req, filename) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${encodeURIComponent(filename)}`;
};
