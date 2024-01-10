import React, { useEffect, useRef, forwardRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web/build/player/lottie_lottielab';

interface LottiePropsBase {
  playing?: boolean;
  loop?: boolean;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

type LottieProps = LottiePropsBase & ({ src: string } | { lottie: object });

const LottieReact = forwardRef<AnimationItem, LottieProps>(
  ({ playing = true, loop = true, speed = 1, className, style, ...rest }, ref) => {
    const container = useRef<HTMLDivElement | null>(null);
    const [animationData, setAnimationData] = React.useState<object | null>(null);
    const [animationSrc, setAnimationSrc] = React.useState<string | null>(null);
    const animationInstance = useRef<AnimationItem | null>(null);

    useEffect(
      () => {
        if ('src' in rest && rest.src !== animationSrc) {
          // Fetch the lottie JSON from the URL
          const src = rest.src;
          setAnimationSrc(src);
          fetch(src)
            .then((r) => r.json())
            .then((data) => setAnimationData(data))
            .catch((e) => console.error(`Error fetching Lottie animation data from '${src}'`, e));
        } else if ('lottie' in rest && rest.lottie !== animationData) {
          // Lottie JSON directly provided
          setAnimationSrc(null);
          setAnimationData(rest.lottie);
        }
      },
      'src' in rest ? [rest.src, undefined] : [undefined, rest.lottie]
    );

    useEffect(() => {
      if (container.current) {
        animationInstance.current = lottie.loadAnimation({
          container: container.current,
          renderer: 'svg',
          loop,
          autoplay: playing,
          animationData,
          ...rest,
        });

        if (ref && typeof ref === 'function') {
          ref(animationInstance.current);
        } else if (ref && 'current' in ref) {
          (ref as React.MutableRefObject<AnimationItem | null>).current = animationInstance.current;
        }
      }

      return () => {
        if (animationInstance.current) {
          animationInstance.current.destroy();
          animationInstance.current = null;
        }
      };
    }, [container.current, animationData, ref, rest]);

    useEffect(() => {
      if (animationInstance.current) {
        if (playing) {
          animationInstance.current.play();
        } else {
          animationInstance.current.pause();
        }
      }
    }, [playing]);

    useEffect(() => {
      if (animationInstance.current) {
        animationInstance.current.setSpeed(speed);
      }
    }, [speed]);

    useEffect(() => {
      if (animationInstance.current) {
        animationInstance.current.setLoop(loop);
      }
    }, [loop]);

    return <div className={'lottie ' + (className ?? '')} style={style} ref={container} />;
  }
);

export default LottieReact;
