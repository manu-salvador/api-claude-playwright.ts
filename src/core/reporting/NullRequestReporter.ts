import { IRequestReporter } from './IRequestReporter';

/** No-op reporter (Null Object) for contexts where reporting is not wanted. */
export class NullRequestReporter implements IRequestReporter {
  async report(): Promise<void> {
    /* intentionally empty */
  }
}
