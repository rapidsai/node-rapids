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

'use strict'

const {dir}                                   = require('console');
const {test}                                  = require('tap');
const {build}                                 = require('../helper');
const {tableFromIPC, RecordBatchStreamWriter} = require('apache-arrow');
const {json_large, json_good, json_out_of_order, json_bad_map, csv_base, csv_particles} =
  require('../fixtures.js');
const gpu_cache = require('../../util/gpu_cache');

test('get_shader_column/:table wrong table', async (t) => {
  const app = await build(t);
  const res = await app.inject({method: 'GET', url: '/particles/get_shader_column/no_table'});
  t.equal(res.statusCode, 404);
  const expected = {params: {table: 'no_table'}, success: false, message: 'Table not found'};
  console.log(res.payload);
  const got = JSON.parse(res.payload);
  t.same(got, expected);
});

test('get_shader_column/:table', async (t) => {
  const dir   = t.testdir(csv_particles);
  const rpath = 'test/routes/' + dir.substring(dir.lastIndexOf('/'));
  const app   = await build(t);
  gpu_cache._setPathForTesting(rpath);
  const load = await app.inject(
    {method: 'POST', url: '/gpu/DataFrame/readCSV', body: {filename: 'csv_particles.csv'}});
  const res =
    await app.inject({method: 'GET', url: '/particles/get_shader_column/csv_particles.csv'});
  const expected = [-105, 40, -106, 41, -107, 42, -108, 43, -109, 44, -110, 45];
  const got      = tableFromIPC(res.rawPayload).getChild('gpu_buffer').toArray();
  const release  = await app.inject({method: 'POST', url: '/gpu/release'});
  t.same(got, expected);
});

test('get_shader_column/:table/:xmin/:xmax/:ymin/:ymax', async (t) => {
  const dir   = t.testdir(csv_particles);
  const rpath = 'test/routes/' + dir.substring(dir.lastIndexOf('/'));
  const app   = await build(t);
  gpu_cache._setPathForTesting(rpath);
  const load = await app.inject(
    {method: 'POST', url: '/gpu/DataFrame/readCSV', body: {filename: 'csv_particles.csv'}});
  const res = await app.inject(
    {method: 'GET', url: '/particles/get_shader_column/csv_particles.csv/-109/-106/41/44'});
  const expected = [-107, 42, -108, 43];
  const got      = tableFromIPC(res.rawPayload).getChild('gpu_buffer').toArray();
  const release  = await app.inject({method: 'POST', url: '/gpu/release'});
  t.same(got, expected);
});
