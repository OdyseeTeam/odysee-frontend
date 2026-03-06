package com.example.odysee_youtube_proxy_app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.IBinder;

public class ProxyForegroundService extends Service {
  private static final String ACTION_START = "com.example.odysee_youtube_proxy_app.action.START_PROXY_FOREGROUND";
  private static final String ACTION_STOP = "com.example.odysee_youtube_proxy_app.action.STOP_PROXY_FOREGROUND";
  private static final String EXTRA_ENDPOINT = "endpoint";
  private static final String EXTRA_BIND_ADDRESS = "bindAddress";
  private static final String EXTRA_PORT = "port";
  private static final String CHANNEL_ID = "odysee_youtube_proxy_foreground";
  private static final int NOTIFICATION_ID = 3106;

  public static Intent createStartIntent(Context context, String endpoint, String bindAddress, int port) {
    Intent intent = new Intent(context, ProxyForegroundService.class);
    intent.setAction(ACTION_START);
    intent.putExtra(EXTRA_ENDPOINT, endpoint);
    intent.putExtra(EXTRA_BIND_ADDRESS, bindAddress);
    intent.putExtra(EXTRA_PORT, port);
    return intent;
  }

  public static Intent createStopIntent(Context context) {
    Intent intent = new Intent(context, ProxyForegroundService.class);
    intent.setAction(ACTION_STOP);
    return intent;
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    if (intent == null || intent.getAction() == null) {
      stopSelf();
      return START_NOT_STICKY;
    }

    String action = intent.getAction();
    if (ACTION_STOP.equals(action)) {
      stopForeground(true);
      stopSelf();
      return START_NOT_STICKY;
    }

    if (!ACTION_START.equals(action)) {
      return START_NOT_STICKY;
    }

    String endpoint = intent.getStringExtra(EXTRA_ENDPOINT);
    String bindAddress = intent.getStringExtra(EXTRA_BIND_ADDRESS);
    int port = intent.getIntExtra(EXTRA_PORT, 0);

    startForeground(NOTIFICATION_ID, buildNotification(endpoint, bindAddress, port));
    return START_NOT_STICKY;
  }

  @Override
  public void onDestroy() {
    stopForeground(true);
    super.onDestroy();
  }

  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  private Notification buildNotification(String endpoint, String bindAddress, int port) {
    ensureNotificationChannel();

    PackageManager packageManager = getPackageManager();
    Intent launchIntent = packageManager.getLaunchIntentForPackage(getPackageName());
    if (launchIntent == null) {
      launchIntent = new Intent(this, MainActivity.class);
    }

    launchIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

    PendingIntent contentIntent =
        PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                : PendingIntent.FLAG_UPDATE_CURRENT);

    String contentText = endpoint;
    if (contentText == null || contentText.isEmpty()) {
      contentText =
          (bindAddress != null && !bindAddress.isEmpty() && port > 0)
              ? "Serving on http://" + bindAddress + ":" + port
              : "Proxy is running in the background";
    }

    Notification.Builder builder =
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);

    builder
        .setSmallIcon(android.R.drawable.stat_notify_sync_noanim)
        .setContentTitle("Odysee proxy active")
        .setContentText(contentText)
        .setStyle(new Notification.BigTextStyle().bigText(contentText + "\nTap to return to the proxy controls."))
        .setContentIntent(contentIntent)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setShowWhen(false);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      builder.setCategory(Notification.CATEGORY_SERVICE);
      builder.setVisibility(Notification.VISIBILITY_PUBLIC);
    }

    return builder.build();
  }

  private void ensureNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return;
    }

    NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    if (manager == null) {
      return;
    }

    NotificationChannel existing = manager.getNotificationChannel(CHANNEL_ID);
    if (existing != null) {
      return;
    }

    NotificationChannel channel =
        new NotificationChannel(
            CHANNEL_ID,
            "Odysee proxy",
            NotificationManager.IMPORTANCE_LOW);
    channel.setDescription("Keeps the local Odysee YouTube proxy alive while the app is backgrounded.");
    channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
    manager.createNotificationChannel(channel);
  }
}
