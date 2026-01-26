# Android TWA wrapper

This directory contains the Trusted Web Activity (TWA) Android wrapper for Brooks AI HUB.

## Notes

- The Gradle wrapper JAR is intentionally **not** committed because large binaries are not supported in this repo.
- When running builds in CI, the Gradle wrapper will download the required distribution defined in
  `gradle/wrapper/gradle-wrapper.properties`.

## Build (CI/locally)

```bash
cd android
./gradlew assembleRelease
```

Set the following environment variables for signing:

- `TWA_KEYSTORE`
- `TWA_KEYSTORE_PASSWORD`
- `TWA_KEY_ALIAS`
- `TWA_KEY_PASSWORD`
