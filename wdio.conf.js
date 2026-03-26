import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import allureReporter from '@wdio/allure-reporter';
import { getApiDemosAppPath, ensureApiDemosApp } from './src/support/app.js';
import {
  allureResultsDir,
  androidConfig,
  apkPackage,
  appiumBinary,
  junitDir,
  pageSourceDir,
  screenshotsDir,
  wdioConfig
} from './src/config/environment.js';
import { ensureDirectory, sanitizeFileName } from './src/support/artifacts.js';

export const config = {
  runner: 'local',
  specs: ['./test/**/*.spec.js'],
  maxInstances: 1,
  port: wdioConfig.port,
  logLevel: wdioConfig.logLevel,
  bail: 0,
  waitforTimeout: wdioConfig.waitTimeoutMs,
  connectionRetryTimeout: wdioConfig.retryTimeoutMs,
  connectionRetryCount: wdioConfig.retries,
  specsRetryTimeout: 0,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': androidConfig.deviceName,
      'appium:platformVersion': androidConfig.platformVersion,
      'appium:avd': androidConfig.avd,
      'appium:appPackage': apkPackage,
      'appium:appActivity': '.ApiDemos',
      'appium:appWaitActivity': androidConfig.appWaitActivity,
      'appium:autoGrantPermissions': true,
      'appium:noReset': false,
      'appium:fullReset': false,
      'appium:adbExecTimeout': 120000,
      'appium:newCommandTimeout': 120,
      'appium:app': getApiDemosAppPath()
    }
  ],
  services: [
    [
      'appium',
      {
        command: appiumBinary
      }
    ]
  ],
  framework: 'mocha',
  reporters: [
    'spec',
    [
      'junit',
      {
        outputDir: junitDir,
        outputFileFormat: () => 'results.xml'
      }
    ],
    [
      'allure',
      {
        outputDir: allureResultsDir,
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false
      }
    ]
  ],
  mochaOpts: {
    ui: 'bdd',
    timeout: wdioConfig.mochaTimeoutMs
  },
  async onPrepare() {
    ensureDirectory(screenshotsDir);
    ensureDirectory(pageSourceDir);
    ensureDirectory(junitDir);
    ensureDirectory(allureResultsDir);
    await ensureApiDemosApp();
  },
  async beforeTest() {
    await browser.reset();
  },
  afterTest: async function afterTest(test, context, { error }) {
    if (error) {
      const fileName = sanitizeFileName(`${test.parent}_${test.title}`);
      const screenshotPath = resolve(screenshotsDir, `${fileName}.png`);
      const pageSourcePath = resolve(pageSourceDir, `${fileName}.xml`);
      const pageSource = await browser.getPageSource();

      await browser.saveScreenshot(screenshotPath);
      writeFileSync(pageSourcePath, pageSource, 'utf8');
      allureReporter.addAttachment('page-source', pageSource, 'application/xml');
    }
  }
};
