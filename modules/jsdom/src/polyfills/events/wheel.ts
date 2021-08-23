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

import {glfw} from '@nvidia/glfw';
import {DOMWindow} from 'jsdom';
import {map, publish, refCount} from 'rxjs/operators';

import {GLFWEvent, windowCallbackAsObservable} from './event';

export function wheelEvents(window: DOMWindow) {
  return windowCallbackAsObservable(glfw.setScrollCallback, window)
    .pipe(map(([, ...rest]) => GLFWWheelEvent.create(window, ...rest)))
    .pipe(publish(), refCount());
}

export class GLFWWheelEvent extends GLFWEvent {
  public static create(window: DOMWindow, xoffset: number, yoffset: number) {
    const evt     = new GLFWWheelEvent('wheel');
    evt.target    = window;
    evt._x        = window.mouseX;
    evt._y        = window.mouseY;
    evt._deltaX   = xoffset * -20;
    evt._deltaY   = yoffset * -20;
    evt._deltaZ   = 0;
    evt._buttons  = window.buttons;
    evt._altKey   = window.altKey;
    evt._ctrlKey  = window.ctrlKey;
    evt._metaKey  = window.metaKey;
    evt._shiftKey = window.shiftKey;
    evt._capsLock = window.capsLock;
    return evt;
  }

  private _x      = 0;
  private _y      = 0;
  private _deltaX = 0;
  private _deltaY = 0;
  private _deltaZ = 0;

  private _buttons  = 0;
  private _altKey   = false;
  private _ctrlKey  = false;
  private _metaKey  = false;
  private _shiftKey = false;
  private _capsLock = false;

  public get deltaMode() { return 0x00; }
  public get deltaX() { return this._deltaX; }
  public get deltaY() { return this._deltaY; }
  public get deltaZ() { return this._deltaZ; }

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
  public get buttons() { return this._buttons; }
  public get ctrlKey() { return this._ctrlKey; }
  public get metaKey() { return this._metaKey; }
  public get shiftKey() { return this._shiftKey; }
  public get capsLock() { return this._capsLock; }
}
