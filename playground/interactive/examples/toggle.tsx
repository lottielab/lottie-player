import React, { useRef, useEffect, useState } from 'react';
import LottieReact, { ILottie } from '../../../src/react';

// This is an Interactive Lottie created in Lottielab.
//
// It contains two states (toggle on and toggle off), and responds to custom
// events 'toggle_on' and 'toggle_off' to switch between them.
//
// To create a Lottie that responds to a custom event in Lottielab, select an
// interactivity state, click + to add an interaction, and select "Custom" from
// the event type dropdown. Then, type in the event name you want to use.
const LOTTIE_PATH = '../lotties/ToggleInteractive.json';

const ToggleComponent = (props: { state: boolean }) => {
  const lottie = useRef<ILottie | null>(null);
  useEffect(() => {
    const player = lottie.current;
    if (!player) return;

    // Send either a toggle_on or toggle_off event based on the current state of
    // the toggle.
    if (props.state) {
      player.interactivity?.trigger('toggle_on');
    } else {
      player.interactivity?.trigger('toggle_off');
    }
  }, [lottie.current, props.state]);

  return <LottieReact src={LOTTIE_PATH} ref={lottie} style={{ width: '200px' }} />;
};

export const ToggleExample = () => {
  const [state, setState] = useState(false);
  return (
    <div>
      <p>
        Click the toggle! Current state: <strong>{state ? 'on' : 'off'}</strong>
      </p>
      <div onClick={() => setState(!state)} style={{ cursor: 'pointer' }}>
        <ToggleComponent state={state} />
      </div>
    </div>
  );
};
