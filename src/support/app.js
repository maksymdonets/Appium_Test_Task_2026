import { createWriteStream, existsSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pipeline } from 'node:stream/promises';
import https from 'node:https';
import { spawnSync } from 'node:child_process';
import { tarBinary } from '../config/environment.js';

const APP_NAME = 'android-apidemos';
const APP_VERSION = '5.0.0';
const APK_NAME = 'ApiDemos-debug.apk';
const APK_URL = `https://registry.npmjs.org/${APP_NAME}/-/${APP_NAME}-${APP_VERSION}.tgz`;
const CACHE_DIR = resolve(process.cwd(), '.cache', 'apps');
const APP_PATH = resolve(CACHE_DIR, APK_NAME);

function download(url, destination, redirectDepth = 0) {
  return new Promise((resolvePromise, rejectPromise) => {
    const request = https.get(url, (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        if (redirectDepth > 5) {
          rejectPromise(new Error('Too many redirects while downloading the app tarball'));
          response.resume();
          return;
        }

        response.resume();
        resolvePromise(download(response.headers.location, destination, redirectDepth + 1));
        return;
      }

      if (response.statusCode !== 200) {
        rejectPromise(new Error(`Failed to download app tarball: ${response.statusCode}`));
        response.resume();
        return;
      }

      const fileStream = createWriteStream(destination);
      pipeline(response, fileStream).then(resolvePromise).catch(rejectPromise);
    });

    request.on('error', rejectPromise);
  });
}

async function extractApk(tarballPath, outputDir) {
  const extractedDir = resolve(outputDir, `android-apidemos-${APP_VERSION}`);
  rmSync(extractedDir, { recursive: true, force: true });
  mkdirSync(extractedDir, { recursive: true });

  const tarResult = spawnSync(tarBinary, ['-xzf', tarballPath, '-C', extractedDir], {
    stdio: 'inherit'
  });

  if (tarResult.status !== 0) {
    throw new Error('Failed to extract the ApiDemos tarball');
  }

  const extractedApk = resolve(extractedDir, 'package', 'apks', APK_NAME);
  await fs.access(extractedApk);
  rmSync(APP_PATH, { force: true });
  copyFileSync(extractedApk, APP_PATH);
  rmSync(extractedDir, { recursive: true, force: true });
  return APP_PATH;
}

export async function ensureApiDemosApp() {
  if (existsSync(APP_PATH)) {
    const stats = await fs.stat(APP_PATH);
    if (stats.size > 0) {
      return APP_PATH;
    }
  }

  mkdirSync(CACHE_DIR, { recursive: true });
  const tmpRoot = resolve(tmpdir(), 'appium-test-task-2026');
  mkdirSync(tmpRoot, { recursive: true });
  const tarballPath = join(tmpRoot, `${APP_NAME}-${APP_VERSION}.tgz`);

  await download(APK_URL, tarballPath);
  return extractApk(tarballPath, CACHE_DIR);
}

export function getApiDemosAppPath() {
  return APP_PATH;
}

export function getApiDemosPackageName() {
  return APP_PACKAGE;
}
