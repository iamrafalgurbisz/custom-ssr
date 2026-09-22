type TrackedPromise<T> = Promise<T> & {
  status?: 'fulfilled' | 'rejected';
  value?: T;
  reason?: unknown;
};

export const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  }) as TrackedPromise<T>;

  promise.catch(() => {});

  return {
    promise,
    resolve(value: T) {
      if (promise.status) return;
      promise.status = 'fulfilled';
      promise.value = value;
      resolve(value);
    },
    reject(reason: unknown) {
      if (promise.status) return;
      promise.status = 'rejected';
      promise.reason = reason;
      reject(reason);
    },
  };
};

export const fulfilled = <T>(value: T): Promise<T> => {
  const deferred = createDeferred<T>();
  deferred.resolve(value);

  return deferred.promise;
};
