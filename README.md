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

- `AGENTS.md` - local repository agent operating model
- `src/config/environment.js` - runtime configuration and binary resolution
- `src/pages/` - object-style page objects with `routes`, `elements`, and methods on `this`
- `src/support/` - APK/bootstrap/artifact helpers
- `test/*.spec.js` - business-readable test scenarios
- `skills/` - local-only agent skills and manifests
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

## Environment overrides

The suite can be tuned without code edits:

- `APPIUM_BINARY`
- `APPIUM_PORT`
- `ANDROID_DEVICE_NAME`
- `ANDROID_PLATFORM_VERSION`
- `ANDROID_AVD_NAME`
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
- Agent instructions and AI-related manifests are local to the repository; no cloud AI integration is required by this project.
