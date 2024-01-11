import lottie, {
  AnimationDirection,
  AnimationItem,
  AnimationSegment,
} from 'lottie-web/build/player/lottie_lottielab';

class LottieWeb extends HTMLElement {
  private player?: AnimationItem;

  static get observedAttributes() {
    return ['src', 'autoplay', 'loop'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.initializePlayer();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'src' && newValue !== oldValue) {
      this.initializePlayer();
    }
  }

  private async initializePlayer() {
    if (!this.shadowRoot) {
      return;
    }

    if (this.player) {
      this.player.destroy();
      this.player = undefined;
    }

    // Clear existing content
    this.shadowRoot.innerHTML = '';

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    this.shadowRoot.appendChild(container);

    let animationData = null;
    const src = this.getAttribute('src');

    if (src) {
      const response = await fetch(src);
      animationData = await response.json();
    }

    if (animationData) {
      const loopAttribute = this.getAttribute('loop');
      // Loop can either be a bool or a number representing the number of loops the animation should run for.
      const loop: boolean | number =
        loopAttribute === null
          ? true
          : isNaN(Number(loopAttribute))
            ? !(loopAttribute === 'false')
            : Number(loopAttribute);

      this.player = lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        autoplay: !(this.getAttribute('autoplay') === 'false'),
        loop,
        animationData: animationData,
      });
    }
  }

  disconnectedCallback() {
    if (this.player) {
      this.player.destroy();
      this.player = undefined;
    }
  }

  // Expose Lottie methods
  play() {
    if (this.player) this.player.play();
  }

  stop() {
    if (this.player) this.player.stop();
  }

  pause() {
    if (this.player) this.player.pause();
  }

  setSpeed(speed: number) {
    if (this.player) this.player.setSpeed(speed);
  }

  goToAndStop(value: number, isFrame: boolean = false) {
    if (this.player) this.player.goToAndStop(value, isFrame);
  }

  goToAndPlay(value: number, isFrame: boolean = false) {
    if (this.player) this.player.goToAndPlay(value, isFrame);
  }

  setDirection(direction: AnimationDirection) {
    if (this.player) this.player.setDirection(direction);
  }

  playSegments(segments: AnimationSegment | AnimationSegment[], forceFlag: boolean) {
    if (this.player) this.player.playSegments(segments, forceFlag);
  }

  setSubframe(useSubFrames: boolean) {
    if (this.player) this.player.setSubframe(useSubFrames);
  }

  destroy() {
    if (this.player) this.player.destroy();
  }

  getDuration(inFrames: boolean): number {
    return this.player ? this.player.getDuration(inFrames) : 0;
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('lottie-player')) {
  window.customElements.define('lottie-player', LottieWeb);
}

export default LottieWeb;
