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

export function installGetContext(window: jsdom.DOMWindow) {
  const gl = window.evalFn(() => require('@nvidia/webgl')) as typeof import('@nvidia/webgl');

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const JSDOM_getContext = window.HTMLCanvasElement.prototype.getContext;

  // Override Canvas's `getContext` method with one that initializes our WebGL bindings
  window.HTMLCanvasElement.prototype.getContext = getContext;

  class GLFWRenderingContext extends gl.WebGL2RenderingContext {
    constructor(canvas: HTMLCanvasElement,
                window: jsdom.DOMWindow,
                options?: WebGLContextAttributes) {
      super(options);
      this.canvas = canvas;
      this.window = window;
      if (!this.window._inputEventTarget) { this.window._inputEventTarget = canvas; }
    }
    private readonly window: jsdom.DOMWindow;
    public readonly canvas: HTMLCanvasElement;
    public get drawingBufferWidth() {  //
      return this.window.frameBufferWidth ?? this.window.outerWidth;
    }
    public get drawingBufferHeight() {
      return this.window.frameBufferHeight ?? this.window.outerHeight;
    }
  }

  window.jsdom.global.WebGLActiveInfo            = gl.WebGLActiveInfo;
  window.jsdom.global.WebGLShaderPrecisionFormat = gl.WebGLShaderPrecisionFormat;
  window.jsdom.global.WebGLBuffer                = gl.WebGLBuffer;
  window.jsdom.global.WebGLContextEvent          = gl.WebGLContextEvent;
  window.jsdom.global.WebGLFramebuffer           = gl.WebGLFramebuffer;
  window.jsdom.global.WebGLProgram               = gl.WebGLProgram;
  window.jsdom.global.WebGLQuery                 = gl.WebGLQuery;
  window.jsdom.global.WebGLRenderbuffer          = gl.WebGLRenderbuffer;
  window.jsdom.global.WebGLSampler               = gl.WebGLSampler;
  window.jsdom.global.WebGLShader                = gl.WebGLShader;
  window.jsdom.global.WebGLSync                  = gl.WebGLSync;
  window.jsdom.global.WebGLTexture               = gl.WebGLTexture;
  window.jsdom.global.WebGLTransformFeedback     = gl.WebGLTransformFeedback;
  window.jsdom.global.WebGLUniformLocation       = gl.WebGLUniformLocation;
  window.jsdom.global.WebGLVertexArrayObject     = gl.WebGLVertexArrayObject;
  window.jsdom.global.WebGLRenderingContext      = GLFWRenderingContext;
  window.jsdom.global.WebGL2RenderingContext     = GLFWRenderingContext;

  return window;

  type RenderingContextSettings =
    CanvasRenderingContext2DSettings|ImageBitmapRenderingContextSettings|WebGLContextAttributes;

  function getContext(contextId: '2d',
                      options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D|null;
  function getContext(contextId: 'bitmaprenderer', options?: ImageBitmapRenderingContextSettings):
    ImageBitmapRenderingContext|null;
  function getContext(contextId: 'webgl', options?: WebGLContextAttributes): WebGLRenderingContext|
    null;
  function getContext(contextId: 'webgl2',
                      options?: WebGLContextAttributes): WebGL2RenderingContext|null;
  function getContext(this: any, ...args: [OffscreenRenderingContextId | 'experimental-webgl', RenderingContextSettings?]): RenderingContext | null {
    const [type, settings = {}] = args;
    switch (type) {
      case 'webgl':
      case 'webgl2':
      case 'experimental-webgl': {
        if (!this.gl) {  //
          window._gl = this.gl = new GLFWRenderingContext(this, window, settings);
        }
        return this.gl;
      }
      default: return JSDOM_getContext.apply(this, <any>args);
    }
  }
}
