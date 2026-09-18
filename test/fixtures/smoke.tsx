// See smoke.css.ts's own header comment: a build-pipeline fixture, not a real exported primitive.

import { smokeText } from "./smoke.css.js";

export function Smoke(): React.JSX.Element {
  return <div className={smokeText}>smoke</div>;
}
