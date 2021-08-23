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

module.exports = (props = { transparent: false }) => {

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

  return require('@rapidsai/jsdom').RapidsJSDOM.fromReactComponent('./app.js', props, props);
}

if (require.main === module) {
  module.exports().window.addEventListener('close', () => process.exit(0), { once: true });
}
