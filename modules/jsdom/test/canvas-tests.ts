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

import {globalWindow} from './utils';

describe('HTMLCanvasElement', () => {
  test(`window.Image exists`, () => {
    expect(globalWindow.evalFn(() => {
      return (typeof Image !== 'undefined') &&             //
             (typeof HTMLImageElement !== 'undefined') &&  //
             (new Image()) instanceof HTMLImageElement;
    }))
      .toBe(true);
  });

  test(`getContext('webgl2') returns our OpenGL context`, () => {
    expect(globalWindow.evalFn(() => {
      const gl         = require('@nvidia/webgl');
      const {document} = window;
      const canvas     = document.body.appendChild(document.createElement('canvas'));
      return canvas.getContext('webgl2') instanceof gl.WebGL2RenderingContext;
    }))
      .toBe(true);
  });

  test(`getContext('webgl2') only creates one OpenGL context`, () => {
    expect(globalWindow.evalFn(() => {
      const {document} = window;
      const canvas     = document.body.appendChild(document.createElement('canvas'));
      return canvas.getContext('webgl2') === canvas.getContext('webgl2');
    }))
      .toBe(true);
  });
});
