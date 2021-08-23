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

import {glfw, GLFWKey} from '@nvidia/glfw';
import {GLFWInputMode} from '@nvidia/glfw';
import {DOMWindow} from 'jsdom';
import {Observable} from 'rxjs';
import {merge as mergeObservables} from 'rxjs';
import {filter, map, mergeAll, publish, refCount, withLatestFrom} from 'rxjs/operators';

import {
  GLFWEvent,
  isAltKey,
  isCapsLock,
  isCtrlKey,
  isMetaKey,
  isShiftKey,
  windowCallbackAsObservable
} from './event';

export function keyboardEvents(window: DOMWindow) {
  const keys        = keyUpdates(window);
  const specialKeys = keys.pipe(filter(isSpecialKey));
  const characterKeys =
    keys.pipe(filter(isCharacterKey), (charKeys) => characterUpdates(window, charKeys));

  return mergeObservables(specialKeys, characterKeys);
}

function keyUpdates(window: DOMWindow) {
  return windowCallbackAsObservable(glfw.setKeyCallback, window)
    .pipe(map(([, ...rest]) => GLFWKeyboardEvent.fromKeyEvent(window, ...rest)))
    .pipe(publish(), refCount());
}

function characterUpdates(window: DOMWindow, charKeys: Observable<GLFWKeyboardEvent>) {
  const charCodes = windowCallbackAsObservable(glfw.setCharCallback, window)
                      .pipe(map(([, charCode]) => charCode), publish(), refCount());
  return charCodes
    .pipe(withLatestFrom(charKeys,
                         function*(charCode, keyEvt) {
                           yield keyEvt.asCharacter(charCode, keyEvt.target.modifiers);
                           if (keyEvt.type === 'keydown' && keyEvt.code === 'Space') {
                             // Also yield spacebar 'keydown' events as 'keypress' for xterm.js
                             yield Object.assign(
                               keyEvt.asCharacter(charCode, keyEvt.target.modifiers),
                               {type: 'keypress'});
                           }
                         }))
    .pipe(mergeAll());
}

function isCharacterKey(evt: GLFWKeyboardEvent) { return !isSpecialKey(evt); }

function isSpecialKey(evt: GLFWKeyboardEvent) {
  switch (evt._rawKey) {
    // GLFW dispatches spacebar as both a keyboard and character input event,
    // but glfw.getKeyName() doesn't return a name for it.
    case GLFWKey.KEY_SPACE: return false;
    // Modifier keys are special keys
    case GLFWKey.KEY_DELETE:
    case GLFWKey.KEY_BACKSPACE:
    case GLFWKey.KEY_CAPS_LOCK:
    case GLFWKey.KEY_LEFT_ALT:
    case GLFWKey.KEY_RIGHT_ALT:
    case GLFWKey.KEY_LEFT_CONTROL:
    case GLFWKey.KEY_RIGHT_CONTROL:
    case GLFWKey.KEY_LEFT_SUPER:
    case GLFWKey.KEY_RIGHT_SUPER:
    case GLFWKey.KEY_LEFT_SHIFT:
    case GLFWKey.KEY_RIGHT_SHIFT: return true;
    default:
      // If GLFW didn't return a key name, it's a special key
      return evt.key === 'Unidentified';
  }
}

export class GLFWKeyboardEvent extends GLFWEvent {
  public static fromKeyEvent(
    window: DOMWindow, key: number, scancode: number, action: number, modifiers: number) {
    const down = action !== glfw.RELEASE;
    const name = glfw.getKeyName(key, scancode);
    const evt  = new GLFWKeyboardEvent(action === glfw.RELEASE ? 'keyup' : 'keydown');

    evt._rawKey      = key;
    evt._rawName     = name;
    evt._rawScanCode = scancode;

    evt.target  = window;
    evt._repeat = action === glfw.REPEAT;

    evt._key   = name || 'Unidentified';
    evt._which = evt._charCode = glfwToDOMKey[key] || key;
    evt._code                  = keyToCode[evt.which] || name || 'Unidentified';

    const isCaps  = key === GLFWKey.KEY_CAPS_LOCK;
    const isAlt   = !isCaps && (key === GLFWKey.KEY_LEFT_ALT || key === GLFWKey.KEY_RIGHT_ALT);
    const isShift = !isAlt && (key === GLFWKey.KEY_LEFT_SHIFT || key === GLFWKey.KEY_RIGHT_SHIFT);
    const isSuper = !isShift && (key === GLFWKey.KEY_LEFT_SUPER || key === GLFWKey.KEY_RIGHT_SUPER);
    const isControl =
      !isSuper && (key === GLFWKey.KEY_LEFT_CONTROL || key === GLFWKey.KEY_RIGHT_CONTROL);

    if (!glfw.getInputMode(window.id, GLFWInputMode.LOCK_KEY_MODS)) {
      evt._capsLock = down ? isCaps || window.capsLock : !isCaps && window.capsLock;
    } else {
      evt._capsLock = isCaps ? window.capsLock ? !down : down : isCapsLock(modifiers);
    }

    if (down) {
      evt._altKey   = isAlt || isAltKey(modifiers);
      evt._ctrlKey  = isControl || isCtrlKey(modifiers);
      evt._metaKey  = isSuper || isMetaKey(modifiers);
      evt._shiftKey = isShift || isShiftKey(modifiers);
    } else {
      evt._altKey   = !isAlt && isAltKey(modifiers);
      evt._ctrlKey  = !isControl && isCtrlKey(modifiers);
      evt._metaKey  = !isSuper && isMetaKey(modifiers);
      evt._shiftKey = !isShift && isShiftKey(modifiers);
    }

    return evt;
  }

  public asCharacter(charCode: number, modifiers: number) {
    const evt        = new GLFWKeyboardEvent(this.type);
    evt.target       = this.target;
    evt._charCode    = charCode;
    evt._which       = this._which;
    evt._rawKey      = this._rawKey;
    evt._rawName     = this._rawName;
    evt._rawScanCode = this._rawScanCode;
    evt._key         = charCode ? String.fromCharCode(charCode) : '';
    evt._repeat      = this._repeat || this.type === 'keypress';
    evt._code        = keyToCode[this._which] || `Key${this._rawName.toUpperCase()}`;
    evt._altKey      = isAltKey(modifiers) || this._altKey;
    evt._ctrlKey     = isCtrlKey(modifiers) || this._ctrlKey;
    evt._metaKey     = isMetaKey(modifiers) || this._metaKey;
    evt._shiftKey    = isShiftKey(modifiers) || this._shiftKey;
    evt._capsLock    = isCapsLock(modifiers) || this._capsLock;
    return evt;
  }

  public isComposing = false;

  private _key                   = '';
  private _code                  = '';
  private _which                 = 0;
  private _repeat                = false;
  private _altKey                = false;
  private _ctrlKey               = false;
  private _metaKey               = false;
  private _shiftKey              = false;
  private _capsLock              = false;
  private _charCode: number|null = null;

  public _rawKey      = 0;
  public _rawName     = '';
  public _rawScanCode = 0;
  public get key() { return this._key; }
  public get code() { return this._code; }
  public get which() { return this._which; }
  public get repeat() { return this._repeat; }
  public get keyCode() { return this._which; }
  public get charCode() { return this._charCode; }

  public get altKey() { return this._altKey; }
  public get ctrlKey() { return this._ctrlKey; }
  public get metaKey() { return this._metaKey; }
  public get shiftKey() { return this._shiftKey; }
  public get capsLock() { return this._capsLock; }
}

const glfwToDOMKey: any = {
  [GLFWKey.KEY_APOSTROPHE]: 222,
  [GLFWKey.KEY_BACKSLASH]: 220,
  [GLFWKey.KEY_BACKSPACE]: 8,
  [GLFWKey.KEY_CAPS_LOCK]: 20,
  [GLFWKey.KEY_COMMA]: 188,
  [GLFWKey.KEY_DELETE]: 46,
  [GLFWKey.KEY_DOWN]: 40,
  [GLFWKey.KEY_END]: 35,
  [GLFWKey.KEY_ENTER]: 13,
  [GLFWKey.KEY_EQUAL]: 187,
  [GLFWKey.KEY_ESCAPE]: 27,
  [GLFWKey.KEY_F10]: 121,
  [GLFWKey.KEY_F11]: 122,
  [GLFWKey.KEY_F12]: 123,
  [GLFWKey.KEY_F13]: 123,
  [GLFWKey.KEY_F14]: 123,
  [GLFWKey.KEY_F15]: 123,
  [GLFWKey.KEY_F16]: 123,
  [GLFWKey.KEY_F17]: 123,
  [GLFWKey.KEY_F18]: 123,
  [GLFWKey.KEY_F19]: 123,
  [GLFWKey.KEY_F1]: 112,
  [GLFWKey.KEY_F20]: 123,
  [GLFWKey.KEY_F21]: 123,
  [GLFWKey.KEY_F22]: 123,
  [GLFWKey.KEY_F23]: 123,
  [GLFWKey.KEY_F24]: 123,
  [GLFWKey.KEY_F25]: 123,
  [GLFWKey.KEY_F2]: 113,
  [GLFWKey.KEY_F3]: 114,
  [GLFWKey.KEY_F4]: 115,
  [GLFWKey.KEY_F5]: 116,
  [GLFWKey.KEY_F6]: 117,
  [GLFWKey.KEY_F7]: 118,
  [GLFWKey.KEY_F8]: 119,
  [GLFWKey.KEY_F9]: 120,
  [GLFWKey.KEY_GRAVE_ACCENT]: 192,
  [GLFWKey.KEY_HOME]: 36,
  [GLFWKey.KEY_INSERT]: 45,
  [GLFWKey.KEY_KP_0]: 96,
  [GLFWKey.KEY_KP_1]: 97,
  [GLFWKey.KEY_KP_2]: 98,
  [GLFWKey.KEY_KP_3]: 99,
  [GLFWKey.KEY_KP_4]: 100,
  [GLFWKey.KEY_KP_5]: 101,
  [GLFWKey.KEY_KP_6]: 102,
  [GLFWKey.KEY_KP_7]: 103,
  [GLFWKey.KEY_KP_8]: 104,
  [GLFWKey.KEY_KP_9]: 105,
  [GLFWKey.KEY_KP_ADD]: 107,
  [GLFWKey.KEY_KP_DECIMAL]: 110,
  [GLFWKey.KEY_KP_DIVIDE]: 111,
  [GLFWKey.KEY_KP_ENTER]: 13,
  [GLFWKey.KEY_KP_EQUAL]: 187,
  [GLFWKey.KEY_KP_MULTIPLY]: 106,
  [GLFWKey.KEY_KP_SUBTRACT]: 109,
  [GLFWKey.KEY_LEFT]: 37,
  [GLFWKey.KEY_LEFT_ALT]: 18,
  [GLFWKey.KEY_LEFT_BRACKET]: 219,
  [GLFWKey.KEY_LEFT_CONTROL]: 17,
  [GLFWKey.KEY_LEFT_SHIFT]: 16,
  [GLFWKey.KEY_LEFT_SUPER]: 91,
  [GLFWKey.KEY_MENU]: 18,
  [GLFWKey.KEY_MINUS]: 189,
  [GLFWKey.KEY_NUM_LOCK]: 144,
  [GLFWKey.KEY_PAGE_DOWN]: 34,
  [GLFWKey.KEY_PAGE_UP]: 33,
  [GLFWKey.KEY_PAUSE]: 19,
  [GLFWKey.KEY_PERIOD]: 190,
  [GLFWKey.KEY_PRINT_SCREEN]: 144,
  [GLFWKey.KEY_RIGHT]: 39,
  [GLFWKey.KEY_RIGHT_ALT]: 18,
  [GLFWKey.KEY_RIGHT_BRACKET]: 221,
  [GLFWKey.KEY_RIGHT_CONTROL]: 17,
  [GLFWKey.KEY_RIGHT_SHIFT]: 16,
  [GLFWKey.KEY_RIGHT_SUPER]: 93,
  [GLFWKey.KEY_SCROLL_LOCK]: 145,
  [GLFWKey.KEY_SEMICOLON]: 186,
  [GLFWKey.KEY_SLASH]: 191,
  [GLFWKey.KEY_SPACE]: 32,
  [GLFWKey.KEY_TAB]: 9,
  [GLFWKey.KEY_UP]: 38,
};

const keyToCode: any = {
  100: 'Numpad4',
  101: 'Numpad5',
  102: 'Numpad6',
  103: 'Numpad7',
  104: 'Numpad8',
  105: 'Numpad9',
  106: 'NumpadMultiply',
  107: 'NumpadAdd',
  109: 'NumpadSubtract',
  110: 'NumpadDecimal',
  111: 'NumpadDivide',
  112: 'F1',
  113: 'F2',
  114: 'F3',
  115: 'F4',
  116: 'F5',
  117: 'F6',
  118: 'F7',
  119: 'F8',
  120: 'F9',
  121: 'F10',
  122: 'F11',
  123: 'F12',
  13: 'Enter',
  144: 'NumLock',
  145: 'ScrollLock',
  16: 'Shift',
  17: 'Control',
  18: 'Alt',
  186: 'Semicolon',
  187: 'Equal',
  188: 'Comma',
  189: 'Minus',
  19: 'Pause',
  190: 'Period',
  191: 'Slash',
  192: 'Tilda',
  20: 'CapsLock',
  219: 'LeftBracket',
  220: 'Backslash',
  221: 'RightBracket',
  222: 'Apostrophe',
  27: 'Escape',
  32: 'Space',
  33: 'PageUp',
  34: 'PageDown',
  35: 'End',
  36: 'Home',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  45: 'Insert',
  46: 'Delete',
  8: 'Backspace',
  9: 'Tab',
  91: 'LeftSuper',
  93: 'RightSuper',
  96: 'Numpad0',
  97: 'Numpad1',
  98: 'Numpad2',
  99: 'Numpad3',
};
