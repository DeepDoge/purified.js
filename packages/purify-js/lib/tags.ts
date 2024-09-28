import { Signal } from "./signals.js"

type Not<T extends boolean> = false extends T ? true : false
type Equal<A, B> = A extends B ? (B extends A ? true : false) : false
type IsReadonly<T, K extends keyof T> =
    (<T_1>() => T_1 extends { [Q in K]: T[K] } ? 1 : 2) extends <T_2>() => T_2 extends {
        readonly [Q_1 in K]: T[K]
    }
        ? 1
        : 2
        ? true
        : false
type IsFunction<T> = T extends Fn ? true : false
type Fn = (...args: any[]) => any
type IsEventHandler<T, K extends keyof T> =
    NonNullable<T[K]> extends (this: any, event: infer U) => any
        ? U extends Event
            ? K extends `on${any}`
                ? true
                : false
            : false
        : false

let instancesOf = <T extends ((abstract new (...args: any[]) => any) | { [Symbol.hasInstance](value: any): any })[]>(
    target: unknown,
    ...constructors: T
): target is T[number] extends abstract new (...args: any[]) => infer U
    ? U
    : T[number] extends { [Symbol.hasInstance](value: any): value is infer U }
      ? U
      : never => constructors.some((constructor) => target instanceof constructor)

/**
 * Creates a DocumentFragment containing the provided members.
 *
 * @param members - The members to append to the fragment.
 * @returns  The created DocumentFragment.
 * @example
 * let frag = fragment(
 *      document.createElement('div'),
 *      div(),
 *      computed(() => count.val * 2),
 *      'Text content'
 * );
 */
export let fragment = (...members: MemberOf<DocumentFragment>[]) => {
    let fragment = document.createDocumentFragment()
    if (members) fragment.append(...members.map(toAppendable))
    return fragment
}

export let toAppendable = (value: unknown): string | CharacterData | Element | DocumentFragment => {
    if (value == null) {
        return ""
    }

    if (instancesOf(value, Element, DocumentFragment, CharacterData)) {
        return value
    }

    if (instancesOf(value, Signal)) {
        return toAppendable(
            tags["div"]({ style: "display:contents" }).use((element) =>
                value.follow((value) => element.replaceChildren(toAppendable(value)), true),
            ),
        )
    }

    if (instancesOf(value, Builder)) {
        return value.element
    }

    if (Array.isArray(value)) {
        return fragment(...value.map(toAppendable))
    }

    return String(value)
}

export type Enhanced<T extends HTMLElement = HTMLElement> = T & {
    onConnect(callback: Enhanced.ConnectedCallback<T>): void
}
export namespace Enhanced {
    export type DisconnectedCallback = () => void
    export type ConnectedCallback<T extends HTMLElement> = (element: T) => void | DisconnectedCallback
}

let enchance = <T extends keyof HTMLElementTagNameMap>(
    tagname: T,
    newTagName = `enchanced-${tagname}`,
    custom = customElements,
    constructor = custom.get(newTagName) as any,
): Enhanced<HTMLElementTagNameMap[T]> => {
    if (!constructor) {
        custom.define(
            newTagName,
            (constructor = class extends (document.createElement(tagname).constructor as typeof HTMLElement) {
                #connectedCallbacks = new Set<Enhanced.ConnectedCallback<this>>()
                // different connected callbacks might use same cleanup function
                #disconnectedCallbacks: Enhanced.DisconnectedCallback[] = []

                #call(callback: Enhanced.ConnectedCallback<this>, disconnectedCallback = callback(this)) {
                    if (disconnectedCallback) {
                        this.#disconnectedCallbacks.push(disconnectedCallback)
                    }
                }

                connectedCallback() {
                    for (let callback of this.#connectedCallbacks) {
                        this.#call(callback)
                    }
                }

                disconnectedCallback() {
                    for (let callback of this.#disconnectedCallbacks) {
                        callback()
                    }
                    this.#disconnectedCallbacks.length = 0
                }

                onConnect(callback: Enhanced.ConnectedCallback<this>) {
                    let self = this
                    self.#connectedCallbacks.add(callback)
                    if (self.isConnected) {
                        self.#call(callback)
                    }
                    return () => {
                        self.#connectedCallbacks.delete(callback)
                    }
                }
            }),
            { extends: tagname },
        )
    }

    return new constructor()
}

export type Tags = {
    [K in keyof HTMLElementTagNameMap]: (attributes?: {
        [name: string]: Builder.AttributeValue<Enhanced<HTMLElementTagNameMap[K]>>
    }) => Builder.Proxy<Enhanced<HTMLElementTagNameMap[K]>>
}

/**
 * Proxy object for building HTML elements.
 * 
 * It separates attributes and properties.

 * @example
 * let { div, span } = tags;
 * 
 * ```ts
 * div({ class: 'hello', 'aria-hidden': 'false' })
 *  .id("my-div")
 *  .ariaLabel("Hello, World!")
 *  .onclick(() => console.log('clicked!'))
 *  .children(span('Hello, World!'));
 * ```
 * 
 * Also allows signals as properties or attributes:
 * ```ts
 * div({ class: computed(() => count.val & 1 ? 'odd' : 'even') })
 *  .onclick(computed(() => 
 *      count.val & 1 ? 
 *          () => alert('odd') : 
 *          () => alert('even')
 *  ))
 *  .children("Click me!");
 * ```
 */
export let tags = new Proxy(
    {},
    {
        get:
            <T extends keyof HTMLElementTagNameMap>(_: never, tag: T) =>
            (attributes: Record<string, Builder.AttributeValue<Enhanced<HTMLElementTagNameMap[T]>>> = {}) =>
                Builder.Proxy(enchance(tag)).attributes(attributes),
    },
) as Tags

/**
 * Builder class to construct a builder to populate an element with attributes and children.
 */
export class Builder<T extends Element> {
    public readonly element: T
    public readonly use: T extends HTMLElement ? Enhanced<T>["onConnect"] : undefined

    /**
     * Creates a builder for the given element.
     *
     * @param element - The element to build.
     * @example
     * new Builder(myDiv)
     *  .attributes({ class: 'hello', 'aria-hidden': 'false' })
     *  .children(span('Hello, World!'));
     */
    constructor(element: T) {
        this.use = (this.element = element as any).onConnect?.bind(element)
    }

    /* 
        Since we access buildier from, BuilderProxy
        Make sure to only use and override names that already exist in HTMLElement(s)
        We don't wanna conflict with something that might come in the future.
    */

    public children(...members: MemberOf<T>[]) {
        let element = this.element
        element.append(...members.map(toAppendable))
        return this
    }

    public attributes(attributes: Record<string, Builder.AttributeValue<T>>) {
        let element = this.element
        for (let name in attributes) {
            let value = attributes[name]

            let setOrRemoveAttribute = (value: unknown) => {
                if (value == null) {
                    element.removeAttribute(name)
                } else {
                    element.setAttribute(name, String(value))
                }
            }

            if (instancesOf(value, Signal)) {
                // @ts-ignore
                element.onConnect(() => value.follow(setOrRemoveAttribute, true))
            } else {
                setOrRemoveAttribute(value)
            }
        }
        return this
    }

    /**
     * Creates a proxy for a `Builder` instance.
     * Which allows you to also set properties.
     *
     * @param element - The element to manage.
     * @returns The proxy for the Builder instance.
     *
     * @example
     * Builder.Proxy(myDiv)
     *  .attributes({ class: 'hello', 'aria-hidden': 'false' })
     *  .children(span('Hello, World!'));
     *  .onclick(() => console.log('clicked!'));
     *  .ariaLabel("Hello, World!");
     */
    static Proxy = <T extends Element>(element: T) =>
        new Proxy(new Builder(element), {
            get: (target: Builder<T>, name: PropertyKey, proxy) =>
                (target as any)[name] ??
                (name in element &&
                    ((value: any) => {
                        if (instancesOf(value, Signal)) {
                            ;(element as never as Enhanced).onConnect(() =>
                                value.follow(() => ((element as any)[name] = value), true),
                            )
                        } else {
                            ;(element as any)[name] = value
                        }

                        return proxy
                    })),
        }) as Builder.Proxy<T>
}
export namespace Builder {
    export type AttributeValue<T extends Element> =
        | string
        | number
        | boolean
        | bigint
        | null
        | (T extends Enhanced ? Signal<AttributeValue<T>> : never)

    export type Proxy<T extends Element> = Builder<T> & {
        [K in keyof T as true extends [IsEventHandler<T, K>, Not<IsFunction<T[K]>> & Not<IsReadonly<T, K>>][number]
            ? K
            : never]: T[K] extends (...args: infer Args) => void
            ? (...args: Args) => Proxy<T>
            : (
                  value: NonNullable<T[K]> extends (this: infer X, event: infer U) => infer R
                      ? U extends Event
                          ? (this: X, event: U & { currentTarget: T }) => R
                          : T[K]
                      : T extends Enhanced
                        ? T[K] | Signal<T[K]>
                        : T[K],
              ) => Proxy<T>
    }
}

export type ChildNodeOf<TParentNode extends ParentNode> =
    | DocumentFragment
    | CharacterData
    | (TParentNode extends SVGElement
          ? TParentNode extends SVGForeignObjectElement
              ? Element
              : SVGElement
          : TParentNode extends HTMLElement
            ? Element
            : TParentNode extends MathMLElement
              ? MathMLElement
              : Element)

export type MemberOf<T extends ParentNode> =
    | string
    | number
    | boolean
    | bigint
    | null
    | ChildNodeOf<T>
    | (HTMLElement extends ChildNodeOf<T> ? Builder<Enhanced> : never)
    | MemberOf<T>[]
    | Signal<MemberOf<T>>
