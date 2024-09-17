import lottie, { AnimationItem } from 'lottie-web/build/player/lottie_lottielab';
import type { LottieJSON } from '..';
import { EventEmitter } from './event';

/**
 * Value of the X-Lottie-Player header that is sent with requests to the server.
 * This can be useful for monitoring and logging the various library versions
 * that exist in the wild, to address compatibility issues, for example.
 */
const X_LOTTIE_PLAYER = '@lottielab/lottie-player 1.1.2';

/**
 * List of allowed origins for which the X-Lottie-Player header, containing the
 * library version, is sent with the request.
 *
 * Ideally we would simply append this header to all requests, but if the server
 * doesn't respond with a matching Access-Control-Allow-Origin header, the request
 * will fail due to CORS. So we instead have a list of origins that are known to
 * allow this header via CORS.
 *
 * PRs to add more origins are welcome.
 */
const X_LOTTIE_PLAYER_ORIGIN_WHITELIST = [/^https?:\/\/(.*[^.]\.)?lottielab\.com$/];

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

/**
 * A base renderer for Lottie animations. Contains no logic for playback. After
 * being initialized with an animation, call render() to seek the animation to a
 * specific time and update the DOM to display the current frame.
 */
export class LottieRenderer {
  protected _animation!: AnimationItem;
  private loadingSrc?: string;
  protected readonly root: Node & InnerHTML;

  constructor(root: Node & InnerHTML, src?: string | LottieJSON, preserveAspectRatio?: string) {
    this.root = root;
    this.initialize(src, preserveAspectRatio);
  }

  private _initWithAnimation(
    animationData: LottieJSON,
    container: HTMLDivElement,
    preserveAspectRatio?: string
  ) {
    this._animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      autoplay: false,
      animationData,
      rendererSettings: {
        preserveAspectRatio,
      },
    });
  }

  initialize(src: string | LottieJSON | undefined, preserveAspectRatio?: string): Promise<void> {
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
      try {
        // Report the library version to the server for logging and monitoring
        // purposes, but only if the origin is whitelisted. This is to avoid CORS
        // issues - see X_LOTTIE_PLAYER_ORIGIN_WHITELIST above.
        if (X_LOTTIE_PLAYER_ORIGIN_WHITELIST.some((re) => new URL(src).origin.match(re))) {
          xhr.setRequestHeader('X-Lottie-Player', X_LOTTIE_PLAYER);
        }
      } catch (e) {
        // Ignore, since it's a debug/monitoring feature
      }

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
              this._initWithAnimation(lottie, container, preserveAspectRatio);
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
      this._initWithAnimation(src ?? EMPTY_LOTTIE, container, preserveAspectRatio);
      this.root.innerHTML = '';
      this.root.appendChild(container);
      this.loadingSrc = undefined;
      return Promise.resolve();
    }
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

  get animation(): AnimationItem {
    return this._animation;
  }

  get animationData(): LottieJSON | undefined {
    const data = (this._animation as any)?.animationData;
    if (data === EMPTY_LOTTIE) {
      return undefined;
    }
    return data;
  }

  renderFrame(time: number) {
    const clampedFrame = Math.max(0, Math.min(this.durationFrames - 1e-6, time * this.frameRate));
    this._animation.goToAndStop(clampedFrame, true);
  }

  get currentTime(): number {
    return this._animation.currentFrame / this.frameRate;
  }

  get currentFrame(): number {
    return this._animation.currentFrame;
  }

  destroy() {
    if (this._animation) {
      this._animation.destroy();
    }

    this.root.innerHTML = '';
  }
}
