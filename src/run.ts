import { IExecutor } from './Executor';
import ITask from './Task';

export default async function run(executor: IExecutor, queue: AsyncIterable<ITask>, maxThreads = 0) {
  maxThreads = Math.max(0, maxThreads);
  const threadLimit = maxThreads === 0 ? Infinity : maxThreads;
  const busyTargets: Set<ITask["targetId"]> = new Set();
  const waiting: Map<ITask["targetId"], ITask[]> = new Map();
  const inFlight: Promise<void>[] = [];

  const startTask = (task: ITask) => {
    busyTargets.add(task.targetId);
    const p = executor.executeTask(task).finally(() => {
      busyTargets.delete(task.targetId);
      const idx = inFlight.indexOf(p);
      if (idx >= 0) inFlight.splice(idx, 1);
    });
    inFlight.push(p);
  };

  const iterator = queue[Symbol.asyncIterator]();
  let doneReading = false;

  while (true) {
    if (waiting.size > 0 && inFlight.length < threadLimit) {
      for (const [targetId, tasks] of waiting) {
        if (inFlight.length >= threadLimit) break;
        if (!busyTargets.has(targetId) && tasks.length > 0) {
          const nextTask = tasks.shift()!;
          if (tasks.length === 0) {
            waiting.delete(targetId);
          }
          startTask(nextTask);
        }
      }
    }

    if (!doneReading && inFlight.length < threadLimit) {
      const { value: task, done } = await iterator.next();
      if (done) {
        doneReading = true;
      } else {
        if (busyTargets.has(task.targetId)) {
          if (!waiting.has(task.targetId)) {
            waiting.set(task.targetId, []);
          }
          waiting.get(task.targetId)!.push(task);
        } else {
          startTask(task);
        }
      }
      continue;
    }

    if (doneReading && inFlight.length === 0) {
      break;
    }

    if (inFlight.length > 0) {
      await Promise.race(inFlight);
      if (doneReading) {
        doneReading = false;
      }
      continue;
    }

    break;
  }
}
