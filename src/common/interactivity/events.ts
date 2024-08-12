import { InteractiveEvent, InteractiveEventType } from './definition';
import { BuiltinVariables } from './variables';

const ENCLOSING_RECT_CLASS = 'll-enclosing-rect';

function clamp(x: number, min: number, max: number) {
  return Math.min(Math.max(x, min), max);
}

export interface InteractiveEventHandler {
  updateVariables(variables: Partial<BuiltinVariables>): void;
  handle(event: InteractiveEvent): void;
}

/**
 * Catches and dispatches interactive mouse events to handlers. Keeps track of
 * mouse-related variables, as defined in `FormulaVariables`.
 */
export class InteractiveEventDispatcher {
  public handler?: InteractiveEventHandler;
  private disposers: (() => void)[] = [];

  private attachContinuousListeners(enclosingSvgRect: SVGRectElement) {
    const globalMouseMove = (e: MouseEvent) => {
      const rect = enclosingSvgRect.getBoundingClientRect();

      this.handler?.updateVariables({
        'mouse.x': e.clientX - rect.left,
        'mouse.y': e.clientY - rect.top,
        'mouse.abs.x': e.clientX,
        'mouse.abs.y': e.clientY,
        'mouse.progress.x': clamp((e.clientX - rect.left) / rect.width, 0, 1),
        'mouse.progress.y': clamp((e.clientY - rect.top) / rect.height, 0, 1),
      });
    };

    window.addEventListener('mousemove', globalMouseMove);
    this.disposers.push(() => window.removeEventListener('mousemove', globalMouseMove));

    const globalMouseDown = (e: MouseEvent) => {
      this.handler?.updateVariables({
        'mouse.buttons.left': (e.buttons & 1) != 0,
        'mouse.buttons.right': (e.buttons & 2) != 0,
        'mouse.buttons.middle': (e.buttons & 4) != 0,
      });
    };

    window.addEventListener('mousedown', globalMouseDown);
    this.disposers.push(() => window.removeEventListener('mousedown', globalMouseDown));

    const globalMouseUp = () => {
      this.handler?.updateVariables({
        'mouse.buttons.left': false,
        'mouse.buttons.right': false,
        'mouse.buttons.middle': false,
      });
    };

    window.addEventListener('mouseup', globalMouseUp);
    this.disposers.push(() => window.removeEventListener('mouseup', globalMouseUp));
  }

  private attachListener(
    element: SVGElement,
    className: string | undefined,
    event: InteractiveEventType
  ) {
    let eventName: 'click' | 'mouseenter' | 'mouseleave' | 'mousedown' | 'mouseup';
    switch (event) {
      case 'click':
        eventName = 'click';
        break;
      case 'mouseEnter':
        eventName = 'mouseenter';
        break;
      case 'mouseLeave':
        eventName = 'mouseleave';
        break;
      case 'mouseDown':
        eventName = 'mousedown';
        break;
      case 'mouseUp':
        eventName = 'mouseup';
        break;
      default:
        throw new Error('InteractiveEventDispatcher: not a DOM event: ' + event);
    }

    const listener = (e: MouseEvent) => {
      if (className === ENCLOSING_RECT_CLASS) {
        this.handler?.handle({ event });
      } else {
        this.handler?.handle({ event, target: className ?? undefined });
      }
    };

    element.addEventListener(eventName, listener);
    this.disposers.push(() => element.removeEventListener(eventName, listener));
  }

  constructor(
    private container: HTMLElement,
    observedClassNames: string[] = []
  ) {
    const svgElement = container.querySelector('svg');
    const viewBox = svgElement
      ?.getAttribute('viewBox')
      ?.split(' ')
      .map((x) => parseFloat(x)) ?? [1200, 900];

    // Create an enclosing rect element
    const rootG = svgElement?.querySelector('svg > g') as SVGElement;
    const fullLottieRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    [
      ['x', '0'],
      ['y', '0'],
      ['width', viewBox[2].toString()],
      ['height', viewBox[3].toString()],
      ['fill', 'transparent'],
      ['pointer-events', 'bounding-box'],
      ['class', ENCLOSING_RECT_CLASS],
    ].forEach(([key, value]) => {
      fullLottieRect.setAttribute(key, value);
    });

    rootG?.insertBefore(fullLottieRect, rootG.firstChild);
    this.disposers.push(() => fullLottieRect.remove());

    const seenClasses = new Set<string>();
    for (const className of [ENCLOSING_RECT_CLASS].concat(observedClassNames)) {
      if (seenClasses.has(className)) {
        console.warn(
          `[@lottielab/lottie-player:interactive] Duplicate class name ${className} in reactivity event dispatcher`
        );
      }

      seenClasses.add(className);

      const element =
        className === ENCLOSING_RECT_CLASS
          ? rootG
          : (this.container.querySelector(`.${className}`) as SVGElement);
      if (!element) {
        console.warn(
          `[@lottielab/lottie-player:interactive] Could not find element with class name ${className}`
        );
        continue;
      }

      for (const event of ['click', 'mouseDown', 'mouseUp', 'mouseEnter', 'mouseLeave'] as const) {
        this.attachListener(element, className, event);
      }
    }

    this.attachContinuousListeners(fullLottieRect);
  }

  destroy() {
    this.disposers.forEach((d) => d());
  }
}
