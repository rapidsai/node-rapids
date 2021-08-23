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

export function dndEvents(window: DOMWindow) {
  return windowCallbackAsObservable(glfw.setDropCallback, window)
    .pipe(map(([, ...rest]) => GLFWDndEvent.create(window, ...rest)))
    .pipe(publish(), refCount());
}

export class GLFWDndEvent extends GLFWEvent {
  public static create(window: DOMWindow, files: string[]) {
    const evt  = new GLFWDndEvent('drop');
    evt.target = window;
    evt._files = files;
    return evt;
  }

  private _files: string[]      = [];
  public readonly types         = [];
  public readonly dropEffect    = 'none';
  public readonly effectAllowed = 'all';
  public get items() { return this._files; }
  public get files() { return this._files; }
}
