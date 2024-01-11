import lottie, { AnimationItem } from 'lottie-web/build/player/lottie_lottielab';

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
}

if (typeof window !== 'undefined' && !window.customElements.get('lottie-player')) {
  window.customElements.define('lottie-player', LottieWeb);
}

export default LottieWeb;
