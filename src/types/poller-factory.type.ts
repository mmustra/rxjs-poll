import { Observable } from 'rxjs';

import { PollService } from '../poller/execution/poll-service';

export interface PollerFactory {
  createDirectPoller$<T>(source$: Observable<T>, pollService: PollService<T>): Observable<T>;
  createCycleControl$<T>(source$: Observable<T>, pollService: PollService<T>): CycleControl<T>;
}

export interface CycleControl<T> {
  poller$: Observable<T>;
  cycler$: Observable<0>;
}
