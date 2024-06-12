export type Point = { x: number; y: number };

export type BuiltinVariables = {
  // Time in seconds since the animation first started.
  time: number;
  // Time in seconds that passed between the previous and the current frames
  'time.diff': number;
  // The current playhead position in this state, in seconds.
  playhead: number;
  // The current playhead position in this state, as a value from 0 to 1
  // within the segment (0 = start, 1 = end).
  'playhead.progress': number;
  // Global position of the playhead in seconds.
  'playhead.abs': number;
  // The current mouse position, relative to the top-left of the lottie, in pixels
  'mouse.x': number;
  'mouse.y': number;
  // The current mouse position, as a value from 0 to 1 within the lottie's bounds
  // (0 = left/top, 1 = right/bottom)
  'mouse.progress.x': number;
  'mouse.progress.y': number;
  // The current mouse position, relative to the top-left of the whole viewport rather
  // than the lottie itself
  'mouse.abs.x': number;
  'mouse.abs.y': number;
  // Whether the left, right, or middle mouse buttons are currently pressed
  'mouse.buttons.left': boolean;
  'mouse.buttons.right': boolean;
  'mouse.buttons.middle': boolean;
};

export const defaultValues: BuiltinVariables = {
  time: 0,
  'time.diff': 0,
  playhead: 0,
  'playhead.progress': 0,
  'playhead.abs': 0,
  'mouse.x': 0,
  'mouse.y': 0,
  'mouse.progress.x': 0,
  'mouse.progress.y': 0,
  'mouse.abs.x': 0,
  'mouse.abs.y': 0,
  'mouse.buttons.left': false,
  'mouse.buttons.right': false,
  'mouse.buttons.middle': false,
};

export type UserVariables = Record<string, number | boolean | Point>;

export type Variables = Record<string, number | boolean>;

export function isValidVariableName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(name);
}

export function mergeVariables(builtin: BuiltinVariables, user: UserVariables): Variables {
  const vars: Variables = { ...builtin };
  for (const key in user) {
    if (!isValidVariableName(key)) {
      continue;
    }

    const val = user[key];
    if (
      typeof val === 'object' &&
      'x' in val &&
      'y' in val &&
      typeof val.x === 'number' &&
      typeof val.y === 'number'
    ) {
      vars[key + '.x'] = val.x;
      vars[key + '.y'] = val.y;
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      vars[key] = val;
    } else {
      vars[key] = 0;
    }
  }

  return vars;
}
