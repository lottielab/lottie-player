import lottie, { AnimationItem } from 'lottie-web/build/player/lottie_lottielab';

const X_LOTTIE_PLAYER = '@lottielab/lottie-player 0.2.0';

export type LottieData = any;

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
  durationFrames: number;
  direction: 1 | -1;
  speed: number;

  animation: AnimationItem | undefined;
  animationData: LottieData | undefined;
}

const EMPTY_LOTTIE = {
  v: '5.7.5',
  fr: 100,
  ip: 0,
  op: 300,
  w: 300,
  h: 225,
  nm: 'Comp 1',
  ddd: 0,
  assets: [],
  layers: [],
  markers: [],
};

class LottiePlayer implements ILottie {
  protected _animation!: AnimationItem;
  private loadingSrc?: string;
  protected readonly root: Node & InnerHTML;

  constructor(root: Node & InnerHTML, src?: string | any, autoplay?: boolean) {
    this.root = root;
    this.initialize(src, autoplay);
  }

  private _initWithAnimation(animationData: any, container: HTMLDivElement, autoplay?: boolean) {
    const { loop, direction, speed } = this;
    this._animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      autoplay,
      animationData,
    });

    this.loop = loop;
    this.direction = direction;
    this.speed = speed;
  }

  initialize(src: string | any | undefined, autoplay?: boolean): Promise<void> {
    // Clear existing content
    this.destroy();

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';

    if (typeof src === 'string') {
      // Load from URL
      if (this.loadingSrc === src) {
        return Promise.resolve();
      }

      this.loadingSrc = src;
      const xhr = new XMLHttpRequest();
      xhr.open('GET', src, true);
      xhr.setRequestHeader('X-Lottie-Player', X_LOTTIE_PLAYER);

      return new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (this.loadingSrc !== src) {
            // Another request has been made in the meantime
            return resolve();
          }

          try {
            if (xhr.status === 200) {
              if (!xhr.response) {
                return reject(new Error(`Failed to load Lottie file ${src}: Empty response`));
              }

              const lottie = JSON.parse(xhr.response);
              this._initWithAnimation(lottie, container, autoplay);
              this.root.innerHTML = '';
              this.root.appendChild(container);
              return resolve();
            } else {
              let responseText = xhr.responseText;
              if (responseText.length > 300) {
                responseText = responseText.slice(0, 300) + '... (truncated)';
              }
              return reject(
                new Error(
                  `Failed to load Lottie file ${src}: HTTP ${xhr.status} ${xhr.statusText}\nResponse:\n${responseText}`
                )
              );
            }
          } catch (e: any) {
            if (e.message) {
              e.message = `Failed to load Lottie file ${src}: ${e.message}`;
            }

            return reject(e);
          } finally {
            this.loadingSrc = undefined;
          }
        };
        xhr.onerror = () => {
          this.loadingSrc = undefined;
          reject(new Error(`Failed to load Lottie file ${src}: Network error`));
        };
        xhr.send();
      });
    } else {
      this._initWithAnimation(src ?? EMPTY_LOTTIE, container, autoplay);
      this.root.innerHTML = '';
      this.root.appendChild(container);
      this.loadingSrc = undefined;
      return Promise.resolve();
    }
  }

  destroy() {
    if (this._animation) {
      this._animation.destroy();
    }

    this.root.innerHTML = '';
  }

  // Methods
  play() {
    this._animation?.play();
  }

  stop() {
    this._animation?.stop();
  }

  pause() {
    this._animation?.pause();
  }

  seek(timeSeconds: number) {
    if (!this._animation) return;

    if (timeSeconds < 0) {
      timeSeconds = 0;
    } else if (timeSeconds >= this.duration) {
      // Last frame is exclusive
      timeSeconds = this.duration - 1e-6;
    }

    timeSeconds *= 1000;

    if (this._animation.isPaused) {
      this._animation.goToAndStop(timeSeconds, false);
    } else {
      this._animation.goToAndPlay(timeSeconds, false);
    }
  }

  seekToFrame(frame: number) {
    if (!this._animation) return;

    if (frame < 0) {
      frame = 0;
    } else if (frame >= this.durationFrames) {
      // Last frame is exclusive
      frame = this.durationFrames - 1e-6;
    }

    if (!this.playing) {
      this._animation.goToAndStop(frame, true);
    } else {
      this._animation.goToAndPlay(frame, true);
    }
  }

  loopBetween(timeSeconds1: number, timeSeconds2: number) {
    if (!this._animation) return;
    const frame1 = Math.round(this.frameRate * timeSeconds1);
    const frame2 = Math.round(this.frameRate * timeSeconds2);

    this._animation.playSegments([frame1, frame2]);
  }

  loopBetweenFrames(frame1: number, frame2: number) {
    this._animation?.playSegments([frame1, frame2]);
  }

  // Getters/Setters

  get playing(): boolean {
    return this._animation ? !this._animation.isPaused : false;
  }

  set playing(play: boolean) {
    if (!this._animation) return;

    if (play) {
      this.play();
    } else {
      this.pause();
    }
  }

  get loop(): boolean | number {
    return this._animation ? this._animation.loop : true;
  }

  set loop(loop: boolean | number) {
    if (!this._animation) return;

    this._animation.setLoop(loop as any); // lottie-web typings seem to be wrong
  }

  get currentTime(): number {
    return this._animation ? this.currentFrame / this.frameRate : 0;
  }

  set currentTime(time: number) {
    this.seek(time);
  }

  get currentFrame(): number {
    return this._animation ? this._animation.currentFrame : 0;
  }

  set currentFrame(frame: number) {
    this.seekToFrame(frame);
  }

  get frameRate(): number {
    return this._animation ? this._animation.frameRate : 0;
  }

  get duration(): number {
    return this._animation ? this._animation.getDuration(false) : 0;
  }

  get durationFrames(): number {
    return this._animation ? this._animation.getDuration(true) : 0;
  }

  get direction(): 1 | -1 {
    return this._animation ? (Math.sign(this._animation.playDirection) as 1 | -1) : 1;
  }

  set direction(playDirection: 1 | -1) {
    this._animation?.setDirection(playDirection);
  }

  get speed(): number {
    return this._animation ? this._animation.playSpeed : 1;
  }

  set speed(speed: number) {
    this._animation?.setSpeed(speed);
  }

  get animation(): AnimationItem {
    return this._animation;
  }

  get animationData(): LottieData | undefined {
    const data = (this._animation as any)?.animationData;
    if (data === EMPTY_LOTTIE) {
      return undefined;
    }
    return data;
  }
}

export default LottiePlayer;
