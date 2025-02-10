#!/usr/bin/env node

// Copyright (c) 2022, NVIDIA CORPORATION.
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

const Path = require('path');

// Change cwd to the example dir so relative file paths are resolved
process.chdir(__dirname);

const fastify = require.resolve('fastify-cli/cli.js');

const {spawnSync} = require('child_process');

const env = {
  NEXT_TELEMETRY_DISABLED: 1,  // disable https://fastifyjs.org/telemetry
  ...process.env,
};

spawnSync(process.execPath,
          [fastify, 'start', '-l', 'info', '--ignore-watch', '-P', '-p', '3010', 'app.js'],
          {env, cwd: __dirname, stdio: 'inherit'});
