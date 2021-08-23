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

import {
  glfw,
  GLFW,
  GLFWClientAPI,
  GLFWContextCreationAPI,
  GLFWInputMode,
  GLFWModifierKey,
  GLFWMouseButton,
  GLFWOpenGLProfile,
  GLFWStandardCursor,
  GLFWWindowAttribute,
} from '@nvidia/glfw';
import * as jsdom from 'jsdom';
import {Subscription} from 'rxjs';

import {dndEvents, GLFWDndEvent} from './events/dnd';
import {isAltKey, isCapsLock, isCtrlKey, isMetaKey, isShiftKey} from './events/event';
import {GLFWKeyboardEvent, keyboardEvents} from './events/keyboard';
import {GLFWMouseEvent, mouseEvents} from './events/mouse';
import {GLFWWheelEvent, wheelEvents} from './events/wheel';
import {GLFWWindowEvent, windowEvents} from './events/window';

// let rootWindow: jsdom.DOMWindow|undefined = undefined;

export function installGLFWWindow(window: jsdom.DOMWindow) {
  // Attatching properties

  let _id                = 0;
  let _cursor            = 0;
  let _buttons           = 0;
  let _devicePixelRatio  = 1;
  let _frameBufferHeight = 0;
  let _frameBufferWidth  = 0;
  let _modifiers         = 0;
  let _mouseX            = 0;
  let _mouseY            = 0;
  let _scrollX           = 0;
  let _scrollY           = 0;
  let _swapInterval      = 0;
  let _width             = 800;
  let _height            = 600;
  let _x                 = 0;
  let _y                 = 0;
  let _xscale            = 1;
  let _yscale            = 1;

  const _debug     = false;
  let _focused     = false;
  let _visible     = true;
  let _decorated   = true;
  let _maximized   = false;
  let _minimized   = false;
  let _transparent = false;
  let _resizable   = true;
  // let _forceNewWindow = false;

  const _gl: any     = null;
  let _title         = 'Untitled';
  const _event: any  = undefined;
  let _subscriptions = new Subscription();

  const _openGLClientAPI          = GLFWClientAPI.OPENGL;
  const _openGLProfile            = GLFWOpenGLProfile.ANY;
  const _openGLMajorVersion       = 4;
  const _openGLMinorVersion       = 6;
  const _openGLForwardCompat      = true;
  const _openGLContextCreationAPI = GLFWContextCreationAPI.EGL;

  Object.defineProperty(window, 'id', {get() { return _id; }});
  Object.defineProperty(window, 'debug', {get() { return _debug; }});
  Object.defineProperty(window, 'xscale', {get() { return _xscale; }});
  Object.defineProperty(window, 'yscale', {get() { return _yscale; }});
  Object.defineProperty(window, 'mouseX', {get() { return _mouseX; }});
  Object.defineProperty(window, 'mouseY', {get() { return _mouseY; }});
  Object.defineProperty(window, 'scrollX', {get() { return _scrollX; }});
  Object.defineProperty(window, 'scrollY', {get() { return _scrollY; }});
  Object.defineProperty(window, 'buttons', {get() { return _buttons; }});
  Object.defineProperty(window, 'focused', {get() { return _focused; }});
  Object.defineProperty(window, 'minimized', {get() { return _minimized; }});
  Object.defineProperty(window, 'maximized', {get() { return _maximized; }});
  Object.defineProperty(window, 'devicePixelRatio', {get() { return _devicePixelRatio; }});
  Object.defineProperty(window, 'event', {get() { return _event; }});
  Object.defineProperty(window, 'modifiers', {get() { return _modifiers; }});
  Object.defineProperty(window, 'frameBufferWidth', {get() { return _frameBufferWidth; }});
  Object.defineProperty(window, 'frameBufferHeight', {get() { return _frameBufferHeight; }});

  Object.defineProperty(window, 'openGLProfile', {get() { return _openGLProfile; }});
  Object.defineProperty(window, 'openGLClientAPI', {get() { return _openGLClientAPI; }});
  Object.defineProperty(window, 'openGLMajorVersion', {get() { return _openGLMajorVersion; }});
  Object.defineProperty(window, 'openGLMinorVersion', {get() { return _openGLMinorVersion; }});
  Object.defineProperty(window, 'openGLForwardCompat', {get() { return _openGLForwardCompat; }});
  Object.defineProperty(
    window, 'openGLContextCreationAPI', {get() { return _openGLContextCreationAPI; }});

  Object.defineProperties(window, {
    x: {
      get() { return _x; },
      set(this: jsdom.DOMWindow, _: any) {
        if ((_ = cssToNumber(this, 'x', _)) !== _x) {
          _x = _;
          if (_id > 0) { glfw.setWindowPos(_id, {x: _x, y: _y}); }
        }
      },
    },
    y: {
      get() { return _y; },
      set(this: jsdom.DOMWindow, _: any) {
        if ((_ = cssToNumber(this, 'y', _)) !== _y) {
          _y = _;
          if (_id > 0) { glfw.setWindowPos(_id, {x: _x, y: _y}); }
        }
      },
    },
    width: {
      get() { return _width; },
      set(this: jsdom.DOMWindow, _: any) {
        if ((_ = cssToNumber(this, 'width', _)) !== _width) {
          _width = _;
          if (_id > 0) { glfw.setWindowSize(_id, {width: _width, height: _height}); }
        }
      },
    },
    height: {
      get() { return _height; },
      set(this: jsdom.DOMWindow, _: any) {
        if ((_ = cssToNumber(this, 'height', _)) !== _height) {
          _height = _;
          if (_id > 0) { glfw.setWindowSize(_id, {width: _width, height: _height}); }
        }
      },
    },
    title: {
      get() { return _title; },
      set(this: jsdom.DOMWindow, _: string) {
        _title = _;
        if (_id > 0) { glfw.setWindowTitle(_id, _title); }
      },
    },
    swapInterval: {
      get(this: jsdom.DOMWindow) { return _swapInterval; },
      set(this: jsdom.DOMWindow, _: number) {
        if (_swapInterval !== _) {
          if (_id > 0 && typeof _ === 'number') {  //
            glfw.swapInterval(_swapInterval = _);
          }
        }
      },
    },

    altKey: {get(this: jsdom.DOMWindow) { return isAltKey(window.modifiers); }},
    ctrlKey: {get(this: jsdom.DOMWindow) { return isCtrlKey(window.modifiers); }},
    metaKey: {get(this: jsdom.DOMWindow) { return isMetaKey(window.modifiers); }},
    shiftKey: {get(this: jsdom.DOMWindow) { return isShiftKey(window.modifiers); }},
    capsLock: {get(this: jsdom.DOMWindow) { return isCapsLock(window.modifiers); }},

    visible: {
      get(this: jsdom.DOMWindow) { return _visible; },
      set(this: jsdom.DOMWindow, _: boolean) {
        if (_visible !== _) {
          _visible = _;
          _visible ? window.show() : window.hide();
        }
      },
    },

    decorated: {
      get(this: jsdom.DOMWindow) { return _decorated; },
      set(this: jsdom.DOMWindow, _: boolean) {
        if (_decorated !== _) {
          _decorated = _;
          if (_id > 0) { glfw.setWindowAttrib(_id, GLFWWindowAttribute.DECORATED, _); }
        }
      }
    },

    transparent: {
      get(this: jsdom.DOMWindow) { return _transparent; },
      set(this: jsdom.DOMWindow, _: boolean) {
        if (_transparent !== _) { _transparent = _; }
      }
    },

    resizable: {
      get(this: jsdom.DOMWindow) { return _resizable; },
      set(this: jsdom.DOMWindow, _: boolean) {
        if (_resizable !== _) {
          _resizable = _;
          if (_id > 0) { glfw.setWindowAttrib(_id, GLFWWindowAttribute.RESIZABLE, _); }
        }
      }
    },

    cursor: {
      get(this: jsdom.DOMWindow) { return _cursor; },
      set(this: jsdom.DOMWindow, _: any) {
        _ = (() => {
          switch (_) {
            case 'pointer': return GLFWStandardCursor.HAND;
            case 'text': return GLFWStandardCursor.IBEAM;
            case 'crosshair': return GLFWStandardCursor.CROSSHAIR;
            case 'e-resize':
            case 'w-resize':
            case 'ew-resize': return GLFWStandardCursor.HRESIZE;
            case 'n-resize':
            case 's-resize':
            case 'ns-resize': return GLFWStandardCursor.VRESIZE;
            case 'auto':
            case 'none':
            case 'grab':
            case 'grabbing':
            case 'default': return GLFWStandardCursor.ARROW;
            default: {
              let key: keyof typeof GLFWStandardCursor;
              for (key in GLFWStandardCursor) {
                if (_ === GLFWStandardCursor[key]) {  //
                  return GLFWStandardCursor[key];
                }
              }
              return GLFWStandardCursor.ARROW;
            }
          }
        })();
        if (_cursor !== _) {
          _cursor = _;
          if (_id > 0) {
            switch (_) {
              case GLFWStandardCursor.ARROW:
              case GLFWStandardCursor.IBEAM:
              case GLFWStandardCursor.CROSSHAIR:
              case GLFWStandardCursor.HAND:
              case GLFWStandardCursor.HRESIZE:
              case GLFWStandardCursor.VRESIZE: glfw.setCursor(_id, _); break;
              default: break;
            }
          }
        }
      }
    },

    style: {
      get(this: jsdom.DOMWindow) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        return {
          get width() { return self.width; },
          set width(_: any) { self.width = _; },
          get height() { return self.height; },
          set height(_: any) { self.height = _; },
          get cursor() { return self.cursor; },
          set cursor(_: any) { self.cursor = _; },
        };
      }
    },

    _clearMask: {
      get() { return _gl ? _gl._clearMask : 0; },
      set(_: any) { _gl && (_gl._clearMask = _); },
    },
  });

  defineDOMEventListenerProperties(window, [
    'onblur',
    'onfocus',
    'onmove',
    'onresize',
    'onkeyup',
    'onkeydown',
    'onmousedown',
    'onmouseup',
    'onmousemove',
    'onmouseenter',
    'onmouseleave',
    'onwheel',
  ]);

  defineDOMElementPropertyAliases(window, [
    {name: 'y', aliases: ['screenY', 'screenTop']},
    {name: 'x', aliases: ['screenX', 'screenLeft']},
    {name: 'scrollX', aliases: ['scrollLeft', 'pageXOffset']},
    {name: 'scrollY', aliases: ['scrollTop', 'pageYOffset']},
    {name: 'onwheel', aliases: ['onscroll', 'onmousewheel']},
    {name: 'width', aliases: ['clientWidth', 'innerWidth', 'offsetWidth']},
    {name: 'height', aliases: ['clientHeight', 'innerHeight', 'offsetHeight']},
  ]);

  // Attaching functions

  window.setAttribute = function setAttribute(this: jsdom.DOMWindow, name: any, value: any) {
    if (name in this) { this[name] = value; }
  }.bind(window);

  window.getBoundingClientRect = function getBoundingClientRect(this: jsdom.DOMWindow) {
    return {
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
      left: 0,
      top: 0,
      right: this.width,
      bottom: this.height,
    };
  }.bind(window);

  window.show = function show(this: jsdom.DOMWindow) {
    this.visible = true;
    glfw.showWindow(_id);
    return this;
  }.bind(window);

  window.hide = function hide(this: jsdom.DOMWindow) {
    this.visible = false;
    glfw.hideWindow(_id);
    return this;
  }.bind(window);

  window.poll = function poll(this: jsdom.DOMWindow) {
    if (_id > 0) {
      // fix for running in the node repl
      const {domain}   = (global as any);
      const patchExit  = (domain && typeof domain.exit !== 'function');
      const patchEnter = (domain && typeof domain.enter !== 'function');
      patchExit && (domain.exit = () => {});
      patchEnter && (domain.enter = () => {});
      glfw.pollEvents();
      patchExit && (delete domain.exit);
      patchEnter && (delete domain.enter);
    }
  }.bind(window);

  window.dispatchEvent = function dispatchJSDOMEventAsGLFWEvent(this: jsdom.DOMWindow, event: any) {
    switch (event && event.type) {
      case 'close': {
        return this._dispatchGLFWWindowEventIntoDOM(GLFWWindowEvent.fromClose(this));
      }
      case 'move': {
        const {x = _mouseX, y = _mouseY} = event;
        return this._dispatchGLFWWindowEventIntoDOM(GLFWWindowEvent.fromMove(this, x, y));
      }
      case 'blur': {
        return this._dispatchGLFWWindowEventIntoDOM(GLFWWindowEvent.fromFocus(this, false));
      }
      case 'focus': {
        return this._dispatchGLFWWindowEventIntoDOM(GLFWWindowEvent.fromFocus(this, true));
      }
      case 'refresh': {
        return this._dispatchGLFWWindowEventIntoDOM(GLFWWindowEvent.fromRefresh(this));
      }
      case 'resize': {
        const {width = _width, height = _height} = event;
        return this._dispatchGLFWWindowEventIntoDOM(
          GLFWWindowEvent.fromResize(this, width, height));
      }
      case 'maximize': {
        return this._dispatchGLFWWindowEventIntoDOM(GLFWWindowEvent.fromMaximize(this, true));
      }
      case 'minimize': {
        return this._dispatchGLFWWindowEventIntoDOM(GLFWWindowEvent.fromIconify(this, true));
      }
      case 'restore': {
        return this._dispatchGLFWWindowEventIntoDOM(GLFWWindowEvent.fromIconify(this, false));
      }
      case 'wheel': {
        const {deltaX = 0, deltaY = 0} = event;
        return this._dispatchGLFWWheelEventIntoDOM(
          GLFWWheelEvent.create(this, -deltaX / 10, -deltaY / 10));
      }
      case 'keyup': {
        return this._dispatchGLFWKeyboardEventIntoDOM(GLFWKeyboardEvent.fromKeyEvent(
          this, event.key, event.scancode, glfw.RELEASE, event.modifiers));
      }
      case 'keydown': {
        return this._dispatchGLFWKeyboardEventIntoDOM(GLFWKeyboardEvent.fromKeyEvent(
          this, event.key, event.scancode, glfw.PRESS, event.modifiers));
      }
      case 'keypress': {
        return this._dispatchGLFWKeyboardEventIntoDOM(GLFWKeyboardEvent.fromKeyEvent(
          this, event.key, event.scancode, glfw.PRESS, event.modifiers));
      }
      case 'mousemove': {
        const {x = _mouseX, y = _mouseY} = event;
        return this._dispatchGLFWMouseEventIntoDOM(GLFWMouseEvent.fromMouseMove(this, x, y));
      }
      case 'mouseup': {
        const button = domToGLFWButton(event);
        if (button !== -1) {
          event = GLFWMouseEvent.fromMouseButton(this, button, glfw.RELEASE, event.modifiers);
          ({x: event._x = _mouseX, y: event._y = _mouseY} = event);
          return this._dispatchGLFWMouseEventIntoDOM(event);
        }
        return true;
      }
      case 'mousedown': {
        const button = domToGLFWButton(event);
        if (button !== -1) {
          event = GLFWMouseEvent.fromMouseButton(this, button, glfw.PRESS, event.modifiers);
          ({x: event._x = _mouseX, y: event._y = _mouseY} = event);
          return this._dispatchGLFWMouseEventIntoDOM(event);
        }
        return true;
      }
      case 'mouseenter': {
        event = GLFWMouseEvent.fromMouseEnter(this, +true);
        ({x: event._x = _mouseX, y: event._y = _mouseY} = event);
        return this._dispatchGLFWMouseEventIntoDOM(event);
      }
      case 'mouseleave': {
        event = GLFWMouseEvent.fromMouseEnter(this, +false);
        ({x: event._x = _mouseX, y: event._y = _mouseY} = event);
        return this._dispatchGLFWMouseEventIntoDOM(event);
      }
      default: break;
    }

    return true;

    function domToGLFWButton({button} = event || {}) {
      switch (button) {
        case 0: return GLFWMouseButton.MOUSE_BUTTON_LEFT;
        case 1: return GLFWMouseButton.MOUSE_BUTTON_MIDDLE;
        case 2: return GLFWMouseButton.MOUSE_BUTTON_RIGHT;
        default: return -1;
      }
    }
  }.bind(window);

  window.destroyGLFWWindow = function destroyGLFWWindow(this: jsdom.DOMWindow) {
    if (_id > 0) {
      const id = _id;
      _id      = 0;
      _subscriptions && _subscriptions.unsubscribe();
      glfw.destroyWindow(id);
      // if (!_forceNewWindow && rootWindow === this) { setImmediate(() => process.exit(0)); }
    }
  }.bind(window);

  window.createGLFWWindow = function createGLFWWindow(this: jsdom.DOMWindow) {
    try {
      const root = null;
      // if (!_forceNewWindow && rootWindow) { root = rootWindow.id; }

      glfw.windowHint(GLFWWindowAttribute.SAMPLES, 4);
      glfw.windowHint(GLFWWindowAttribute.DOUBLEBUFFER, true);
      glfw.windowHint(GLFWWindowAttribute.FOCUSED, window.focused);
      glfw.windowHint(GLFWWindowAttribute.FOCUS_ON_SHOW, window.focused);
      glfw.windowHint(GLFWWindowAttribute.VISIBLE, window.visible);
      glfw.windowHint(GLFWWindowAttribute.DECORATED, window.decorated);
      glfw.windowHint(GLFWWindowAttribute.RESIZABLE, window.resizable);
      glfw.windowHint(GLFWWindowAttribute.TRANSPARENT_FRAMEBUFFER, window.transparent);

      glfw.windowHint(GLFWWindowAttribute.CLIENT_API, window.openGLClientAPI);
      glfw.windowHint(GLFWWindowAttribute.OPENGL_DEBUG_CONTEXT, window.debug);
      glfw.windowHint(GLFWWindowAttribute.OPENGL_PROFILE, window.openGLProfile);
      glfw.windowHint(GLFWWindowAttribute.CONTEXT_VERSION_MAJOR, window.openGLMajorVersion);
      glfw.windowHint(GLFWWindowAttribute.CONTEXT_VERSION_MINOR, window.openGLMinorVersion);
      glfw.windowHint(GLFWWindowAttribute.OPENGL_FORWARD_COMPAT, window.openGLForwardCompat);
      glfw.windowHint(GLFWWindowAttribute.CONTEXT_CREATION_API, window.openGLContextCreationAPI);

      _id = glfw.createWindow(window.width, window.height, window.title, null, root);

      glfw.setInputMode(window.id, GLFWInputMode.LOCK_KEY_MODS, true);
      glfw.setInputMode(window.id, GLFWInputMode.CURSOR, GLFW.CURSOR_NORMAL);
      glfw.makeContextCurrent(window.id);

      ({x: _x, y: _y} = glfw.getWindowPos(window.id));
      ({width: _width, height: _height} = glfw.getWindowSize(window.id));
      ({xscale: _xscale, yscale: _yscale} = glfw.getWindowContentScale(window.id));

      // !_forceNewWindow && !rootWindow && (rootWindow = window);
      _frameBufferWidth  = _width * _xscale;
      _frameBufferHeight = _height * _yscale;
      _subscriptions && _subscriptions.unsubscribe();
      _subscriptions = new Subscription();
      window.cursor  = _cursor;

      [dndEvents(window).subscribe(window._dispatchGLFWDropEventIntoDOM),
       mouseEvents(window).subscribe(window._dispatchGLFWMouseEventIntoDOM),
       wheelEvents(window).subscribe(window._dispatchGLFWWheelEventIntoDOM),
       windowEvents(window).subscribe(window._dispatchGLFWWindowEventIntoDOM),
       keyboardEvents(window).subscribe(window._dispatchGLFWKeyboardEventIntoDOM),
      ].forEach((subscription) => _subscriptions.add(subscription));

      glfw.swapInterval(window.swapInterval);
      glfw.swapBuffers(window.id);
      window.poll();
    } catch (e) {
      console.error(`Error creating GLFW window:\n${Object.prototype.toString.call(e)}`);
      window.destroyGLFWWindow();
      throw e;
    }
    return window;
  }.bind(window);

  window._dispatchGLFWDropEventIntoDOM = function dispatchGLFWDropEventIntoDOM(
                                           this: jsdom.DOMWindow, event: GLFWDndEvent) {
    return dispatchEventIntoDOM(this, event, this.Event);
  }.bind(window);

  window._dispatchGLFWMouseEventIntoDOM = function dispatchGLFWMouseEventIntoDOM(
                                            this: jsdom.DOMWindow, event: GLFWMouseEvent) {
    _mouseX  = event.x;
    _mouseY  = event.y;
    _buttons = event.buttons;
    let m    = _modifiers;
    m        = event.altKey ? (m | GLFWModifierKey.MOD_ALT) : (m & ~GLFWModifierKey.MOD_ALT);
    m = event.ctrlKey ? (m | GLFWModifierKey.MOD_CONTROL) : (m & ~GLFWModifierKey.MOD_CONTROL);
    m = event.metaKey ? (m | GLFWModifierKey.MOD_SUPER) : (m & ~GLFWModifierKey.MOD_SUPER);
    m = event.shiftKey ? (m | GLFWModifierKey.MOD_SHIFT) : (m & ~GLFWModifierKey.MOD_SHIFT);
    m = event.capsLock ? (m | GLFWModifierKey.MOD_CAPS_LOCK) : (m & ~GLFWModifierKey.MOD_CAPS_LOCK);
    _modifiers = m;
    return dispatchEventIntoDOM(this, event, this.MouseEvent);
  }.bind(window);

  window._dispatchGLFWWheelEventIntoDOM = function dispatchGLFWWheelEventIntoDOM(
                                            this: jsdom.DOMWindow, event: GLFWWheelEvent) {
    _scrollX += event.deltaX;
    _scrollY += event.deltaY;
    return dispatchEventIntoDOM(this, event, this.WheelEvent);
  }.bind(window);

  window._dispatchGLFWWindowEventIntoDOM = function dispatchGLFWWindowEventIntoDOM(
                                             this: jsdom.DOMWindow, event: GLFWWindowEvent) {
    _x                 = event.x;
    _y                 = event.y;
    _width             = event.width;
    _height            = event.height;
    _xscale            = event.xscale;
    _yscale            = event.yscale;
    _focused           = event.focused;
    _minimized         = event.minimized;
    _maximized         = event.maximized;
    _frameBufferWidth  = event.frameBufferWidth;
    _frameBufferHeight = event.frameBufferHeight;
    _devicePixelRatio  = Math.min(_frameBufferWidth / _width, _frameBufferHeight / _height);
    const result       = dispatchEventIntoDOM(this, event, this.Event);
    if (event.type === 'close') { this.destroyGLFWWindow(); }
    return result;
  }.bind(window);

  window._dispatchGLFWKeyboardEventIntoDOM = function dispatchGLFWKeyboardEventIntoDOM(
                                               this: jsdom.DOMWindow, event: GLFWKeyboardEvent) {
    let m = _modifiers;
    m     = event.altKey ? (m | GLFWModifierKey.MOD_ALT) : (m & ~GLFWModifierKey.MOD_ALT);
    m     = event.ctrlKey ? (m | GLFWModifierKey.MOD_CONTROL) : (m & ~GLFWModifierKey.MOD_CONTROL);
    m     = event.metaKey ? (m | GLFWModifierKey.MOD_SUPER) : (m & ~GLFWModifierKey.MOD_SUPER);
    m     = event.shiftKey ? (m | GLFWModifierKey.MOD_SHIFT) : (m & ~GLFWModifierKey.MOD_SHIFT);
    m = event.capsLock ? (m | GLFWModifierKey.MOD_CAPS_LOCK) : (m & ~GLFWModifierKey.MOD_CAPS_LOCK);
    _modifiers = m;
    return dispatchEventIntoDOM(this, event, this.KeyboardEvent);
  }.bind(window);

  defineLayoutProps(window, window.Document.prototype);
  defineLayoutProps(window, window.HTMLElement.prototype);

  Object.defineProperties(window.SVGElement.prototype, {
    width: {get() { return {baseVal: {value: window.innerWidth}}; }},
    height: {get() { return {baseVal: {value: window.innerHeight}}; }},
  });

  return window.createGLFWWindow();
}

function dispatchEventIntoDOM(window: jsdom.DOMWindow, glfwEvent: any, EventCtor: any) {
  const target = window._inputEventTarget || window.document;
  if (target && target.dispatchEvent) {
    glfwEvent.target     = target;
    const jsdomEvent     = new EventCtor(glfwEvent.type, glfwEvent);
    const jsdomEventImpl = window.jsdom.utils.implForWrapper(jsdomEvent);
    for (const key in glfwEvent) {
      if (!key.startsWith('_')) {
        try {
          jsdomEventImpl[key] = glfwEvent[key];
        } catch (e) { /**/
        }
      }
    }
    return target.dispatchEvent(jsdomEvent);
  }
  return true;
}

function defineDOMEventListenerProperties(window: jsdom.DOMWindow, propertyNames: string[]) {
  propertyNames.forEach((name) => {
    const type  = name.slice(2);
    const pname = Symbol(`_${name}Listener`);
    Object.defineProperty(window, name, {
      get() { return this[pname] || undefined; },
      set(listener: (...args: any[]) => any) {
        if (typeof this[pname] === 'function') { this.removeEventListener(type, this[pname]); }
        if (typeof listener === 'function') {
          this[pname] = (e: any) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            listener(e);
          };
          this.addEventListener(type, this[pname], true);
        }
      }
    });
  });
}

function defineDOMElementPropertyAliases(window: jsdom.DOMWindow,
                                         aliases: {name: string, aliases: string[]}[]) {
  /* eslint-disable @typescript-eslint/unbound-method */
  aliases.forEach(({name, aliases = []}) => {
    const descriptor = Object.getOwnPropertyDescriptor(window, name);
    if (descriptor) {
      descriptor.get =
        ((get) => get && function(this: any) { return get.call(this); })(descriptor.get);
      descriptor.set =
        ((set) => set && function(this: any, _: any) { return set.call(this, _); })(descriptor.set);
      aliases.forEach((alias) => Object.defineProperty(window, alias, descriptor));
    }
  });
}

function cssToNumber(window: jsdom.DOMWindow, prop: keyof jsdom.DOMWindow, value: any): number {
  switch (typeof value) {
    case 'number': return value;
    case 'string': {
      if (value.endsWith('px')) {
        return +(value.slice(0, -1));
      } else if (value.endsWith('%')) {
        return +window[prop] * (+value.slice(0, -1) / 100);
      }
    }
  }
  return ((value = +value) !== value) ? +window[prop] : value;
}

function defineLayoutProps(window: jsdom.DOMWindow, proto: any) {
  ['width',
   'height',
   'screenY',
   'screenX',
   'screenTop',
   'screenLeft',
   'scrollTop',
   'scrollLeft',
   'pageXOffset',
   'pageYOffset',
   'clientWidth',
   'clientHeight',
   'innerWidth',
   'innerHeight',
   'offsetWidth',
   'offsetHeight',
  ].forEach((k) => Object.defineProperty(proto, k, {
    get: () => window[k],
    set: () => {},
    enumerable: true,
    configurable: true,
  }));
  proto.getBoundingClientRect = window.getBoundingClientRect.bind(window);
  return proto;
}
