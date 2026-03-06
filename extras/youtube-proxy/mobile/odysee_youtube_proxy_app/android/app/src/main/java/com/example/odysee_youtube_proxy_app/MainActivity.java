package com.example.odysee_youtube_proxy_app;

import android.content.Context;
import android.content.Intent;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.os.Bundle;
import android.os.Build;
import io.flutter.app.FlutterActivity;
import io.flutter.plugin.common.MethodCall;
import io.flutter.plugin.common.MethodChannel;
import io.flutter.plugins.GeneratedPluginRegistrant;

public class MainActivity extends FlutterActivity {
  private static final String CHANNEL = "odysee.youtube_proxy/native";

  private MethodChannel nativeChannel;
  private String pendingPairingUri;
  private NsdManager nsdManager;
  private NsdManager.RegistrationListener registrationListener;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    GeneratedPluginRegistrant.registerWith(this);
    nsdManager = (NsdManager) getSystemService(Context.NSD_SERVICE);
    capturePairingIntent(getIntent());

    nativeChannel = new MethodChannel(getFlutterView(), CHANNEL);
    nativeChannel.setMethodCallHandler(
        new MethodChannel.MethodCallHandler() {
          @Override
          public void onMethodCall(MethodCall call, MethodChannel.Result result) {
            if ("consumePendingPairingUri".equals(call.method)) {
              final String response = pendingPairingUri;
              pendingPairingUri = null;
              result.success(response);
            } else if ("startForegroundProxyService".equals(call.method)) {
              startForegroundProxyService(call, result);
            } else if ("stopForegroundProxyService".equals(call.method)) {
              stopForegroundProxyService();
              result.success(true);
            } else if ("startServiceAdvertisement".equals(call.method)) {
              startServiceAdvertisement(call, result);
            } else if ("stopServiceAdvertisement".equals(call.method)) {
              stopServiceAdvertisement();
              result.success(true);
            } else {
              result.notImplemented();
            }
          }
        });
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    capturePairingIntent(intent);
  }

  @Override
  protected void onDestroy() {
    stopServiceAdvertisement();
    super.onDestroy();
  }

  private void capturePairingIntent(Intent intent) {
    if (intent == null || !Intent.ACTION_VIEW.equals(intent.getAction()) || intent.getData() == null) {
      return;
    }

    pendingPairingUri = intent.getDataString();

    if (nativeChannel != null) {
      nativeChannel.invokeMethod("pairingUriUpdated", pendingPairingUri);
    }
  }

  private void startForegroundProxyService(MethodCall call, MethodChannel.Result result) {
    final String endpoint = call.argument("endpoint");
    final String bindAddress = call.argument("bindAddress");
    final Integer port = call.argument("port");

    Intent intent =
        ProxyForegroundService.createStartIntent(
            this,
            endpoint,
            bindAddress,
            port == null ? 0 : port);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      startForegroundService(intent);
    } else {
      startService(intent);
    }

    result.success(true);
  }

  private void stopForegroundProxyService() {
    stopService(ProxyForegroundService.createStopIntent(this));
  }

  private void startServiceAdvertisement(MethodCall call, MethodChannel.Result result) {
    if (nsdManager == null) {
      result.error("nsd_unavailable", "NsdManager is unavailable on this device.", null);
      return;
    }

    final String serviceName = call.argument("serviceName");
    final String serviceType = call.argument("serviceType");
    final Integer port = call.argument("port");
    final Integer securePort = call.argument("securePort");
    final String secureHost = call.argument("secureHost");

    if (serviceName == null || serviceType == null || port == null) {
      result.error("invalid_args", "serviceName, serviceType, and port are required.", null);
      return;
    }

    stopServiceAdvertisement();

    NsdServiceInfo serviceInfo = new NsdServiceInfo();
    serviceInfo.setServiceName(serviceName);
    serviceInfo.setServiceType(serviceType);
    serviceInfo.setPort(port);

    if (securePort != null && securePort > 0 && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      serviceInfo.setAttribute("secure_port", String.valueOf(securePort));
      if (secureHost != null && !secureHost.isEmpty()) {
        serviceInfo.setAttribute("secure_host", secureHost);
      }
      serviceInfo.setAttribute("path", "/proxy");
    }

    registrationListener =
        new NsdManager.RegistrationListener() {
          @Override
          public void onRegistrationFailed(NsdServiceInfo serviceInfo, int errorCode) {}

          @Override
          public void onUnregistrationFailed(NsdServiceInfo serviceInfo, int errorCode) {}

          @Override
          public void onServiceRegistered(NsdServiceInfo serviceInfo) {}

          @Override
          public void onServiceUnregistered(NsdServiceInfo serviceInfo) {}
        };

    nsdManager.registerService(serviceInfo, NsdManager.PROTOCOL_DNS_SD, registrationListener);
    result.success(true);
  }

  private void stopServiceAdvertisement() {
    if (nsdManager == null || registrationListener == null) {
      return;
    }

    try {
      nsdManager.unregisterService(registrationListener);
    } catch (IllegalArgumentException ignored) {
    }

    registrationListener = null;
  }
}
