import { spawn } from 'node:child_process';
import { ensureApiDemosApp } from '../src/support/app.js';
import {
  ensureManagedAndroidEnvironment,
  getManagedAvdHome,
  getManagedAvdName,
  getPreferredJavaHome,
  getManagedSdkRoot,
  printManagedAndroidPaths,
  setupManagedAndroidOnly
} from './android-tooling.mjs';

const rawArgs = process.argv.slice(2);
const setupOnly = rawArgs.includes('--setup-only');
const emulatorOnly = rawArgs.includes('--emulator-only');
const killEmulator = rawArgs.includes('--kill-emulator');
const headed = rawArgs.includes('--headed');
const headless = rawArgs.includes('--headless');
const passthroughArgs = rawArgs.filter(
  (arg) =>
    !['--setup-only', '--emulator-only', '--kill-emulator', '--headed', '--headless'].includes(arg)
);

function buildLocalEnv() {
  const sdkRoot = getManagedSdkRoot();
  const systemPath = ['/usr/bin', '/bin', '/usr/sbin', '/sbin'];
  const preferredJavaHome = getPreferredJavaHome();
  const noWindow =
    headed ? '0' : headless ? '1' : process.env.ANDROID_EMULATOR_NO_WINDOW || '1';

  return {
    ...process.env,
    ANDROID_HOME: sdkRoot,
    ANDROID_SDK_ROOT: sdkRoot,
    ANDROID_AVD_HOME: getManagedAvdHome(),
    ANDROID_AVD_NAME: getManagedAvdName(),
    ANDROID_EMULATOR_NO_WINDOW: noWindow,
    JAVA_HOME: preferredJavaHome || process.env.JAVA_HOME,
    SKIP_JDK_VERSION_CHECK: process.env.SKIP_JDK_VERSION_CHECK || '1',
    PATH: [
      ...systemPath,
      `${sdkRoot}/platform-tools`,
      `${sdkRoot}/emulator`,
      `${sdkRoot}/cmdline-tools/latest/bin`,
      process.env.PATH || ''
    ].join(':')
  };
}

function runWdio(args = []) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(
      process.execPath,
      ['./node_modules/@wdio/cli/bin/wdio.js', 'run', './wdio.conf.js', ...args],
      {
        stdio: 'inherit',
        env: buildLocalEnv()
      }
    );

    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`WDIO exited with code ${code ?? 1}`));
    });
  });
}

async function terminateRunningEmulator() {
  const environment = buildLocalEnv();
  const adbPath = `${getManagedSdkRoot()}/platform-tools/adb`;

  const child = spawn(adbPath, ['devices'], {
    env: environment,
    stdio: ['ignore', 'pipe', 'ignore']
  });

  let output = '';
  for await (const chunk of child.stdout) {
    output += chunk.toString();
  }

  const serial = output
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .find((line) => line.startsWith('emulator-') && line.endsWith('device'))
    ?.split(/\s+/)[0];

  if (!serial) {
    console.log('No running emulator found.');
    return;
  }

  await new Promise((resolvePromise, rejectPromise) => {
    const killer = spawn(adbPath, ['-s', serial, 'emu', 'kill'], {
      env: environment,
      stdio: 'inherit'
    });

    killer.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`Failed to stop emulator ${serial}`));
    });
  });
}

try {
  await ensureApiDemosApp();

  if (setupOnly) {
    const setup = await setupManagedAndroidOnly();
    printManagedAndroidPaths();
    console.log(`Managed Android SDK ready: ${setup.sdkRoot}`);
    console.log(`Managed AVD ready: ${setup.avdName}`);
    console.log(`Managed AVD home: ${setup.avdHome}`);
    process.exit(0);
  }

  if (killEmulator) {
    await terminateRunningEmulator();
    process.exit(0);
  }

  const environment = await ensureManagedAndroidEnvironment();
  printManagedAndroidPaths();
  console.log(`Using Android SDK: ${environment.sdkRoot}`);
  console.log(`Using Android AVD: ${environment.avdName}`);
  console.log(`Using emulator serial: ${environment.serial}`);

  if (emulatorOnly) {
    process.exit(0);
  }

  await runWdio(passthroughArgs);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
