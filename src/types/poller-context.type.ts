import { Observable } from 'rxjs';

import { PollService } from '../poller/execution/poll-service';
import { PollerFactory } from './poller-factory.type';

export interface PollerContext<T> {
  source$: Observable<T>;
  pollService: PollService<T>;
  factory: PollerFactory;
  poller$?: Observable<T>;
  cycler$?: Observable<0>;
}

export interface ComposedPollerContext<T> extends PollerContext<T> {
  poller$: Observable<T>;
}
