import * as def from './definition';
import * as bezier from './bezier';
import type { LottieDriver, LottieState } from '../driver';
import { PlaybackDriver, PlaybackEvent } from '../playback';
import { parse, evaluate } from '../expressions';
import {
  BuiltinVariables,
  UserVariables,
  Variables,
  defaultValues,
  mergeVariables,
} from './variables';
import { MorphOperation, MAX_MORPHS } from '../morphing';
import type { InteractiveEventHandler } from './events';
import { EventEmitter } from '../event';

export type StateTransitionEvent = {
  from: def.State;
  to: def.State;
  transition: def.TransitionProperties;
};

function easingToBezier(easing: def.BezierEasing): bezier.CubicBezier {
  return {
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    controlPoint1: easing.o,
    controlPoint2: easing.i,
  };
}

export function ease(easing: def.BezierEasing, t: number): number {
  return bezier.evaluate(easingToBezier(easing), t).y;
}

type StateState = {
  type: 'state';
  def: def.State;
  playback: StatePlayback;
  remainingDuration?: number;
};

type TransitionState = {
  type: 'transition';
  def: def.TransitionProperties;
  prev: StateState | TransitionState;
  from: def.State;
  next?: StateState;
  progress: number;
};

function formulaToFunction(
  formula: string,
  defaultValue: number
): (variables: Variables) => number {
  try {
    const parsedFormula = parse(formula);
    return (variables: Variables) => {
      try {
        return +evaluate(parsedFormula, variables);
      } catch (e) {
        return defaultValue;
      }
    };
  } catch (e) {
    return () => defaultValue;
  }
}

type StatePlayback = {
  driver: PlaybackDriver;
  playheadControl?: (variables: Variables) => number;
  speedControl?: (variables: Variables) => number;
};

function playbackFor(state: def.State): StatePlayback {
  const driver = new PlaybackDriver();
  driver.segment = state.segment;
  driver.loop = state.loop ?? true;
  if (state.direction) driver.direction = state.direction === 'forward' ? 1 : -1;

  const pb: StatePlayback = { driver };
  if (typeof state.speed === 'number') {
    driver.speed = state.speed;
  } else if (typeof state.speed == 'string') {
    pb.speedControl = formulaToFunction(state.speed, 1);
  }

  if (state.playhead) {
    pb.playheadControl = formulaToFunction(state.playhead, 0);
  }

  return pb;
}

function advanceStatePlayback(
  pb: StatePlayback,
  ls: LottieState,
  elapsed: number,
  clock: number,
  variables: Variables,
  eventsOut?: PlaybackEvent[]
) {
  const newVars = {
    ...variables,
    time: clock,
    'time.diff': elapsed,
    playhead: pb.driver.timeInSegment,
    'playhead.progress':
      pb.driver.durationOfSegment > 0 ? pb.driver.timeInSegment / pb.driver.durationOfSegment : 0,
    'playhead.abs': pb.driver.currentTime,
  };
  if (pb.speedControl) {
    pb.driver.speed = pb.speedControl(variables);
  }

  const newState = pb.driver.advance(ls, elapsed, eventsOut);
  if (pb.playheadControl) {
    newState.time =
      pb.playheadControl(newVars) * pb.driver.durationOfSegment + (pb.driver.segment?.[0] ?? 0);
  }

  return newState;
}

function proportionalTimeRemap(
  time: number,
  from: [number, number],
  onto: [number, number],
  speed = 1
) {
  const fromDuration = from[1] - from[0];
  const ontoDuration = onto[1] - onto[0];
  let progress = fromDuration > 0 ? (time - from[0]) / fromDuration : 0;
  progress = Math.min(1, Math.max(0, progress)) * speed;
  return onto[0] + progress * ontoDuration;
}

function wrapTimeRemap(time: number, from: [number, number], onto: [number, number]) {
  const duration = onto[1] - onto[0];
  const t = time - from[0];
  const val = onto[0] + (duration > 0 ? t % (onto[1] - onto[0]) : 0);
  return Math.min(onto[1], Math.max(onto[0], val));
}

function clampTimeRemap(time: number, from: [number, number], onto: [number, number]) {
  const val = time - from[0] + onto[0];
  return Math.min(onto[1], Math.max(onto[0], val));
}

function applyTransition(
  ls: LottieState,
  transition: TransitionState,
  elapsed: number,
  clock: number,
  variables: Variables,
  advanceTransition: boolean = true,
  remainingMorphs: number = MAX_MORPHS
): LottieState {
  let newLs = transition.next
    ? advanceStatePlayback(transition.next.playback, ls, elapsed, clock, variables)
    : ls;
  if (transition && transition.def.duration) {
    let prevLs;
    if (transition.prev.type === 'state') {
      prevLs = advanceStatePlayback(transition.prev.playback, ls, elapsed, clock, variables);
    } else {
      prevLs = applyTransition(
        ls,
        transition.prev,
        elapsed,
        clock,
        variables,
        false,
        remainingMorphs - 1
      );
    }

    if (advanceTransition) {
      transition.progress += elapsed / transition.def.duration;
    }
    transition.progress = Math.min(1, transition.progress);

    let alpha = transition.progress;
    if (transition.def.easing) {
      alpha = ease(transition.def.easing, alpha);
    }

    if (alpha === 1) {
      newLs = { ...prevLs, morphs: undefined, time: newLs.time };
    } else {
      if (remainingMorphs > 0) {
        const newTime = newLs.time;
        newLs = { ...prevLs };
        newLs.morphs = (newLs.morphs ?? []).concat([{ time: newTime, strength: alpha }]);
      } else {
        // Don't create any new morphs, just flatten
        newLs = { ...prevLs, time: alpha > 0.5 ? newLs.time : prevLs.time };
      }
    }
  } else if (!transition.def.duration) {
    console.warn(
      '[@lottielab/lottie-player:interactive] Transition duration of 0/unset is not expected here'
    );
  }

  return newLs;
}

export class InteractiveDriver implements LottieDriver, InteractiveEventHandler {
  private _definition: def.LottielabInteractivityDef;
  private builtinVariables: BuiltinVariables = { ...defaultValues };
  private userVariables: UserVariables = {};
  private variables: Variables = {};
  private clock: number = 0;

  private state!: StateState;
  private morphing?: {
    other: StateState;
    strength: number | ((variables: Variables) => number);
  };
  private transition?: TransitionState;

  public readonly transitionStartEvent = new EventEmitter<StateTransitionEvent>();
  public readonly transitionEndEvent = new EventEmitter<StateTransitionEvent>();

  constructor(definition: def.LottielabInteractivityDef) {
    this._definition = definition;
    const initialState = definition.states[definition.initialState];
    if (!initialState) {
      throw new Error(`Initial state ${definition.initialState} does not exist`);
    }

    this.enterState(initialState);
  }

  private setupMorphingForCurrentState(opts?: { force: boolean }) {
    if (opts?.force) this.morphing = undefined;

    const sd = this.state.def;
    if (sd.morphing && !this.morphing) {
      const otherState = this._definition.states[sd.morphing.otherState];
      if (otherState) {
        this.morphing = {
          other: {
            type: 'state',
            def: otherState,
            playback: playbackFor(otherState),
          },
          strength:
            typeof sd.morphing.strength === 'number'
              ? sd.morphing.strength
              : formulaToFunction(sd.morphing.strength, 0),
        };
      } else {
        console.warn(
          `[@lottielab/lottie-player:interactivity] State '${sd.morphing.otherState}' to morph with does not exist`
        );
      }
    } else if (!sd.morphing && this.morphing) {
      this.morphing = undefined;
    }
  }

  private enterState(state: def.State) {
    const newPb = playbackFor(state);
    this.state = {
      type: 'state',
      def: state,
      playback: newPb,
      remainingDuration: state.duration,
    };

    this.setupMorphingForCurrentState({ force: true });
  }

  getCurrentState() {
    return this.state;
  }

  goToState(newState: def.State, transition?: def.TransitionProperties) {
    const prevState = this.state;
    const prevSegment = prevState.def.segment;

    if (this.transition) {
      this.transitionEndEvent.emit({
        from: this.transition.from,
        to: this.state.def,
        transition: this.transition.def,
      });
    }

    const currTime = this.state.playback.driver.time;
    this.enterState(newState);
    transition = transition ?? { startAt: 'start' };
    this.transitionStartEvent.emit({
      from: prevState.def,
      to: newState,
      transition,
    });

    const newSegment = newState.segment;
    switch (transition?.startAt) {
      case 'start':
      case undefined:
        this.state.playback.driver.time = newSegment[0];
        break;
      case 'end':
        this.state.playback.driver.time = newSegment[1];
        break;
      case 'proportional':
        this.state.playback.driver.time = proportionalTimeRemap(currTime, prevSegment, newSegment);
        break;
      case 'wrap':
        this.state.playback.driver.time = wrapTimeRemap(currTime, prevSegment, newSegment);
        break;
      case 'clamp':
        this.state.playback.driver.time = clampTimeRemap(currTime, prevSegment, newSegment);
        break;
      default:
        console.warn(
          `[@lottielab/lottie-player:interactive] Unknown startAt value in ttransition: ${transition.startAt}`
        );
    }

    if (transition.duration) {
      const prevStateOrTransition: StateState | TransitionState = this.transition
        ? { ...this.transition, next: prevState }
        : prevState;

      this.transition = {
        type: 'transition',
        prev: prevStateOrTransition,
        progress: 0,
        def: transition,
        from: prevState.def,
      };
    } else {
      // Instant
      this.transition = undefined;
      this.transitionEndEvent.emit({
        from: prevState.def,
        to: newState,
        transition,
      });
    }
  }

  get definition() {
    return this._definition;
  }

  set definition(def: def.LottielabInteractivityDef) {
    const thisStateName = Object.entries(this._definition.states).find(
      ([_, v]) => v === this.state.def
    )?.[0];
    this._definition = def;

    if (!thisStateName || !this._definition.states[thisStateName]) {
      const initialState = def.states[def.initialState];
      if (!initialState) {
        this.enterState({
          segment: [0, 0],
          loop: false,
          speed: 1,
          direction: 'forward',
        });

        throw new Error(`Initial state ${def.initialState} does not exist`);
      }

      const oldTime = this.state.playback.driver.time;
      this.enterState(def.states[def.initialState]);
      this.state.playback.driver.time = oldTime;
      this.transition = undefined;
    } else {
      this.enterState(def.states[thisStateName]);
    }
  }

  updateVariables(update: Partial<BuiltinVariables>) {
    this.builtinVariables = { ...this.builtinVariables, ...update };
    this.variables = mergeVariables(this.builtinVariables, this.userVariables);
  }

  setUserVariables(vars: UserVariables) {
    this.userVariables = vars;
    this.variables = mergeVariables(this.builtinVariables, this.userVariables);
  }

  handle(event: def.InteractiveEvent) {
    const transition = this.state.def.on?.[def.eventToString(event)];
    if (!transition) {
      return;
    }

    const newState = this._definition.states[transition.goTo];
    if (!newState) {
      console.warn(
        `[@lottielab/lottie-player:interactive] State ${transition.goTo} does not exist`
      );
      return;
    }

    this.goToState(newState, transition);
  }

  private getMorphs(ls: LottieState): MorphOperation[] | undefined {
    if (!this.morphing) return ls.morphs;
    const timeRemap = this.state.def.morphing?.timeRemap ?? 'proportional';
    let newTime;
    const currTime = ls.morphs ? ls.morphs[ls.morphs.length - 1].time : ls.time;
    switch (timeRemap) {
      case 'proportional':
        newTime = proportionalTimeRemap(
          currTime,
          this.state.def.segment,
          this.morphing.other.def.segment
        );
        break;
      case 'wrap':
        newTime = wrapTimeRemap(currTime, this.state.def.segment, this.morphing.other.def.segment);
        break;
      case 'clamp':
        newTime = clampTimeRemap(currTime, this.state.def.segment, this.morphing.other.def.segment);
        break;
      default:
        console.warn(`[@lottielab/lottie-player:interactive] Unknown timeRemap: ${timeRemap}`);
        return undefined;
    }

    return (ls.morphs ?? []).concat([
      {
        time: newTime,
        strength:
          typeof this.morphing.strength === 'number'
            ? this.morphing.strength
            : this.morphing.strength(this.variables),
      },
    ]);
  }

  private getEffectiveState(t: StateState | TransitionState): StateState | TransitionState {
    if (t.type === 'state') {
      return t;
    }

    if (t.progress < 1) {
      return t;
    }

    if (t.next) {
      return t.next;
    } else {
      return this.state;
    }
  }

  private applyTransition(ls: LottieState, elapsed: number, clock: number): LottieState {
    let newLs = ls;
    if (this.transition) {
      newLs = applyTransition(ls, this.transition, elapsed, clock, this.variables);

      if (this.transition.progress >= 1) {
        this.transitionEndEvent.emit({
          from: this.transition.from,
          to: this.state.def,
          transition: this.transition.def,
        });

        this.transition = undefined;
      } else {
        this.transition.prev = this.getEffectiveState(this.transition.prev);
      }
    }

    return newLs;
  }

  advance(ls: LottieState, elapsed: number): LottieState {
    let newLs = { ...ls };
    const clock = (this.clock += elapsed);

    const pbEvents: PlaybackEvent[] = [];
    if (this.state.remainingDuration === undefined) {
      // No predefined duration just advance the playback and handle the finish
      // events below
      newLs = advanceStatePlayback(
        this.state.playback,
        ls,
        elapsed,
        clock,
        this.variables,
        pbEvents
      );
    } else {
      const d = this.state.remainingDuration;
      if (d > 0) {
        const dt = Math.min(d, elapsed);
        this.state.remainingDuration -= dt;
        newLs = advanceStatePlayback(this.state.playback, ls, dt, clock, this.variables, pbEvents);

        // Have we finished the full duration?
        // (This will also take into account predefined loops, see enterState())
        if (this.state.remainingDuration <= 0) {
          this.state.remainingDuration = 0;
          this.handle({ event: 'finish' });
        }
      }
    }

    for (const e of pbEvents) {
      if (e.type === 'finish') {
        this.handle({ event: 'finish' });
      }
    }

    this.setupMorphingForCurrentState();

    newLs = this.applyTransition(newLs, elapsed, clock);
    newLs.morphs = this.getMorphs(newLs);
    return newLs;
  }

  get currentTime() {
    if (this.state.playback.playheadControl) {
      return this.state.playback.playheadControl(this.variables);
    } else {
      return this.state.playback.driver.currentTime;
    }
  }

  get currentFrame() {
    return this.currentTime / this.state.playback.driver.frameRate;
  }
}
