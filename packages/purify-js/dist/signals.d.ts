export declare namespace Signal {
    type Cleanup = {
        (): unknown;
    };
    /**
     * A type representing a function that follows a signal's value changes.
     * @template T - The type of the signal's value.
     */
    type Follower<T> = {
        (value: T): unknown;
    };
    /**
     * A type representing an object that can be used to unfollow a signal.
     */
    type Unfollower = {
        (): void;
    };
}
export declare abstract class Signal<T> {
    abstract follow(follower: Signal.Follower<T>, immediate?: boolean): Signal.Unfollower;
    get val(): T;
    /**
     * Creates a new computed Signal derived from the current Signal's value using the provided getter function.
     * This allows for more complex transformations of the signal's value.
     *
     * @template U - The type of the derived signal's value.
     * @param getter - A function that receives the current value of the signal and returns the derived value.
     * @returns A new Compute signal that reflects changes in the source signal.
     *
     * @example
     * ```ts
     * const count = ref(0);
     * const doubledCount = count.derive(value => value * 2);
     * doubledCount.follow(value => console.log(value)); // Logs the doubled count value.
     * ```
     */
    derive<U>(getter: (value: T) => U): Signal.Computed<U>;
}
export declare namespace Signal {
    class State<T> extends Signal<T> {
        private value;
        constructor(initial: T);
        get val(): T;
        set val(value: T);
        private followers;
        follow(follower: Signal.Follower<T>, immediate?: boolean): Signal.Unfollower;
    }
    class Readonly<T> extends Signal<T> {
        follow: Signal<T>["follow"];
        constructor(followHandler: Signal<T>["follow"]);
    }
    namespace Computed {
        /**
         * A type representing a function that gets a value.
         * @template T - The type of the value to be retrieved.
         */
        type Getter<T> = {
            (): T;
        };
    }
    class Computed<T> extends Readonly<T> {
        constructor(getter: Signal.Computed.Getter<T>, dependencies: Signal<unknown>[]);
    }
}
/**
 * Creates a new `State` signal with the provided initial value.
 *
 * @template T - The type of the signal's value.
 * @param initial - The initial value of the signal.
 * @returns A new `State` signal.
 *
 * @example
 * const count = ref(0); // Creates a state signal with initial value 0.
 */
export declare let ref: <T>(initial: T) => Signal.State<T>;
/**
 * Creates a new `Compute` signal that computes its value using the provided callback function.
 *
 * @template T - The type of the signal's value.
 * @param callback - The function that computes the signal's value.
 * @param dependencies - An array of signals that the computed signal depends on.
 * @returns A new `Compute` signal.
 *
 * @example
 * const doubleCount = computed(() => count.val * 2, [count]); // Creates a computed signal that doubles `count`.
 */
export declare let computed: <T>(callback: Signal.Computed.Getter<T>, dependencies: Signal<unknown>[]) => Signal.Computed<T>;
/**
 * Creates a readonly Signal that can be followed but not directly modified.
 * Useful for exposing a signal's value without allowing changes.
 *
 * @template T - The type of the signal's value.
 * @param followHandler - A function defining how the readonly signal is followed.
 * @returns A new Readonly signal.
 *
 * @example
 * ```ts
 * // Create a readonly signal that reflects the video player's play state.
 * const isPlayingSignal = readonly<boolean>((follower, immediate) => {
 *   const onPlayPause = () => follower(videoElement.paused === false);
 *   if (immediate) onPlayPause();
 *   videoElement.addEventListener("play", onPlayPause);
 *   videoElement.addEventListener("pause", onPlayPause);
 *   return () => {
 *     videoElement.removeEventListener("play", onPlayPause);
 *     videoElement.removeEventListener("pause", onPlayPause);
 *   };
 * });
 *
 * // Consumers can follow `isPlayingSignal` but cannot modify its value.
 * isPlayingSignal.follow(isPlaying => console.log(`Playing: ${isPlaying}`));
 * ```
 */
export declare let readonly: <T>(followHandler: Signal<T>["follow"]) => Signal.Readonly<T>;
/**
 * Creates a new signal that resolves its value when the provided promise resolves.
 *
 * @template T - The type of the promise's resolved value.
 * @template U - The type of the `until` value used before the promise resolves.
 * @param promise - The promise to await.
 * @param until - The value to use until the promise resolves. Defaults to `null`.
 * @returns A new signal that resolves to the promise's value or `until` value before the promise is fulfilled.
 *
 * @example
 * const data = awaited(fetchData(), null); // Creates a signal that holds the fetched data once the promise resolves.
 */
export declare let awaited: <T, const U = null>(promise: Promise<T>, until?: U) => Signal<T | U>;
