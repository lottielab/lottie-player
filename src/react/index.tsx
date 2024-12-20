import React, { useEffect, useRef, useCallback, forwardRef, useState } from 'react';
import { LottiePlayer } from '../common/player';
import { ILottie, TimeEvent, TransitionEvent } from '..';

function warn(e: any) {
  // Create an error object if the input is a string so that the stack trace is preserved
  console.warn(`[@lottielab/lottie-player/web]`, typeof e === 'string' ? new Error(e) : e);
}

export type LottiePropsDriven =
  | {
      time: number;
    }
  | { frame: number };

export interface LottiePropsAutonomous {
  autoplay?: boolean;
  playing?: boolean;
  loop?: boolean;
  speed?: number;
  direction?: 1 | -1;
}

export interface LottiePropsBase {
  className?: string;
  style?: React.CSSProperties;
  preserveAspectRatio?: string;

  onLoad?: () => void;
  onError?: (e: unknown) => void;
  onTime?: (e: TimeEvent) => void;
  onLoop?: () => void;
  onFinish?: () => void;
  onTransitionStart?: (e: TransitionEvent) => void;
  onTransitionEnd?: (e: TransitionEvent) => void;
}

export type LottieProps = LottiePropsBase &
  ({ src: string } | { lottie: object }) &
  (LottiePropsAutonomous | LottiePropsDriven);

const LottieReact = forwardRef<ILottie, LottieProps>((props, ref) => {
  const player = useRef<LottiePlayer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const container = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      player.current = new LottiePlayer(node);
      if (ref) {
        if (typeof ref === 'function') {
          ref(player.current);
        } else {
          ref.current = player.current;
        }
      }
    }
  }, []);

  const isDriven = 'frame' in props || 'time' in props;

  const handleInitialize = useCallback(async function ({
    player,
    src,
    autoplay,
    preserveAspectRatio,
    onSuccess,
    onError,
  }: {
    player: LottiePlayer;
    src: string | object;
    autoplay?: boolean;
    preserveAspectRatio?: string;
    onSuccess?: () => void;
    onError?: (error: unknown) => void;
  }) {
    try {
      await player.initialize(src, autoplay, preserveAspectRatio);
      onSuccess?.();
    } catch (error) {
      onError?.(error);
    }
  }, []);

  useEffect(() => {
    if (!player.current) {
      return;
    }

    const autoplay =
      'playing' in props && props.playing != undefined
        ? props.playing
        : 'autoplay' in props
          ? props.autoplay
          : true;

    const src = 'src' in props ? props.src : props.lottie;

    const preserveAspectRatio = props.preserveAspectRatio;

    void handleInitialize({
      player: player.current,
      src,
      autoplay,
      preserveAspectRatio,
      onSuccess: function () {
        props.onLoad?.();
        setIsInitialized(true);
      },
      onError: function (error) {
        warn(error);
        props.onError?.(error);
      },
    });

    return () => player.current?.destroy();
  }, ['src' in props ? props.src : props.lottie, props.preserveAspectRatio]);

  useEffect(() => {
    if (!player.current || isDriven) return;
    player.current.loop = props.loop ?? true;
  }, [isDriven, 'loop' in props ? props.loop : undefined]);

  useEffect(() => {
    if (!player.current || isDriven) return;
    player.current.speed = props.speed ?? 1;
  }, [isDriven, 'speed' in props ? props.speed : undefined]);

  useEffect(() => {
    if (!player.current || isDriven) return;
    player.current.direction = props.direction ?? 1;
  }, ['direction' in props ? props.direction : undefined]);

  useEffect(() => {
    if (!player.current || isDriven || props.playing == undefined) return;
    if (props.playing) {
      player.current.play();
    } else {
      player.current.pause();
    }
  }, [isDriven, 'playing' in props ? props.playing : undefined, player.current?.playing]);

  useEffect(() => {
    if (!player.current || !isDriven) return;
    if (player.current.playing) {
      player.current.pause();
    }

    if ('time' in props) {
      player.current.currentTime = props.time;
    } else {
      player.current.currentFrame = props.frame;
    }
  }, [isDriven, 'time' in props ? props.time : 'frame' in props ? props.frame : undefined]);

  useEffect(() => {
    if (!props.onTime) return;
    function listener(e: TimeEvent) {
      props.onTime?.(e);
    }

    player.current?.on('time', listener);
    return () => player.current?.off('time', listener);
  }, [props.onTime]);

  useEffect(() => {
    if (!props.onLoop) return;
    function listener() {
      props.onLoop?.();
    }

    player.current?.on('loop', listener);
    return () => player.current?.off('loop', listener);
  }, [props.onLoop]);

  useEffect(() => {
    if (!props.onFinish) return;
    function listener() {
      props.onFinish?.();
    }

    player.current?.on('finish', listener);
    return () => player.current?.off('finish', listener);
  }, [props.onFinish]);

  useEffect(() => {
    if (!props.onTransitionStart || !isInitialized) return;
    function listener(e: TransitionEvent) {
      props.onTransitionStart?.(e);
    }

    player.current?.interactivity?.on('transitionstart', listener);
    return () => player.current?.interactivity?.off('transitionstart', listener);
  }, [props.onTransitionStart, isInitialized]);

  useEffect(() => {
    if (!props.onTransitionEnd || !isInitialized) return;
    function listener(e: TransitionEvent) {
      props.onTransitionEnd?.(e);
    }

    player.current?.interactivity?.on('transitionend', listener);
    return () => player.current?.interactivity?.off('transitionend', listener);
  }, [props.onTransitionEnd, isInitialized]);

  const { className, style } = props;
  return (
    <div className={'lottie' + (className ? ' ' + className : '')} style={style} ref={container} />
  );
});

export * from '../common-exports';
export default LottieReact;
