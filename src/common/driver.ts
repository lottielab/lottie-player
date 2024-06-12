import type { LottieJSON } from '..';
import type { MorphOperation } from './morphing';

export type LottieState = {
  time: number;
  morphs?: MorphOperation[];
  lottie: LottieJSON;
};

export interface LottieDriver {
  advance(state: LottieState, elapsed: number): LottieState;
}
