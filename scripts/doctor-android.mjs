import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { appiumBinary, localAndroidAvdRoot, localAndroidSdkRoot, tarBinary } from '../src/config/environment.js';
import {
  getManagedSdkRoot,
  getManagedAvdHome,
  getPreferredJavaBinary,
  getSdkToolPaths
} from './android-tooling.mjs';

const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || getManagedSdkRoot();
const androidHomeExists = androidHome ? existsSync(androidHome) : false;
const managedTools = getSdkToolPaths(localAndroidSdkRoot);

const candidatePaths = {
  node: ['/usr/local/bin/node', '/opt/homebrew/bin/node'],
  npm: ['/usr/local/bin/npm', '/opt/homebrew/bin/npm'],
  java: [getPreferredJavaBinary()],
  adb: [
    process.env.ADB_BINARY,
    managedTools.adb,
    '/Users/maksymdonets/Library/Android/sdk/platform-tools/adb',
    '/Users/maksymdonets/Android/Sdk/platform-tools/adb',
    androidHome ? `${androidHome}/platform-tools/adb` : undefined
  ],
  emulator: [
    process.env.EMULATOR_BINARY,
    managedTools.emulator,
    '/Users/maksymdonets/Library/Android/sdk/emulator/emulator',
    '/Users/maksymdonets/Android/Sdk/emulator/emulator',
    androidHome ? `${androidHome}/emulator/emulator` : undefined
  ]
};

function findExisting(paths) {
  return paths.find((value) => value && existsSync(value));
}

const diagnostics = [
  ['node', findExisting(candidatePaths.node)],
  ['npm', findExisting(candidatePaths.npm)],
  ['java', findExisting(candidatePaths.java)],
  ['appium', appiumBinary],
  ['tar', tarBinary],
  ['adb', findExisting(candidatePaths.adb)],
  ['emulator', findExisting(candidatePaths.emulator)]
];

let hasError = false;

for (const [label, value] of diagnostics) {
  if (!value || !existsSync(value)) {
    console.error(`[missing] ${label}`);
    hasError = true;
    continue;
  }

  console.log(`[ok] ${label}: ${value}`);
}

if (hasError) {
  if (androidHome) {
    if (androidHomeExists) {
      console.error(`[info] ANDROID_HOME is set: ${androidHome}`);
    } else {
      console.error(`[info] ANDROID_HOME points to a missing directory: ${androidHome}`);
    }
  } else {
    console.error('[info] ANDROID_HOME / ANDROID_SDK_ROOT is not set');
  }

  console.error(`[info] Managed project SDK path: ${localAndroidSdkRoot}`);
  console.error(`[info] Managed project AVD path: ${getManagedAvdHome() || localAndroidAvdRoot}`);
  console.error('[hint] Either export a valid machine SDK root or let the project bootstrap its own SDK');
  console.error('[hint] Managed bootstrap: npm run android:setup');
  console.error('[hint] Full local run with bootstrap: npm test');
  console.error('[hint] Example: export ANDROID_HOME="$HOME/Library/Android/sdk"');
  console.error('[hint] Example: export ADB_BINARY="$ANDROID_HOME/platform-tools/adb"');
  console.error('[hint] Example: export EMULATOR_BINARY="$ANDROID_HOME/emulator/emulator"');
  process.exit(1);
}

const apkCachePath = resolve(process.cwd(), '.cache', 'apps', 'ApiDemos-debug.apk');
if (existsSync(apkCachePath)) {
  console.log(`[ok] apk-cache: ${apkCachePath}`);
} else {
  console.log(`[info] apk-cache will be created on first "npm run app:download" or "npm test"`);
}
