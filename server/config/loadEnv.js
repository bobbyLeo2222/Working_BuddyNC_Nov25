import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Ensure we resolve the workspace-local .env file even when scripts run from the repo root
const dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(dirname, '../.env');

if (process.env.NODE_ENV !== 'production') {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.warn('Unable to load server .env file:', result.error.message);
  }
}
