import React from 'react';
import { AnimationItem } from 'lottie-web/build/player/lottie_lottielab';

type InteractiveEventType = 'click' | 'mouseDown' | 'mouseUp' | 'mouseEnter' | 'mouseLeave' | 'finish' | 'custom';
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

export { type ILottie, type LottieProps, type LottiePropsAutonomous, type LottiePropsBase, type LottiePropsDriven, LottieReact as default };
