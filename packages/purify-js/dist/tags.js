import { Signal } from "./signals.js";
let instancesOf = (target, ...constructors) => constructors.some((constructor) => target instanceof constructor);
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
export let fragment = (...members) => {
    let fragment = document.createDocumentFragment();
    if (members)
        fragment.append(...members.map(toAppendable));
    return fragment;
};
export let toAppendable = (value) => {
    if (value == null) {
        return "";
    }
    if (instancesOf(value, Element, DocumentFragment, CharacterData)) {
        return value;
    }
    if (instancesOf(value, Signal)) {
        return toAppendable(tags["div"]({ style: "display:contents" }).use((element) => value.follow((value) => element.replaceChildren(toAppendable(value)), true)));
    }
    if (instancesOf(value, Builder)) {
        return value.element;
    }
    if (Array.isArray(value)) {
        return fragment(...value.map(toAppendable));
    }
    return String(value);
};
let enchance = (tagname, newTagName = `enchanced-${tagname}`, custom = customElements, constructor = custom.get(newTagName)) => {
    if (!constructor) {
        custom.define(newTagName, (constructor = class extends document.createElement(tagname).constructor {
            #connectedCallbacks = new Set();
            // different connected callbacks might use same cleanup function
            #disconnectedCallbacks = [];
            #call(callback, disconnectedCallback = callback(this)) {
                if (disconnectedCallback) {
                    this.#disconnectedCallbacks.push(disconnectedCallback);
                }
            }
            connectedCallback() {
                for (let callback of this.#connectedCallbacks) {
                    this.#call(callback);
                }
            }
            disconnectedCallback() {
                for (let callback of this.#disconnectedCallbacks) {
                    callback();
                }
                this.#disconnectedCallbacks.length = 0;
            }
            onConnect(callback) {
                let self = this;
                self.#connectedCallbacks.add(callback);
                if (self.isConnected) {
                    self.#call(callback);
                }
                return () => {
                    self.#connectedCallbacks.delete(callback);
                };
            }
        }), { extends: tagname });
    }
    return new constructor();
};
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
export let tags = new Proxy({}, {
    get: (_, tag) => (attributes = {}) => Builder.Proxy(enchance(tag)).attributes(attributes),
});
/**
 * Builder class to construct a builder to populate an element with attributes and children.
 */
export class Builder {
    element;
    /**
     * Creates a builder for the given element.
     *
     * @param element - The element to build.
     * @example
     * new Builder(myDiv)
     *  .attributes({ class: 'hello', 'aria-hidden': 'false' })
     *  .children(span('Hello, World!'));
     */
    constructor(element) {
        this.element = element;
    }
    use(callback) {
        this.element.onConnect(callback);
        return this;
    }
    children(...members) {
        let element = this.element;
        element.append(...members.map(toAppendable));
        return this;
    }
    attributes(attributes) {
        let element = this.element;
        for (let name in attributes) {
            let value = attributes[name];
            let setOrRemoveAttribute = (value) => {
                if (value == null) {
                    element.removeAttribute(name);
                }
                else {
                    element.setAttribute(name, String(value));
                }
            };
            if (instancesOf(value, Signal)) {
                element.onConnect(() => value.follow(setOrRemoveAttribute, true));
            }
            else {
                setOrRemoveAttribute(value);
            }
        }
        return this;
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
    static Proxy = (element) => new Proxy(new Builder(element), {
        get: (target, name, proxy) => target[name] ??
            (name in element &&
                ((value) => {
                    if (instancesOf(value, Signal)) {
                        element.onConnect(() => value.follow((value) => (element[name] = value), true));
                    }
                    else {
                        ;
                        element[name] = value;
                    }
                    return proxy;
                })),
    });
}
