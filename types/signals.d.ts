export class Signal<const T> {
    constructor(initial: T)
    get(self?: this): T
    get val(): T
    follow(
        follower: Signal.Follower<T>,
        immediate?: boolean,
        self?: this,
    ): Signal.Unfollower
    notify(self?: this, value?: T): void
}
export namespace Signal {
    class State<T> extends Signal<T> {
        set(value: T, self?: this): void
        set val(value: T): void
        get val(): T
    }
    class Compute<T> extends Signal<T> {
        constructor(callback: Compute.Callback<T>)
    }
    namespace Compute {
        type Callback<T> = { (): T }
    }
    type Setter<T> = { (value: T): void }
    type Getter<T> = { (): T }
    type Follower<T> = { (value: T): unknown }
    type Unfollower = { (): void }
}
export function ref<T>(value: T): Signal.State<T>
export function computed<T>(callback: Signal.Compute.Callback<T>): Signal.Compute<T>
export function awaited<T, const U = null>(
    promise: Promise<T>,
    until?: U,
    signal?: Signal.State<T | U>,
): Signal<T | U>
export function effect<T>(callback: Signal.Compute.Callback<T>): Signal.Unfollower
