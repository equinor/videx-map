
export interface EventHandlerCallbacks {
  mousemove: (event : MouseEvent) => boolean,
  mouseout: (event : MouseEvent) => boolean,
  click: (event : MouseEvent) => boolean,
}

export interface EventHandler {
  map: L.Map;
  element: HTMLElement;
  callbacks: EventHandlerCallbacks;

  register(map: L.Map, element: HTMLElement, callbacks: EventHandlerCallbacks) : void;
  unregister(): void;
}

export class DefaultEventHandler implements EventHandler {
  map: L.Map;
  element: HTMLElement;
  callbacks: EventHandlerCallbacks;

  register(map: L.Map, element: HTMLElement, callbacks: EventHandlerCallbacks): void {
    this.map = map;
    this.element = element;
    this.callbacks = callbacks;

    element.addEventListener('mousemove', this.callbacks.mousemove);
    element.addEventListener('mouseout', this.callbacks.mouseout);
    element.addEventListener('click', this.callbacks.click);
  }
  unregister(): void {
    const { element } = this;
    element.removeEventListener('mousemove', this.callbacks.mousemove);
    element.removeEventListener('mouseout', this.callbacks.mouseout);
    element.removeEventListener('click', this.callbacks.click);
    this.map = null;
    this.element = null;
  }
}
