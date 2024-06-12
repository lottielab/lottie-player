import * as def from './common/interactivity/definition';
import type { AnimationItem } from 'lottie-web/build/player/lottie_lottielab';
import LottieReact from './react';
import LottieWeb from './web';

export type LottieJSON = any;

export type Point = { x: number; y: number };
export type NamedState = def.State & { name: string | '<custom>' };

/** An event describing the passage of time. */
export type TimeEvent = {
  /** Position of the playhead in seconds. */
  playhead: number;
  /** Monotonically increasing clock since creation of the player, in seconds */
  clock: number;
  /** Time, in seconds, elapsed since the last frame. */
  elapsed: number;
};

/**
 * An event describing the start  or end of a transition between Interactive
 * Lottie states.
 */
export type TransitionEvent = {
  from: NamedState;
  to: NamedState;
  transition: def.TransitionProperties;
};

export interface IFormulaInputs {
  set(name: string, value: number | boolean | Point): void;
  get(name: string): number | boolean | Point | undefined;
  delete(name: string): void;
  clear(): void;
}

export interface ILottielabInteractivity {
  definition: def.LottielabInteractivityDef | undefined;
  hasUserProvidedDefinition(): boolean;
  resetDefinition(): void;

  state: NamedState;
  goToState(state: string | def.State, options?: def.TransitionProperties): void;

  on(event: 'transitionstart' | 'transitionend', listener: (e: TransitionEvent) => void): void;
  off(event: 'transitionstart' | 'transitionend', listener: (e: TransitionEvent) => void): void;

  readonly inputs: IFormulaInputs;
  trigger(eventName: string): void;
}

export interface ILottie {
  play(): void;
  stop(): void;
  pause(): void;
  seek(timeSeconds: number): void;
  seekToFrame(frame: number): void;
  loopBetween(timeSeconds1: number, timeSeconds2: number): void;
  loopBetweenFrames(frame1: number, frame2: number): void;
  toInteractive(): void;
  toPlayback(): void;

  on(event: 'loop' | 'finish', listener: () => void): void;
  on(event: 'time', listener: (e: TimeEvent) => void): void;
  off(event: 'loop' | 'finish', listener: () => void): void;
  off(event: 'time', listener: (e: TimeEvent) => void): void;

  playing: boolean;
  loop: boolean | number;
  currentTime: number;
  currentFrame: number;
  frameRate: number;
  duration: number;
  durationFrames: number;
  direction: 1 | -1;
  speed: number;
  interactivity?: ILottielabInteractivity;

  animation: AnimationItem | undefined;
  animationData: LottieJSON | undefined;
}

export { def as interactivity };

export { LottieReact, LottieWeb };
