import React, { useEffect, useRef, useCallback, forwardRef } from 'react';
import LottiePlayer, { ILottie } from '../common/player';

interface LottiePropsBase {
  autoplay?: boolean;
  loop?: boolean;
  speed?: number;
  direction?: 1 | -1;
  className?: string;
  style?: React.CSSProperties;
}

type LottieProps = LottiePropsBase & ({ src: string } | { lottie: object });

const LottieReact = forwardRef<ILottie, LottieProps>(
  ({ autoplay = true, loop = true, speed = 1, direction = 1, className, style, ...rest }, ref) => {
    const player = useRef<LottiePlayer | null>(null);
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

    useEffect(() => {
      player.current?.initialize('src' in rest ? rest.src : rest.lottie, autoplay);
      return () => player.current?.destroy();
    }, ['src' in rest ? rest.src : rest.lottie]);

    useEffect(() => {
      if (!player.current) return;
      player.current.loop = loop;
    }, [loop]);

    useEffect(() => {
      if (!player.current) return;
      player.current.speed = speed;
    }, [speed]);

    useEffect(() => {
      if (!player.current) return;
      player.current.direction = direction;
    }, [direction]);

    return <div className={'lottie ' + (className ?? '')} style={style} ref={container} />;
  }
);

export default LottieReact;
export { ILottie };
