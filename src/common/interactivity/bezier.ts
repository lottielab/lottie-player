/** Minimalistic, small-footprint library for evaluating bezier curves. */

type Point = { x: number; y: number };

export type CubicBezier = {
  start: Point;
  end: Point;
  controlPoint1: Point;
  controlPoint2: Point;
};

function zipReduce(points: Point[], coeffs: number[]) {
  return points.reduce(
    (acc, point, index) => {
      return {
        x: acc.x + coeffs[index] * point.x,
        y: acc.y + coeffs[index] * point.y,
      };
    },
    { x: 0, y: 0 }
  );
}

function points(curve: CubicBezier) {
  return [curve.start, curve.controlPoint1, curve.controlPoint2, curve.end];
}

export function evaluate(curve: CubicBezier, t: number) {
  return zipReduce(points(curve), [
    (1 - t) ** 3,
    3 * (1 - t) ** 2 * t,
    3 * (1 - t) * t ** 2,
    t ** 3,
  ]);
}
