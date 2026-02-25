import { ComposedPollerContext, PollerContext } from './poller-context.type';

export type PollComposer = <T>(ctx: PollerContext<T>) => ComposedPollerContext<T>;
