export default function addVolumeMouseWheelListener($videoElement, onVolumeUp, onVolumeDown) {
  $videoElement.addEventListener('wheel', (event) => {
    event.preventDefault();

    if (event.deltaY > 0) {
      onVolumeUp();
    } else if (event.deltaY < 0) {
      onVolumeDown();
    }
  });
}
