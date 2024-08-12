import type { ILottie, LottieJSON, TimeEvent } from '..';
import { LottiePlayer } from '../common/player';
import { AnimationItem } from 'lottie-web/build/player/lottie_lottielab';
import { LottielabInteractivity } from '../common/interactivity';
import { Listener } from '../common/event';

function warn(e: any) {
  // Create an error object if the input is a string so that the stack trace is preserved
  console.warn(`[@lottielab/lottie-player/web]`, typeof e === 'string' ? new Error(e) : e);
}

class LottieWeb extends HTMLElement implements ILottie {
  private lottie: LottiePlayer;

  // Load event
  private loadEvent = new CustomEvent('load', {
    bubbles: true,
    cancelable: false,
  });

  static get observedAttributes() {
    return ['src', 'loop', 'speed', 'direction', 'preserveAspectRatio'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    this.shadowRoot!.appendChild(style);
    this.shadowRoot!.appendChild(container);

    this.lottie = new LottiePlayer(container);
    this.updateStyles();
  }

  private updateStyles() {
    const [w, h] = this.intrinsicSize;
    this.shadowRoot!.querySelector('style')!.textContent = `
      :host { display: inline-block; width: ${w}px; height: ${h}px; }
    `;
  }

  private get intrinsicSize() {
    if (this.lottie.animationData) {
      return [this.lottie.animationData.w, this.lottie.animationData.h];
    } else {
      return [300, 225];
    }
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) {
      return;
    }

    switch (name) {
      case 'src':
        try {
          this.lottie
            .initialize(
              newValue,
              !(this.getAttribute('autoplay') === 'false'),
              this.getAttribute('preserveAspectRatio') ?? undefined
            )
            .then(() => this.dispatchEvent(this.loadEvent))
            .catch((e) => {
              warn(e);
              this.dispatchEvent(
                new CustomEvent('error', { bubbles: true, cancelable: false, detail: e })
              );
            })
            .finally(() => this.updateStyles());
        } catch (e) {
          warn(e);
          this.dispatchEvent(
            new CustomEvent('error', { bubbles: true, cancelable: false, detail: e })
          );
        }
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

  toInteractive() {
    this.lottie.toInteractive();
  }

  toPlayback() {
    this.lottie.toPlayback();
  }

  /**
   * Subcribes to one of the supported events.
   *
   * 'loop' fires when the animation loops around.
   * 'finish' fires when the animation reaches the end.
   * 'time' fires whenever a frame passes, and has a `TimeEvent` argument which
   * gives information about the passage of time since the last time event.
   *
   * If the Lottie is interactive (`.interactivity` is defined), only the 'time'
   * event works. In that case, use the `interactivity` object to listen to
   * events pertaining to the interactive Lottie.
   */
  on(event: 'time' | 'loop' | 'finish', listener: Listener<any>): void {
    switch (event) {
      case 'time':
        this.lottie.on(event, listener);
        break;

      case 'loop':
      case 'finish':
        this.lottie.on(event, listener);
    }
  }

  /** Unsubscribes from one of the supported events. */
  off(event: 'time' | 'loop' | 'finish', listener: Listener<any>): void {
    this.lottie.off(event, listener);
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
  get durationFrames(): number {
    return this.lottie.durationFrames;
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

  get animation(): AnimationItem {
    return this.lottie.animation;
  }

  get animationData(): LottieJSON | undefined {
    return this.lottie.animationData;
  }

  get interactivity(): LottielabInteractivity | undefined {
    return this.lottie.interactivity;
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('lottie-player')) {
  window.customElements.define('lottie-player', LottieWeb);
}

export default LottieWeb;
export { ILottie };
