#!/usr/bin/env -S node -r esm

// Copyright (c) 2020, NVIDIA CORPORATION.
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

module.exports = function () {
  require('segfault-handler').registerHandler('./crash.log');

  const { RapidsJSDOM } = require('@rapidsai/jsdom');
  const { window } = new RapidsJSDOM();
  window.evalFn(createXTermJS);

}

function createXTermJS(props = {}) {

  const { Terminal } = require('xterm');
  const { WebglAddon } = require('xterm-addon-webgl');

  // Create xterm.js terminal
  const terminal = new Terminal();
  terminal.open(document.body);
  // Hack to override font size measurement
  hackFontMeasurement(terminal);
  // load xterm.js WebGL renderer
  terminal.loadAddon(new WebglAddon());
  // handle keyboard input
  terminal.onKey(handleKeyInput);
  // print initial startup message
  printStartupMessage(terminal);

  function hackFontMeasurement(terminal) {
    Object.defineProperty(
      terminal._core._charSizeService._measureStrategy._measureElement,
      'getBoundingClientRect', { value() { return { width: 9, height: 14 } } });
    terminal._core._charSizeService.measure();

    window._inputEventTarget = terminal.textarea;
    window.requestAnimationFrame(function af() { window.requestAnimationFrame(af); });

    return terminal;
  }

  function handleKeyInput(e) {
    const ev = e.domEvent;
    const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;
    if (ev.keyCode === 13) {
      terminal.prompt();
    } else if (ev.keyCode === 8) {
      // Do not delete the prompt
      if (terminal._core.buffer.x > 2) {
        terminal.write('\b \b');
      }
    } else if (printable) {
      terminal.write(e.key);
    }
  }

  function printStartupMessage(terminal) {
    terminal.prompt = () => { terminal.write('\r\n$ '); };
    terminal.writeln('Welcome to xterm.js');
    terminal.writeln('This is a local terminal emulation, without a real terminal in the back-end.');
    terminal.writeln('Type some keys and commands to play around.');
    terminal.writeln('');
    terminal.prompt();
    return terminal;
  }
}

if (require.main === module) {
  module.exports();
}
