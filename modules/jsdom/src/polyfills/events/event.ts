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

import {GLFWModifierKey} from '@nvidia/glfw';
import {DOMWindow} from 'jsdom';
import {Observable, Observer} from 'rxjs';

export const isAltKey = (modifiers: number) => (modifiers & GLFWModifierKey.MOD_ALT) !== 0;
export const isCtrlKey = (modifiers: number) => (modifiers & GLFWModifierKey.MOD_CONTROL) !== 0;
export const isMetaKey = (modifiers: number) => (modifiers & GLFWModifierKey.MOD_SUPER) !== 0;
export const isShiftKey = (modifiers: number) => (modifiers & GLFWModifierKey.MOD_SHIFT) !== 0;
export const isCapsLock = (modifiers: number) => (modifiers & GLFWModifierKey.MOD_CAPS_LOCK) !== 0;

export class GLFWEvent {
  public target: any;
  public bubbles    = true;
  public composed   = false;
  public cancelable = true;
  public readonly type: string;

  constructor(type: string) { this.type = type; }

  public preventDefault() {}
  public stopPropagation() {}
  public stopImmediatePropagation() {}

  public get defaultPrevented() { return false; }
  public get srcElement() { return this.target; }
  public get relatedTarget() { return null; }
  public get currentTarget() { return this.target; }
}

type SetGLFWCallback = (cb: null|((...args: any) => void)) => void;
type GLFWCallbackArgs<T extends SetGLFWCallback> = T extends(cb: (...args: infer P) => void) =>
                                                              any ? P : never;

type SetWindowCallback = (ptr: number, cb: null|((...args: any) => void)) => void;
type WindowCallbackArgs<T extends SetWindowCallback>                      = T extends(ptr: number,
                                                                                      cb: (...args: infer P) => void) =>
                                                                  any ? P : never;

export function glfwCallbackAsObservable<C extends SetGLFWCallback>(setCallback: C) {
  type Args = GLFWCallbackArgs<C>;
  return new Observable<Args>((observer: Observer<Args>) => {
    const next = (..._: Args) => observer.next(_);
    const dispose = () => trySetCallback(setCallback.name, () => setCallback(null));
    return trySetCallback(setCallback.name, () => setCallback(next)) ? dispose : () => {};
  });
}

export function windowCallbackAsObservable<C extends SetWindowCallback>(
  setCallback: C, window: DOMWindow|DOMWindow) {
  type Args = WindowCallbackArgs<C>;
  return new Observable<Args>((observer: Observer<Args>) => {
    const next = (..._: Args) => observer.next(_);
    const dispose = () => trySetCallback(setCallback.name, () => setCallback(window.id, null));
    return trySetCallback(setCallback.name, () => setCallback(window.id, next)) ? dispose
                                                                                : () => {};
  });
}

function trySetCallback(name: string, work: () => void) {
  try {
    work();
  } catch (e) {
    console.error(`glfw.${name} error:`, e);
    return false;
  }
  return true;
}
