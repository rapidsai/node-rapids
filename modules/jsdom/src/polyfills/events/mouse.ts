// Copyright (c) 2021, NVIDIA CORPORATION.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {glfw, GLFWMouseButton} from '@nvidia/glfw';
import {DOMWindow} from 'jsdom';
import {merge as mergeObservables} from 'rxjs';
import {map, publish, refCount} from 'rxjs/operators';

import {
  GLFWEvent,
  isAltKey,
  isCapsLock,
  isCtrlKey,
  isMetaKey,
  isShiftKey,
  windowCallbackAsObservable
} from './event';

export function mouseEvents(window: DOMWindow) {
  return mergeObservables(
    buttonUpdates(window),
    positionUpdates(window),
    boundaryUpdates(window),
  );
}

function buttonUpdates(window: DOMWindow) {
  return windowCallbackAsObservable(glfw.setMouseButtonCallback, window)
    .pipe(map(([, ...rest]) => GLFWMouseEvent.fromMouseButton(window, ...rest)))
    .pipe(publish(), refCount());
}

function positionUpdates(window: DOMWindow) {
  return windowCallbackAsObservable(glfw.setCursorPosCallback, window)
    .pipe(map(([, ...rest]) => GLFWMouseEvent.fromMouseMove(window, ...rest)))
    .pipe(publish(), refCount());
}

function boundaryUpdates(window: DOMWindow) {
  return windowCallbackAsObservable(glfw.setCursorEnterCallback, window)
    .pipe(map(([, ...rest]) => GLFWMouseEvent.fromMouseEnter(window, ...rest)))
    .pipe(publish(), refCount());
}

export class GLFWMouseEvent extends GLFWEvent {
  public static create(window: DOMWindow, type: string) {
    const evt      = new GLFWMouseEvent(type);
    evt.target     = window;
    evt._movementX = 0;
    evt._movementY = 0;
    evt._x         = window.mouseX;
    evt._y         = window.mouseY;
    evt._altKey    = window.altKey;
    evt._buttons   = window.buttons;
    evt._ctrlKey   = window.ctrlKey;
    evt._metaKey   = window.metaKey;
    evt._shiftKey  = window.shiftKey;
    evt._capsLock  = window.capsLock;
    return evt;
  }

  public static fromMouseMove(window: DOMWindow, x: number, y: number) {
    const evt      = GLFWMouseEvent.create(window, 'mousemove');
    evt._x         = x;
    evt._y         = y;
    evt._movementX = x - window.mouseX;
    evt._movementY = y - window.mouseY;
    return evt;
  }

  public static fromMouseEnter(window: DOMWindow, entered: number) {
    const evt = GLFWMouseEvent.create(window, entered ? 'mouseenter' : 'mouseleave');
    ({x: evt._x, y: evt._y} = glfw.getCursorPos(window.id));
    return evt;
  }

  public static fromMouseButton(window: DOMWindow,
                                button: number,
                                action: number,
                                modifiers: number) {
    const down = action === glfw.PRESS;
    const evt  = GLFWMouseEvent.create(window, down ? 'mousedown' : 'mouseup');
    evt._altKey || (evt._altKey = isAltKey(modifiers));
    evt._ctrlKey || (evt._ctrlKey = isCtrlKey(modifiers));
    evt._metaKey || (evt._metaKey = isMetaKey(modifiers));
    evt._shiftKey || (evt._shiftKey = isShiftKey(modifiers));
    evt._capsLock || (evt._capsLock = isCapsLock(modifiers));
    evt._button  = button + (button == GLFWMouseButton.MOUSE_BUTTON_3   ? -1
                             : button == GLFWMouseButton.MOUSE_BUTTON_2 ? 1
                                                                        : 0);
    evt._buttons = down ? window.buttons | (1 << button) : window.buttons & ~(1 << button);
    ({x: evt._x, y: evt._y} = glfw.getCursorPos(window.id));
    return evt;
  }

  private _x         = 0;
  private _y         = 0;
  private _button    = 0;
  private _buttons   = 0;
  private _movementX = 0;
  private _movementY = 0;
  private _altKey    = false;
  private _ctrlKey   = false;
  private _metaKey   = false;
  private _shiftKey  = false;
  private _capsLock  = false;

  public get x() { return this._x; }
  public get y() { return this._y; }
  public get pageX() { return this._x; }
  public get pageY() { return this._y; }
  public get clientX() { return this._x; }
  public get clientY() { return this._y; }
  public get offsetX() { return this._x; }
  public get offsetY() { return this._y; }
  public get screenX() { return this._x; }
  public get screenY() { return this._y; }
  public get which() { return this._buttons; }
  public get altKey() { return this._altKey; }
  public get button() { return this._button; }
  public get buttons() { return this._buttons; }
  public get ctrlKey() { return this._ctrlKey; }
  public get metaKey() { return this._metaKey; }
  public get shiftKey() { return this._shiftKey; }
  public get capsLock() { return this._capsLock; }
  public get movementX() { return this._movementX; }
  public get movementY() { return this._movementY; }
}
