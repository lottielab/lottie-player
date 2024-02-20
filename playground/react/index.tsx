import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { LottieReact, ILottie } from '../..';
import animation from '../lottielab-logo.json';

type ControlsProps = {
  playing: boolean;
  loop: boolean;
  speed: number;
  direction: 1 | -1;

  onOpen: () => void;
  onPlayPause: () => void;
  onStop: () => void;
  onLoopChange: (loop: boolean) => void;
  onSpeedChange: (speed: number) => void;
  onDirectionChange: (direction: 1 | -1) => void;
};

function Controls(props: ControlsProps) {
  return (
    <div className="controls">
      <button onClick={props.onOpen}>Open...</button>
      {/* Seeking and other actions can be performed by accessing the ILottie ref directly. */}
      <button onClick={props.onPlayPause}>{props.playing ? 'Pause' : 'Play'}</button>
      <button onClick={props.onStop}>Stop</button>
      <input
        id="ct-loop"
        type="checkbox"
        checked={props.loop}
        onChange={(e) => props.onLoopChange(e.target.checked)}
      />
      <label htmlFor="ct-loop">Loop</label> | Speed:
      <button onClick={() => props.onSpeedChange(props.speed * 2)}>x2</button>
      <button onClick={() => props.onSpeedChange(props.speed * 0.5)}>x0.5</button>
      Direction:
      <button onClick={() => props.onDirectionChange(1)}>Normal</button>
      <button onClick={() => props.onDirectionChange(-1)}>Reverse</button>
    </div>
  );
}

function App() {
  const [loop, setLoop] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [playing, setPlaying] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const lottie = useRef<ILottie | null>(null);

  useEffect(() => {
    let raf: ReturnType<typeof requestAnimationFrame>;
    function update() {
      setPlaying(lottie.current?.playing ?? false);
      raf = requestAnimationFrame(update);
    }
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  const input = src ? { src } : { lottie: animation };

  return (
    <div>
      <Controls
        playing={playing}
        loop={loop}
        speed={speed}
        direction={direction}
        onOpen={() => {
          const url = prompt(
            'Enter Lottie JSON URL (or "default" to use the initial one)',
            src ?? ''
          );
          if (url === 'default') setSrc(null);
          else if (url) setSrc(url);
        }}
        onPlayPause={() => {
          if (!lottie.current) return;
          lottie.current.playing = !lottie.current.playing;
        }}
        onStop={() => lottie.current?.stop()}
        onLoopChange={setLoop}
        onSpeedChange={setSpeed}
        onDirectionChange={setDirection}
      />

      <LottieReact
        ref={lottie}
        {...input}
        loop={loop}
        speed={speed}
        direction={direction}
        autoplay={true}
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
