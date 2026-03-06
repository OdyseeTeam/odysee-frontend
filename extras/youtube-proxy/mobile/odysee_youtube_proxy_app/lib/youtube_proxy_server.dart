import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

typedef ProxyLogFn = void Function(String message);

const int defaultProxyPort = 19191;
const int defaultSecureProxyPort = 19443;
const int defaultTimeoutMs = 10000;
const int maxTimeoutMs = 15000;
// Watch HTML and youtubei search responses regularly exceed 1MB.
// Keep a modest cap, but high enough for real-world YouTube pages.
const int maxResponseBytes = 4 * 1024 * 1024;
const Set<String> supportedUpstreamMethods = {'GET', 'HEAD', 'POST'};
const Set<String> blockedProxyHeaders = {
  'cookie',
  'authorization',
  'proxy-authorization',
};
const Set<String> allowedExactHosts = {'youtubei.googleapis.com'};
const List<String> secureProxyFallbackHosts = <String>[
  'odysee-proxy.local',
  'odysee.local',
];
const List<String> localProxyFallbackHosts = <String>[
  'odysee-proxy.local',
  'odysee.local',
];

class ProxyRequestConfig {
  final String url;
  final String method;
  final String responseType;
  final int timeoutMs;
  final Map<String, String> headers;
  final String body;

  const ProxyRequestConfig({
    this.url,
    this.method,
    this.responseType,
    this.timeoutMs,
    this.headers,
    this.body,
  });
}

class UpstreamRequestTarget {
  final Uri uri;
  final HttpClientRequest request;

  UpstreamRequestTarget(this.uri, this.request);
}

class ProxyServerStartResult {
  final int port;
  final int securePort;
  final String bindAddress;
  final List<String> detectedAddresses;

  ProxyServerStartResult(this.port, this.securePort, this.bindAddress, this.detectedAddresses);

  List<String> get baseUrls {
    if (bindAddress == null || bindAddress.isEmpty) {
      return <String>[];
    }

    return <String>['http://$bindAddress:$port'];
  }

  List<String> get secureBaseUrls {
    if (bindAddress == null || bindAddress.isEmpty || securePort == null || securePort <= 0) {
      return <String>[];
    }

    return buildSecureAliasUrls(bindAddress, securePort);
  }

  String get secureBaseUrl {
    final urls = secureBaseUrls;
    return urls.isEmpty ? null : urls.first;
  }

  String get secureHostBaseUrl {
    return secureBaseUrl;
  }
}

class YouTubeProxyServer {
  HttpServer _server;
  HttpServer _secureServer;

  bool get isRunning => _server != null || _secureServer != null;

  int get port => _server == null ? 0 : _server.port;
  int get securePort => _secureServer == null ? 0 : _secureServer.port;

  Future<ProxyServerStartResult> start({
    int port = defaultProxyPort,
    int securePort = defaultSecureProxyPort,
    String bindAddress,
    SecurityContext securityContext,
    ProxyLogFn onLog,
  }) async {
    if (_server != null || _secureServer != null) {
      final detectedAddresses = await findLanAddresses();
      return ProxyServerStartResult(
        this.port,
        this.securePort,
        _server.address?.address ?? '',
        detectedAddresses,
      );
    }

    final detectedAddresses = await findLanAddresses();
    final preferredBindAddress = _normalizeBindAddress(bindAddress) ??
        selectPreferredBindAddress(detectedAddresses);
    final targetAddress = preferredBindAddress == null
        ? InternetAddress.anyIPv4
        : InternetAddress(preferredBindAddress);

    _server = await HttpServer.bind(targetAddress, port);
    _server.listen(
      (request) => _handleRequest(request, onLog),
      onError: (error) {
        if (onLog != null) {
          onLog('Server error: $error');
        }
      },
    );

    if (onLog != null) {
      onLog('Listening on ${_server.address.address}:${_server.port}');
    }

    if (securityContext != null) {
      try {
        _secureServer = await HttpServer.bindSecure(targetAddress, securePort, securityContext);
        _secureServer.listen(
          (request) => _handleRequest(request, onLog),
          onError: (error) {
            if (onLog != null) {
              onLog('Secure server error: $error');
            }
          },
        );

        if (onLog != null) {
          onLog('Listening securely on ${_secureServer.address.address}:${_secureServer.port}');
        }
      } catch (error) {
        _secureServer = null;
        if (onLog != null) {
          onLog('Secure listener unavailable: $error');
        }
      }
    }

    return ProxyServerStartResult(
      _server.port,
      this.securePort,
      _server.address.address,
      detectedAddresses,
    );
  }

  Future<void> stop({ProxyLogFn onLog}) async {
    if (_server == null && _secureServer == null) return;

    final server = _server;
    final secureServer = _secureServer;
    _server = null;
    _secureServer = null;

    if (server != null) {
      await server.close(force: true);
    }

    if (secureServer != null) {
      await secureServer.close(force: true);
    }

    if (onLog != null) {
      onLog('Server stopped.');
    }
  }

  Future<void> _handleRequest(HttpRequest request, ProxyLogFn onLog) async {
    _applyCorsHeaders(request.response);

    if (request.method == 'OPTIONS') {
      request.response.statusCode = HttpStatus.noContent;
      await request.response.close();
      return;
    }

    if (request.uri.path == '/health') {
      final secureUrls = buildSecureAliasUrls(_server?.address?.address, securePort);
      await _writeJson(
        request.response,
        HttpStatus.ok,
        <String, dynamic>{
          'ok': true,
          'status': HttpStatus.ok,
          'statusText': 'OK',
          'url': '/health',
          'headers': <String, String>{},
          'responseType': 'json',
          'data': <String, dynamic>{
            'service': 'odysee-youtube-proxy-mobile',
            'running': true,
            'port': port,
            'securePort': securePort,
            'secureHost': secureUrls.isNotEmpty ? Uri.parse(secureUrls.first).host : null,
            'secureHosts': securePort > 0 ? buildSecureAliasHosts(_server?.address?.address) : <String>[],
            'secureUrls': secureUrls,
          },
        },
      );
      return;
    }

    if (request.uri.path != '/proxy') {
      await _writeJson(
        request.response,
        HttpStatus.notFound,
        <String, dynamic>{
          'ok': false,
          'status': HttpStatus.notFound,
          'statusText': 'Not Found',
          'url': request.uri.toString(),
          'headers': <String, String>{},
          'responseType': 'json',
          'data': null,
          'error': 'Unknown endpoint.',
        },
      );
      return;
    }

    if (request.method != 'GET' && request.method != 'HEAD' && request.method != 'POST') {
      await _writeJson(
        request.response,
        HttpStatus.methodNotAllowed,
        <String, dynamic>{
          'ok': false,
          'status': HttpStatus.methodNotAllowed,
          'statusText': 'Method Not Allowed',
          'url': request.uri.toString(),
          'headers': <String, String>{},
          'responseType': 'json',
          'data': null,
          'error': 'Only GET, HEAD, and POST are supported.',
        },
      );
      return;
    }

    ProxyRequestConfig proxyRequest;
    try {
      proxyRequest = await _parseProxyRequest(request);
    } catch (error) {
      await _writeJson(
        request.response,
        HttpStatus.badRequest,
        <String, dynamic>{
          'ok': false,
          'status': HttpStatus.badRequest,
          'statusText': 'Bad Request',
          'url': request.uri.toString(),
          'headers': <String, String>{},
          'responseType': 'json',
          'data': null,
          'error': error.toString(),
        },
      );
      return;
    }

    if (!supportedUpstreamMethods.contains(proxyRequest.method)) {
      await _writeJson(
        request.response,
        HttpStatus.methodNotAllowed,
        <String, dynamic>{
          'ok': false,
          'status': HttpStatus.methodNotAllowed,
          'statusText': 'Method Not Allowed',
          'url': proxyRequest.url,
          'headers': <String, String>{},
          'responseType': proxyRequest.responseType,
          'data': null,
          'error': 'Only GET, HEAD, and POST target methods are supported.',
        },
      );
      return;
    }

    if (!_isAllowedTarget(proxyRequest.url)) {
      await _writeJson(
        request.response,
        HttpStatus.badRequest,
        <String, dynamic>{
          'ok': false,
          'status': HttpStatus.badRequest,
          'statusText': 'Bad Request',
          'url': proxyRequest.url,
          'headers': <String, String>{},
          'responseType': proxyRequest.responseType,
          'data': null,
          'error':
              'Only https://youtube.com/*, https://youtu.be/*, and https://youtubei.googleapis.com/* targets are supported.',
        },
      );
      return;
    }

    final targetUri = Uri.parse(proxyRequest.url);
    final client = HttpClient();
    client.connectionTimeout = Duration(milliseconds: proxyRequest.timeoutMs);
    client.userAgent = 'OdyseeYouTubeProxyMobile/0.1';

    try {
      final upstreamTarget = await _openUpstreamRequestTarget(client, proxyRequest, targetUri);
      final upstreamRequest = upstreamTarget.request;
      final resolvedTargetUri = upstreamTarget.uri;
      upstreamRequest.followRedirects = true;
      upstreamRequest.maxRedirects = 5;
      _applyUpstreamHeaders(upstreamRequest, proxyRequest.headers);

      if (proxyRequest.method == 'POST' && proxyRequest.body != null) {
        upstreamRequest.write(proxyRequest.body);
      }

      final upstreamResponse =
          await upstreamRequest.close().timeout(Duration(milliseconds: proxyRequest.timeoutMs));
      final bytes = proxyRequest.method == 'HEAD'
          ? Uint8List(0)
          : await _readResponseBytes(upstreamResponse, maxResponseBytes);
      final upstreamHeaders = <String, String>{};

      upstreamResponse.headers.forEach((name, values) {
        upstreamHeaders[name] = values.join(', ');
      });

      dynamic data;
      String error;

      if (proxyRequest.method == 'HEAD') {
        data = null;
      } else if (proxyRequest.responseType == 'json') {
        final text = utf8.decode(bytes, allowMalformed: true);
        try {
          data = jsonDecode(text);
        } catch (_) {
          error = 'Upstream response was not valid JSON.';
        }
      } else {
        data = utf8.decode(bytes, allowMalformed: true);
      }

      final isOk = upstreamResponse.statusCode >= 200 && upstreamResponse.statusCode < 300 && error == null;

      await _writeJson(
        request.response,
        isOk ? HttpStatus.ok : HttpStatus.badGateway,
        <String, dynamic>{
          'ok': isOk,
          'status': upstreamResponse.statusCode,
          'statusText': upstreamResponse.reasonPhrase ?? '',
          'url': resolvedTargetUri.toString(),
          'headers': upstreamHeaders,
          'responseType': proxyRequest.responseType,
          'data': error == null ? data : null,
          'error': error,
        },
      );

      if (onLog != null) {
        onLog('${proxyRequest.method} ${resolvedTargetUri.host}${resolvedTargetUri.path} -> ${upstreamResponse.statusCode}');
      }
    } on TimeoutException {
      await _writeJson(
        request.response,
        HttpStatus.gatewayTimeout,
        <String, dynamic>{
          'ok': false,
          'status': HttpStatus.gatewayTimeout,
          'statusText': 'Gateway Timeout',
          'url': targetUri.toString(),
          'headers': <String, String>{},
          'responseType': proxyRequest.responseType,
          'data': null,
          'error': 'Upstream request timed out.',
        },
      );
    } catch (error) {
      await _writeJson(
        request.response,
        HttpStatus.badGateway,
        <String, dynamic>{
          'ok': false,
          'status': HttpStatus.badGateway,
          'statusText': 'Bad Gateway',
          'url': targetUri.toString(),
          'headers': <String, String>{},
          'responseType': proxyRequest.responseType,
          'data': null,
          'error': error.toString(),
        },
      );
    } finally {
      client.close(force: true);
    }
  }
}

Future<UpstreamRequestTarget> _openUpstreamRequestTarget(
  HttpClient client,
  ProxyRequestConfig proxyRequest,
  Uri targetUri,
) async {
  SocketException lastLookupError;
  final attemptedHosts = <String>[];

  for (final candidate in _buildUpstreamTargetCandidates(targetUri)) {
    attemptedHosts.add(candidate.host);

    try {
      // ignore: close_sinks
      final request = await client
          .openUrl(proxyRequest.method, candidate)
          .timeout(Duration(milliseconds: proxyRequest.timeoutMs));
      return UpstreamRequestTarget(candidate, request);
    } on SocketException catch (error) {
      if (!_isHostLookupFailure(error)) {
        rethrow;
      }

      lastLookupError = error;
    }
  }

  if (lastLookupError != null) {
    throw SocketException(
      'Failed host lookup for ${attemptedHosts.join(', ')} (${lastLookupError.message})',
    );
  }

  throw const SocketException('No upstream target could be resolved.');
}

Future<List<String>> findLanAddresses() async {
  final interfaces = await NetworkInterface.list(
    type: InternetAddressType.IPv4,
    includeLoopback: false,
  );
  final addresses = <String>{};

  for (final networkInterface in interfaces) {
    for (final address in networkInterface.addresses) {
      final raw = address.address;
      if (raw.startsWith('169.254.') || raw.startsWith('127.')) {
        continue;
      }

      addresses.add(raw);
    }
  }

  final sorted = addresses.toList()..sort();
  sorted.sort((left, right) {
    final leftRank = _addressRank(left);
    final rightRank = _addressRank(right);

    if (leftRank != rightRank) {
      return leftRank.compareTo(rightRank);
    }

    return left.compareTo(right);
  });

  return sorted;
}

String selectPreferredBindAddress(List<String> addresses) {
  if (addresses == null || addresses.isEmpty) {
    return null;
  }

  for (final address in addresses) {
    if (_isPrivateLanAddress(address)) {
      return address;
    }
  }

  return addresses.first;
}

String _normalizeBindAddress(String bindAddress) {
  final normalized = bindAddress == null ? '' : bindAddress.trim();
  return normalized.isEmpty ? null : normalized;
}

bool _isPrivateLanAddress(String rawAddress) {
  if (rawAddress == null || rawAddress.isEmpty) {
    return false;
  }

  if (rawAddress.startsWith('10.') || rawAddress.startsWith('192.168.')) {
    return true;
  }

  if (!rawAddress.startsWith('172.')) {
    return false;
  }

  final parts = rawAddress.split('.');
  if (parts.length < 2) {
    return false;
  }

  final secondOctet = int.tryParse(parts[1]);
  return secondOctet != null && secondOctet >= 16 && secondOctet <= 31;
}

bool _isCarrierOrOverlayAddress(String rawAddress) {
  if (rawAddress == null || rawAddress.isEmpty) {
    return false;
  }

  final parts = rawAddress.split('.');
  if (parts.length < 2) {
    return false;
  }

  final firstOctet = int.tryParse(parts[0]);
  final secondOctet = int.tryParse(parts[1]);

  if (firstOctet == null || secondOctet == null) {
    return false;
  }

  return firstOctet == 100 && secondOctet >= 64 && secondOctet <= 127;
}

int _addressRank(String rawAddress) {
  if (_isPrivateLanAddress(rawAddress)) {
    return 0;
  }

  if (_isCarrierOrOverlayAddress(rawAddress)) {
    return 2;
  }

  return 1;
}

bool _isIPv4Address(String rawAddress) {
  if (rawAddress == null || rawAddress.isEmpty) {
    return false;
  }

  final parts = rawAddress.split('.');
  if (parts.length != 4) {
    return false;
  }

  for (final part in parts) {
    final parsed = int.tryParse(part);
    if (parsed == null || parsed < 0 || parsed > 255) {
      return false;
    }
  }

  return true;
}

String buildSecureAliasHost(String rawAddress, String domain) {
  if (!_isIPv4Address(rawAddress)) {
    return null;
  }

  return '${rawAddress.split('.').join('-')}.$domain';
}

List<String> buildSecureAliasHosts(String bindAddress) {
  final hosts = <String>[];

  void addHost(String host) {
    final normalized = host == null ? '' : host.trim();
    if (normalized.isNotEmpty && !hosts.contains(normalized)) {
      hosts.add(normalized);
    }
  }

  if (_isIPv4Address(bindAddress) && bindAddress != '127.0.0.1') {
    addHost(buildSecureAliasHost(bindAddress, 'sslip.io'));
    addHost(buildSecureAliasHost(bindAddress, 'nip.io'));
  }

  secureProxyFallbackHosts.forEach(addHost);

  return hosts;
}

List<String> buildLocalAliasHosts() {
  return List<String>.from(localProxyFallbackHosts);
}

List<String> buildLocalAliasUrls(int port) {
  if (port == null || port <= 0) {
    return <String>[];
  }

  return buildLocalAliasHosts().map((host) => 'http://$host:$port').toList(growable: false);
}

List<String> buildSecureAliasUrls(String bindAddress, int securePort) {
  if (securePort == null || securePort <= 0) {
    return <String>[];
  }

  return buildSecureAliasHosts(bindAddress)
      .map((host) => 'https://$host:$securePort')
      .toList(growable: false);
}

bool _isAllowedTarget(String rawUrl) {
  if (rawUrl == null || rawUrl.isEmpty) {
    return false;
  }

  Uri uri;

  try {
    uri = Uri.parse(rawUrl);
  } catch (_) {
    return false;
  }

  if (uri.scheme != 'https') {
    return false;
  }

  final host = uri.host.toLowerCase();
  if (allowedExactHosts.contains(host)) {
    return true;
  }

  return host == 'youtube.com' ||
      host.endsWith('.youtube.com') ||
      host == 'youtu.be' ||
      host.endsWith('.youtu.be');
}

bool _isHostLookupFailure(SocketException error) {
  return error != null && error.message != null && error.message.contains('Failed host lookup');
}

List<Uri> _buildUpstreamTargetCandidates(Uri targetUri) {
  final candidates = <Uri>[targetUri];
  final host = targetUri.host.toLowerCase();
  final isInnertubePath = targetUri.path.startsWith('/youtubei/');

  void addCandidate(String nextHost) {
    if (nextHost == null || nextHost.isEmpty || nextHost == host) {
      return;
    }

    final candidate = targetUri.replace(host: nextHost);
    if (!candidates.any((existing) => existing.toString() == candidate.toString())) {
      candidates.add(candidate);
    }
  }

  if (host == 'www.youtube.com') {
    addCandidate('youtube.com');
    addCandidate('m.youtube.com');
  } else if (host == 'youtube.com') {
    addCandidate('www.youtube.com');
  }

  if (isInnertubePath) {
    addCandidate('youtubei.googleapis.com');
  }

  return candidates;
}

Future<ProxyRequestConfig> _parseProxyRequest(HttpRequest request) async {
  final Map<String, dynamic> requestBody = request.method == 'POST'
      ? await _readJsonRequestBody(request)
      : const <String, dynamic>{};
  final String url = _readStringValue(
        requestBody['url'],
      ) ??
      request.uri.queryParameters['url'] ??
      '';
  final String method = _normalizeMethod(
    _readStringValue(requestBody['method']) ?? request.uri.queryParameters['method'],
  );
  final String responseType =
      (_readStringValue(requestBody['responseType']) ?? request.uri.queryParameters['responseType']) == 'json'
          ? 'json'
          : 'text';
  final int timeoutMs = _clampTimeout(
    _readStringValue(requestBody['timeoutMs']) ?? request.uri.queryParameters['timeoutMs'],
  );

  return ProxyRequestConfig(
    url: url,
    method: method,
    responseType: responseType,
    timeoutMs: timeoutMs,
    headers: _sanitizeProxyHeaders(requestBody['headers']),
    body: _normalizeRequestBody(method, requestBody['body']),
  );
}

Future<Map<String, dynamic>> _readJsonRequestBody(HttpRequest request) async {
  final rawBody = await utf8.decoder.bind(request).join();
  if (rawBody.trim().isEmpty) {
    return <String, dynamic>{};
  }

  final decoded = jsonDecode(rawBody);
  if (decoded is! Map) {
    throw const FormatException('Proxy request body must be a JSON object.');
  }

  return Map<String, dynamic>.from(decoded as Map);
}

String _readStringValue(dynamic value) {
  if (value == null) return null;
  if (value is String) return value;
  return value.toString();
}

String _normalizeMethod(String rawMethod) {
  final normalized = (rawMethod ?? 'GET').toUpperCase();
  return supportedUpstreamMethods.contains(normalized) ? normalized : 'GET';
}

Map<String, String> _sanitizeProxyHeaders(dynamic rawHeaders) {
  if (rawHeaders is! Map) {
    return <String, String>{};
  }

  final headers = <String, String>{};

  rawHeaders.forEach((key, value) {
    final name = key.toString().trim();
    final lowerName = name.toLowerCase();
    final headerValue = value == null ? '' : value.toString().trim();

    if (name.isEmpty || headerValue.isEmpty || blockedProxyHeaders.contains(lowerName)) {
      return;
    }

    headers[name] = headerValue;
  });

  return headers;
}

String _normalizeRequestBody(String method, dynamic rawBody) {
  if (method != 'POST' || rawBody == null) {
    return null;
  }

  if (rawBody is String) {
    return rawBody;
  }

  return jsonEncode(rawBody);
}

void _applyUpstreamHeaders(HttpClientRequest request, Map<String, String> headers) {
  headers.forEach((name, value) {
    if (name.toLowerCase() == 'user-agent') {
      request.headers.set(HttpHeaders.userAgentHeader, value);
      return;
    }

    request.headers.set(name, value);
  });
}

int _clampTimeout(String rawTimeoutMs) {
  final parsed = int.tryParse(rawTimeoutMs ?? '') ?? defaultTimeoutMs;
  if (parsed < 1000) return 1000;
  if (parsed > maxTimeoutMs) return maxTimeoutMs;
  return parsed;
}

void _applyCorsHeaders(HttpResponse response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Allow-Methods', 'GET,HEAD,POST,OPTIONS');
  response.headers.set('Cache-Control', 'no-store');
}

Future<void> _writeJson(HttpResponse response, int statusCode, Map<String, dynamic> body) async {
  response.statusCode = statusCode;
  response.headers.contentType = ContentType('application', 'json', charset: 'utf-8');
  response.write(jsonEncode(body));
  await response.close();
}

Future<Uint8List> _readResponseBytes(HttpClientResponse response, int maxBytes) {
  final completer = Completer<Uint8List>();
  final bytesBuilder = BytesBuilder(copy: false);
  StreamSubscription<List<int>> subscription;

  subscription = response.listen(
    (chunk) {
      if (bytesBuilder.length + chunk.length > maxBytes) {
        subscription.cancel();
        if (!completer.isCompleted) {
          completer.completeError(
            StateError('Response exceeded ${maxBytes ~/ 1024}KB cap.'),
          );
        }
        return;
      }

      bytesBuilder.add(chunk);
    },
    onDone: () {
      if (!completer.isCompleted) {
        completer.complete(Uint8List.fromList(bytesBuilder.takeBytes()));
      }
    },
    onError: (error) {
      if (!completer.isCompleted) {
        completer.completeError(error);
      }
    },
    cancelOnError: true,
  );

  return completer.future;
}
