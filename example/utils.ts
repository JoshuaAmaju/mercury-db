type Props = Record<string, unknown>;

const toString = Object.prototype.toString;

function isEvent(label: string) {
  return label.startsWith("on");
}

function getEventName(label: string) {
  return label.substr(2).toLowerCase();
}

export function h(type: string): HTMLElement;
export function h(type: string, props: Props): HTMLElement;
export function h(
  type: string,
  children: string | (string | HTMLElement)[]
): HTMLElement;
export function h(
  type: string,
  props: Props,
  children: string | (string | HTMLElement)[]
): HTMLElement;

export function h(type: string, ...args: unknown[]): HTMLElement {
  const props = args[0];
  const children = args[1];
  const element = document.createElement(type);

  const _props = (props && toString.call(props) === "[object Object]"
    ? props
    : null) as Props;

  const _children =
    children && (Array.isArray(children) || typeof children === "string")
      ? children
      : Array.isArray(props) || typeof props === "string"
      ? props
      : null;

  if (_props) {
    for (const prop in _props) {
      const value = _props[prop];

      if (isEvent(prop)) {
        element.addEventListener(getEventName(prop), value as VoidFunction);
      } else {
        element.setAttribute(prop, value as string);
      }
    }
  }

  if (_children) {
    if (typeof _children === "string") {
      element.appendChild(createTextNode(_children));
    } else {
      _children
        .map((child) => {
          return typeof child === "string" ? createTextNode(child) : child;
        })
        .forEach((child) => {
          element.appendChild(child);
        });
    }
  }

  return element;
}

function createTextNode(text: string): Text {
  return document.createTextNode(text);
}
