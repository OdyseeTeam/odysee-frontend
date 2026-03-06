# Odysee YouTube Proxy App

This Flutter app runs a small local HTTP proxy on the phone so Odysee in a mobile browser or on a desktop PC can route YouTube requests through the device.

Current behavior:

- Starts a LAN-accessible HTTP server on app launch.
- Shows reachable `http://PHONE_IP:PORT` URLs for the current network.
- Exposes `GET /health`.
- Exposes `GET /proxy?url=...&responseType=text|json&timeoutMs=10000`.
- Restricts upstream targets to `https://youtube.com/*`, `https://*.youtube.com/*`, and `https://youtu.be/*`.
- Adds permissive CORS headers so browsers can call it directly.
- Caps timeouts and response size.

Quick start:

1. Run `flutter pub get`.
2. Run `flutter run`.
3. Keep the app open on the phone.
4. In Odysee, open a page once with `?yt_proxy=http://PHONE_IP:19191`.

Notes:

- This is a foreground-first prototype. iOS will likely suspend the local server after the app backgrounds.
- The Odysee web client in this repo reads `yt_proxy` from the URL and stores it in localStorage for later requests.
