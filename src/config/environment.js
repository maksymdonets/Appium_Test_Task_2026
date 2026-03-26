import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function firstExistingPath(candidates) {
  return candidates.find((candidate) => candidate && existsSync(candidate));
}

export const projectRoot = process.cwd();
export const artifactsRoot = resolve(projectRoot, 'artifacts');
export const cacheRoot = resolve(projectRoot, '.cache');
export const localAndroidSdkRoot = resolve(cacheRoot, 'android-sdk');
export const localAndroidAvdRoot = resolve(cacheRoot, 'android-avd');
export const screenshotsDir = resolve(artifactsRoot, 'screenshots');
export const pageSourceDir = resolve(artifactsRoot, 'page-source');
export const junitDir = resolve(artifactsRoot, 'junit');
export const allureResultsDir = resolve(artifactsRoot, 'allure-results');

export const apkPackage = 'io.appium.android.apis';

export const appiumBinary =
  process.env.APPIUM_BINARY ||
  firstExistingPath([
    resolve(projectRoot, 'node_modules', '.bin', 'appium'),
    '/usr/local/bin/appium',
    '/opt/homebrew/bin/appium'
  ]) ||
  'appium';

export const tarBinary =
  process.env.TAR_BINARY || firstExistingPath(['/usr/bin/tar', '/bin/tar']) || 'tar';

export const androidConfig = {
  deviceName: process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
  platformVersion: process.env.ANDROID_PLATFORM_VERSION || undefined,
  avd: process.env.ANDROID_AVD_NAME || 'apidemos-local-api35',
  appWaitActivity: process.env.ANDROID_APP_WAIT_ACTIVITY || `${apkPackage}.*`
};

export const wdioConfig = {
  logLevel: process.env.WDIO_LOG_LEVEL || 'info',
  port: toNumber(process.env.APPIUM_PORT, 4723),
  waitTimeoutMs: toNumber(process.env.WDIO_WAIT_TIMEOUT_MS, 15000),
  mochaTimeoutMs: toNumber(process.env.WDIO_MOCHA_TIMEOUT_MS, 120000),
  retryTimeoutMs: toNumber(process.env.WDIO_RETRY_TIMEOUT_MS, 120000),
  retries: toNumber(process.env.WDIO_RETRY_COUNT, 2)
};
