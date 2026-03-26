# Appium ApiDemos 2026

Production-ready Appium + WebdriverIO suite for the Android `ApiDemos-debug.apk` sample app.

## What changed

- Cleaner page-object architecture with isolated, deterministic specs
- Stable selectors and reusable screen helpers instead of ad-hoc test logic
- Automatic APK download with redirect-safe extraction and local caching
- Failure artifacts for CI and local debugging: screenshots, page source, JUnit XML, Allure results
- GitHub Actions workflow that boots an Android emulator and runs the same suite as local execution
- No AI runtime dependency or cloud AI integration in the test project

## Project structure

- `src/config/environment.js` - runtime configuration and binary resolution
- `src/pages/` - object-style page objects with `routes`, `elements`, and methods on `this`
- `src/support/` - APK/bootstrap/artifact helpers
- `test/*.spec.js` - business-readable test scenarios
- `.github/workflows/android.yml` - CI pipeline for GitHub Actions

## Local prerequisites

- Node.js 20.18.1+
- Android SDK with:
  - `platform-tools`
  - `emulator`
  - at least one bootable Android emulator
- Java 17+ available for Android tooling

## Local run

```bash
npm install
npm run doctor:android
npm test
```

Useful commands:

```bash
npm run app:download
npm run test:smoke
npm run report:allure
```

The APK is downloaded once into `.cache/apps/ApiDemos-debug.apk`.

## Android SDK setup

If `npm run doctor:android` reports missing `adb` or `emulator`, your SDK path is either absent or points to a dead directory.

Typical fix:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export ADB_BINARY="$ANDROID_HOME/platform-tools/adb"
export EMULATOR_BINARY="$ANDROID_HOME/emulator/emulator"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

Then rerun:

```bash
npm run doctor:android
```

If that directory does not exist on your machine, install Android Studio plus:

- Android SDK Platform-Tools
- Android Emulator
- at least one Android system image and AVD

## Environment overrides

The suite can be tuned without code edits:

- `APPIUM_BINARY`
- `APPIUM_PORT`
- `ANDROID_HOME`
- `ANDROID_SDK_ROOT`
- `ANDROID_DEVICE_NAME`
- `ANDROID_PLATFORM_VERSION`
- `ANDROID_AVD_NAME`
- `ADB_BINARY`
- `EMULATOR_BINARY`
- `WDIO_LOG_LEVEL`

## CI

[`android.yml`](./.github/workflows/android.yml) uses GitHub Actions plus `reactivecircus/android-emulator-runner` to:

1. install Node and Java
2. install project dependencies
3. download the APK
4. boot an Android emulator
5. run the Appium suite
6. upload artifacts from `artifacts/`

## Artifacts

On failure the suite stores:

- `artifacts/screenshots/*.png`
- `artifacts/page-source/*.xml`
- `artifacts/junit/results.xml`
- `artifacts/allure-results/*`

## Notes

- `browser.reset()` is executed before every test for isolation.
- The test repository stays clean because the app binary is downloaded at runtime.
