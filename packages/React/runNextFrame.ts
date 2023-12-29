import { useMemo } from "react";

/**
 * 下一个requestAnimationFrame执行
 * @param callback 回调函数
 * @returns 取消执行的函数
 */
export function runInNextFrame(callback: () => void): () => void {
  // 当前的requestAnimationFrame进行存储下一次的，然后在下一次的requestAnimationFrame中执行
  let rafId: null | number = requestAnimationFrame(() => {
    rafId = requestAnimationFrame(() => {
      callback();
      rafId = null;
    });
  });
  // 返回一个函数，用于取消当前的requestAnimationFrame
  return () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}

/**
 * 下一个requestAnimationFrame执行一次
 * @param callback 执行方法
 * @returns 执行一次的函数
 */
export function runOnceInNextFrame<T extends (...args: unknown[]) => void>(
  callback: T
): T & { cancel(): void } {
  let ticking = false;
  let savedArgs: unknown[] = [];
  let cancel: null | (() => void) = null;
  const fn = (...args: unknown[]) => {
    savedArgs = args;
    // 如果当前没有在执行，那么就执行
    if (!ticking) {
      // 保存下一次的执行
      cancel = runInNextFrame(() => {
        callback(...savedArgs);
        cancel = null;
        ticking = false;
      });
    }
    ticking = true;
  };
  // 取消执行
  fn.cancel = () => {
    cancel?.();
  };
  return fn as T & { cancel(): void };
}
// hook
const useRunOnceInNextFrame = <T extends (...args: unknown[]) => void>(
  cb: T,
  disabled: boolean
): T & { cancel?(): void } => {
  return useMemo(
    () => (!disabled ? runOnceInNextFrame(cb) : cb),
    [cb, disabled]
  );
};
