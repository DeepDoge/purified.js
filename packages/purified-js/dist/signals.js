/**
 * @template T
 * @typedef Signal.State
 * @type {InstanceType<typeof Signal.State<T>>}
 */
/**
 * @template T
 * @typedef Signal.Compute
 * @type {InstanceType<typeof Signal.Compute<T>>}
 */
/** @type {Set<Signal<any>>[]} */
const trackerStack = [];
/** @template [T=unknown] */
export class Signal {
    /** @type {T} */
    #value;
    /** @type {Set<import('./signals.d.ts').Signal.Follower<T>>} */
    #followers = new Set();
    /** @param {T} initial */
    constructor(initial) {
        this.#value = initial;
    }
    /** @param {T} value */
    #set(value, self = this) {
        let changed = self.#value !== value;
        self.#value = value;
        if (changed)
            self.notify();
    }
    get val() {
        trackerStack.at(-1)?.add(this);
        return this.#value;
    }
    /**
     *
     * @param {import('./signals.d.ts').Signal.Follower<T>} follower
     * @param {boolean=} immediate
     * @returns {import('./signals.d.ts').Signal.Unfollower}
     */
    follow(follower, immediate) {
        if (immediate)
            follower(this.val);
        this.#followers.add(follower);
        return () => this.#followers.delete(follower);
    }
    notify() {
        for (let follower of this.#followers) {
            follower(this.val);
        }
    }
    static State = 
    /**
     * @template [T=unknown]
     * @extends {Signal<T>}
     */
    class State extends Signal {
        /** @param {T} value */
        set val(value) {
            this.#set(value);
        }
        get val() {
            return super.val;
        }
    };
    static Compute = 
    /**
     * @template [T=unknown]
     * @extends {Signal<T>}
     */
    class Compute extends Signal {
        #dirty = true;
        /** @type {Map<Signal<unknown>, import('./signals.d.ts').Signal.Unfollower>} */
        #dependencies = new Map();
        /** @type {import('./signals.d.ts').Signal.Compute.Callback<T>} */
        #callback;
        /** @param {import('./signals.d.ts').Signal.Compute.Callback<T>} callback */
        constructor(callback) {
            super(/** @type {never} */ (0));
            this.#callback = callback;
        }
        get val() {
            let self = this;
            if (self.#dirty) {
                if (!self.#followers.size) {
                    return self.#callback();
                }
                self.#updateAndTrack();
            }
            return super.val;
        }
        /**
         * @param {import('./signals.d.ts').Signal.Follower<T>} follower
         * @returns {import('./signals.d.ts').Signal.Unfollower}
         */
        follow(follower, immediate = false) {
            let self = this;
            if (self.#dirty) {
                self.#updateAndTrack();
            }
            let unfollow = super.follow(follower, immediate);
            return () => {
                unfollow();
                if (!self.#followers.size) {
                    self.#unfollowDependencies();
                }
            };
        }
        #unfollowDependencies(self = this) {
            self.#dependencies.forEach((unfollow, dependency) => {
                unfollow();
                self.#dependencies.delete(dependency);
            });
            self.#dirty = true;
        }
        #updateAndTrack(self = this) {
            let dependencies = self.#dependencies;
            /** @type {Set<Signal<any>>} */
            let trackedSet = new Set();
            trackerStack.push(trackedSet);
            let value = self.#callback();
            trackerStack.pop();
            trackedSet.delete(self);
            self.#dirty = false;
            self.#set(value);
            // Unfollow and remove dependencies that are no longer being tracked
            dependencies.forEach((unfollow, dependency) => {
                if (trackedSet.has(dependency))
                    return;
                unfollow();
                dependencies.delete(dependency);
            });
            // Follow new dependencies
            trackedSet.forEach((dependency) => {
                if (dependencies.has(dependency))
                    return;
                let unfollow = dependency.follow(() => {
                    if (self.#followers.size) {
                        self.#updateAndTrack();
                    }
                    else {
                        self.#unfollowDependencies();
                    }
                });
                dependencies.set(dependency, unfollow);
            });
        }
    };
}
/**
 * @template T
 * @param {T} value
 */
export let ref = (value) => new Signal.State(value);
/**
 * @template T
 * @param {import('./signals.d.ts').Signal.Compute.Callback<T>} callback
 */
export let computed = (callback) => new Signal.Compute(callback);
/**
 * @template T
 * @template [const U = null]
 * @param {Promise<T>} promise
 * @param {U?} until
 * @returns {Signal<T | U>}
 */
export let awaited = (promise, until = null) => {
    let signal = /** @type {Signal.State<T | U>} */ (ref(until));
    promise.then((value) => (signal.val = value));
    return signal;
};
/**
 * @template T
 * @param {import("./signals.js").Signal.Compute.Callback<T>} callback
 */
export let effect = (callback) => computed(callback).follow(() => { });
