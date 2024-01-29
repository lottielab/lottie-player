# <img alt="Lottielab" src="lottielab.png" width="35"> Lottie Player

**@lottielab/lottie-player** is a lightweight and versatile web player for Lottie
animations exported from [Lottielab](https://lottielab.com).

## ✨Features

- **Simple and easy-to-use** API.
- **Lightweight:** <40KiB compressed (~150KiB minified)
- **Web component:** use the player easily within any HTML content
- **React support:** versatile React component for displaying lotties
- **Robust:** Under the hood uses lottie-web, the industry-standard Lottie
  library.

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
<lottie-player src="path/to/your-animation.json" autoplay loop></lottie-player>
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

The player can also be used programatically like any other HTML component:

```javascript
import Lottie from '@lottielab/lottie-player/web';
// or: import { LottieWeb } from '@lottielab/lottie-player';

const lottie = new LottieWeb();
lottie.setAttribute('src', 'path/to/your-animation.json');
lottie.setAttribute('autoplay', 'true');
lottie.setAttribute('loop', 'false');
document.getElementById('my-animation').appendChild(lottie);
lottie.play();
lottie.setSpeed(1.5);
lottie.goToAndStop(50, true);
// and so on...
```

#### API

##### HTML Attributes

These are attributes that can be set on the `<lottie-player>` component in HTML.

| Name | Type | Description |
| --- | --- | --- |
| `src`      | string  | The source path or JSON data for the Lottie animation. |
| `autoplay` | boolean | Whether the animation should autoplay.                 |
| `loop`     | boolean  \| number | Whether the animation should loop, optionally pass a number to set the number of loops an animation should play. |

Example usage:

```html
  <lottie-player src="path/to/file" autoplay=true loop=4 />
```

##### Methods

These methods provide controls for playing, stopping, pausing, seeking, and looping the Lottie animation.

| Name | Parameters | Description |
| ---- | ---------- | ----------- |
| `play()` | `void` | Plays the Lottie animation. |
| `stop()` | `void` | Stops the Lottie animation, resetting the animation to frame 0. |
| `pause()` | `void` | Pauses the Lottie animation at the current frame. |
| `seek(time)` | `time: number` | Seeks Lottie animation to a specific point in time, in seconds. |
| `seekToFrame(frame)` | `frame: number` | Seeks Lottie animation to specified frame. |
| `loopBetweenFrames(frame1, frame2)` | `frame1: number, frame2: number` | Loops between two frames within the Lottie animation. |

Example usage:

```javascript
// Play the animation
lottieAnimation.play();

// Pause the animation
lottieAnimation.pause();

// Stop and reset the animation
lottieAnimation.stop();

// Seek to 5 seconds into the animation
lottieAnimation.seek(5);

// Seek to frame 20
lottieAnimation.seekToFrame(20);

// Loop between frames 10 and 30
lottieAnimation.loopBetweenFrames(10, 30);
```

##### Properties

These properties can be accessed and modified on the component class to control various aspects of the Lottie animation.

| Name | Type | Description |
| ---- | ---------- | ----------- |
| `playing` | `boolean` | Gets/Sets whether the Lottie animation is playing or paused. Inverse of `paused`. |
| `paused` | `boolean`| Gets/Sets whether the Lottie animation is playing or paused. Inverse of `playing`. |
| `currentTime` | `timeInSeconds: number`| Gets/Sets the current time in seconds of the Lottie animation. If setting, this will seek the animation to that point in time. |
| `currentFrame` | `frame: number` | Gets/Sets the current frame of the Lottie animation. If setting, this will seek the animation to that frame. |
| `duration` | `Getter only` | Gets the duration of the Lottie animation in seconds. |
| `durationFrames` | `Getter only`| Gets the duration of the Lottie animation in frames. |
| `direction` | `direction: 1 \| -1`| Gets or Sets the current direction. A value of `1` plays the animation in a _forwards_ direction, whereas `-1` plays the animation in _reverse_. |
| `speed` | `speed:number`| Gets or Sets the current speed factor, where `2` is twice the normal playing speed, `4` is four times, etc, etc. |

For example, assumming we have a Lottie Animation instance named `lottieAnimation`:

```javascript
// Play the animation
lottieAnimation.play = true;

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
const MyComponent = () => <Lottie src="path/to/your-animation.json" />;
```

Alternatively, you can provide the lottie JSON directly, rather than a URL. This
can be easier, since it can integrate better with your build pipeline and
bundler:

```javascript
import myAnimation from './path/to/your/animation.json';
// Note: make sure to setup JSON imports in your build pipeline

const MyComponent = () => <Lottie lottie={myAnimation} />;
```

#### Available properties

**TODO**

## License

MIT · Made with ❤️ by [Lottielab](https://lottielab.com)
