# Lottielab Player - Interactivity Support

> See the examples live at https://lottielab.github.io/lottie-player/playground/interactivity.

Lottielab Player supports _Interactive Lotties_ out of the box. These Lotties
contain a state machine and can change state in response to mouse movement,
clicks, or even custom user-defined events.

Providing an Interactive Lottie to the player will automatically activate its
interacttivity features.

Technically, _Interactive Lotties_ are similar to ordinary Lotties, but they
contain a _Lottielab Interactivity Definition_ embedded in the JSON. This is a
simple JSON object which defines various states and transitions that the Lottie
can take. States are time-based, i.e. each state plays a specific time range of
the Lottie animation.

The interactivity definition is precisely defined via a [TypeScript
schema](src/common/interactivity/definition.ts).

**[Lottielab](https://lottielab.com)** provides a web-based editor for creating
Interactive Lotties with a visual interface and live preview.

Besides loading an Interactive Lottie, the Lottielab Player allows you to inspect
and interact with the underlying state machine, or apply a custom interactivity
definition to an existing, plain Lottie.

> This documentation focuses on the player features for playing and managing
> Interactive Lotties. For a more in-depth explanation and information about
> creating them, see the [Lottielab
> Docs](https://docs.lottielab.com/editor/interactivity).

## User manual

### Playing an Interactive Lottie

To play an Interactive Lottie, simply load it into the player as you would with
a regular Lottie. The player will:

- detect the interactivity definition
- set up the necessary event listeners
- display the Lottie in its initial state
- react to user input and update the Lottie accordingly

> Example: [./playground/interactive/examples/interactive-lottie.html](./playground/interactive/examples/interactive-lottie.html)

To disable this behavior and revert the Lottie to a normal one, call the player's
`.toPlayback()` method after load.

### Interactivity API

Upon loading an Interactive Lottie, the player will expose an `interactivity`
property. This will be an instance of
[`LottielabInteractivity`](./src/common/interactivity/index.ts), which allows
you to query and manipulate the state of the Lottie.

For example:

```javascript
import Lottie from '@lottielab/lottie-player/web';

const player = new LottiePlayer();
// Interactive Lottie:
player.setAttribute('src', './playground/lotties/FavoriteButtonInteractive.json');
player.addEventListener('load', () => {
  // Access the interactivity API
  const interactivity = player.interactivity;

  // Query the current state
  console.log('Current state is', interactivity.state.name);

  // Change the state
  interactivity.goToState('hover', { duration: 0.5 });

  // Listen to state changes
  interactivity.on('transitionstart', (event) => {
    console.log('State changing from', event.from.name, 'to', event.to.name);
    // event.from and event.to are states from the interactivity definition, with
    // an additional .name member.
    // event.transition is a transition from the interactivity definition.
  });

  // Provide a custom variable that can be used by the Lottie
  interactivity.inputs.set('custom_var', 0.75);

  // Trigger a custom event that the Lottie can react to
  interactivity.trigger('my_event');
});
```

For a full list of available methods and properties, see the
[LottielabInteractivity API](src/common/interactivity/index.ts).

Also refer to the examples in the
[Playground](./playground/interactive/examples/), as they demonstrate a number of
uses of the interactivity API.

### Infusing custom interactivity and states

If you have an ordinary Lottie, you can make it interactive by providing an
external interactivity definition.

To do this, you can use the `toInteractive()` method of the player:

```javascript
import Lottie from '@lottielab/lottie-player/web';

const player = new LottiePlayer();
// Normal, non-interactive lottie
player.setAttribute('src', 'https://cdn.lottielab.com/l/8ok2qzQDyoFeyf.json');

player.toInteractive();
```

Now, you can use the `interactivity` API as described above, and you can simply
set a custom definition:

```javascript
player.interactivity.definition = {
  initialState: 'default',
  states: {
    default: {
      segment: [0, 0.5],
      loop: true,
      on: {
        click: { goTo: 'clicked' },
      },
    },
    clicked: {
      segment: [0.5, 1],
      loop: false,
      on: {
        finish: { goTo: 'default' },
      },
    },
  },
};
```
