import type { ILottie, LottieJSON } from '..';
import type { LottieDriver, LottieState } from './driver';
import type { AnimationItem } from 'lottie-web/build/player/lottie_lottielab';
import { EventEmitter } from './event';

function lottieFrameRate(lottie: any) {
  if (!lottie) return 100;
  return lottie.fr;
}

function lottieDuration(lottie: any) {
  if (!lottie) return 0;
  return (lottie.op - lottie.ip) / lottieFrameRate(lottie);
}

export type PlaybackEvent = {
  type: 'loop' | 'finish';
  relativeTime: number; // time from [0, elapsed] (see advanceWithEvents()) when the event happened
};

export class PlaybackDriver implements LottieDriver, ILottie {
  public playing: boolean = true;
  public time: number = 0;
  public speed: number = 1;
  public direction: 1 | -1 = 1;
  public segment?: [number, number];

  private _fps?: number;
  private _duration?: number;
  private _loop: boolean | number = true;
  private _loopsRemaining: number = Infinity;

  public readonly loopEvent = new EventEmitter();
  public readonly finishEvent = new EventEmitter();

  private get effectiveSegment() {
    if (this.segment) {
      return this.segment;
    } else {
      return [0, this._duration ?? 0];
    }
  }

  private globalTimeToSegmentTime(time: number) {
    const [from, to] = this.effectiveSegment;
    return Math.min(Math.max(time - from, 0), to - from);
  }

  private segmentTimeToGlobalTime(time: number) {
    const [from] = this.effectiveSegment;
    return from + time;
  }

  advance(ls: LottieState, elapsed: number, eventsOut?: PlaybackEvent[]): LottieState {
    const { lottie } = ls;
    this._fps = lottieFrameRate(lottie);
    this._duration = lottieDuration(lottie);
    if (!this.playing) {
      return { time: this.time, lottie };
    }

    const segmentTime = this.globalTimeToSegmentTime(this.time);

    let newTime;
    newTime = segmentTime + elapsed * this.speed * this.direction;

    const events: PlaybackEvent[] = [];
    if (this.durationOfSegment > 0) {
      const loops = Math.abs(Math.floor(newTime / this.durationOfSegment));

      // TODO: Check if this is correct
      const firstLoop = this.durationOfSegment - segmentTime;
      for (let i = 0; i < loops; i++) {
        this._loopsRemaining--;
        const relativeTime = firstLoop + i * this.durationOfSegment;
        if (this._loopsRemaining > 0) {
          events.push({ type: 'loop', relativeTime });
          if (newTime >= this.durationOfSegment) {
            newTime -= this.durationOfSegment;
          } else {
            newTime += this.durationOfSegment;
          }
        } else {
          events.push({ type: 'finish', relativeTime });
          newTime = Math.max(0, Math.min(newTime, this.durationOfSegment));
          this._loopsRemaining = 0;
          this.playing = false;

          break;
        }
      }
    } else {
      newTime = 0;
      events.push({ type: 'loop', relativeTime: 0 });
    }

    const globalTime = this.segmentTimeToGlobalTime(newTime);
    this.time = globalTime;

    if (events.length > 0) {
      if (eventsOut != undefined) {
        eventsOut.push(...events);
      }

      for (const event of events) {
        if (event.type === 'loop') {
          this.loopEvent.emit(undefined);
        } else if (event.type === 'finish') {
          this.finishEvent.emit(undefined);
        }
      }
    }

    return { time: globalTime, lottie };
  }

  play() {
    this.playing = true;
  }

  pause() {
    this.playing = false;
  }

  stop() {
    this.playing = false;
    this.seek(0);
    this.loop = this._loop; // reset loop count
  }

  seek(time: number) {
    this.time = time;
  }

  seekToFrame(frame: number) {
    this.time = frame / this.frameRate;
  }

  loopBetween(start: number, end: number) {
    this.segment = [start, end];
  }

  loopBetweenFrames(start: number, end: number) {
    this.segment = [start / this.frameRate, end / this.frameRate];
  }

  get loop() {
    return this._loop;
  }

  set loop(newLoop: number | boolean) {
    this._loop = newLoop;
    if (typeof newLoop === 'number') {
      this._loopsRemaining = newLoop;
    } else {
      if (newLoop) {
        this._loopsRemaining = Infinity;
      } else {
        this._loopsRemaining = 1;
      }
    }
  }

  get currentTime() {
    return this.time;
  }

  get currentFrame() {
    return this.time * this.frameRate;
  }

  get timeInSegment() {
    return this.globalTimeToSegmentTime(this.time);
  }

  set timeInSegment(time: number) {
    this.time = this.segmentTimeToGlobalTime(time);
  }

  get frameInSegment() {
    return this.timeInSegment * this.frameRate;
  }

  get frameRate() {
    return this._fps ?? 100;
  }

  get duration() {
    return this._duration ?? 0;
  }

  get durationFrames() {
    return this.duration * this.frameRate;
  }

  get durationOfSegment() {
    const [from, to] = this.effectiveSegment;
    return to - from;
  }

  get animation(): AnimationItem {
    throw new Error(
      "This is just a driver and implements ILottie for clarity; you shouldn't directly call this function"
    );
  }

  get animationData(): LottieJSON {
    throw new Error(
      "This is just a driver and implements ILottie for clarity; you shouldn't directly call this function"
    );
  }

  toInteractive() {
    throw new Error(
      "This is just a driver and implements ILottie for clarity; you shouldn't directly call this function"
    );
  }

  toPlayback() {}

  on(event: string, listener: any) {
    throw new Error(
      "This is just a driver and implements ILottie for clarity; you shouldn't directly call this function"
    );
  }

  off(event: string, listener: any) {
    throw new Error(
      "This is just a driver and implements ILottie for clarity; you shouldn't directly call this function"
    );
  }
}
