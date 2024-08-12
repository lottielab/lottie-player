import type { AnimationItem } from 'lottie-web';

// lottie-web internal types

interface SvgRenderer {
  elements: SvgRendererElement[];
}

type ValueCallback = (val: Lerpable) => Lerpable;

interface DynamicProp {
  addEffect(cb: ValueCallback): void;
  effectsSequence: ValueCallback[];
  _caching: unknown;
  offsetTime: number;
  interpolateValue?(frame: number, caching: unknown): Lerpable;
  interpolateShape?(frame: number, prevValue: Lerpable, caching: unknown): Lerpable;
}

interface NestedDynamicProp {
  dynamicProperties: DynamicProp[];
}

interface SvgRendererElement {
  elements?: SvgRendererElement[];
  dynamicProperties?: (DynamicProp | NestedDynamicProp)[];
}

type ShapePath = {
  closed: boolean;
  i: number[];
  o: number[];
  v: number[];
  length?: number;
  _length?: number;
};

type Lerpable = number | number[] | Float32Array | ShapePath;

/**
 * A linear interpolation implementation which dynamically handles any type of
 * value that a lottie-web dynamic property (DynamicProp) might contain.
 */
function universalLerp(a: Lerpable, b: Lerpable, t: number): Lerpable {
  if (a == undefined) {
    return b;
  } else if (b == undefined) {
    return a;
  } else if (typeof a === 'number') {
    // 1-d lerp

    if (typeof b !== 'number') {
      // Cannot interpolate between these, fallback to a step function
      return t > 0.5 ? b : a;
    }

    return (1 - t) * a + t * b;
  } else if (Array.isArray(a) || a instanceof Float32Array) {
    // k-d lerp

    if (!Array.isArray(b) && !(b instanceof Float32Array)) {
      // Cannot interpolate between these, fallback to a step function
      return t > 0.5 ? b : a;
    }

    // Recursively apply to elements
    return a.map((xa, i) => universalLerp(xa, b[i] ?? xa, t) as number);
  } else if ('i' in a && 'v' in a && 'o' in a) {
    // Lerp between vector paths

    if (typeof b !== 'object' || !('i' in b && 'v' in b && 'o' in b)) {
      // Cannot interpolate between these, fallback to a step function
      return t > 0.5 ? b : a;
    }

    return {
      closed: a.closed && b.closed,
      i: universalLerp(a.i, b.i, t) as number[],
      o: universalLerp(a.o, b.o, t) as number[],
      v: universalLerp(a.v, b.v, t) as number[],
      length: Math.max(a.length ?? 0, b.length ?? 0),
      _length: Math.max(a._length ?? 0, b._length ?? 0),
    };
  } else {
    // Unknown type, fall back to step function
    return t > 0.5 ? b : a;
  }
}

/**
 * A single inter-frame morph operation. It instructs the morphing system to
 * combine the current state of each property with what its state would be at
 * another frame, interpolated with the provided strength.
 *
 * For example, if the animation is at time 2.0s and a morph operation of the
 * following form is applied:
 *
 * { time: 5.0, strength: 0.25 }
 *
 * This means that, for each animatable property, its state at frame 5.0s will be
 * combined with the state at frame 2.0s with 25% strength. Sliding the strength
 * from 0 to 1 will result in a smooth linar transition between the time 5.0s and
 * 2.0s.
 */
export type MorphOperation = {
  time: number;
  strength: number;
};

/** Maximum number of concurrent ops, for performance reasons. */
export const MAX_MORPHS = 8;

/**
 * An inter-frame morphing implementation for lottie-web.
 *
 * This class attaches to an existing lottie-web instance and allows the user to
 * manipulate the displayed state of the Lottie so that it does not display only
 * one frame, but an arbitrary linear combination of multiple frames.
 *
 * To use, instantiate the Morphing class and pass it a lottie-web instance.
 * Then, set the ops property to an array of MorphOperation objects. The
 * operations will be performed in sequence, each blending the state left by
 * the previous with some other frame of the animation. @see MorphOperation
 */
export class Morphing {
  public ops: MorphOperation[];
  private lottie: AnimationItem;

  constructor(lottie: AnimationItem) {
    this.ops = [];
    this.lottie = lottie;

    const renderer = lottie.renderer as SvgRenderer;
    const s = new WeakSet<object>();
    (renderer?.elements ?? []).forEach((el) => this.attach(el, s));
  }

  private attachToProp(p: DynamicProp) {
    const self = this;
    const s = p as any;
    if (!p.effectsSequence?.length) {
      return;
    }

    const vrs: any[] = [];
    for (let i = 0; i < MAX_MORPHS; i++) {
      vrs[i] = {
        _caching: structuredClone(p._caching),
        propType: s.propType,
        offsetTime: s.offsetTime,
        keyframes: s.keyframes,
        keyframesMetadata: s.keyframesMetadata,
        sh: s.sh,
        pv: structuredClone(s.pv),
      };
    }

    p.addEffect(function (val: Lerpable) {
      const activeMorphs = self.ops.slice(-MAX_MORPHS);

      if (p.interpolateShape && val == undefined) {
        val = structuredClone(s.pv);
      }

      for (let i = 0; i < activeMorphs.length; i++) {
        const morph = activeMorphs[i];
        const vr = vrs[i];

        if (!vr._caching && p._caching) vr._caching = structuredClone(p._caching);
        if (!vr.keyframes && s.keyframes) vr.keyframes = s.keyframes;
        if (!vr.keyframesMetadata && s.keyframesMetadata)
          vr.keyframesMetadata = s.keyframesMetadata;

        const otherFrame = Math.min(
          Math.max(Math.round(morph.time * self.lottie.frameRate), 0),
          self.lottie.getDuration(true) - 1e-5
        );

        try {
          vr.offsetTime = p.offsetTime;
          let otherVal;
          if (p.interpolateValue) {
            if (vr._caching.lastFrame >= otherFrame) {
              vr._caching._lastKeyframeIndex = -1;
              vr._caching.lastIndex = 0;
            }
            otherVal = p.interpolateValue.call(vr, otherFrame, vr._caching);
            vr.pv = otherVal;
          } else if (p.interpolateShape) {
            vr._caching.lastIndex = vr._caching.lastFrame < otherFrame ? vr._caching.lastIndex : 0;
            p.interpolateShape.call(vr, otherFrame, vr.pv, vr._caching);
            otherVal = vr.pv;
          } else {
            otherVal = 0;
          }

          // update caching
          vr._caching.lastFrame = otherFrame;

          val = universalLerp(val, otherVal, morph.strength);
        } catch (e) {
          console.warn(`[@lottielab/lottie-player:morph]`, e);
        }
      }

      return val;
    });
  }

  private attach(el: any, s = new WeakSet<object>()) {
    if (s.has(el)) {
      return;
    }

    if (typeof el === 'object' && el != null) {
      s.add(el);
    } else {
      return;
    }

    if (el.interpolateShape || el.interpolateValue || el.addEffect || el.effectsSequence) {
      this.attachToProp(el);
      return;
    }

    for (const v of Object.values(el)) {
      this.attach(v, s);
    }
  }

  detach() {
    // TODO
  }
}
