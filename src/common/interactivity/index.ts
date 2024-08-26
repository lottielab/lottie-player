import * as def from './definition';
import type { LottieJSON, TransitionEvent, NamedState, ILottielabInteractivity } from '../..';
import { InteractiveDriver, StateTransitionEvent as DriverTransitionEvent } from './driver';
import { InteractiveEventDispatcher } from './events';
import { EventEmitter, Listener } from '../event';
import { UserVariables, Point } from './variables';

/** Lottielab-inspired easing presets. Useful for smooth state transitions. */
export namespace EasingPresets {
  export const Linear: def.BezierEasing = { i: { x: 0.75, y: 0.75 }, o: { x: 0.25, y: 0.25 } };
  export const Natural: def.BezierEasing = { o: { x: 0.4, y: 0 }, i: { x: 0.8, y: 1 } };
  export const BounceIn: def.BezierEasing = { o: { x: 0.8, y: 0 }, i: { x: 0.5, y: 1.5 } };
  export const BounceOut: def.BezierEasing = { o: { x: 0.5, y: -0.5 }, i: { x: 0.2, y: 1 } };
  export const Accelerate: def.BezierEasing = { o: { x: 0.42, y: 0 }, i: { x: 1, y: 1 } };
  export const SlowDown: def.BezierEasing = { o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 } };
}

export function isInteractive(lottie?: LottieJSON) {
  return (
    !!lottie?.metadata?.lottielabInteractivity &&
    lottie?.metadata?.lottielabInteractivity.__version === 'v1'
  );
}

/**
 * Custom variables that can be set and read by the Lottielab Interactivity
 * state machine. These variables, alongside builtin ones (@see BuiltinVariables)
 * can be used in formulas to, for example, directly drive the playhead or blend
 * between states.
 */
export class FormulaInputs {
  private variables: UserVariables = {};

  constructor(private onUpdate: (vars: UserVariables) => void) {}

  set(name: string, value: number | boolean | Point) {
    this.variables[name] = value;
    this.onUpdate(this.variables);
  }

  get(name: string): number | boolean | Point | undefined {
    return this.variables[name];
  }

  delete(name: string) {
    delete this.variables[name];
    this.onUpdate(this.variables);
  }

  clear() {
    this.variables = {};
    this.onUpdate(this.variables);
  }
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
export class LottielabInteractivity implements ILottielabInteractivity {
  private _userProvidedDefinition:
    | { set: true; value: def.LottielabInteractivityDef | undefined }
    | { set: false };
  private _rootElement: HTMLElement;
  private _lottie: LottieJSON | undefined;
  private _driver: InteractiveDriver;
  private _dispatcher: InteractiveEventDispatcher;

  private _transitionStartEvent = new EventEmitter<TransitionEvent>();
  private _transitionEndEvent = new EventEmitter<TransitionEvent>();

  public readonly inputs: FormulaInputs;

  constructor(root: HTMLElement, lottie: LottieJSON | undefined) {
    this._userProvidedDefinition = { set: false };
    this._rootElement = root;
    this._lottie = lottie;
    const def = this.effectiveDefinition();
    this._driver = new InteractiveDriver(def);
    this._dispatcher = new InteractiveEventDispatcher(
      this._rootElement,
      this.getObservedClassNames(def)
    );
    this._dispatcher.setClickableClassNames(this.getClickableClassNames());
    this._dispatcher.handler = this._driver;

    const onTransitionStartEvent = (event: DriverTransitionEvent) => {
      this._transitionStartEvent.emit(this.translateTransitionEvent(event));
      this._dispatcher.setClickableClassNames(this.getClickableClassNames());
    };
    const onTransitionEndEvent = (event: DriverTransitionEvent) =>
      this._transitionEndEvent.emit(this.translateTransitionEvent(event));

    this._driver.transitionStartEvent.addListener(onTransitionStartEvent);
    this._driver.transitionEndEvent.addListener(onTransitionEndEvent);

    this.inputs = new FormulaInputs((vars) => this._driver.setUserVariables(vars));
  }

  /**
   * Returns the current Lottielab Interactivity definition. The definition is a
   * programmatic description of how a Lottie responds to events.
   *
   * By default, this definition is read from the Lottie itself in case it's an
   * Interactive Lottie. If an ordinary Lottie is used, the definition will be
   * empty, but a custom one can be provided by setting this property.
   */
  get definition(): def.LottielabInteractivityDef | undefined {
    if (this._userProvidedDefinition.set) {
      return this._userProvidedDefinition.value;
    }
    return this._lottie?.metadata?.lottielabInteractivity;
  }

  /**
   * Overrides the Lottielab Interactivity definition used by this lottie. The
   * definition is a programmatic description of how a Lottie responds to events.
   *
   * Setting this property will override any existing definition that has been
   * set or read from the Lottie itself.
   */
  set definition(definition: def.LottielabInteractivityDef | undefined) {
    this._userProvidedDefinition = { set: true, value: definition };
    this.updateReactivity();
  }

  /**
   * Returns the current state that the Lottie is in. A state encompasses the
   * current time segment, playback behavior (speed, looping, etc.) and
   * transitions to other states in response to events.
   */
  get state(): NamedState {
    const stateDef = this._driver.getCurrentState().def;
    const name = this.lookupStateName(stateDef);
    return { ...stateDef, name: name ?? '<custom>' };
  }

  /**
   * Switches the Lottie to another state. The state can either be given based on
   * the name of a state defined in the interactivity definition, or a bespoke
   * state configuration.
   */
  set state(state: string | def.State) {
    this._driver.goToState(this.findState(state));
  }

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
  goToState(state: string | def.State, options?: def.TransitionProperties) {
    this._driver.goToState(this.findState(state), options);
  }

  /** Whether a custom Lottielab Interactivity definiton was set by the user. */
  hasUserProvidedDefinition() {
    return this._userProvidedDefinition.set;
  }

  /**
   * Clears any custom Lottielab Interactivity definition set by the user. After
   * calling this method, the definition will be read from the Lottie itself. If
   * the Lottie is not an Interactive Lottie, the definition will be empty.
   */
  resetDefinition() {
    this._userProvidedDefinition = { set: false };
    this.updateReactivity();
  }

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
  on(event: 'transitionstart' | 'transitionend', listener: Listener<TransitionEvent>) {
    switch (event) {
      case 'transitionstart':
        this._transitionStartEvent.addListener(listener);
        break;
      case 'transitionend':
        this._transitionEndEvent.addListener(listener);
        break;
    }
  }

  /** Unsubscribes from an event. */
  off(event: 'transitionstart' | 'transitionend', listener: Listener<TransitionEvent>) {
    switch (event) {
      case 'transitionstart':
        this._transitionStartEvent.removeListener(listener);
        break;
      case 'transitionend':
        this._transitionEndEvent.removeListener(listener);
        break;
    }
  }

  /**
   * Triggers a custom, user-defined event that the state machine can respond to.
   *
   * The corresponding name of this event in the interactivity definition would
   * be 'custom:<event-name>'. For example, if this function is called with the
   * event name 'onboardingComplete', the transition
   * `this.state.on['custom:onboardingComplete']` would run.
   */
  trigger(eventName: string) {
    this._driver.handle({ event: 'custom', name: eventName });
  }

  _destroy() {
    this._dispatcher?.destroy();
  }

  _getDriver() {
    return this._driver;
  }

  private translateTransitionEvent(event: DriverTransitionEvent): TransitionEvent {
    return {
      from: { ...event.from, name: this.lookupStateName(event.from) ?? '<custom>' },
      to: { ...event.to, name: this.lookupStateName(event.to) ?? '<custom>' },
      transition: event.transition,
    };
  }

  private effectiveDefinition(): def.LottielabInteractivityDef {
    const duration = this._lottie ? this._lottie.op / this._lottie.fr : 0;
    return (
      this.definition ?? {
        __version: 'v1',
        initialState: 'default',
        states: {
          default: {
            segment: [0, duration],
          },
        },
      }
    );
  }

  private lookupStateName(state: def.State): string | undefined {
    return Object.entries(this.effectiveDefinition().states).find(([_name, s]) => s === state)?.[0];
  }

  private findState(state: string | def.State): def.State {
    let newState;
    if (typeof state === 'string') {
      newState = this.effectiveDefinition().states[state];
    } else {
      newState = state;
    }

    if (!state) {
      throw new Error(`State ${state} not found`);
    }

    return newState;
  }

  private getObservedClassNames(def: def.LottielabInteractivityDef | undefined): string[] {
    if (!def) return [];

    return [
      ...new Set(
        Object.values(def.states)
          .flatMap((state) => Object.keys(state.on ?? {}))
          .flatMap((eventName) => {
            const [type, className] = eventName.split(':');
            if (type === 'custom' || !className) return [];
            return [className];
          })
      ),
    ];
  }

  private getClickableClassNames(): (string | 'full')[] {
    return [
      ...new Set(
        Object.keys(this.state.on ?? {}).flatMap((eventName) => {
          const [type, className] = eventName.split(':');
          if (!['click', 'mouseDown', 'mouseUp'].includes(type)) {
            return [];
          }

          if (!className) {
            return ['full'];
          }

          return [className];
        })
      ),
    ];
  }

  private updateReactivity() {
    const def = this.effectiveDefinition();
    this._driver.definition = def;

    // Recreate the dispatcher because the list of observed class names
    // might've changed
    this._dispatcher?.destroy();
    this._dispatcher = new InteractiveEventDispatcher(
      this._rootElement,
      this.getObservedClassNames(def)
    );
    this._dispatcher.handler = this._driver;
  }
}
