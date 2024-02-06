import lottie, { AnimationItem } from 'lottie-web/build/player/lottie_lottielab';

const X_LOTTIE_PLAYER = '@lottielab/lottie-player 0.2.0';

function warn(message: string) {
  console.warn(`[@lottielab/lottie-player] ${message}`);
}

export interface ILottie {
  play(): void;
  stop(): void;
  pause(): void;
  seek(timeSeconds: number): void;
  seekToFrame(frame: number): void;
  loopBetween(timeSeconds1: number, timeSeconds2: number): void;
  loopBetweenFrames(frame1: number, frame2: number): void;
  playing: boolean;
  loop: boolean | number;
  currentTime: number;
  currentFrame: number;
  frameRate: number;
  duration: number;
  durationInFrames: number;
  direction: 1 | -1;
  speed: number;
}

class LottiePlayer implements ILottie {
  protected player?: AnimationItem;
  private loadingSrc?: string;
  protected readonly root: Node & InnerHTML;

  constructor(root: Node & InnerHTML, src?: string | any, autoplay?: boolean) {
    this.root = root;
    if (src) {
      this.initialize(src, autoplay);
    }
  }

  private _initWithAnimation(animationData: any, container: HTMLDivElement, autoplay?: boolean) {
    this.player = lottie.loadAnimation({
      container,
      renderer: 'svg',
      autoplay,
      animationData,
    });
  }

  initialize(src: string | any, autoplay?: boolean) {
    const { direction, loop, speed } = this;

    // Clear existing content
    this.destroy();

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';

    if (typeof src === 'string') {
      if (this.loadingSrc === src) {
        return;
      }

      this.loadingSrc = src;
      const xhr = new XMLHttpRequest();
      xhr.open('GET', src, true);
      xhr.setRequestHeader('X-Lottie-Player', X_LOTTIE_PLAYER);
      xhr.responseType = 'json';
      xhr.onload = () => {
        if (this.loadingSrc !== src) {
          // Another request has been made in the meantime
          return;
        }

        try {
          if (xhr.status === 200) {
            if (!xhr.response) {
              warn(`Failed to load Lottie file ${src}: Empty response or invalid JSON`);
              return;
            }

            this._initWithAnimation(xhr.response, container, autoplay);
            this.loop = loop;
            this.direction = direction;
            this.speed = speed;

            this.root.innerHTML = '';
            this.root.appendChild(container);
          } else {
            warn(`Failed to load Lottie file ${src}: HTTP ${xhr.statusText} ${xhr.responseText}`);
          }
        } finally {
          this.loadingSrc = undefined;
        }
      };
      xhr.onerror = () => {
        warn(`Failed to load Lottie file ${src}: Network error`);
        this.loadingSrc = undefined;
      };
      xhr.send();
    } else {
      this._initWithAnimation(src, container, autoplay);
      this.root.innerHTML = '';
      this.root.appendChild(container);
      this.loop = loop;
      this.direction = direction;
      this.speed = speed;
      this.loadingSrc = undefined;
    }
  }

  destroy() {
    if (this.player) {
      this.player.destroy();
      this.player = undefined;
    }

    this.root.innerHTML = '';
  }

  // Methods
  play() {
    this.player?.play();
  }

  stop() {
    this.player?.stop();
  }

  pause() {
    this.player?.pause();
  }

  seek(timeSeconds: number) {
    if (!this.player) return;

    if (timeSeconds < 0) {
      timeSeconds = 0;
    } else if (timeSeconds >= this.duration) {
      // Last frame is exclusive
      timeSeconds = this.duration - 1e-6;
    }

    timeSeconds *= 1000;

    if (this.player.isPaused) {
      this.player.goToAndStop(timeSeconds, false);
    } else {
      this.player.goToAndPlay(timeSeconds, false);
    }
  }

  seekToFrame(frame: number) {
    if (!this.player) return;

    if (frame < 0) {
      frame = 0;
    } else if (frame >= this.durationInFrames) {
      // Last frame is exclusive
      frame = this.durationInFrames - 1e-6;
    }

    if (!this.playing) {
      this.player.goToAndStop(frame, true);
    } else {
      this.player.goToAndPlay(frame, true);
    }
  }

  loopBetween(timeSeconds1: number, timeSeconds2: number) {
    if (!this.player) return;
    const frame1 = Math.round(this.frameRate * timeSeconds1);
    const frame2 = Math.round(this.frameRate * timeSeconds2);

    this.player.playSegments([frame1, frame2]);
  }

  loopBetweenFrames(frame1: number, frame2: number) {
    this.player?.playSegments([frame1, frame2]);
  }

  // Getters/Setters

  get playing(): boolean {
    return this.player ? !this.player.isPaused : false;
  }

  set playing(play: boolean) {
    if (!this.player) return;

    if (play) {
      this.play();
    } else {
      this.pause();
    }
  }

  get loop(): boolean | number {
    return this.player ? this.player.loop : true;
  }

  set loop(loop: boolean | number) {
    if (!this.player) return;

    this.player.setLoop(loop as any); // lottie-web typings seem to be wrong
  }

  get currentTime(): number {
    return this.player ? this.currentFrame / this.frameRate : 0;
  }

  set currentTime(time: number) {
    this.seek(time);
  }

  get currentFrame(): number {
    return this.player ? this.player.currentFrame : 0;
  }

  set currentFrame(frame: number) {
    this.seekToFrame(frame);
  }

  get frameRate(): number {
    return this.player ? this.player.frameRate : 0;
  }

  get duration(): number {
    return this.player ? this.player.getDuration(false) : 0;
  }

  get durationInFrames(): number {
    return this.player ? this.player.getDuration(true) : 0;
  }

  get direction(): 1 | -1 {
    return this.player ? (Math.sign(this.player.playDirection) as 1 | -1) : 1;
  }

  set direction(playDirection: 1 | -1) {
    this.player?.setDirection(playDirection);
  }

  get speed(): number {
    return this.player ? this.player.playSpeed : 1;
  }

  set speed(speed: number) {
    this.player?.setSpeed(speed);
  }
}

export default LottiePlayer;
