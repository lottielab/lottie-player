import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import LottieReact, { ILottie } from '../../src/react';
import animation from '../lotties/Lottielab.json';

type ControlsProps = {
  playing: boolean;
  playheadTime: number;
  loop: boolean;
  speed: number;
  direction: 1 | -1;
  duration: number;

  onOpen: () => void;
  onPlayPause: () => void;
  onSeek: (newPlayheadTime: number) => void;
  onStop: () => void;
  onLoopChange: (loop: boolean) => void;
  onSpeedChange: (speed: number) => void;
  onDirectionChange: (direction: 1 | -1) => void;
};

function Controls(props: ControlsProps) {
  return (
    <div className="controls container">
      <button className="btn btn-primary" onClick={props.onOpen}>
        Open...
      </button>
      <input
        type="range"
        className="form-range"
        id="ct-progress"
        min="0"
        max={props.duration}
        step="0.001"
        value={props.playheadTime}
        onChange={(e) => props.onSeek(+e.target.value)}
      />
      <button className="btn btn-secondary" onClick={props.onPlayPause}>
        {props.playing ? 'Pause' : 'Play'}
      </button>
      <button className="btn btn-secondary" onClick={props.onStop}>
        Stop
      </button>
      <input
        id="ct-loop"
        type="checkbox"
        checked={props.loop}
        onChange={(e) => props.onLoopChange(e.target.checked)}
      />
      <label htmlFor="ct-loop">Loop</label> | Speed:
      <button className="btn btn-secondary" onClick={() => props.onSpeedChange(props.speed * 2)}>
        x2
      </button>
      <button className="btn btn-secondary" onClick={() => props.onSpeedChange(props.speed * 0.5)}>
        x0.5
      </button>
      Direction:
      <button className="btn btn-secondary" onClick={() => props.onDirectionChange(1)}>
        Normal
      </button>
      <button className="btn btn-secondary" onClick={() => props.onDirectionChange(-1)}>
        Reverse
      </button>
    </div>
  );
}

function App() {
  const [loop, setLoop] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [playhead, setPlayhead] = useState<number>(0);
  const [playing, setPlaying] = useState(true);
  const [src, setSrc] = useState<string | null>(null);
  const lottie = useRef<ILottie | null>(null);

  const input = src ? { src } : { lottie: animation };

  return (
    <div>
      <Controls
        playing={playing}
        playheadTime={playhead}
        loop={loop}
        speed={speed}
        direction={direction}
        duration={lottie.current?.duration ?? 0}
        onOpen={() => {
          const url = prompt(
            'Enter Lottie JSON URL (or "default" to use the initial one)',
            src ?? ''
          );
          if (url === 'default') setSrc(null);
          else if (url) setSrc(url);
        }}
        onSeek={(newPlayheadTime) => {
          setPlayhead(newPlayheadTime);
          lottie.current?.seek(newPlayheadTime);
        }}
        onPlayPause={() => setPlaying(!playing)}
        onStop={() => lottie.current?.stop()}
        onLoopChange={setLoop}
        onSpeedChange={setSpeed}
        onDirectionChange={setDirection}
      />

      <LottieReact
        ref={lottie}
        playing={playing}
        onTime={(e) => setPlayhead(e.playhead)}
        {...input}
        loop={loop}
        speed={speed}
        direction={direction}
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
