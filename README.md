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

##### Attributes

| Name       | Type                | Description                                            |
| ---------- | ------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `src`      | Attribute (string)  | The source path or JSON data for the Lottie animation. |
| `autoplay` | Attribute (boolean) | Whether the animation should autoplay.                 |
| `loop`     | Attribute (boolean  | number)                                                | Whether the animation should loop, optionally pass a number to set the number of loops an animation should play. |

##### Methods

| Name           | Type                                     | Description                                                                                                 |
| -------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `play`         | Method                                   | Plays the Lottie animation.                                                                                 |
| `stop`         | Method                                   | Stops the Lottie animation.                                                                                 |
| `pause`        | Method                                   | Pauses the Lottie animation.                                                                                |
| `setSpeed`     | Method (speed: number)                   | Sets the speed of the animation. `speed`: The speed factor.                                                 |
| `goToAndStop`  | Method (value: number, isFrame: boolean) | Goes to a specific frame and stops. `value`: Frame number or time, `isFrame`: Frame if true, time if false. |
| `goToAndPlay`  | Method (value: number, isFrame: boolean) | Goes to a specific frame and plays. `value`: Frame number or time, `isFrame`: Frame if true, time if false. |
| `setDirection` | Method (direction: AnimationDirection)   | Sets the direction of the animation. `direction`: 1 for forward, -1 for reverse.                            |
| `playSegments` | Method (segments: AnimationSegment       | AnimationSegment[], forceFlag: boolean)                                                                     | Plays specified segments of the animation. `segments`: The animation segments, `forceFlag`: If true, changes immediately. |
| `setSubframe`  | Method (useSubFrames: boolean)           | Sets whether to use subframes. `useSubFrames`: Subframe usage.                                              |
| `destroy`      | Method                                   | Destroys the Lottie animation instance.                                                                     |
| `getDuration`  | Method (inFrames: boolean): number       | Returns the duration of the animation. `inFrames`: If true, returns in frames, otherwise in seconds.        |

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
