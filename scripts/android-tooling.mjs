import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createWriteStream } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import https from 'node:https';
import { pipeline } from 'node:stream/promises';
import {
  cacheRoot,
  localAndroidSdkRoot,
  localAndroidAvdRoot,
  projectRoot
} from '../src/config/environment.js';

const CMDLINE_TOOLS_XML_URL = 'https://dl.google.com/android/repository/repository2-1.xml';
const GOOGLE_REPO_BASE_URL = 'https://dl.google.com/android/repository';
const DEFAULT_PLATFORM_API = '35';
const DEFAULT_BUILD_TOOLS = '36.0.0';
const DEFAULT_AVD_NAME = 'apidemos-local-api35';

function sleep(ms) {
  return delay(ms);
}

function fileExists(filePath) {
  return Boolean(filePath) && existsSync(filePath);
}

function firstExistingPath(candidates) {
  return candidates.find((candidate) => fileExists(candidate));
}

function tryRun(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (result.status !== 0 || result.error) {
    return null;
  }

  return result.stdout?.trim() || null;
}

function getPlatformToolsArchivePattern() {
  if (process.platform === 'darwin') {
    return /<url>(commandlinetools-mac-[^<]+\.zip)<\/url>/g;
  }

  if (process.platform === 'linux') {
    return /<url>(commandlinetools-linux-[^<]+\.zip)<\/url>/g;
  }

  throw new Error(`Unsupported platform for managed Android SDK bootstrap: ${process.platform}`);
}

export function getManagedSdkRoot() {
  const explicitSdkRoot = firstExistingPath([
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT
  ]);

  if (explicitSdkRoot) {
    return explicitSdkRoot;
  }

  const machineSdkRoot = firstExistingPath([
    resolve(process.env.HOME || '', 'Library', 'Android', 'sdk'),
    resolve(process.env.HOME || '', 'Android', 'Sdk')
  ]);

  return machineSdkRoot || localAndroidSdkRoot;
}

export function getManagedAvdHome() {
  return process.env.ANDROID_AVD_HOME || localAndroidAvdRoot;
}

export function getManagedAvdName() {
  return process.env.ANDROID_AVD_NAME || DEFAULT_AVD_NAME;
}

export function getHostSystemImageAbi() {
  if (process.platform === 'darwin' && process.arch === 'arm64') {
    return 'arm64-v8a';
  }

  return 'x86_64';
}

export function getSystemImageCandidates() {
  const abi = getHostSystemImageAbi();

  return [
    `system-images;android-${DEFAULT_PLATFORM_API};google_apis;${abi}`,
    `system-images;android-${DEFAULT_PLATFORM_API};default;${abi}`
  ];
}

export function getSdkToolPaths(sdkRoot = getManagedSdkRoot()) {
  return {
    sdkRoot,
    adb: resolve(sdkRoot, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb'),
    emulator: resolve(
      sdkRoot,
      'emulator',
      process.platform === 'win32' ? 'emulator.exe' : 'emulator'
    ),
    sdkmanager: resolve(
      sdkRoot,
      'cmdline-tools',
      'latest',
      'bin',
      process.platform === 'win32' ? 'sdkmanager.bat' : 'sdkmanager'
    ),
    avdmanager: resolve(
      sdkRoot,
      'cmdline-tools',
      'latest',
      'bin',
      process.platform === 'win32' ? 'avdmanager.bat' : 'avdmanager'
    )
  };
}

export function getPreferredJavaHome() {
  const modernJavaHome =
    firstExistingPath([
      tryRun('/usr/libexec/java_home', ['-v', '17+']),
      tryRun('/usr/libexec/java_home', ['-v', '21+'])
    ]) || null;

  return modernJavaHome || process.env.JAVA_HOME || null;
}

export function getPreferredJavaBinary() {
  const preferredJavaHome = getPreferredJavaHome();

  return (
    firstExistingPath([
      process.env.JAVA_BINARY,
      preferredJavaHome ? resolve(preferredJavaHome, 'bin', 'java') : undefined,
      '/usr/bin/java'
    ]) || null
  );
}

export function getAndroidEnv(sdkRoot = getManagedSdkRoot()) {
  const toolPaths = getSdkToolPaths(sdkRoot);
  const currentPath = process.env.PATH || '';
  const systemPath = ['/usr/bin', '/bin', '/usr/sbin', '/sbin'];
  const preferredJavaHome = getPreferredJavaHome();

  return {
    ...process.env,
    ANDROID_HOME: sdkRoot,
    ANDROID_SDK_ROOT: sdkRoot,
    ANDROID_AVD_HOME: getManagedAvdHome(),
    JAVA_HOME: preferredJavaHome || process.env.JAVA_HOME,
    SKIP_JDK_VERSION_CHECK: process.env.SKIP_JDK_VERSION_CHECK || '1',
    PATH: [
      ...systemPath,
      dirname(toolPaths.adb),
      dirname(toolPaths.emulator),
      dirname(toolPaths.sdkmanager),
      currentPath
    ].join(':')
  };
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
    ...options
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(' ')}`,
        result.stdout?.trim(),
        result.stderr?.trim()
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  return result.stdout?.trim() || '';
}

async function fetchText(url) {
  return new Promise((resolvePromise, rejectPromise) => {
    https
      .get(url, (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();
          fetchText(response.headers.location).then(resolvePromise).catch(rejectPromise);
          return;
        }

        if (response.statusCode !== 200) {
          rejectPromise(new Error(`Failed to fetch ${url}: ${response.statusCode}`));
          response.resume();
          return;
        }

        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => resolvePromise(data));
      })
      .on('error', rejectPromise);
  });
}

function downloadFile(url, destination) {
  return new Promise((resolvePromise, rejectPromise) => {
    https
      .get(url, (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();
          downloadFile(response.headers.location, destination)
            .then(resolvePromise)
            .catch(rejectPromise);
          return;
        }

        if (response.statusCode !== 200) {
          rejectPromise(new Error(`Failed to download ${url}: ${response.statusCode}`));
          response.resume();
          return;
        }

        const output = createWriteStream(destination);
        pipeline(response, output).then(resolvePromise).catch(rejectPromise);
      })
      .on('error', rejectPromise);
  });
}

async function resolveCommandLineToolsArchiveUrl() {
  const xml = await fetchText(CMDLINE_TOOLS_XML_URL);
  const urls = [...xml.matchAll(getPlatformToolsArchivePattern())].map((match) => match[1]);

  if (urls.length === 0) {
    throw new Error('Could not resolve Android command-line tools archive from repository metadata');
  }

  return `${GOOGLE_REPO_BASE_URL}/${urls[0]}`;
}

function ensureJavaRuntime() {
  const javaBinary = getPreferredJavaBinary();

  if (!javaBinary) {
    throw new Error('Java runtime is required for Android SDK tools. Install Java 17+ and retry.');
  }
}

export async function ensureAndroidCommandLineTools() {
  ensureJavaRuntime();

  const sdkRoot = getManagedSdkRoot();
  const toolPaths = getSdkToolPaths(sdkRoot);

  if (fileExists(toolPaths.sdkmanager)) {
    return sdkRoot;
  }

  const downloadsRoot = resolve(cacheRoot, 'downloads');
  const archivePath = resolve(downloadsRoot, 'android-commandlinetools-latest.zip');
  const extractRoot = resolve(downloadsRoot, 'android-commandlinetools');
  const latestRoot = resolve(sdkRoot, 'cmdline-tools', 'latest');
  const archiveUrl = await resolveCommandLineToolsArchiveUrl();

  mkdirSync(downloadsRoot, { recursive: true });
  mkdirSync(resolve(sdkRoot, 'cmdline-tools'), { recursive: true });

  await downloadFile(archiveUrl, archivePath);
  runCommand('/usr/bin/unzip', ['-oq', archivePath, '-d', extractRoot]);
  runCommand('/bin/rm', ['-rf', latestRoot]);
  runCommand('/bin/mv', [resolve(extractRoot, 'cmdline-tools'), latestRoot]);

  return sdkRoot;
}

function buildSdkManagerArgs(...packages) {
  return [`--sdk_root=${getManagedSdkRoot()}`, '--install', ...packages];
}

function acceptSdkLicenses(sdkmanager, env) {
  runCommand(sdkmanager, [`--sdk_root=${getManagedSdkRoot()}`, '--licenses'], {
    env,
    input: 'y\n'.repeat(200)
  });
}

export function ensureAndroidPackages() {
  const sdkRoot = getManagedSdkRoot();
  const env = getAndroidEnv(sdkRoot);
  const { sdkmanager } = getSdkToolPaths(sdkRoot);

  acceptSdkLicenses(sdkmanager, env);

  runCommand(
    sdkmanager,
    buildSdkManagerArgs(
      'platform-tools',
      'emulator',
      `platforms;android-${DEFAULT_PLATFORM_API}`,
      `build-tools;${DEFAULT_BUILD_TOOLS}`
    ),
    { env }
  );

  for (const systemImage of getSystemImageCandidates()) {
    try {
      runCommand(sdkmanager, buildSdkManagerArgs(systemImage), { env });
      return systemImage;
    } catch (_error) {
      continue;
    }
  }

  throw new Error(
    `Unable to install any supported Android system image: ${getSystemImageCandidates().join(', ')}`
  );
}

export function ensureAvd(systemImagePackage) {
  const sdkRoot = getManagedSdkRoot();
  const env = getAndroidEnv(sdkRoot);
  const avdName = getManagedAvdName();
  const avdConfigPath = resolve(getManagedAvdHome(), `${avdName}.avd`, 'config.ini');
  const { avdmanager } = getSdkToolPaths(sdkRoot);

  mkdirSync(getManagedAvdHome(), { recursive: true });

  if (!fileExists(avdConfigPath)) {
    runCommand(
      avdmanager,
      [
        'create',
        'avd',
        '--force',
        '--name',
        avdName,
        '--package',
        systemImagePackage,
        '--device',
        'pixel_7'
      ],
      {
        env,
        input: 'no\n'
      }
    );
  }

  if (fileExists(avdConfigPath)) {
    const config = readFileSync(avdConfigPath, 'utf8');
    const settings = [
      ['hw.cpu.ncore', '2'],
      ['hw.keyboard', 'yes'],
      ['disk.dataPartition.size', '4G']
    ];

    for (const [key, value] of settings) {
      if (!config.includes(`${key}=`)) {
        appendFileSync(avdConfigPath, `\n${key}=${value}\n`, 'utf8');
      }
    }
  }

  return avdName;
}

function listConnectedDevices(adb, env) {
  const output = runCommand(adb, ['devices'], { env });

  return output
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [serial, state] = line.split(/\s+/);
      return { serial, state };
    });
}

function findRunningEmulatorSerial(adb, env) {
  return listConnectedDevices(adb, env).find(
    (device) => device.serial.startsWith('emulator-') && device.state === 'device'
  )?.serial;
}

function startAdbServer(adb, env) {
  try {
    runCommand(adb, ['start-server'], { env });
  } catch (_error) {
    // Appium and the emulator can still recover if adb is already coming up.
  }
}

export function getBootedEmulatorSerial() {
  const sdkRoot = getManagedSdkRoot();
  const env = getAndroidEnv(sdkRoot);
  const { adb } = getSdkToolPaths(sdkRoot);

  if (!fileExists(adb)) {
    return null;
  }

  return findRunningEmulatorSerial(adb, env) || null;
}

export async function waitForBootCompleted(serial, timeoutMs = 240000) {
  const sdkRoot = getManagedSdkRoot();
  const env = getAndroidEnv(sdkRoot);
  const { adb } = getSdkToolPaths(sdkRoot);
  const startedAt = Date.now();

  runCommand(adb, ['-s', serial, 'wait-for-device'], { env });

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const isBooted = runCommand(adb, ['-s', serial, 'shell', 'getprop', 'sys.boot_completed'], {
        env
      });

      if (isBooted.trim() === '1') {
        runCommand(adb, ['-s', serial, 'shell', 'input', 'keyevent', '82'], { env });
        runCommand(adb, ['-s', serial, 'shell', 'settings', 'put', 'global', 'window_animation_scale', '0.0'], { env });
        runCommand(adb, ['-s', serial, 'shell', 'settings', 'put', 'global', 'transition_animation_scale', '0.0'], { env });
        runCommand(adb, ['-s', serial, 'shell', 'settings', 'put', 'global', 'animator_duration_scale', '0.0'], { env });
        return;
      }
    } catch (_error) {
      // The emulator is still coming up.
    }

    await sleep(2000);
  }

  throw new Error(`Timed out waiting for Android emulator ${serial} to finish booting`);
}

export async function startManagedEmulator() {
  const sdkRoot = getManagedSdkRoot();
  const env = getAndroidEnv(sdkRoot);
  const { adb, emulator } = getSdkToolPaths(sdkRoot);
  const runningSerial = getBootedEmulatorSerial();

  if (runningSerial) {
    return runningSerial;
  }

  startAdbServer(adb, env);

  const args = [
    '-avd',
    getManagedAvdName(),
    '-netdelay',
    'none',
    '-netspeed',
    'full',
    '-no-snapshot',
    '-no-boot-anim',
    '-noaudio',
    '-camera-back',
    'none'
  ];

  if (process.env.ANDROID_EMULATOR_NO_WINDOW !== '0') {
    args.push('-no-window', '-gpu', 'swiftshader_indirect');
  }

  const child = spawn(emulator, args, {
    detached: true,
    stdio: 'ignore',
    env
  });

  child.unref();

  const startedAt = Date.now();
  while (Date.now() - startedAt < 120000) {
    const serial = findRunningEmulatorSerial(adb, env);
    if (serial) {
      return serial;
    }

    await sleep(2000);
  }

  throw new Error('Android emulator did not register with adb in time');
}

export async function ensureManagedAndroidEnvironment() {
  const sdkRoot = await ensureAndroidCommandLineTools();
  const systemImage = ensureAndroidPackages();
  ensureAvd(systemImage);
  const serial = await startManagedEmulator();
  await waitForBootCompleted(serial);

  return {
    sdkRoot,
    avdName: getManagedAvdName(),
    avdHome: getManagedAvdHome(),
    serial
  };
}

export async function setupManagedAndroidOnly() {
  await ensureAndroidCommandLineTools();
  const systemImage = ensureAndroidPackages();

  return {
    sdkRoot: getManagedSdkRoot(),
    avdName: ensureAvd(systemImage),
    avdHome: getManagedAvdHome()
  };
}

export function printManagedAndroidPaths() {
  const sdkRoot = getManagedSdkRoot();
  const avdHome = getManagedAvdHome();
  const tooling = getSdkToolPaths(sdkRoot);

  mkdirSync(dirname(resolve(projectRoot, '.cache', '.keep')), { recursive: true });
  writeFileSync(
    resolve(cacheRoot, 'android-environment.json'),
    JSON.stringify(
      {
        sdkRoot,
        avdHome,
        adb: tooling.adb,
        emulator: tooling.emulator
      },
      null,
      2
    ),
    'utf8'
  );
}
