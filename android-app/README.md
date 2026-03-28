# Android wrapper app

This folder contains a small native Android app that wraps the deployed Gym Tracker web app in a `WebView`.

## Why it is a wrapper

The main project is a server-backed Next.js app that depends on API routes and SQLite, so it cannot be turned into a fully offline APK without also moving the backend onto Android. This wrapper points at the live deployment instead:

- `https://gym-tracker-kpasam.fly.dev`

If you deploy the backend somewhere else, update the `BASE_URL` value in `app/build.gradle.kts`.

## Features

- Full-screen Android app shell
- Pull to refresh
- Android back button support
- CSV export downloads into the phone's Downloads folder
- External links open outside the app

## Build in Android Studio

1. Open the `android-app` folder in Android Studio.
2. Let Android Studio sync the Gradle project and install any missing SDK components.
3. Build a debug APK from `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
4. The APK will be generated under `app/build/outputs/apk/debug/`.

## Sideload on a Samsung phone

1. Copy the generated APK to the phone.
2. On the phone, allow installs from the app you used to open the APK.
3. Open the APK and install it.

## Notes

- This workspace does not currently have Java or the Android SDK installed, so the APK could not be generated here.
- The app requires internet access because the workout data and authentication still live on the server.
