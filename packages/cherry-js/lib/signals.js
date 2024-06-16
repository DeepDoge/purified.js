/**
 * @template T
 * @typedef Signal.Setter<T>
 * @type {{ (value: T): void}}
 */

/**
 * @template T
 * @typedef Signal.Getter<T>
 * @type {{ (): T}}
 */

/**
 * @template T
 * @typedef Signal.Compute.Callback<T>
 * @type {{ (): T}}
 */

/**
 * @template T
 * @typedef Signal.Follower
 * @type {{ (value: T): unknown }}
 */

/**
 * @typedef Signal.Unfollower
 * @type {{ (): void }}
 */

/**
 * @type {Set<Signal<*>>[]}
 */
const trackerStack = []

/**
 * @template T
 */
export class Signal {
    static State =
        /**
         * @template T
         * @extends {Signal<T>}
         */
        class State extends Signal {
            set = this.#set

            /** @param {T} value */
            set val(value) {
                this.set(value)
            }

            get val() {
                return super.val
            }
        }

    static Compute =
        /**
         * @template T
         * @extends {Signal<T>}
         */
        class Compute extends Signal {
            #dirty = true
            /** @type {Map<Signal<unknown>, Signal.Unfollower>} */
            #dependencies = new Map()
            /** @type {Signal.Compute.Callback<T>} */
            #callback

            /** @param {Signal.Compute.Callback<T>} callback */
            constructor(callback) {
                super(/** @type {*} */ (0))
                this.#callback = callback
            }

            get(self = this) {
                if (self.#dirty) {
                    self.#update()
                }
                return super.get()
            }

            #update(self = this) {
                let dependencies = self.#dependencies

                let trackedSet = new Set()
                trackerStack.push(trackedSet)
                self.#set(self.#callback())
                trackerStack.pop()
                trackedSet.delete(self)
                self.#dirty = false

                // Unfollow and remove dependencies that are no longer being tracked
                for (const [dependency, unfollow] of dependencies) {
                    if (!trackedSet.has(dependency)) {
                        unfollow()
                        dependencies.delete(dependency)
                    }
                }

                // Follow new dependencies
                for (const dependency of trackedSet) {
                    if (!dependencies.has(dependency)) {
                        dependencies.set(
                            dependency,
                            dependency.follow(() => {
                                if (self.#followers.size) {
                                    self.#update()
                                } else {
                                    self.#dirty = true
                                    for (const [dependency, unfollow] of dependencies) {
                                        unfollow()
                                        dependencies.delete(dependency)
                                    }
                                }
                            }),
                        )
                    }
                }
            }
        }

    /** @type {T} */
    #value
    /** @type {Set<Signal.Follower<T>>} */
    #followers = new Set()

    /**
     * @param {T} initial
     */
    constructor(initial) {
        this.#value = initial
    }

    /**
     * @param {T} value
     */
    #set(value, self = this) {
        const changed = self.#value !== value
        self.#value = value
        if (changed) self.notify()
    }

    /**
     * @returns {T}
     */
    get(self = this) {
        trackerStack.at(-1)?.add(self)
        return self.#value
    }

    get val() {
        return this.get()
    }

    /**
     * @param {Signal.Follower<T>} follower
     * @param {boolean} immediate
     * @returns {Signal.Unfollower}
     */
    follow(follower, immediate = false, self = this) {
        if (immediate || !self.#followers.size) follower(self.val)
        self.#followers.add(follower)
        return () => self.#followers.delete(follower)
    }

    notify(self = this, value = self.val) {
        for (const follower of self.#followers) {
            follower(value)
        }
    }
}

/**
 * @template T
 * @param {T} value
 */
export let ref = (value) => new Signal.State(value)

/**
 * @template T
 * @param {Signal.Compute.Callback<T>} callback
 */
export let computed = (callback) => new Signal.Compute(callback)
