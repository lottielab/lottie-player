import lottie, {
  AnimationDirection,
  AnimationItem,
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

    if (name === 'autoplay' && newValue !== oldValue) {
      if (!this.shadowRoot || !this.player) {
        return;
      }
      this.player.autoplay = !(newValue === 'false');
    }

    if (name === 'loop' && newValue !== oldValue) {
      if (!this.shadowRoot || !this.player) {
        return;
      }
      this.player.loop = this.convertLoopAttribute(newValue);
    }
  }

  /**
   * Converts the loop attribute (which can either be null or a string) to either a boolean or a number.
   * When `loop` is true/false it sets whether the animation should loop indefinitely or not.
   * When `loop` is a number, this sets the number of loops the animation should run for.
   * @param loopAttribute - parameter taken from the component's attributes (string | null)
   * @returns boolen | number
   */
  private convertLoopAttribute(loopAttribute: string | null): boolean | number {
    return loopAttribute === null
      ? true
      : isNaN(Number(loopAttribute))
        ? !(loopAttribute === 'false')
        : Number(loopAttribute);
  }

  /**
   * Converts the direction attribute (which can either be null or a string) to a number.
   * The direction dictates the play direction of the animation.
   * A value of `1` represents an animation playing forwards (and is default).
   * A value of `-1` represents an animation playing backwards.
   */
  private convertDirectionAttribute(directionAttribute: number): AnimationDirection {
    return directionAttribute > 0 ? 1 : -1;
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
      // Loop can either be a bool or a number representing the number of loops the animation should run for.
      const loop: boolean | number = this.convertLoopAttribute(this.getAttribute('loop'));
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

  // Methods
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

  seek(time: number) {
    if (this.player) {
      time = time * 1000; // goTo expects milliseconds
      if (this.player.isPaused) {
        this.player.goToAndStop(time, false);
      } else {
        this.player.goToAndPlay(time, false);
      }
    }
  }

  seekToFrame(frame: number) {
    if (this.player) {
      if (this.player.isPaused) {
        this.player.goToAndStop(frame, true);
      } else {
        this.player.goToAndPlay(frame, true);
      }
    }
  }

  loopBetweenFrames(frame1: number, frame2: number) {
    if (this.player) this.player.playSegments([frame1, frame2]);
  }

  // Getters/Setters

  get playing() {
    return this.player ? !this.player.isPaused : false;
  }

  set playing(play: boolean) {
    if (this.player) {
      if (play) {
        this.player.play();
      } else {
        this.player.pause();
      }
    }
  }

  get paused() {
    return this.player ? this.player.isPaused : true;
  }

  set paused(paused: boolean) {
    if (this.player) {
      if (paused) {
        this.player.pause();
      } else {
        this.player.play();
      }
    }
  }

  get currentTime() {
    return this.player ? this.player.currentFrame / this.player.frameRate : 0;
  }

  set currentTime(time) {
    if (this.player) {
      this.seek(time);
    }
  }

  get currentFrame() {
    return this.player ? this.player.currentFrame : 0;
  }

  set currentFrame(frame) {
    if (this.player) {
      this.seekToFrame(frame);
    }
  }

  get duration() {
    return this.player ? this.player.getDuration(false) : 0;
  }

  get durationInFrames() {
    return this.player ? this.player.getDuration(true) : 0;
  }

  get direction() {
    return this.player ? this.player.playDirection : 1;
  }

  set direction(playDirection) {
    if (this.player) {
      this.player.setDirection(this.convertDirectionAttribute(playDirection));
    }
  }

  get speed() {
    return this.player ? this.player.playSpeed : 1;
  }

  set speed(speed) {
    if (this.player) {
      this.setSpeed(speed);
    }
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('lottie-player')) {
  window.customElements.define('lottie-player', LottieWeb);
}

export default LottieWeb;
