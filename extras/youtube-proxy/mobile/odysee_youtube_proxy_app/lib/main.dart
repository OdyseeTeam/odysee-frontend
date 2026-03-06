import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'youtube_proxy_server.dart';

const MethodChannel _nativeChannel = MethodChannel('odysee.youtube_proxy/native');

void main() {
  runApp(ProxyApp());
}

class ProxyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Odysee YouTube Proxy',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFFEF6C00),
        accentColor: const Color(0xFFFF8A30),
        scaffoldBackgroundColor: const Color(0xFF0E1016),
        cardColor: const Color(0xFF171B25),
        textTheme: const TextTheme(
          headline: TextStyle(
            fontSize: 30,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
          title: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
          subhead: TextStyle(
            fontSize: 15,
            color: Color(0xFFD0D6E2),
          ),
          body1: TextStyle(
            fontSize: 14,
            color: Color(0xFFE8ECF3),
          ),
        ),
      ),
      home: ProxyHomePage(),
    );
  }
}

class ProxyHomePage extends StatefulWidget {
  @override
  _ProxyHomePageState createState() => _ProxyHomePageState();
}

class _ProxyHomePageState extends State<ProxyHomePage> with WidgetsBindingObserver {
  final YouTubeProxyServer _server = YouTubeProxyServer();
  final TextEditingController _portController = TextEditingController(
    text: defaultProxyPort.toString(),
  );
  final TextEditingController _pairCodeController = TextEditingController();
  final TextEditingController _pairRelayOriginController = TextEditingController(
    text: 'https://odysee.com',
  );

  bool _isBusy = false;
  bool _isRunning = false;
  bool _isPairing = false;
  String _statusText = 'Booting proxy...';
  String _pairStatusText = 'Create a 6-digit code on Odysee, then enter it here to register this phone proxy.';
  String _bindAddress = '';
  List<String> _baseUrls = <String>[];
  List<String> _detectedAddresses = <String>[];
  List<String> _logLines = <String>[];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _nativeChannel.setMethodCallHandler(_handleNativeMethodCall);
    _consumePendingPairingUri();
    _startServer();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _portController.dispose();
    _pairCodeController.dispose();
    _pairRelayOriginController.dispose();
    _server.stop();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _consumePendingPairingUri();
    }
  }

  Future<void> _startServer() async {
    if (_isBusy) return;

    final parsedPort = int.tryParse(_portController.text.trim());
    if (parsedPort == null || parsedPort <= 0) {
      setState(() {
        _statusText = 'Choose a valid port before starting the proxy.';
      });
      return;
    }

    setState(() {
      _isBusy = true;
      _statusText = 'Starting proxy on port $parsedPort...';
    });

    try {
      final detectedAddresses = await findLanAddresses();
      final preferredBindAddress = selectPreferredBindAddress(detectedAddresses);
      final result = await _server.start(
        port: parsedPort,
        securePort: 0,
        bindAddress: preferredBindAddress,
        onLog: _appendLog,
      );

      await _startNativeAdvertisement(
        port: result.port,
        securePort: 0,
      );

      setState(() {
        _isRunning = true;
        _bindAddress = result.bindAddress;
        _baseUrls = result.baseUrls;
        _detectedAddresses = result.detectedAddresses;
        _statusText = _baseUrls.isEmpty
            ? 'Proxy started, but no reachable address was detected yet.'
            : 'Proxy ready on ${result.bindAddress}. Point Odysee at the URL below.';
      });
    } catch (error) {
      setState(() {
        _isRunning = false;
        _bindAddress = '';
        _statusText = 'Failed to start proxy: $error';
      });
    } finally {
      setState(() {
        _isBusy = false;
      });
    }
  }

  Future<void> _stopServer() async {
    if (_isBusy) return;

    setState(() {
      _isBusy = true;
      _statusText = 'Stopping proxy...';
    });

    await _server.stop(onLog: _appendLog);
    await _stopNativeAdvertisement();

    setState(() {
      _isBusy = false;
      _isRunning = false;
      _bindAddress = '';
      _baseUrls = <String>[];
      _detectedAddresses = <String>[];
      _statusText = 'Proxy stopped.';
    });
  }

  Future<void> _refreshAddresses() async {
    final addresses = await findLanAddresses();
    final activePort = _server.port == 0 ? _portController.text.trim() : _server.port.toString();

    setState(() {
      _detectedAddresses = addresses;
      _baseUrls = _bindAddress.isEmpty ? <String>[] : <String>['http://$_bindAddress:$activePort'];
      if (_isRunning) {
        _statusText = _bindAddress.isEmpty
            ? 'Proxy is running, but no active LAN address is bound.'
            : addresses.contains(_bindAddress)
                ? 'Proxy ready on $_bindAddress.'
                : 'Network changed. Restart the proxy to bind a new address.';
      }
    });
  }

  void _appendLog(String message) {
    if (!mounted) return;

    final timestamp = TimeOfDay.now().format(context);
    setState(() {
      _logLines = <String>['[$timestamp] $message', ..._logLines].take(20).toList(growable: false);
    });
  }

  Future<void> _copyUrl(String url) async {
    await Clipboard.setData(ClipboardData(text: url));
    setState(() {
      _statusText = 'Copied $url';
    });
  }

  Future<void> _submitPairing() async {
    if (_isPairing) return;

    final pairCode = _pairCodeController.text.trim();
    if (!RegExp(r'^\d{6}$').hasMatch(pairCode)) {
      setState(() {
        _pairStatusText = 'Enter the 6-digit code shown on Odysee first.';
      });
      return;
    }

    final relayOrigin = _normalizeRelayOrigin(_pairRelayOriginController.text);
    if (relayOrigin == null) {
      setState(() {
        _pairStatusText = 'Enter a valid pairing relay origin first.';
      });
      return;
    }

    final endpoint = _activeProxyUrl;
    if (endpoint == null) {
      setState(() {
        _pairStatusText = 'Start the proxy before pairing this phone.';
      });
      return;
    }

    setState(() {
      _isPairing = true;
      _pairStatusText = 'Registering $endpoint with $relayOrigin...';
    });

    final client = HttpClient();

    try {
      final uri = Uri.parse(relayOrigin).resolve('/\$/api/youtubeProxyPair/v1/register');
      final request = await client.postUrl(uri);
      request.headers.contentType = ContentType('application', 'json', charset: 'utf-8');
      request.write(
        jsonEncode(<String, dynamic>{
          'code': pairCode,
          'endpoint': endpoint,
          'bindAddress': _bindAddress,
          'detectedAddresses': _detectedAddresses,
          'metadata': <String, dynamic>{
            'platform': Platform.operatingSystem,
            'transport': 'http',
          },
        }),
      );

      final response = await request.close();
      final rawResponse = await utf8.decoder.bind(response).join();
      final Map<String, dynamic> json = rawResponse.trim().isEmpty
          ? <String, dynamic>{}
          : Map<String, dynamic>.from(jsonDecode(rawResponse));

      if (response.statusCode < 200 || response.statusCode >= 300 || json['success'] != true) {
        throw Exception(json['error']?.toString() ?? 'Pairing request failed.');
      }

      setState(() {
        _pairStatusText = 'Pairing complete. Odysee should now use $endpoint for mobile proxy mode.';
      });
    } catch (error) {
      setState(() {
        _pairStatusText = 'Pairing failed: $error';
      });
    } finally {
      client.close(force: true);
      setState(() {
        _isPairing = false;
      });
    }
  }

  String get _activeProxyUrl {
    if (_baseUrls.isNotEmpty) {
      return _baseUrls.first;
    }

    final activePort = _server.port == 0 ? _portController.text.trim() : _server.port.toString();
    if (_bindAddress.isEmpty || activePort.isEmpty) {
      return null;
    }

    return 'http://$_bindAddress:$activePort';
  }

  String _normalizeRelayOrigin(String rawOrigin) {
    final trimmed = rawOrigin.trim();
    if (trimmed.isEmpty) {
      return null;
    }

    try {
      final parsed = Uri.parse(trimmed);
      if (!parsed.hasScheme || (parsed.scheme != 'http' && parsed.scheme != 'https')) {
        return null;
      }

      return '${parsed.scheme}://${parsed.authority}';
    } catch (_) {
      return null;
    }
  }

  Future<void> _consumePendingPairingUri() async {
    try {
      final String rawUri = await _nativeChannel.invokeMethod('consumePendingPairingUri');
      _applyPairingUri(rawUri);
    } catch (_) {}
  }

  void _applyPairingUri(String rawUri) {
    if (rawUri == null || rawUri.trim().isEmpty) {
      return;
    }

    try {
      final uri = Uri.parse(rawUri.trim());
      if (uri.scheme != 'odyseeproxy' || uri.host != 'pair') {
        return;
      }

      final pairCode = uri.queryParameters['code'] ?? '';
      final relayOrigin = uri.queryParameters['relay'] ?? '';
      final autoSubmit = uri.queryParameters['auto'] == '1';

      setState(() {
        if (pairCode.isNotEmpty) {
          _pairCodeController.text = pairCode;
        }
        if (relayOrigin.isNotEmpty) {
          _pairRelayOriginController.text = relayOrigin;
        }
        _pairStatusText = pairCode.isNotEmpty
            ? 'Pair code received from QR. Review it below and pair this phone.'
            : _pairStatusText;
      });

      if (autoSubmit && _isRunning && !_isPairing) {
        _submitPairing();
      }
    } catch (error) {
      setState(() {
        _pairStatusText = 'Could not parse the QR pairing link: $error';
      });
    }
  }

  Future<void> _startNativeAdvertisement({int port, int securePort}) async {
    try {
      await _nativeChannel.invokeMethod('startServiceAdvertisement', <String, dynamic>{
        'serviceName': 'odysee-proxy',
        'serviceType': '_odysee-proxy._tcp.',
        'port': port,
        'securePort': securePort,
      });
    } catch (error) {
      _appendLog('Bonjour/NSD advertisement unavailable: $error');
    }
  }

  Future<void> _stopNativeAdvertisement() async {
    try {
      await _nativeChannel.invokeMethod('stopServiceAdvertisement');
    } catch (error) {
      _appendLog('Could not stop native advertisement: $error');
    }
  }

  Future<dynamic> _handleNativeMethodCall(MethodCall call) async {
    switch (call.method) {
      case 'pairingUriUpdated':
        _applyPairingUri(call.arguments is String ? call.arguments : null);
        return null;
      default:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: <Color>[
              Color(0xFF11131A),
              Color(0xFF0A0C11),
              Color(0xFF15111C),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: <Widget>[
              Text('Odysee YouTube Proxy', style: theme.textTheme.headline),
              const SizedBox(height: 8),
              Text(
                'Run this on your phone, keep it open, and let Odysee route YouTube requests through your device.',
                style: theme.textTheme.subhead,
              ),
              const SizedBox(height: 20),
              _buildPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        _buildStatusPill(),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _statusText,
                            style: theme.textTheme.body1,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    Text('Port', style: theme.textTheme.title),
                    const SizedBox(height: 8),
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: TextField(
                            controller: _portController,
                            keyboardType: TextInputType.number,
                            style: theme.textTheme.body1,
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: const Color(0xFF0F131B),
                              hintText: defaultProxyPort.toString(),
                              hintStyle: const TextStyle(color: Color(0xFF7F889B)),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: Color(0xFF343B49)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: Color(0xFF343B49)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: Color(0xFFFF8A30)),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        RaisedButton(
                          color: const Color(0xFFFF8A30),
                          textColor: Colors.black,
                          onPressed: _isBusy ? null : (_isRunning ? _stopServer : _startServer),
                          child: Text(_isRunning ? 'Stop' : 'Start'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _buildPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text('Pair with Odysee', style: theme.textTheme.title),
                    const SizedBox(height: 10),
                    Text(
                      'Create a 6-digit code in Odysee first, then enter it here so the site can store this phone proxy URL automatically. You can also scan the desktop QR with the phone camera to prefill this form.',
                      style: theme.textTheme.body1,
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _pairCodeController,
                      keyboardType: TextInputType.number,
                      style: theme.textTheme.body1,
                      decoration: InputDecoration(
                        labelText: '6-digit pair code',
                        filled: true,
                        fillColor: const Color(0xFF0F131B),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF343B49)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF343B49)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFFFF8A30)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _pairRelayOriginController,
                      keyboardType: TextInputType.url,
                      style: theme.textTheme.body1,
                      decoration: InputDecoration(
                        labelText: 'Pairing relay origin',
                        helperText: 'Use the same origin that created the pair code. If Odysee is on localhost, the phone needs a LAN or public relay URL instead.',
                        filled: true,
                        fillColor: const Color(0xFF0F131B),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF343B49)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF343B49)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFFFF8A30)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: <Widget>[
                        RaisedButton(
                          color: const Color(0xFFFF8A30),
                          textColor: Colors.black,
                          onPressed: _isPairing ? null : _submitPairing,
                          child: Text(_isPairing ? 'Pairing...' : 'Pair'),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _pairStatusText,
                            style: theme.textTheme.body1.copyWith(color: const Color(0xFFAFB7C8)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _buildPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Text('Active Proxy URL', style: theme.textTheme.title),
                        ),
                        FlatButton(
                          textColor: const Color(0xFFFF8A30),
                          onPressed: _refreshAddresses,
                          child: const Text('Refresh'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_baseUrls.isEmpty)
                      Text(
                        'No active LAN URL detected yet. Join Wi-Fi, then tap Refresh.',
                        style: theme.textTheme.body1,
                      ),
                    ..._baseUrls.map(
                      (url) => Container(
                        margin: const EdgeInsets.only(top: 10),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10141D),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFF2C3341)),
                        ),
                        child: Row(
                          children: <Widget>[
                            Expanded(
                              child: Text(
                                url,
                                style: theme.textTheme.body1.copyWith(
                                  fontFamily: Platform.isIOS ? 'Courier' : 'monospace',
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            OutlineButton(
                              borderSide: const BorderSide(color: Color(0xFFFF8A30)),
                              textColor: const Color(0xFFFF8A30),
                              onPressed: () => _copyUrl(url),
                              child: const Text('Copy'),
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (_detectedAddresses.any((address) => address != _bindAddress)) ...<Widget>[
                      const SizedBox(height: 16),
                      Text('Other detected interfaces', style: theme.textTheme.title),
                      const SizedBox(height: 8),
                      Text(
                        'These are visible on the phone, but not active in LAN-only mode.',
                        style: theme.textTheme.body1.copyWith(color: const Color(0xFF8D96AA)),
                      ),
                      ..._detectedAddresses
                          .where((address) => address != _bindAddress)
                          .map(
                            (address) => Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Text(
                                'http://$address:${_server.port == 0 ? _portController.text.trim() : _server.port}',
                                style: theme.textTheme.body1.copyWith(
                                  color: const Color(0xFFAFB7C8),
                                  fontFamily: Platform.isIOS ? 'Courier' : 'monospace',
                                ),
                              ),
                            ),
                          )
                          .toList(growable: false),
                    ],
                    const SizedBox(height: 16),
                    Text(
                      'Use once in Odysee: ?yt_proxy=http://PHONE_IP:${_server.port == 0 ? _portController.text.trim() : _server.port}',
                      style: theme.textTheme.body1.copyWith(color: const Color(0xFFAFB7C8)),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'LAN-only mode binds one private address instead of every network interface. Keep the app open while proxying. iOS will likely suspend the local server in the background.',
                      style: theme.textTheme.body1.copyWith(color: const Color(0xFF8D96AA)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _buildPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text('What it serves', style: theme.textTheme.title),
                    const SizedBox(height: 10),
                    Text(
                      'GET /health',
                      style: theme.textTheme.body1.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'GET /proxy?url=https://www.youtube.com/...&responseType=text|json&timeoutMs=10000',
                      style: theme.textTheme.body1,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _buildPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text('Recent activity', style: theme.textTheme.title),
                    const SizedBox(height: 12),
                    if (_logLines.isEmpty)
                      Text('No requests yet.', style: theme.textTheme.body1),
                    ..._logLines.map(
                      (line) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Text(
                          line,
                          style: theme.textTheme.body1.copyWith(color: const Color(0xFFB8C0D0)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusPill() {
    final isActive = _isRunning && !_isBusy;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFF163A2C) : const Color(0xFF341E1E),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: isActive ? const Color(0xFF4ED49A) : const Color(0xFFFF7A7A),
        ),
      ),
      child: Text(
        isActive ? 'Running' : (_isBusy ? 'Working' : 'Stopped'),
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildPanel({Widget child}) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xCC171B25),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFF2A3140)),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x33000000),
            blurRadius: 24,
            offset: Offset(0, 16),
          ),
        ],
      ),
      child: child,
    );
  }
}

