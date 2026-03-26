import { ensureApiDemosApp } from '../src/support/app.js';

try {
  const appPath = await ensureApiDemosApp();
  console.log(appPath);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
