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

  require('@babel/register')({
    cache: false,
    babelrc: false,
    cwd: __dirname,
    presets: [
      ['@babel/preset-env', { 'targets': { 'node': 'current' } }],
      ['@babel/preset-react', { 'useBuiltIns': true }]
    ]
  });

  // Change cwd to the example dir so relative file paths are resolved
  process.chdir(__dirname);

  const props = {
    transparent: false
  };

  require('@rapidsai/jsdom').RapidsJSDOM.fromReactComponent('./app.js', {}, props);
}

if (require.main === module) {
  module.exports();
}

/*
 * Introduces new error:
 *
 * (node:2608695) V8: /opt/rapids/node/node_modules/@loaders.gl/las/dist/es5/libs/laz-perf.js:2321 Linking failure in asm.js: Unexpected stdlib member
 * (Use `node --trace-warnings ...` to show where the warning was created)
 *
 * still works tho
*/
