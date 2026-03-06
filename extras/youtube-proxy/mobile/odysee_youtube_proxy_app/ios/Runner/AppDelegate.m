#include "AppDelegate.h"
#include "GeneratedPluginRegistrant.h"

@interface AppDelegate () <NSNetServiceDelegate>
@property(nonatomic, strong) FlutterMethodChannel *nativeChannel;
@property(nonatomic, strong) NSString *pendingPairingUri;
@property(nonatomic, strong) NSNetService *proxyService;
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  BOOL result = [super application:application didFinishLaunchingWithOptions:launchOptions];
  [GeneratedPluginRegistrant registerWithRegistry:self];

  FlutterViewController *controller = (FlutterViewController *)self.window.rootViewController;
  __weak typeof(self) weakSelf = self;
  self.nativeChannel = [FlutterMethodChannel methodChannelWithName:@"odysee.youtube_proxy/native"
                                                   binaryMessenger:controller];

  [self.nativeChannel setMethodCallHandler:^(FlutterMethodCall *call, FlutterResult flutterResult) {
    if ([@"consumePendingPairingUri" isEqualToString:call.method]) {
      NSString *value = weakSelf.pendingPairingUri;
      weakSelf.pendingPairingUri = nil;
      flutterResult(value);
    } else if ([@"startServiceAdvertisement" isEqualToString:call.method]) {
      [weakSelf startServiceAdvertisement:call.arguments result:flutterResult];
    } else if ([@"stopServiceAdvertisement" isEqualToString:call.method]) {
      [weakSelf stopServiceAdvertisement];
      flutterResult(@YES);
    } else {
      flutterResult(FlutterMethodNotImplemented);
    }
  }];

  NSURL *launchUrl = launchOptions[UIApplicationLaunchOptionsURLKey];
  if (launchUrl != nil) {
    [self capturePairingURL:launchUrl];
  }

  return result;
}

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options {
  [self capturePairingURL:url];
  return [super application:application openURL:url options:options];
}

- (void)capturePairingURL:(NSURL *)url {
  if (url == nil) {
    return;
  }

  self.pendingPairingUri = url.absoluteString;

  if (self.nativeChannel != nil) {
    [self.nativeChannel invokeMethod:@"pairingUriUpdated" arguments:self.pendingPairingUri];
  }
}

- (void)startServiceAdvertisement:(NSDictionary *)arguments result:(FlutterResult)flutterResult {
  NSString *serviceName = arguments[@"serviceName"];
  NSString *serviceType = arguments[@"serviceType"];
  NSNumber *port = arguments[@"port"];
  NSNumber *securePort = arguments[@"securePort"];
  NSString *secureHost = arguments[@"secureHost"];

  if (serviceName.length == 0 || serviceType.length == 0 || port == nil) {
    flutterResult([FlutterError errorWithCode:@"invalid_args"
                                      message:@"serviceName, serviceType, and port are required."
                                      details:nil]);
    return;
  }

  [self stopServiceAdvertisement];

  self.proxyService = [[NSNetService alloc] initWithDomain:@"local."
                                                      type:serviceType
                                                      name:serviceName
                                                      port:port.intValue];
  self.proxyService.delegate = self;

  NSMutableDictionary *records = [NSMutableDictionary dictionary];
  records[@"path"] = [@"/proxy" dataUsingEncoding:NSUTF8StringEncoding];
  if (securePort != nil && securePort.intValue > 0) {
    records[@"secure_port"] = [[securePort stringValue] dataUsingEncoding:NSUTF8StringEncoding];
    if (secureHost.length > 0) {
      records[@"secure_host"] = [secureHost dataUsingEncoding:NSUTF8StringEncoding];
    }
  }

  NSData *txtData = [NSNetService dataFromTXTRecordDictionary:records];
  if (txtData != nil) {
    [self.proxyService setTXTRecordData:txtData];
  }

  [self.proxyService publish];
  flutterResult(@YES);
}

- (void)stopServiceAdvertisement {
  if (self.proxyService != nil) {
    [self.proxyService stop];
    self.proxyService = nil;
  }
}

@end
