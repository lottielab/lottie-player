import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import cx from 'classnames';

import { InteractiveLottieExample } from './examples/interactive-lottie';
import { ToggleExample } from './examples/toggle';
import {ProgressBarExample} from './examples/progress-bar';

const NAV_ELEMENTS = [
  {
    title: 'Interactive Lottie',
    tech: 'HTML',
    tagline: `Demoes out-of-the-box Interactive Lottie support.`,
    description: `
    An Interactive Lottie is an ordinary Lottie infused with special interactivity information. When such
    a Lottie is loaded into the player, it becomes interactive and can respond to user actions such as clicks,
    and hovers.

    Interactive Lotties can be created and previewed using the Lottielab editor, or by writing a Lottielab Interactivity
    definition by hand.

    This example shows how easy it is to display an interactive Lottie like this using the HTML player component.
    The same can also easily be achieved using the React component instead.
    `,
    component: () => <InteractiveLottieExample />,
  },
  {
    title: 'Toggle',
    tech: 'React',
    tagline: 'Controllable Lottie-powered toggle component using custom events.',
    description: `
    While an Interactive Lottie that responds to mouse events out of the box is cool, there's no reason
    to stop there.

    With Lottielab Interactivity support in this player, you can create Lotties that automatically respond
    to custom, user-defined events as well as predefined ones.

    This example shows how to create a simple animated toggle React component that uses a custom event to switch
    between two states.`,
    component: () => <ToggleExample />,
  },
  {
    title: 'Progress Bar',
    tech: 'React',
    tagline: `Lottie-powered progress bar React component using custom variables.`,
    description: `
    Besides reacting to predefined and custom user events, an Interactive Lottie can use formulas to smoothly
    respond to changing inputs. A simple example of this is responding to the mouse as it moves over the Lottie.

    However, we can go one step further and create an Interactive Lottie that responds to a custom,
    programmatically provided variable.

    This example will combine this technique with support for blending between two states to create a flexible
    progress bar component, completely Lottie-powered and with almost 0 extra code.
    `,
    component: () => <ProgressBarExample />,
  },
];

const App = () => {
  const [selected, setSelected] = useState<string>('Interactive Lottie');
  const selectedItem = NAV_ELEMENTS.find((x) => x.title === selected);

  return (
    <div className="my-2 container">
      <a href="..">&lt; Back to all examples</a>
      <h1 className="mt-2"><strong>Interactivity Examples</strong> | Lottielab Player</h1>
      <div className="navbar navbar-expand-lg navbar-light bg-light">
        <ul className="navbar-nav">
          {NAV_ELEMENTS.map((navElement) => (
            <li
              key={navElement.title}
              className={cx('btn mx-1 nav-item', {
                'active btn-outline-primary': selected === navElement.title,
                'btn-outline-secondary': selected !== navElement.title,
              })}
              onClick={() => setSelected(navElement.title)}
            >
              {navElement.title}
              {' '}
              <span className="badge rounded-pill text-bg-primary">{navElement.tech}</span>
            </li>
          ))}
        </ul>
      </div>
      {selectedItem && (
        <>
          <div className="row p-1 my-2">
            <h3>{selectedItem.tagline}</h3>
            {selectedItem.description?.split('\n\n').map((x, i) => <p key={i}>{x}</p>)}
          </div>
          <hr />
          <div className="row">{NAV_ELEMENTS.find((x) => x.title === selected)?.component()}</div>
        </>
      )}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
