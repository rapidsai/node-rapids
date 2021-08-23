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

export function installMjolnirHammer(window: jsdom.DOMWindow) {
  window.evalFn(function() {
    const Path             = require('path');
    const hammerjs         = require('hammerjs');
    const mjolnirSrcHammer = require('mjolnir.js/src/utils/hammer');
    const {enhancePointerEventInput, enhanceMouseInput} =
      require('mjolnir.js/src/utils/hammer-overrides');
    enhancePointerEventInput(hammerjs.PointerEventInput);
    enhanceMouseInput(hammerjs.MouseInput);
    redefine(mjolnirSrcHammer, 'Manager', hammerjs['Manager']);
    redefine(mjolnirSrcHammer, 'default', hammerjs);
    for (const x of ['src', 'dist/es5', 'dist/esm']) {
      try {
        const mjolnirHammer = require(Path.join('mjolnir.js', x, 'utils/hammer'));
        redefine(mjolnirHammer, 'Manager', hammerjs['Manager']);
        redefine(mjolnirHammer, 'default', hammerjs);
      } catch (e) { /**/
      }
    }
    function redefine(target: any, field: string, value: any) {
      const desc = Object.getOwnPropertyDescriptor(target, field);
      Object.defineProperty(target, field, {...desc, value});
    }
  });

  return window;
}
