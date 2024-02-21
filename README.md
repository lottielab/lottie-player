# <img alt="Lottielab" src="lottielab.png" width="35"> Lottielab Player

**@lottielab/lottie-player** is a lightweight and versatile web player for Lottie
animations exported from [Lottielab](https://lottielab.com).

## ✨Features

- **Simple and easy-to-use** API.
- **Lightweight:** <50KiB compressed (~160KiB minified)
- **Web component:** use the player easily within any HTML content
- **React support:** also provides a separate React Lottie player component
- **Robust:** uses lottie-web, the industry-standard Lottie library
- **Secure:** eliminates insecure lottie-web features, such as expressions
- **Type-safe:** written in TypeScript with strict typings available.

## ⚙️ Installation

### npm

```bash
npm install --save @lottielab/lottie-player
```

### yarn

```bash
yarn add @lottielab/lottie-player
```

## 📜 Usage

### 🔵 Web Component (HTML, universal)

The easiest way to get started is to import the script directly from the
Lottielab CDN, preferably inside your `<head>` element:

```html
<script src="https://cdn.lottielab.com/s/lottie-player@1.x/player-web.min.js"></script>
```

Then, to play a Lottie:

```html
<lottie-player src="https://cdn.lottielab.com/l/8ok2qzQDyoFeyf.json" autoplay loop>
</lottie-player>
```

---

If you already have a build pipeline, you might prefer loading the script from
within your code. You can simply import the file:

```javascript
import '@lottielab/lottie-player/web';
// or: import '@lottielab/lottie-player';
```

...and then use the `<lottie-player>` component from anywhere, like in the
example above.

**Since the player is a web component, it can be used from any HTML content,
which means you can readily use it even from frameworks for which it doesn't
provide a custom component, such as Vue, Angular, Svelte, and others.**

---

The player can also be used programatically like any other HTML element:

```javascript
import Lottie from '@lottielab/lottie-player/web';
// or: import { LottieWeb as Lottie } from '@lottielab/lottie-player';

window.addEventListener('load', () => {
  // create the element
  const lottie = new Lottie();

  // set attributes
  lottie.setAttribute('src', 'path/to/your-animation.json');
  lottie.setAttribute('autoplay', 'false');

  // add to the DOM
  document.body.appendChild(lottie);

  // full animation API is now available:
  lottie.speed = 1.5;
  lottie.play();
  // and so on...
});
```

#### API

The animation playback can be controlled in depth using a simple-to-use API.
Click below to see the full docs.

<details>
<summary>Full API docs</summary>

##### HTML Attributes

These are attributes that can be set on the `<lottie-player>` component in HTML.

| Name | Type | Description |
| --- | --- | --- |
| `src`      | string  | The source path or url for the Lottie animation. |
| `autoplay` | boolean | Whether the animation should autoplay.                 |
| `loop`     | boolean or number | Whether the animation should loop (true or false). Alternatively, pass a number to set the number of loops an animation should play before pausing. |
| `speed`     | number | Speed of the animation. 1 represents the normal (real-time) speed of the animation; values less than 1 are slower than normal, and higher values are faster. For example, 0.5 plays twice as slow and 2 plays twice as fast.
| `direction` | `1`, `-1`, `forwards`, `backwards` | Direction in which the animation plays. `1` is the same as `forwards` and `-1` is the same as `backwards`.

Example usage:

```html
<lottie-player
    src="https://cdn.lottielab.com/l/8ok2qzQDyoFeyf.json"
    autoplay
    loop="true"
    speed="0.5"
    direction="backwards">
</lottie-player>
```

##### Methods

These methods provide controls for playing, stopping, pausing, seeking, and looping the Lottie animation.

| Name | Parameters | Description |
| ---- | ---------- | ----------- |
| `play()` | / | Plays the animation. |
| `pause()` | / | Pauses the Lottie animation at the current frame. |
| `stop()` | / | Pauses the animation and resets it to the beginning. |
| `seek(timeSeconds)` | `timeSeconds: number` | Moves the animation to a specific point in time, in seconds. |
| `seekToFrame(frame)` | `frame: number` | Moves the animation to a specific frame. |
| `loopBetween(timeSeconds1, timeSeconds2)` | `timeSeconds1: number, timeSeconds2: number` | Loops between two points in time (in seconds) within the Lottie animation. |
| `loopBetweenFrames(frame1, frame2)` | `frame1: number, frame2: number` | Loops between two frames within the Lottie animation. |

Example usage:

```javascript
// get the reference to an animation from the DOM
// (it's also possible to create the player programmatically)
const lottie = document.querySelector('lottie-player#my-lottie');

// seek to 5 seconds into the animation
lottie.seek(5);

// pause
lottie.pause();
```

##### Properties

These properties can be accessed and modified on the component class to control various aspects of the Lottie animation.

| Name | Type | Description |
| ---- | ---------- | ----------- |
| `playing` | boolean | Whether the Lottie animation is playing at the moment. Setting it has a similar effect as calling `play()` or `pause()`. |
| `currentTime` | number | Current position, in seconds, of the Lottie animation playhead. Setting it has a similar effect as calling `seek()`. |
| `currentFrame` | number | Current position, in frames, of the Lottie animation playhead. Settting it has a similar effect as calling `seekToFrame()`. |
| `frameRate` | number (read-only) | Returns the preferred frame rate of the Lottie. Note that, being an implicit vector format, the animation technically has an infinite frame rate.
| `duration` | number (read-only) | Duration of the Lottie animation in seconds. |
| `durationFrames` | number (read-only) | Duration of the Lottie animation in frames. |
| `loop`     | boolean or number | Whether the animation should loop (true or false). Alternatively, it can be a number to set the number of loops an animation should play before pausing. |
| `direction` | 1 or -1 | Direction in which the animation is played. A value of `1` plays the animation in a _forwards_ direction, whereas `-1` plays the animation in _reverse_. |
| `speed` | number | Current speed of the animation. 1 is normal speed; values above 1 are faster and below are slower. For example, 0.5 is twice as slow and 2 is twice as fast.
| `animation` | `AnimationItem` from `lottie-web` | Returns the underlying lottie-web instance. Note that the exact behavior of the underlying instance **is not covered by the semver guarantee**.
| `animationData` | Lottie JSON | Returns the actual underlying Lottie JSON.

```javascript
// get the reference to an animation from the DOM
// (it's also possible to create the player programmatically)
const lottie = document.querySelector('lottie-player#my-lottie')

// play the animation
lottie.playing = true;

// seek to specific time
lottie.currentTime = 3; // seeks to 3 seconds

// get the total duration in frames
let animationDuration = lottie.durationFrames;
console.log(`Duration in frames: ${animationDuration}`); // Duration in frames: 400
```

</details>

### 🔵 React Component

Import the component:

```javascript
import Lottie from '@lottielab/lottie-player/react';
// or: import { LottieReact as Lottie } from '@lottielab/lottie-player';
```

Then use it:

```javascript
const MyComponent = () => <Lottie src="https://cdn.lottielab.com/l/8ok2qzQDyoFeyf.json" />;
```

Alternatively, you can provide a deserialized Lottie JSON directly, rather than a
URL. This can be easier, since it can integrate better with your build pipeline
and bundler:

```javascript
// note: make sure to setup JSON imports in your build pipeline
import myAnimation from './path/to/your/animation.json';

const MyComponent = () => <Lottie lottie={myAnimation} />;
```

#### API

The component allows some setup via props, and can provide the underlying player
for deeper control. Click below to see the full docs.


<details>
<summary>Full API docs</summary>

##### Props

These props can be passed to the component to control various aspects of the Lottie animation.

| Name | Type | Description |
| ---- | ---------- | ----------- |
| `lottie` | Lottie animation data | Deserialized Lottie JSON of the animation to display. Alternatively, you can pass a URL to fetch the lottie from, see `src` below. |
| `src` | string | URL from where to load the animation. This can be a relative path, but it will be fetched using an HTTP request, not bundled. See also `lottie` above. |
| `ref` | React ref | If provided, the ref will be populated with a full player instance capable of controlling the animation. See "Controlling the animation" below. |
| `autoplay` | boolean | Whether the animation should play as soon as the React component is mounted. |
| `loop`     | boolean or number | Whether the animation should loop (true or false). Alternatively, pass a number to set the number of loops an animation should play before pausing. |
| `direction` | 1 or -1 | Direction in which the animation is played. A value of `1` plays the animation in a _forwards_ direction, whereas `-1` plays the animation in _reverse_. |
| `speed` | number | Current speed of the animation. 1 is normal speed; values above 1 are faster and below are slower. For example, 0.5 is twice as slow and 2 is twice as fast.

##### Controlling the animation

The single-direction data flow enforced by React means that some features, such
as manually pausing and playing the animation or seeking it, are not readily
available, since they would require bi-directional data flow.

Instead, you can get access to the underlying player instance by passing a ref:

```javascript
import Lottie from '@lottielab/lottie-player/react';
import myAnimation from './path/to/your/animation.json';
// For TypeScript, also do:
// import { ILottie } from '@lottielab/lottie-player/react'

const MyComponent = () => {
  const lottieRef = useRef(null); // TypeScript: useRef<ILottie | null>(null)
  return (
    <div>
      <Lottie lottie={myAnimation} ref={lottieRef} autoplay={false} />;
      <button onClick={() => lottieRef.current?.play()}>Play!</button>
    </div>
  );
}
```

The object provided to your ref will conform to the `ILottie` interface, _which
the web component also implements_. You can refer to the "Properties" and
"Methods" documentation in the **Web Component** section above.

Note that, using methods and properties of the provided `ILottie`, it's possible
to override the passed-in props.

</details>

## Development

After cloning the repo, run `npm install`. To build the web bundle, run `npm run
build`. Changes can be tested using the playground using `npm run playground`,
which will open the playground in your web browser. Then, click on either the
`react/` or `web/` directories and you'll be able to test the corresponding
component.

### Release checklist

1. `npm install`
2. Bump version in `package.json`
3. Bump version of `X_LOTTIE_PLAYER` in `src/common/player.ts`
3. `npm run build`
4. `npm run playground`, check all of the examples with different Lottie URLs.
   Verify all controls are working.
5. `npm publish`

## License

MIT · Made with ❤️ by [Lottielab](https://lottielab.com)
