// @flow
import * as React from 'react';
import LoadingScreen from 'component/common/loading-screen';
import { WebGLRenderer } from 'three-full/sources/renderers/WebGLRenderer';
import { Scene } from 'three-full/sources/scenes/Scene';
import { PerspectiveCamera } from 'three-full/sources/cameras/PerspectiveCamera';
import { SphereGeometry } from 'three-full/sources/geometries/SphereGeometry';
import { PlaneGeometry } from 'three-full/sources/geometries/PlaneGeometry';
import { BoxGeometry } from 'three-full/sources/geometries/BoxGeometry';
import { MeshBasicMaterial } from 'three-full/sources/materials/MeshBasicMaterial';
import { Mesh } from 'three-full/sources/objects/Mesh';
import { Group } from 'three-full/sources/objects/Group';
import { VideoTexture } from 'three-full/sources/textures/VideoTexture';
import { TextureLoader } from 'three-full/sources/loaders/TextureLoader';
import { Vector3 } from 'three-full/sources/math/Vector3';
import { Color } from 'three-full/sources/math/Color';
import { AmbientLight } from 'three-full/sources/lights/AmbientLight';
import { PointLight } from 'three-full/sources/lights/PointLight';
import detectWebGL from '../threeViewer/internal/detector';

type Props = {
  source: {
    fileType: string,
    downloadPath: string,
  },
  videoSource?: string,
  isVideo?: boolean,
};

type State = {
  error: ?string,
  isReady: boolean,
  isLoading: boolean,
  vrSupported: boolean,
};

class VRViewer extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      error: null,
      isReady: false,
      isLoading: false,
      vrSupported: false,
    };

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.frameID = null;
    this.videoElement = null;
    this.videoScreen = null;
    this.controllers = [];
    this.currentSession = null;
  }

  componentDidMount() {
    if (!detectWebGL()) {
      this.setState({ error: "Sorry, your computer doesn't support WebGL." });
      return;
    }

    if ('xr' in navigator) {
      navigator.xr
        .isSessionSupported('immersive-vr')
        .then((supported) => {
          this.setState({ vrSupported: supported });
          if (supported) {
            this.initScene();
          } else {
            this.setState({ error: 'VR not supported on this device' });
          }
        })
        .catch(() => {
          this.setState({ error: 'Could not check VR support' });
        });
    } else {
      this.setState({ error: 'WebXR not available in this browser' });
    }

    window.addEventListener('resize', this.handleResize, false);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize, false);

    if (this.currentSession) {
      this.currentSession.end();
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement = null;
    }

    cancelAnimationFrame(this.frameID);
  }

  renderer: any;
  scene: any;
  camera: any;
  frameID: any;
  videoElement: any;
  videoScreen: any;
  controllers: Array<any>;
  currentSession: any;
  container: ?HTMLElement;

  initScene = () => {
    this.scene = new Scene();
    this.scene.background = new Color(0x101010);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.set(0, 1.6, 0);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;

    const ambientLight = new AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const pointLight = new PointLight(0xffffff, 1, 100);
    pointLight.position.set(0, 5, 0);
    this.scene.add(pointLight);

    this.createVideoScreen();
    this.createEnvironment();
    this.setupControllers();

    if (this.container) {
      this.container.appendChild(this.renderer.domElement);
    }

    this.setState({ isReady: true });
  };

  createVideoScreen = () => {
    const { videoSource, isVideo } = this.props;

    if (isVideo && videoSource) {
      this.videoElement = document.createElement('video');
      this.videoElement.src = videoSource;
      this.videoElement.crossOrigin = 'anonymous';
      this.videoElement.loop = true;
      this.videoElement.muted = false;

      const videoTexture = new VideoTexture(this.videoElement);
      const videoMaterial = new MeshBasicMaterial({ map: videoTexture });

      const screenGeometry = new PlaneGeometry(16, 9);
      this.videoScreen = new Mesh(screenGeometry, videoMaterial);
      this.videoScreen.position.set(0, 1.6, -10);

      this.scene.add(this.videoScreen);
    } else {
      const geometry = new PlaneGeometry(16, 9);
      const material = new MeshBasicMaterial({ color: 0x333333 });
      this.videoScreen = new Mesh(geometry, material);
      this.videoScreen.position.set(0, 1.6, -10);
      this.scene.add(this.videoScreen);
    }
  };

  createEnvironment = () => {
    const floorGeometry = new PlaneGeometry(50, 50);
    const floorMaterial = new MeshBasicMaterial({ color: 0x222222 });
    const floor = new Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.scene.add(floor);

    const gridSize = 20;
    const gridSpacing = 2;
    for (let i = -gridSize; i <= gridSize; i += gridSpacing) {
      for (let j = -gridSize; j <= gridSize; j += gridSpacing) {
        if (Math.abs(i) < 8 && j > -2 && j < 15) continue;

        const boxGeometry = new BoxGeometry(0.3, 0.3, 0.3);
        const boxMaterial = new MeshBasicMaterial({ color: 0x444444 });
        const box = new Mesh(boxGeometry, boxMaterial);
        box.position.set(i, 0.15, j);
        this.scene.add(box);
      }
    }
  };

  setupControllers = () => {
    const controllerModelFactory = {
      createControllerModel: () => {
        const geometry = new BoxGeometry(0.05, 0.05, 0.15);
        const material = new MeshBasicMaterial({ color: 0x888888 });
        return new Mesh(geometry, material);
      },
    };

    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('selectstart', this.onSelectStart);
      controller.addEventListener('selectend', this.onSelectEnd);
      this.scene.add(controller);
      this.controllers.push(controller);

      const grip = this.renderer.xr.getControllerGrip(i);
      const model = controllerModelFactory.createControllerModel();
      grip.add(model);
      this.scene.add(grip);
    }
  };

  onSelectStart = (event: any) => {
    if (this.videoElement) {
      if (this.videoElement.paused) {
        this.videoElement.play();
      } else {
        this.videoElement.pause();
      }
    }
  };

  onSelectEnd = (event: any) => {};

  handleResize = () => {
    if (!this.camera || !this.renderer) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  enterVR = () => {
    if (!this.renderer) return;

    this.renderer.xr.getSession().then((session) => {
      this.currentSession = session;
    });

    const sessionInit = {
      optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
    };

    navigator.xr
      .requestSession('immersive-vr', sessionInit)
      .then((session) => {
        this.currentSession = session;
        this.renderer.xr.setSession(session);

        if (this.videoElement) {
          this.videoElement.play();
        }

        this.renderer.setAnimationLoop(this.render);
      })
      .catch((error) => {
        this.setState({ error: 'Could not start VR session: ' + error.message });
      });
  };

  render = (time: number, frame: any) => {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  renderComponent() {
    const { error, isReady, isLoading, vrSupported } = this.state;
    const loadingMessage = __('Loading VR environment...');
    const showLoading = isLoading && !error && !isReady;

    return (
      <div className="file-render__viewer file-render__viewer--vr">
        <div
          className="vr-viewer"
          ref={(element) => (this.container = element)}
          style={{ width: '100%', height: '100vh' }}
        >
          {error && <LoadingScreen status={error} spinner={false} />}
          {showLoading && <LoadingScreen status={loadingMessage} spinner />}
          {isReady && vrSupported && (
            <button
              onClick={this.enterVR}
              style={{
                position: 'absolute',
                bottom: '50px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                zIndex: 1000,
              }}
            >
              Enter VR
            </button>
          )}
        </div>
      </div>
    );
  }

  render() {
    return this.renderComponent();
  }
}

export default VRViewer;
