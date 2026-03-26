# Appium ApiDemos 2026

Production-ready Appium + WebdriverIO suite for the Android `ApiDemos-debug.apk` sample app.

## What changed

- Cleaner page-object architecture with isolated, deterministic specs
- Stable selectors and reusable screen helpers instead of ad-hoc test logic
- Automatic APK download with redirect-safe extraction and local caching
- Failure artifacts for CI and local debugging: screenshots, page source, JUnit XML, Allure results
- GitHub Actions workflow that boots an Android emulator and runs the same suite as local execution

## Project structure

- `src/config/environment.js` - runtime configuration and binary resolution
- `src/pages/` - object-style page objects with `routes`, `elements`, and methods on `this`
- `src/support/` - APK/bootstrap/artifact helpers
- `test/*.spec.js` - business-readable test scenarios
- `.github/workflows/android.yml` - CI pipeline for GitHub Actions

## Local prerequisites

- Node.js 20.18.1+
- Java 17+ available for Android tooling

## Local bootstrap

Install dependencies once:

```bash
npm install
```

Prepare the local Android tooling cache:

```bash
npm run android:setup
```

That command downloads and caches everything the project needs:

- `.cache/apps/ApiDemos-debug.apk`
- `.cache/android-sdk`
- `.cache/android-avd`
- `.cache/downloads`

Validate the setup:

```bash
npm run doctor:android
```

## Local commands

Open a visible emulator window:

```bash
npm run android:emulator
```

Open a headless emulator:

```bash
npm run android:emulator:headless
```

Stop a running emulator:

```bash
npm run android:kill
```

Run the full suite with the emulator visible:

```bash
npm test
```

Run the full suite headless:

```bash
npm run test:headless
```

Run only the smoke navigation test:

```bash
npm run test:smoke
```

Run the smoke test headless:

```bash
npm run test:smoke:headless
```

Generate the Allure report:

```bash
npm run report:allure
```

## Recommended local flow

First run on a clean machine:

```bash
npm install
npm run android:setup
npm run doctor:android
npm run android:emulator
npm test
```

Fast headless run:

```bash
npm run test:headless
```

If the emulator is already running, the project reuses it. If it is missing, the project boots it automatically.

## Android SDK behavior

The project prefers a valid machine SDK if one already exists. If not, it falls back to the managed SDK under `.cache/android-sdk`.

You do not need to export `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `ADB_BINARY`, or `EMULATOR_BINARY` for normal project usage. The local runner sets them for you.

## Environment overrides

The suite can be tuned without code edits:

- `APPIUM_BINARY`
- `APPIUM_PORT`
- `ANDROID_HOME`
- `ANDROID_SDK_ROOT`
- `ANDROID_AVD_HOME`
- `ANDROID_DEVICE_NAME`
- `ANDROID_PLATFORM_VERSION`
- `ANDROID_AVD_NAME`
- `ADB_BINARY`
- `EMULATOR_BINARY`
- `WDIO_LOG_LEVEL`

## CI

[`android.yml`](./.github/workflows/android.yml) uses the same repository-local bootstrap flow as local execution:

1. install Node and Java
2. install project dependencies
3. restore or build the managed Android SDK and AVD cache
4. run `npm run android:setup`
5. run `npm run doctor:android`
6. run `npm run test:ci`
7. upload artifacts from `artifacts/`

## Artifacts

On failure the suite stores:

- `artifacts/screenshots/*.png`
- `artifacts/page-source/*.xml`
- `artifacts/junit/results.xml`
- `artifacts/allure-results/*`

## Notes

- The suite restarts the target activity before each test for isolation.
- The test repository stays clean because the app binary and managed Android tooling are downloaded at runtime into `.cache/`.
