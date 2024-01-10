import lottie, { AnimationItem } from 'lottie-web/build/player/lottie_lottielab';

class LottieWeb extends HTMLElement {
  private player?: AnimationItem;

  static get observedAttributes() {
    return ['src', 'autoplay', 'playing', 'pause', 'loop'];
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

    // handle rest here
  }

  async initializePlayer() {
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
      this.player = lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: !(this.getAttribute('loop') === 'false'),
        autoplay: !(this.getAttribute('autoplay') === 'false'),
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
}

if (typeof window !== 'undefined' && !window.customElements.get('lottie-player')) {
  window.customElements.define('lottie-player', LottieWeb);
}

export default LottieWeb;
