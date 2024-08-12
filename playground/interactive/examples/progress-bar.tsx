import React, { useRef, useEffect, useState } from 'react';
import LottieReact, { ILottie } from '../../../src/react';

// This is an Interactive Lottie created in Lottielab.
//
// It contains two states: Empty and Full. The Empty state is configured to blend
// with the second one smoothly based on the value of a variable called
// "progress". A custom formula inside the Lottie controls the blend strength in
// such a way that when `progress` is 0, the progress bar is empty, when
// `progress` is 50 it's at 50%, etc.
//
// The value for this variable will be provided by us. The result will be a
// progress bar component powered only by a Lottie, with almost 0 extra code.
const LOTTIE_PATH = '../lotties/ProgressBarInteractive.json';

const ProgressBarComponent = (props: { progress: number }) => {
  const lottie = useRef<ILottie | null>(null);
  useEffect(() => {
    // The `interactivity.inputs` object allows setting value of custom variables
    // that an Interactive Lottie can respond to.
    lottie.current?.interactivity?.inputs.set('progress', props.progress);
  }, [lottie.current, props.progress]);

  return <LottieReact src={LOTTIE_PATH} ref={lottie} style={{ width: '100%' }}/>;
};

export const ProgressBarExample = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((progress) => (progress + 0.35) % 100);
    }, 20 + Math.random() * 20);
    return () => clearInterval(interval);
  });

  return (
    <div>
      <p>
        Progress: <strong>{Math.round(progress)}%</strong>
      </p>
      <ProgressBarComponent progress={progress} />
    </div>
  );
};
