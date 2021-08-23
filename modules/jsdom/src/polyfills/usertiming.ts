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
import {performance} from 'perf_hooks';

export function installUserTiming(window: jsdom.DOMWindow) {
  // Use node's perf_hooks for native performance.now
  (<any>window).performance = Object.create(performance);
  // Polyfill the rest of the UserTiming API
  (<any>global).window      = window;
  (<any>window).performance = require('usertiming');
  delete (<any>global).window;
  return window;
}
