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

import {mkdtempSync, unlinkSync, writeFileSync} from 'fs';
import * as jsdom from 'jsdom';
import * as os from 'os';
import * as Path from 'path';

export function createObjectUrlAndTmpDir() {
  const tmpdir = mkdtempSync(os.tmpdir() + Path.sep);
  const url    = `http://${Path.basename(tmpdir)}/`.toLowerCase();

  return {url, tmpdir, install: installObjectURL};

  function installObjectURL(window: jsdom.DOMWindow) {
    let filesCount = 0;
    const map: any = {};

    if (!window.jsdom.global.URL) {  //
      Object.defineProperty(window.jsdom.global, 'URL', {});
    }

    window.jsdom.global.URL.createObjectURL = createObjectURL;
    window.jsdom.global.URL.revokeObjectURL = revokeObjectURL;

    return window;

    function createObjectURL(blob: Blob) {
      const path = Path.join(tmpdir, `${filesCount++}`);
      writeFileSync(path, window.jsdom.utils.implForWrapper(blob)._buffer);
      const url = `file://${path}`;
      map[url]  = path;
      return url;
    }

    function revokeObjectURL(url: any) {
      if (url in map) {
        const p = map[url];
        delete map[url];
        unlinkSync(p);
      }
    }
  }
}
