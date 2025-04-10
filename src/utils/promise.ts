export interface DeferredPromise<T = void> {
  promise: Promise<T>;
  isResolved: boolean;
  isRejected: boolean;
  isComplete: boolean;
  resolve(value: T | PromiseLike<T>): void;
  reject(reason?: unknown): void;
}

export function makeDeferredPromise<T = void>(): DeferredPromise<T> {
  let resolve: (value: T | PromiseLike<T>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reject: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const deferred: DeferredPromise<T> = {
    promise,
    isResolved: false,
    isRejected: false,
    isComplete: false,
    resolve(value: T | PromiseLike<T>) {
      if (!this.isDone) {
        this.isResolved = true;
        this.isComplete = true;
        resolve(value);
      }
    },
    reject(reason?: unknown) {
      if (!this.isDone) {
        this.isRejected = true;
        this.isComplete = true;
        reject(reason);
      }
    },
  };

  return deferred;
}
