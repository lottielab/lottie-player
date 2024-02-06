# <img alt="Lottielab" src="lottielab.png" width="35"> Lottielab Player

**@lottielab/lottie-player** is a lightweight and versatile web player for Lottie
animations exported from [Lottielab](https://lottielab.com).

## ✨Features

- **Simple and easy-to-use** API.
- **Lightweight:** <40KiB compressed (~150KiB minified)
- **Web component:** use the player easily within any HTML content
- **React support:** versatile React component for displaying Lotties
- **Robust:** under the hood uses lottie-web, the industry-standard Lottie
  library.
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

### 🔵 Web Component (HTML)

The easiest way to get started is to import the script via CDN, preferably inside
your `<head>` element:

```html
<script src="...TODO..."></script>
```

Then, to play a Lottie:

```html
<lottie-player src="https://example.com/your-lottie.json" autoplay loop>
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

---

The player can also be used programatically like any other web component:

```javascript
import LottieWeb from '@lottielab/lottie-player/web';
// or: import { LottieWeb } from '@lottielab/lottie-player';

const lottie = new LottieWeb();

lottie.setAttribute('src', 'path/to/your-animation.json');
lottie.setAttribute('autoplay', 'false');
document.getElementById('my-animation').appendChild(lottie);

lottie.speed = 1.5;
lottie.play();
// and so on...
```

#### API

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
    src="https://example.com/your-lottie.json"
    autoplay
    loop="4"
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
import LottieWeb from '@lottielab/lottie-player/web';
// or: import { LottieWeb } from '@lottielab/lottie-player';

const lottie = new LottieWeb();

// Seek to 5 seconds into the animation
lottie.seek(5);
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

For example, assumming we have a Lottie Animation instance named `lottieAnimation`:

```javascript
// Play the animation
lottieAnimation.playing = true;

// Seek to specific time
lottieAnimation.currentTime = 3; // Seeks to 3 seconds!

// Get the total duration in frames
let animationDuration = lottieAnimation.durationFrames;
console.log(`Duration in frames: ${animationDuration}`); // Duration in frames: 400
```

---

### 🔵 React Component

Import the component:

```javascript
import Lottie from '@lottielab/lottie-player/react';
// or: import { LottieReact } from '@lottielab/lottie-player';
```

Then use it:

```javascript
const MyComponent = () => <Lottie src="https://example.com/your-lottie,.json" />;
```

Alternatively, you can provide a deserialized Lottie JSON directly, rather than a
URL. This can be easier, since it can integrate better with your build pipeline
and bundler:

```javascript
import myAnimation from './path/to/your/animation.json';
// Note: make sure to setup JSON imports in your build pipeline

const MyComponent = () => <Lottie lottie={myAnimation} />;
```

#### Controlling the animation

The single-direction data flow enforced by React means that some features, such
as manually pausing and playing the animation or seeking it, are not readily
available.

You can get access to a full player instance by passing a ref:

```javascript
import Lottie from '@lottielab/lottie-player/react';
import myAnimation from './path/to/your/animation.json';

const MyComponent = () => {
  const lottieRef = useRef(null);
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
"Methods" documentation above.

Note that, using methods and properties of the provided `ILottie`, it's possible
to override the passed-in props.

#### Available properties

These properties can be accessed and modified on the component class to control various aspects of the Lottie animation.

| Name | Type | Description |
| ---- | ---------- | ----------- |
| `lottie` | Lottie animation data | Deserialized Lottie JSON of the animation to display. Alternatively, you can pass a URL to fetch the lottie from, see `src` below. |
| `src` | string | URL from where to load the animation. This can be a relative path, but it will be fetched using an HTTP request, not bundled. See also `lottie` above. |
| `ref` | React ref | If provided, the ref will be populated with a full player instance capable of controlling the animation. See "Controlling the animation" above. |
| `autoplay` | boolean | Whether the animation should play as soon as the React component is mounted. |
| `loop`     | boolean or number | Whether the animation should loop (true or false). Alternatively, pass a number to set the number of loops an animation should play before pausing. |
| `direction` | 1 or -1 | Direction in which the animation is played. A value of `1` plays the animation in a _forwards_ direction, whereas `-1` plays the animation in _reverse_. |
| `speed` | number | Current speed of the animation. 1 is normal speed; values above 1 are faster and below are slower. For example, 0.5 is twice as slow and 2 is twice as fast.

## License

MIT · Made with ❤️ by [Lottielab](https://lottielab.com)
