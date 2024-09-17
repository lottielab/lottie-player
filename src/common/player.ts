import type { ILottie, LottieJSON, TimeEvent } from '..';
import { DrivenLottieRenderer } from './driven-renderer';
import { PlaybackDriver } from './playback';
import { LottielabInteractivity, isInteractive } from './interactivity';
import { EventEmitter, Listener } from './event';
import { AnimationItem } from 'lottie-web/build/player/lottie_lottielab';

type InteractivePlaybackState = {
  direction: 1 | -1;
  speed: number;
  playing: boolean;
};

type PlayerImpl =
  | { type: 'playback'; driver: PlaybackDriver }
  | {
      type: 'interactive';
      interactivity: LottielabInteractivity;
      playback: InteractivePlaybackState;
    };

/**
 * A base renderer for Lottie animations based on lottie-web. Able to play
 * ordinary Lottie animations, as well as Lotties with Lottielab Interactivity.
 */
export class LottiePlayer implements ILottie {
  protected readonly _renderer: DrivenLottieRenderer;
  protected readonly root: Node & InnerHTML;

  private _impl: PlayerImpl;

  private readonly timeEvent = new EventEmitter<TimeEvent>();
  private readonly timeEventListener = (e: TimeEvent) => {
    if (this._impl.type === 'playback') {
      this.timeEvent.emit(e);
    } else {
      this.timeEvent.emit({
        ...e,
        playhead: this.currentTime,
      });
    }
  };

  constructor(
    root: Node & InnerHTML,
    src?: string | any,
    autoplay?: boolean,
    preserveAspectRatio?: string
  ) {
    this.root = root;
    this._renderer = new DrivenLottieRenderer(root, src, undefined, preserveAspectRatio);

    const playback = new PlaybackDriver();
    if (autoplay) {
      playback.play();
    } else {
      playback.pause();
    }
    this._impl = { type: 'playback', driver: playback };
    this._renderer.driver = playback;
    this.initialize(src, autoplay, preserveAspectRatio);
  }

  initialize(src: string | any, autoplay?: boolean, preserveAspectRatio?: string) {
    this._renderer.timeEvent.removeListener(this.timeEventListener);
    return this._renderer.initialize(src, preserveAspectRatio).then(() => {
      this._renderer.timeEvent.addListener(this.timeEventListener);

      // Sync the impl with the current state of the lottie.
      //
      // If we previously had a user-provided interactivity definition, maintain
      // it.
      //
      // Otherwise, if the lottie is interactive, create an interactive driver
      // for it to enable interactivity.
      //
      // If none of the above apply, the Lottie should be an ordinary playback
      // Lottie. In that case, destroy any existing interactivity (via
      // .toPlayback()).
      if (
        this.interactivity?.hasUserProvidedDefinition() ||
        isInteractive(this._renderer.animationData)
      ) {
        const hadUserProvidedDefinition = this.interactivity?.hasUserProvidedDefinition();
        const oldDefinition = this.interactivity?.definition;
        this.destroyImpl();
        this.createInteractiveImpl();

        if (hadUserProvidedDefinition) {
          this.interactivity!.definition = oldDefinition!;
        }
      } else if (this.interactivity) {
        this.toPlayback();
      }

      if (autoplay) {
        this.play();
      } else {
        this.pause();
      }
    });
  }

  private destroyImpl() {
    if (this._impl.type === 'interactive') {
      this._impl.interactivity._destroy();
    }
  }

  private createPlaybackImpl() {
    this._impl = { type: 'playback', driver: new PlaybackDriver() };
    this._renderer.driver = this._impl.driver;
    this._updateTimeMultiplier();
  }

  private createInteractiveImpl() {
    this._impl = {
      type: 'interactive',
      interactivity: new LottielabInteractivity(
        this.root as HTMLElement,
        this._renderer.animationData
      ),
      playback: {
        direction: 1,
        speed: 1,
        playing: true,
      },
    };
    this._renderer.driver = this._impl.interactivity._getDriver();
    this._updateTimeMultiplier();
  }

  toInteractive() {
    if (this._impl.type === 'interactive') return;
    this.destroyImpl();
    this.createInteractiveImpl();
  }

  toPlayback() {
    if (this._impl.type === 'playback') return;
    this.destroyImpl();
    this.createPlaybackImpl();
  }

  destroy() {
    this.destroyImpl();
    this._renderer.timeEvent.removeListener(this.timeEventListener);
    this._renderer.destroy();
    this.root.innerHTML = '';
  }

  get interactivity(): LottielabInteractivity | undefined {
    return this._impl.type === 'interactive' ? this._impl.interactivity : undefined;
  }

  private _updateTimeMultiplier() {
    if (this._impl.type === 'playback') {
      this._renderer.timeMultiplier = 1.0;
    } else {
      if (this._impl.playback.playing) {
        this._renderer.timeMultiplier = this._impl.playback.speed * this._impl.playback.direction;
      } else {
        this._renderer.timeMultiplier = 0;
      }
    }
  }

  // Methods
  play() {
    if (this._impl.type === 'playback') {
      this._impl.driver.play();
    } else {
      this._impl.playback.playing = true;
      this._updateTimeMultiplier();
    }
  }

  stop() {
    if (this._impl.type === 'playback') {
      this._impl.driver.stop();
    } else {
      this.pause();
    }
  }

  pause() {
    if (this._impl.type === 'playback') {
      this._impl.driver.pause();
    } else {
      this._impl.playback.playing = false;
      this._updateTimeMultiplier();
    }
  }

  seek(timeSeconds: number) {
    if (this._impl.type === 'playback') {
      this._impl.driver.seek(timeSeconds);
      this._renderer.advanceToNow();
    } else {
      console.warn(`[@lottielab/lottie-player] Cannot seek an interactive Lottie`);
    }
  }

  seekToFrame(frame: number) {
    if (this._impl.type === 'playback') {
      this._impl.driver.seekToFrame(frame);
      this._renderer.advanceToNow();
    } else {
      console.warn(`[@lottielab/lottie-player] Cannot seek an interactive Lottie`);
    }
  }

  loopBetween(timeSeconds1: number, timeSeconds2: number) {
    if (this._impl.type === 'playback') {
      this._impl.driver.loopBetween(timeSeconds1, timeSeconds2);
    } else {
      console.warn(`[@lottielab/lottie-player] Cannot loop an interactive Lottie`);
    }
  }

  loopBetweenFrames(frame1: number, frame2: number) {
    if (this._impl.type === 'playback') {
      this._impl.driver.loopBetweenFrames(frame1, frame2);
    } else {
      console.warn(`[@lottielab/lottie-player] Cannot loop an interactive Lottie`);
    }
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
  on(event: 'time', listener: Listener<TimeEvent>): void;
  on(event: 'loop' | 'finish', listener: Listener<undefined>): void;
  on(event: 'time' | 'loop' | 'finish', listener: Listener<any>): void {
    switch (event) {
      case 'loop':
        if (this._impl.type === 'interactive')
          throw new Error("Cannot listen to 'loop' event on an interactive Lottie");
        this._impl.driver.loopEvent.addListener(listener);
        break;
      case 'finish':
        if (this._impl.type === 'interactive')
          throw new Error("Cannot listen to 'finish' event on an interactive Lottie");
        this._impl.driver.finishEvent.addListener(listener);
      case 'time':
        this.timeEvent.addListener(listener);
        break;
    }
  }

  /** Unsubscribes from an event. */
  off(event: 'time' | 'loop' | 'finish', listener: Listener<any>): void {
    switch (event) {
      case 'time':
        this.timeEvent.removeListener(listener);
        break;
      case 'loop':
        if (this._impl.type === 'interactive') return; // no listeners
        this._impl.driver.loopEvent.removeListener(listener);
        break;
      case 'finish':
        if (this._impl.type === 'interactive') return; // no listeners
        this._impl.driver.finishEvent.removeListener(listener);
        break;
    }
  }

  // Getters/Setters

  get playing(): boolean {
    return this._impl.type === 'playback' ? this._impl.driver.playing : this._impl.playback.playing;
  }

  set playing(play: boolean) {
    if (this._impl.type === 'playback') {
      this._impl.driver.playing = play;
    } else {
      this._impl.playback.playing = play;
      this._updateTimeMultiplier();
    }
  }

  get loop(): boolean | number {
    return this._impl.type === 'playback' ? this._impl.driver.loop : false;
  }

  set loop(loop: boolean | number) {
    if (this._impl.type === 'playback') {
      this._impl.driver.loop = loop;
    } else {
      console.warn(`[@lottielab/lottie-player] Cannot set loop on an interactive Lottie`);
    }
  }

  get currentTime(): number {
    switch (this._impl.type) {
      case 'playback':
        return this._impl.driver.currentTime;
      case 'interactive':
        return this._impl.interactivity._getDriver().currentTime;
    }
  }

  set currentTime(time: number) {
    this.seek(time);
  }

  get currentFrame(): number {
    switch (this._impl.type) {
      case 'playback':
        return this._impl.driver.currentFrame;
      case 'interactive':
        return this._impl.interactivity._getDriver().currentFrame;
    }
  }

  set currentFrame(frame: number) {
    this.seekToFrame(frame);
  }

  get frameRate(): number {
    return this._renderer.frameRate;
  }

  get duration(): number {
    return this._renderer.duration;
  }

  get durationFrames(): number {
    return this._renderer.durationInFrames;
  }

  get direction(): 1 | -1 {
    if (this._impl.type === 'playback') {
      return this._impl.driver.direction;
    } else {
      return this._impl.playback.direction;
    }
  }

  set direction(playDirection: 1 | -1) {
    if (this._impl.type === 'playback') {
      this._impl.driver.direction = playDirection;
    } else {
      this._impl.playback.direction = playDirection;
      this._updateTimeMultiplier();
    }
  }

  get speed(): number {
    if (this._impl.type === 'playback') {
      return this._impl.driver.speed;
    } else {
      return this._impl.playback.speed;
    }
  }

  set speed(speed: number) {
    if (this._impl.type === 'playback') {
      this._impl.driver.speed = speed;
    } else {
      this._impl.playback.speed = speed;
      this._updateTimeMultiplier();
    }
  }

  get animation(): AnimationItem {
    return this._renderer.animation;
  }

  get animationData(): LottieJSON | undefined {
    return this._renderer.animationData;
  }
}

export default LottiePlayer;
