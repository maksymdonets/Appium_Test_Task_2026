import { mkdirSync } from 'node:fs';

export function ensureDirectory(directoryPath) {
  mkdirSync(directoryPath, { recursive: true });
}

export function sanitizeFileName(value) {
  return value
    .replace(/[^a-z0-9-_]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}
