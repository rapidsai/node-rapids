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

import * as jsdom from 'jsdom';

const {ImageData} = require('canvas');

export function installImageData(window: jsdom.DOMWindow) {
  window.jsdom.global.ImageData ??= ImageData;
  return window;
}

export function installImageDecode(window: jsdom.DOMWindow) {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  window.HTMLImageElement.prototype.decode ??= function decode(this: HTMLImageElement) {
    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        this.removeEventListener('load', onload);
        this.removeEventListener('error', onerror);
      };
      const onload = () => {
        resolve();
        cleanup();
      };
      const onerror = () => {
        reject();
        cleanup();
      };
      this.addEventListener('load', onload);
      this.addEventListener('error', onerror);
    });
  };
  return window;
}
