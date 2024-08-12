import type { LottieDriver, LottieState } from './driver';
import { LottieRenderer } from './renderer';
import { Morphing } from './morphing';
import { AnimationItem } from 'lottie-web/build/player/lottie_lottielab';
import type { LottieJSON, TimeEvent } from '..';
import { EventEmitter } from './event';

function getRealTime() {
  return performance?.now() || new Date().getTime();
}

/**
 * A Lottie renderer based on LottieRenderer, which additionally accepts a
 * LottieDriver. This renderer will call its driver's `advance` method as
 * frames pass, and display the returned state. It additionally supports
 * displaying complex morphed states (@see Morphing)
 *
 * @see LottieRenderer
 * @see LottieDriver
 */
export class DrivenLottieRenderer<D extends LottieDriver = LottieDriver> {
  private renderer: LottieRenderer;
  private morphing?: Morphing;
  private _state: LottieState;
  private _driver?: D;
  private animationFrame: number | undefined = undefined;
  private prevTime?: DOMHighResTimeStamp;
  private prevRealTime?: number;
  private prevClock?: number;
  private onFrameBound: FrameRequestCallback = this.onFrame.bind(this);

  public timeMultiplier: number = 1;

  public readonly timeEvent = new EventEmitter<TimeEvent>();

  constructor(init: Node & InnerHTML, src: string | any, driver?: D, preserveAspectRatio?: string) {
    this.renderer = new LottieRenderer(init, src, preserveAspectRatio);
    this._state = {
      time: 0,
      lottie: this.renderer.animationData,
    };

    if (driver) {
      this.animationFrame = requestAnimationFrame(this.onFrameBound);
      this.driver = driver;
    }
  }

  initialize(src: string | any, preserveAspectRatio?: string) {
    return this.renderer
      .initialize(src, preserveAspectRatio)
      .then(() => {
        if (this.animationFrame === undefined) {
          this.animationFrame = requestAnimationFrame(this.onFrameBound);
        }
        this.advanceToNow();
        this._state.lottie = this.renderer.animationData;
        this.refresh();
      })
      .catch((e) => {
        this._state.lottie = undefined;
      });
  }

  get state(): LottieState {
    return this._state;
  }

  refresh() {
    this.morphing?.detach();
    this.morphing = undefined;
    this.renderer.renderFrame(this.state.time);
    this.setState(this.state);
  }

  private setState(newState: LottieState) {
    const oldTime = this._state.time;
    const timeChanged = oldTime !== newState.time;
    this._state = newState;
    if (timeChanged) {
      this.renderer.renderFrame(newState.time);
    }

    if (newState.morphs) {
      if (!this.morphing && this.renderer.animation) {
        this.morphing = new Morphing(this.renderer.animation!);
      }

      if (this.morphing) {
        const morphChanged =
          this.morphing.ops.length !== newState.morphs.length ||
          this.morphing.ops.some((m, i) => {
            const nm = newState.morphs![i];
            return !nm || m.time !== nm.time || m.strength !== nm.strength;
          });

        this.morphing.ops = newState.morphs;

        if (morphChanged && !timeChanged) {
          // Force render
          this.renderer.animation?.renderer?.renderFrame(null);
        }
      }
    } else if (this.morphing && this.morphing.ops.length > 0) {
      this.morphing.ops = [];
      // Force render
      this.renderer.animation?.renderer?.renderFrame(null);
    }
  }

  set state(newState: LottieState) {
    if (this.driver) {
      throw new Error('Cannot set state directly when using a driver');
    }

    this.setState(newState);
  }

  get driver(): D | undefined {
    return this._driver;
  }

  set driver(newDriver: D | undefined) {
    if (this.animationFrame === undefined && newDriver) {
      this.animationFrame = requestAnimationFrame(this.onFrameBound);
    } else if (this.animationFrame !== undefined && !newDriver) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }

    this._driver = newDriver;
    if (newDriver?.advance) {
      this.setState(newDriver.advance(this._state, 0));
    }
  }

  /**
   * Returns a precise clock that reflects real time that has passed since the
   * first frame was rendered to the last call to the driver's advance() method.
   *
   * The clock uses seconds as the unit.
   */
  get clock() {
    if (this.prevTime === undefined) {
      return 0;
    }

    // Clock is synced to the DOMHighResTimeStamps provided to the animation
    // frame callback, but it still allows inter-frame time to pass.
    //
    // We do this by tracking the real time elapsed since the previous frame and
    // adding that time to the DOMHighResTimeStamp of the previous frame.
    //
    // When the animation frame callback is called, it will advance the clock
    // for exactly the delta time between frames, minus any inter-frame
    // adjustment made. In other words, since
    //
    // clock = prevFrameTs + interFrameAdvancesMs
    //
    // and an advancement is made for a delta time of
    //
    // dt = newClock - prevClock = (newFrameTs + 0) - (prevFrameTs + interFrameAdvancesMs)
    // dt = (newFrameTs - prevFrameTs) - interFrameAdvancesMs

    const base = this.prevTime;
    const realNow = getRealTime();
    const realBase = this.prevRealTime || realNow;
    return (base + (realNow - realBase)) / 1000;
  }

  get duration(): number {
    return this.renderer.duration;
  }

  get durationInFrames(): number {
    return this.renderer.durationFrames;
  }

  get frameRate(): number {
    return this.renderer.frameRate;
  }

  get animation(): AnimationItem {
    return this.renderer.animation;
  }

  get animationData(): LottieJSON | undefined {
    return this.renderer.animationData;
  }

  get currentTime(): number {
    return this.renderer.currentTime;
  }

  get currentFrame(): number {
    return this.renderer.currentFrame;
  }

  /**
   * Advances the internal clock of the driver to the current moment in real time
   * (as of the call to the method). This is used to inform the driver about the
   * accurate passage of time between frames when necessary.
   */
  advanceToNow() {
    const clock = this.clock;
    const diff = this.prevClock !== undefined ? clock - this.prevClock : 0;
    if (this.driver?.advance && diff > 0) {
      this._state.lottie = this.renderer.animationData;
      const elapsed = diff * this.timeMultiplier;
      this.setState(this.driver.advance(this._state, diff * this.timeMultiplier));
      this.timeEvent.emit({ playhead: this.currentTime, clock: this.clock, elapsed });
      this.renderer.renderFrame(this._state.time);
    }

    this.prevClock = clock;
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    this.morphing?.detach();
    this.renderer.destroy();
  }

  private onFrame(time: DOMHighResTimeStamp) {
    this.prevTime = time;
    this.prevRealTime = performance?.now() || new Date().getTime();
    this.advanceToNow();

    this.animationFrame = requestAnimationFrame(this.onFrameBound);
  }
}
