import { AnimationItem } from 'lottie-web/build/player/lottie_lottielab';
import React from 'react';

type InteractiveEventType = 'click' | 'mouseDown' | 'mouseUp' | 'mouseEnter' | 'mouseLeave' | 'finish' | 'custom';
type InteractiveEvent = {
    event: InteractiveEventType;
} & ({
    event: 'click' | 'mouseDown' | 'mouseUp' | 'mouseEnter' | 'mouseLeave';
    target?: string;
} | {
    event: 'finish';
} | {
    event: 'custom';
    name: string;
});
/**
 * A string representation of an interactive event. Can be one of the following:
 * - 'click', 'mouseDown', 'mouseUp', 'mouseEnter', 'mouseLeave': when the user interacts with the lottie
 * - 'finish': when the animation of this state finishes (after all the looping has completed, if any)
 * - 'custom:<event-name>': a custom, user-defined event with the name
 * '<event-name>', manually triggerable from code using
 * LottielabInteractivity.trigger.
 *
 * By appending a `:<class>` suffix, you can target specific layers for the mouse
 * events, where `<class>` is the CSS class of the layer in the Lottie JSON, see
 * the "cl" member of the Lottie JSON. For example, `click:myButton` will only
 * trigger the transition if the user clicks on a layer with the class (`cl`
 * property in the JSON) of `myButton`.
 */
type InteractiveEventStr = InteractiveEventType | string;
declare function eventToString(e: InteractiveEvent): InteractiveEventStr;
type State = {
    /**
     * Which segment of the animation to play when this state is active. Accepts a
     * [start, end] array of times, in seconds, from the beginning of the
     * animation.
     */
    segment: [number, number];
    /** Speed of the animation in this state. 1.0 (normal speed) is the default. */
    speed?: number | Formula;
    /**
     * Direction of the animation in this state. Can be 'forward' or 'reverse'.
     * 'forward' is the default.
     */
    direction?: 'forward' | 'reverse';
    /**
     * Whether to loop the animation when in this state, and/or how many times. If
     * set to true, loops indefinitely. A value of false means the same as 1 (no
     * looping).
     */
    loop?: boolean | number;
    /**
     * If set, the state will end after this many seconds, regardless of the
     * looping or playback state, and a 'finish' event will be triggered. If this
     * is not provided, the 'finish' event will trigger at the end of the segment
     * if looping is disabled, or at the end of the last loop if looping is
     * enabled. If no 'finish' transition is present, playback will pause.
     */
    duration?: number;
    /**
     * If set, activates morphing of this state with another state. Morphing means
     * that there is another state running "in parallel", and the final animation
     * can be smoothly morphed between this state and the other state. When
     * morphing is active, you can map the "morph strength" value to some user
     * input, like the mouse position, to achieve various effects.
     */
    morphing?: {
        /** Name of the other state to morph with. */
        otherState: string;
        /**
         * How to sync the playhead of this state to the playhead of the other state.
         * Can be one of the following:
         *
         * - 'proportional': the playhead of the other state will be at the
         *   same relative position (percentage) in the other as in this segment. For
         *   example, if this state's segment is 0s-1s and the other state's segment is
         *   1s-3s, and this state is at 0.5s (50%), the other state will be at 1.5s
         *   (also 50%). In this case, states will always be in sync but the other
         *   state might be playing at a different speed if the segment lengths differ.
         * - 'wrap': means that the playheads of both states will start at the beginning
         *   of their segments, but will be allowed to proceed independently and loop
         *   around. In this case, both states will be playing at the same speed, but
         *   they might go out of sync with each other if one's segment's length is not
         *   an exact multiple of the other's.
         * - 'clamp': means that the playheads of both states will start at the same
         *   absolute time, but the second one will get clamped to the end of its segment.
         *   The playheads will be in sync, but the second state will stop if its
         *   segment is shorter than the first state's.
         */
        timeRemap?: 'proportional' | 'wrap' | 'clamp';
        /**
         * A formula describing the morph strength as a value between 0 and 1 where 0 means
         * behave as if there is no morphing, 1 means display the other state fully, 0.5
         * means to morph evenly between this and the other state, etc.
         */
        strength: number | Formula;
    };
    /**
     * Defines the transitions to other states. The key is the name of the event,
     * and the value is the details about the transition.
     *
     * Available events are:
     * - 'click': when the user clicks on the lottie
     * - 'mouseDown': when the user presses the mouse button
     * - 'mouseUp': when the user releases the mouse button
     * - 'mouseEnter': when the user's mouse enters the lottie
     * - 'mouseLeave': when the user's mouse leaves the lottie
     * - 'finish': when the animation of this state finishes (after all the
     *   looping has completed, if any)
     *
     * Optionally, for all events except 'finish', the event can have a `:<target>`
     * suffix which targets specific layers defined by a CSS class, see the `.cl`
     * member of the Lottie JSON.
     *
     * For example, if the lottie JSON defines a layer with its `cl` property set
     * to `myButton`, you can define a transition that should only happen when this
     * layer is clicked by setting the event to `click:myButton`.
     */
    on?: Partial<Record<InteractiveEventStr, Transition>>;
    /**
     * Allows the playhead position in this state to be mapped to some user
     * input, possibly via a formula. This is sometimes called "playback control".
     * The result of the provided formula will be applied as a 0-1 progress within
     * the segment of this state.
     */
    playhead?: Formula;
};
type TransitionProperties = {
    /**
     * Duration of the transition to the new state. If 0 or not provided, the
     * transition is instant. Otherwise, the state will be smoothly morphed to the
     * other state.
     */
    duration?: number;
    /**
     * Describes the initial playhead position in the new state after switching.
     * Can be one of the following:
     *
     * - 'start': start from the beginning of the new state's segment
     * - 'end': start at the end of the new state's segment
     * - 'proportional': start at the same relative position of the playhead (by
     *   percentage/progress) as the current time. For example, if the current state
     *   is at 25% of its segment, the new state will start at 25% of its segment.
     * - 'wrap': the new state will start at the same absolute time as the current
     *   one, wrapped around. This means that if the current state is at 0.75s and
     *   the new state has a 2 second long segment, it will also start at 0.75s.
     *   However, if the new state has a 0.5s long segment, it will start at 0.25s
     *   (wrapping around as if it looped).
     * - 'clamp': the new state will start at the same absolute time as the current
     *   one, but simply clamped to the new state's segment. This means that if the
     *   new state has a segment 0.5s long, a 0.25s playhead will end up the same
     *   (at 0.25s), but a 1.0s playhead will end up at 0.5s (clamped).
     */
    startAt?: 'start' | 'end' | 'proportional' | 'wrap' | 'clamp';
    /**
     * Easing function to use for the transition. Has an effect only if `duration`
     * is set (otherwise, the transition is instant). If not provided, a linear
     * easing function is used. Accepts a cubic Bezier easing in a similar format
     * as Lottie (two control points).
     */
    easing?: BezierEasing;
};
type Transition = {
    /** Name of the state to switch to. */
    goTo: string;
} & TransitionProperties;
/** Lottie-like Bezier easing with 2 control points. */
type BezierEasing = {
    i: {
        x: number;
        y: number;
    };
    o: {
        x: number;
        y: number;
    };
};
/**
 * A simple number or an expression whose result will be used to control the provided
 * variable. The expression can use the standard mathematical functions and constants
 * from the JavaScript Math module (without the `Math.` prefix), and can use a few built-in
 * variables which are mapped to the current user input state, or custom
 * variables provided by the user.
 *
 * The formula can be as simple as a single variable to map the user input
 * directly, or a complex expression that remaps values and integrates multiple
 * inputs for a complex effect.
 *
 * The variables that can be used in the formula are:
 * - `time`: Time in seconds since this state started.
 * - `time.abs`: Time in seconds since the animation first started.
 * - `playhead`: The current playhead position in this state, in seconds.
 * - `playhead.progress`: The current playhead position in this state, as a
 *    value from 0 to 1 within the segment (0 = start, 1 = end).
 * - `playhead.abs`: Global position of the playhead in seconds.
 * - `mouse.x`, `mouse.y`: the current mouse position, relative to the top-left
 *   of the lottie, in pixels
 * - `mouse.progress.x`, `mouse.progress.y`: the current mouse position, as a
 *   value from 0 to 1 within the lottie's bounds (0 = left/top, 1 = right/bottom)
 * - `mouse.abs.x`, `mouse.abs.y`: the current mouse position, relative to the top-left
 *   of the whole viewport rather than the lottie itself
 * - `mouse.buttons.left`, `mouse.buttons.right`, `mouse.buttons.middle`: whether the left,
 *    right, or middle mouse buttons are currently pressed
 *
 * All other variable names are considered custom variables and can be freely
 * used in formulas, provided that `LottielabInteractivity.inputs.set()` is
 * called by the user to set their values.
 */
type Formula = string;
/**
 * A definition of states and transitions conforming to Lottielab Interactivity.
 *
 * This object is added to the lottie in `.metadata.lottielabInteractivity`.
 */
type LottielabInteractivityDef = {
    __version: 'v1';
    /** List of states in the animation by their names. */
    states: Record<string, State>;
    /** Name of the state to start the animation in. */
    initialState: string;
};

type definition_d_BezierEasing = BezierEasing;
type definition_d_Formula = Formula;
type definition_d_InteractiveEvent = InteractiveEvent;
type definition_d_InteractiveEventStr = InteractiveEventStr;
type definition_d_InteractiveEventType = InteractiveEventType;
type definition_d_LottielabInteractivityDef = LottielabInteractivityDef;
type definition_d_State = State;
type definition_d_Transition = Transition;
type definition_d_TransitionProperties = TransitionProperties;
declare const definition_d_eventToString: typeof eventToString;
declare namespace definition_d {
  export { type definition_d_BezierEasing as BezierEasing, type definition_d_Formula as Formula, type definition_d_InteractiveEvent as InteractiveEvent, type definition_d_InteractiveEventStr as InteractiveEventStr, type definition_d_InteractiveEventType as InteractiveEventType, type definition_d_LottielabInteractivityDef as LottielabInteractivityDef, type definition_d_State as State, type definition_d_Transition as Transition, type definition_d_TransitionProperties as TransitionProperties, definition_d_eventToString as eventToString };
}

type LottiePropsDriven = {
    time: number;
} | {
    frame: number;
};
interface LottiePropsAutonomous {
    autoplay?: boolean;
    playing?: boolean;
    loop?: boolean;
    speed?: number;
    direction?: 1 | -1;
}
interface LottiePropsBase {
    className?: string;
    style?: React.CSSProperties;
    preserveAspectRatio?: string;
    onLoad?: () => void;
    onError?: (e: unknown) => void;
    onTime?: (e: TimeEvent) => void;
    onLoop?: () => void;
    onFinish?: () => void;
    onTransitionStart?: (e: TransitionEvent) => void;
    onTransitionEnd?: (e: TransitionEvent) => void;
}
type LottieProps = LottiePropsBase & ({
    src: string;
} | {
    lottie: object;
}) & (LottiePropsAutonomous | LottiePropsDriven);
declare const LottieReact: React.ForwardRefExoticComponent<LottieProps & React.RefAttributes<ILottie>>;

/**
 * A single inter-frame morph operation. It instructs the morphing system to
 * combine the current state of each property with what its state would be at
 * another frame, interpolated with the provided strength.
 *
 * For example, if the animation is at time 2.0s and a morph operation of the
 * following form is applied:
 *
 * { time: 5.0, strength: 0.25 }
 *
 * This means that, for each animatable property, its state at frame 5.0s will be
 * combined with the state at frame 2.0s with 25% strength. Sliding the strength
 * from 0 to 1 will result in a smooth linar transition between the time 5.0s and
 * 2.0s.
 */
type MorphOperation = {
    time: number;
    strength: number;
};

type LottieState = {
    time: number;
    morphs?: MorphOperation[];
    lottie: LottieJSON;
};
interface LottieDriver {
    advance(state: LottieState, elapsed: number): LottieState;
}

type Listener<E> = (event: E) => void;
declare class EventEmitter<E = undefined> {
    private listeners;
    addListener(listener: (event: E) => void): void;
    removeListener(listener: (event: E) => void): void;
    hasListeners(): boolean;
    removeAllListeners(): void;
    emit(event: E): void;
}

type PlaybackEvent = {
    type: 'loop' | 'finish';
    relativeTime: number;
};
declare class PlaybackDriver implements LottieDriver, ILottie {
    playing: boolean;
    time: number;
    speed: number;
    direction: 1 | -1;
    segment?: [number, number];
    private _fps?;
    private _duration?;
    private _loop;
    private _loopsRemaining;
    readonly loopEvent: EventEmitter<undefined>;
    readonly finishEvent: EventEmitter<undefined>;
    private get effectiveSegment();
    private globalTimeToSegmentTime;
    private segmentTimeToGlobalTime;
    advance(ls: LottieState, elapsed: number, eventsOut?: PlaybackEvent[]): LottieState;
    play(): void;
    pause(): void;
    stop(): void;
    seek(time: number): void;
    seekToFrame(frame: number): void;
    loopBetween(start: number, end: number): void;
    loopBetweenFrames(start: number, end: number): void;
    get loop(): number | boolean;
    set loop(newLoop: number | boolean);
    get currentTime(): number;
    get currentFrame(): number;
    get timeInSegment(): number;
    set timeInSegment(time: number);
    get frameInSegment(): number;
    get frameRate(): number;
    get duration(): number;
    get durationFrames(): number;
    get durationOfSegment(): number;
    get animation(): AnimationItem;
    get animationData(): LottieJSON;
    toInteractive(): void;
    toPlayback(): void;
    on(event: string, listener: any): void;
    off(event: string, listener: any): void;
}

type Point$1 = {
    x: number;
    y: number;
};
type BuiltinVariables = {
    time: number;
    'time.diff': number;
    playhead: number;
    'playhead.progress': number;
    'playhead.abs': number;
    'mouse.x': number;
    'mouse.y': number;
    'mouse.progress.x': number;
    'mouse.progress.y': number;
    'mouse.abs.x': number;
    'mouse.abs.y': number;
    'mouse.buttons.left': boolean;
    'mouse.buttons.right': boolean;
    'mouse.buttons.middle': boolean;
};
type UserVariables = Record<string, number | boolean | Point$1>;
type Variables = Record<string, number | boolean>;

interface InteractiveEventHandler {
    updateVariables(variables: Partial<BuiltinVariables>): void;
    handle(event: InteractiveEvent): void;
}

type StateTransitionEvent = {
    from: State;
    to: State;
    transition: TransitionProperties;
};
type StateState = {
    type: 'state';
    def: State;
    playback: StatePlayback;
    remainingDuration?: number;
};
type StatePlayback = {
    driver: PlaybackDriver;
    playheadControl?: (variables: Variables) => number;
    speedControl?: (variables: Variables) => number;
};
declare class InteractiveDriver implements LottieDriver, InteractiveEventHandler {
    private _definition;
    private builtinVariables;
    private userVariables;
    private variables;
    private clock;
    private state;
    private morphing?;
    private transition?;
    readonly transitionStartEvent: EventEmitter<StateTransitionEvent>;
    readonly transitionEndEvent: EventEmitter<StateTransitionEvent>;
    constructor(definition: LottielabInteractivityDef);
    private setupMorphingForCurrentState;
    private enterState;
    getCurrentState(): StateState;
    goToState(newState: State, transition?: TransitionProperties): void;
    get definition(): LottielabInteractivityDef;
    set definition(def: LottielabInteractivityDef);
    updateVariables(update: Partial<BuiltinVariables>): void;
    setUserVariables(vars: UserVariables): void;
    handle(event: InteractiveEvent): void;
    private getMorphs;
    private getEffectiveState;
    private applyTransition;
    advance(ls: LottieState, elapsed: number): LottieState;
    get currentTime(): number;
    get currentFrame(): number;
}

/**
 * Custom variables that can be set and read by the Lottielab Interactivity
 * state machine. These variables, alongside builtin ones (@see BuiltinVariables)
 * can be used in formulas to, for example, directly drive the playhead or blend
 * between states.
 */
declare class FormulaInputs {
    private onUpdate;
    private variables;
    constructor(onUpdate: (vars: UserVariables) => void);
    set(name: string, value: number | boolean | Point$1): void;
    get(name: string): number | boolean | Point$1 | undefined;
    delete(name: string): void;
    clear(): void;
}
/**
 * Manages the Lottielab Interactivity state machine.
 *
 * By default, the interactivity state machine definition is extracted from the
 * Lottie JSON file (if the file is an Interactive Lottie). You can always
 * provide a custom definition by setting the `.definition` property.
 *
 * If an animation is not interactive, you can use `.toInteractive()` on a Lottie
 * player, and then manually create a definition or trigger states and state
 * transitions.
 *
 * With this class, you can inspect the state, trigger transitions to new states
 * programatically, provide inputs for the interactivity machinery and trigger
 * custom events that an Interactive Lottie can respond to.
 *
 * This class should not be constructed directly; rather, use the
 * `.interactivity` property of a player instance to gain access to it.
 */
declare class LottielabInteractivity implements ILottielabInteractivity {
    private _userProvidedDefinition;
    private _rootElement;
    private _lottie;
    private _driver;
    private _dispatcher;
    private _transitionStartEvent;
    private _transitionEndEvent;
    readonly inputs: FormulaInputs;
    constructor(root: HTMLElement, lottie: LottieJSON | undefined);
    /**
     * Returns the current Lottielab Interactivity definition. The definition is a
     * programmatic description of how a Lottie responds to events.
     *
     * By default, this definition is read from the Lottie itself in case it's an
     * Interactive Lottie. If an ordinary Lottie is used, the definition will be
     * empty, but a custom one can be provided by setting this property.
     */
    get definition(): LottielabInteractivityDef | undefined;
    /**
     * Overrides the Lottielab Interactivity definition used by this lottie. The
     * definition is a programmatic description of how a Lottie responds to events.
     *
     * Setting this property will override any existing definition that has been
     * set or read from the Lottie itself.
     */
    set definition(definition: LottielabInteractivityDef | undefined);
    /**
     * Returns the current state that the Lottie is in. A state encompasses the
     * current time segment, playback behavior (speed, looping, etc.) and
     * transitions to other states in response to events.
     */
    get state(): NamedState;
    /**
     * Switches the Lottie to another state. The state can either be given based on
     * the name of a state defined in the interactivity definition, or a bespoke
     * state configuration.
     */
    set state(state: string | State);
    /**
     * Switches the Lottie to another state. You can provide either the name of a
     * state defined in the interactivity definition, or a bespoke state
     * configuration.
     *
     * The `options` parameter can be used to specify details about the transition.
     * Among other things, it allows a smooth blending transition to be applied
     * instead of an instant switch, or the new state can be configured to start
     * at a specific playhead position.
     */
    goToState(state: string | State, options?: TransitionProperties): void;
    /** Whether a custom Lottielab Interactivity definiton was set by the user. */
    hasUserProvidedDefinition(): boolean;
    /**
     * Clears any custom Lottielab Interactivity definition set by the user. After
     * calling this method, the definition will be read from the Lottie itself. If
     * the Lottie is not an Interactive Lottie, the definition will be empty.
     */
    resetDefinition(): void;
    /**
     * Subcribes to one of the two transition events.
     *
     * 'transitionstart' is fired when a transition from state A to state B
     * starts.
     * 'transitionend' is fired when a transition from state A to state B
     * completes.
     *
     * Both events have a `TransitionEvent` object as their argument, which
     * gives more information about the state transition. @see TransitionEvent
     *
     * If a transition has a duration of 0 (or not set), the 'transitionend'
     * event will be fired immediately followed by the 'transitionstart' event.
     */
    on(event: 'transitionstart' | 'transitionend', listener: Listener<TransitionEvent>): void;
    /** Unsubscribes from an event. */
    off(event: 'transitionstart' | 'transitionend', listener: Listener<TransitionEvent>): void;
    /**
     * Triggers a custom, user-defined event that the state machine can respond to.
     *
     * The corresponding name of this event in the interactivity definition would
     * be 'custom:<event-name>'. For example, if this function is called with the
     * event name 'onboardingComplete', the transition
     * `this.state.on['custom:onboardingComplete']` would run.
     */
    trigger(eventName: string): void;
    _destroy(): void;
    _getDriver(): InteractiveDriver;
    private translateTransitionEvent;
    private effectiveDefinition;
    private lookupStateName;
    private findState;
    private getObservedClassNames;
    private updateReactivity;
}

declare class LottieWeb extends HTMLElement implements ILottie {
    private lottie;
    private loadEvent;
    static get observedAttributes(): string[];
    constructor();
    private updateStyles;
    private get intrinsicSize();
    attributeChangedCallback(name: string, oldValue: string, newValue: string): void;
    /**
     * Converts the loop attribute (which can either be null or a string) to either a boolean or a number.
     * When `loop` is true/false it sets whether the animation should loop indefinitely or not.
     * When `loop` is a number, this sets the number of loops the animation should run for.
     * @param loopAttribute - parameter taken from the component's attributes (string | null)
     * @returns boolean | number
     */
    private convertLoopAttribute;
    /**
     * Converts the direction attribute (which can either be null or a string) to a number.
     * The direction dictates the play direction of the animation.
     * A value of `1` represents an animation playing forwards (and is default).
     * A value of `-1` represents an animation playing backwards.
     */
    private convertDirectionAttribute;
    disconnectedCallback(): void;
    play(): void;
    stop(): void;
    pause(): void;
    seek(timeSeconds: number): void;
    seekToFrame(frame: number): void;
    loopBetween(timeSeconds1: number, timeSeconds2: number): void;
    loopBetweenFrames(frame1: number, frame2: number): void;
    toInteractive(): void;
    toPlayback(): void;
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
    on(event: 'time' | 'loop' | 'finish', listener: Listener<any>): void;
    /** Unsubscribes from one of the supported events. */
    off(event: 'time' | 'loop' | 'finish', listener: Listener<any>): void;
    get playing(): boolean;
    set playing(play: boolean);
    get loop(): boolean | number;
    set loop(loop: boolean | number);
    get currentTime(): number;
    set currentTime(time: number);
    get currentFrame(): number;
    set currentFrame(frame: number);
    get frameRate(): number;
    get duration(): number;
    get durationFrames(): number;
    get direction(): 1 | -1;
    set direction(direction: 1 | -1);
    get speed(): number;
    set speed(speed: number);
    get animation(): AnimationItem;
    get animationData(): LottieJSON | undefined;
    get interactivity(): LottielabInteractivity | undefined;
}

type LottieJSON = any;
type Point = {
    x: number;
    y: number;
};
type NamedState = State & {
    name: string | '<custom>';
};
/** An event describing the passage of time. */
type TimeEvent = {
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
type TransitionEvent = {
    from: NamedState;
    to: NamedState;
    transition: TransitionProperties;
};
interface IFormulaInputs {
    set(name: string, value: number | boolean | Point): void;
    get(name: string): number | boolean | Point | undefined;
    delete(name: string): void;
    clear(): void;
}
interface ILottielabInteractivity {
    definition: LottielabInteractivityDef | undefined;
    hasUserProvidedDefinition(): boolean;
    resetDefinition(): void;
    state: NamedState;
    goToState(state: string | State, options?: TransitionProperties): void;
    on(event: 'transitionstart' | 'transitionend', listener: (e: TransitionEvent) => void): void;
    off(event: 'transitionstart' | 'transitionend', listener: (e: TransitionEvent) => void): void;
    readonly inputs: IFormulaInputs;
    trigger(eventName: string): void;
}
interface ILottie {
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

export { type IFormulaInputs, type ILottie, type ILottielabInteractivity, type LottieJSON, LottieReact, LottieWeb, type NamedState, type Point, type TimeEvent, type TransitionEvent, definition_d as interactivity };
