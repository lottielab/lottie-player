import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { LottieReact } from '../..';
import animation from '../lottielab-logo.json';

function App() {
  const [mode, setMode] = useState<'url' | 'direct'>('url');
  useEffect(() => {
    let currMode = mode;
    const interval = setInterval(() => {
      currMode = currMode === 'url' ? 'direct' : 'url';
      setMode(currMode);
      console.log(`Switching to mode: ${currMode}`);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (mode === 'url') {
    return (
      <LottieReact
        src="../lottielab-logo.json"
        playing={true}
        style={{ width: '100vw', height: '100vh' }}
      />
    );
  } else {
    return (
      <LottieReact lottie={animation} playing={true} style={{ width: '100vw', height: '100vh' }} />
    );
  }
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
