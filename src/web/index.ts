import LottiePlayer, { ILottie, LottieData } from '../common/player';
import { AnimationItem } from 'lottie-web/build/player/lottie_lottielab';

function warn(message: string) {
  console.warn(`[@lottielab/lottie-player/web] ${message}`);
}

class LottieWeb extends HTMLElement implements ILottie {
  private lottie: LottiePlayer;

  static get observedAttributes() {
    return ['src', 'loop', 'speed', 'direction'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.lottie = new LottiePlayer(this.shadowRoot!);
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) {
      return;
    }

    switch (name) {
      case 'src':
        this.lottie.initialize(newValue, !(this.getAttribute('autoplay') === 'false'));
        break;
      case 'loop':
        this.lottie.loop = this.convertLoopAttribute(newValue);
        break;
      case 'direction':
        this.lottie.direction = this.convertDirectionAttribute(newValue);
        break;
      case 'speed':
        const value = parseFloat(newValue);
        if (!isNaN(value)) {
          this.lottie.speed = parseFloat(newValue);
        } else {
          warn(`Invalid speed value: ${newValue}`);
          this.lottie.speed = 1;
        }

        break;
    }
  }

  /**
   * Converts the loop attribute (which can either be null or a string) to either a boolean or a number.
   * When `loop` is true/false it sets whether the animation should loop indefinitely or not.
   * When `loop` is a number, this sets the number of loops the animation should run for.
   * @param loopAttribute - parameter taken from the component's attributes (string | null)
   * @returns boolean | number
   */
  private convertLoopAttribute(loopAttribute: string): boolean | number {
    switch (loopAttribute) {
      case 'true':
      case '':
        return true;
      case 'false':
        return false;
      default:
        const num = +loopAttribute;
        if (isNaN(num)) {
          warn(`Invalid loop value: ${loopAttribute}`);
          return true;
        }

        if (num < 0) {
          warn(`Invalid loop value (negative): ${loopAttribute}`);
          return true;
        }

        if (Math.floor(num) !== num) {
          warn(`Non-integer loop values are not supported: ${loopAttribute}`);
        }

        return Math.round(num);
    }
  }

  /**
   * Converts the direction attribute (which can either be null or a string) to a number.
   * The direction dictates the play direction of the animation.
   * A value of `1` represents an animation playing forwards (and is default).
   * A value of `-1` represents an animation playing backwards.
   */
  private convertDirectionAttribute(directionAttribute: string): 1 | -1 {
    if (['normal', 'forwards'].includes(directionAttribute)) {
      return 1;
    } else if (['reverse', 'backwards'].includes(directionAttribute)) {
      return -1;
    }

    const num = +directionAttribute;
    if (isNaN(num)) {
      warn(`Invalid direction value: ${directionAttribute}`);
      return 1;
    }

    if (num === 1 || num === -1) {
      return num;
    } else {
      warn(`Invalid direction value: ${directionAttribute}`);
      return 1;
    }
  }

  disconnectedCallback() {
    this.lottie.destroy();
  }

  // Methods
  play() {
    this.lottie.play();
  }
  stop() {
    this.lottie.stop();
  }
  pause() {
    this.lottie.pause();
  }

  seek(timeSeconds: number) {
    this.lottie.seek(timeSeconds);
  }
  seekToFrame(frame: number) {
    this.lottie.seekToFrame(frame);
  }

  loopBetween(timeSeconds1: number, timeSeconds2: number) {
    this.lottie.loopBetween(timeSeconds1 * 1000, timeSeconds2 * 1000);
  }
  loopBetweenFrames(frame1: number, frame2: number) {
    this.lottie.loopBetweenFrames(frame1, frame2);
  }

  // Getters/Setters

  get playing(): boolean {
    return this.lottie.playing;
  }
  set playing(play: boolean) {
    this.lottie.playing = play;
  }

  get loop(): boolean | number {
    return this.lottie.loop;
  }
  set loop(loop: boolean | number) {
    this.lottie.loop = loop;
  }

  get currentTime(): number {
    return this.lottie.currentTime;
  }
  set currentTime(time: number) {
    this.lottie.currentTime = time;
  }

  get currentFrame(): number {
    return this.lottie.currentFrame;
  }
  set currentFrame(frame: number) {
    this.lottie.currentFrame = frame;
  }

  get frameRate(): number {
    return this.lottie.frameRate;
  }

  get duration(): number {
    return this.lottie.duration;
  }
  get durationInFrames(): number {
    return this.lottie.durationInFrames;
  }

  get direction(): 1 | -1 {
    return this.lottie.direction;
  }
  set direction(direction: 1 | -1) {
    this.lottie.direction = direction;
  }

  get speed(): number {
    return this.lottie.speed;
  }
  set speed(speed: number) {
    this.lottie.speed = speed;
  }

  get animation(): AnimationItem | undefined {
    return this.lottie.animation;
  }

  get animationData(): LottieData | undefined {
    return this.lottie.animationData;
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('lottie-player')) {
  window.customElements.define('lottie-player', LottieWeb);
}

export default LottieWeb;
export { ILottie };
