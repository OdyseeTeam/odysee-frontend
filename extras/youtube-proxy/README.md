# YouTube Proxy Workbench

This folder now holds the two user-run proxy paths we are experimenting with for YouTube requests:

- Browser extension bridge: already implemented elsewhere, but the Odysee web client in this repo can call it now.
- Mobile LAN proxy app: Flutter prototype under `mobile/odysee_youtube_proxy_app`.

## Web-client integration

The shared caller lives in `ui/util/youtubeProxy.js`.

Current modes:

- `auto`: use the mobile proxy if one is configured; otherwise use direct browser fetch; if the extension later exposes a bridge marker, auto can use that too.
- `extension`: force the in-browser extension bridge.
- `mobile`: force the mobile app proxy URL.
- `direct`: bypass both proxy paths.

Current runtime overrides:

- `?yt_proxy=extension`
- `?yt_proxy=direct`
- `?yt_proxy=http://PHONE_IP:19191`
- `?yt_proxy=off`
- `?yt_proxy_mode=extension|mobile|direct|auto`

Those values are persisted into localStorage under:

- `odysee.youtubeProxy.mode`
- `odysee.youtubeProxy.baseUrl`

The first real integration point is `ui/page/claim/internal/claimPageComponent/view.jsx`, where Woo oEmbed loading now goes through `fetchYouTubeJson(...)` instead of raw `fetch(...)`.

## Extension contract

The frontend expects the extension bridge contract you provided:

- request message type: `WATCH_ON_ODYSEE_PROXY_REQUEST`
- response message type: `WATCH_ON_ODYSEE_PROXY_RESPONSE`
- payload fields: `ok`, `status`, `statusText`, `url`, `headers`, `responseType`, `data`, optional `error`

The shared caller now also sends request metadata needed for `youtubei` POST probes:

- `method`: `GET`, `HEAD`, or `POST`
- `headers`: sanitized request headers
- `body`: serialized request body for `POST`

If the extension does not support those fields yet, GET probes will keep working but POST probes will fail in `extension` mode.

For `auto` mode to detect the extension without forcing `?yt_proxy=extension`, the extension should also set a simple bridge marker such as:

```js
window.__WATCH_ON_ODYSEE_PROXY_AVAILABLE__ = true
```

or:

```html
<html data-watch-on-odysee-proxy="true">
```

Without a marker, explicit `extension` mode is the safe path.

## Mobile app contract

The Flutter app exposes:

- `GET /health`
- `GET /proxy?url=...&method=GET|HEAD&responseType=text|json&timeoutMs=10000`
- `POST /proxy` with JSON body:

```json
{
  "url": "https://www.youtube.com/youtubei/v1/search?...",
  "method": "POST",
  "responseType": "json",
  "timeoutMs": 10000,
  "headers": {
    "Content-Type": "application/json",
    "X-YouTube-Client-Name": "1",
    "X-YouTube-Client-Version": "..."
  },
  "body": "{\"context\":{...},\"query\":\"veritasium\"}"
}
```

Its JSON response envelope matches the extension response shape closely so the web client can treat both as the same abstraction.

## Pairing, QR, and local discovery

The test page at `/$/youtube_proxy_test` now supports:

- creating a short-lived 6-digit pair code through the Koa relay
- polling that relay until the phone app registers its current proxy endpoint
- rendering a QR code that opens a dedicated fallback landing page first:

```text
https://odysee.com/$/youtube_proxy_pair?code=123456&relay=https%3A%2F%2Fodysee.com&auto=1
```

That landing page then tries the custom deep link for the app:

```text
odyseeproxy://pair?code=123456&relay=https%3A%2F%2Fodysee.com&auto=1
```

The mobile app now supports that same deep link on both Android and iOS. Scanning the desktop QR with the phone camera should open the app, prefill the pair code and relay origin, and auto-submit when the proxy is already running.

The mobile app also now advertises `_odysee-proxy._tcp` through Android NSD / iOS Bonjour as groundwork for future helper-based discovery.

Current recommendation for the mobile app path is the plain LAN HTTP proxy URL returned by pairing. The secure HTTPS experiment is not part of the active flow right now.
