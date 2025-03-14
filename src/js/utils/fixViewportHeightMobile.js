export default function fixViewportHeightMobile() {
  function setViewportHeight() {
    document.documentElement.style.setProperty(
      '--viewport-height',
      `${window.innerHeight}px`,
    );
  }

  setViewportHeight();

  window.addEventListener('orientationchange', setViewportHeight);
  window.addEventListener('resize', setViewportHeight);
}
