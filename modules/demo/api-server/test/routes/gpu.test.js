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
const {json_large, json_good, json_out_of_order, json_bad_map, csv_base} =
  require('../fixtures.js');
const gpu_cache = require('../../util/gpu_cache');

test('read_csv', async (t) => {
  const dir   = t.testdir(csv_base);
  const rpath = 'test/routes/' + dir.substring(dir.lastIndexOf('/'));
  const app   = await build(t);
  gpu_cache._setPathForTesting(rpath);
  const res = await app.inject(
    {method: 'POST', url: '/gpu/DataFrame/readCSV', body: {filename: 'csv_base.csv'}});
  const release = await app.inject({method: 'POST', url: '/graphology/release'});
  t.same(JSON.parse(res.payload), {
    success: true,
    message: 'CSV file in GPU memory.',
    statusCode: 200,
    params: {filename: 'csv_base.csv'}
  });
});

test('list_tables', async (t) => {
  const dir   = t.testdir(csv_base);
  const rpath = 'test/routes/' + dir.substring(dir.lastIndexOf('/'));
  const app   = await build(t);
  gpu_cache._setPathForTesting(rpath);
  const res = await app.inject(
    {method: 'POST', url: '/gpu/DataFrame/readCSV', body: {filename: 'csv_base.csv'}});
  const tables  = await app.inject({method: 'GET', url: '/gpu/list_tables'});
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
  t.same(JSON.parse(tables.payload), ['csv_base.csv']);
});

test('release', async (t) => {
  const dir   = t.testdir(csv_base);
  const rpath = 'test/routes/' + dir.substring(dir.lastIndexOf('/'));
  const app   = await build(t);
  gpu_cache._setPathForTesting(rpath);
  const res = await app.inject(
    {method: 'POST', url: '/gpu/DataFrame/readCSV', body: {filename: 'csv_base.csv'}});
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
  const tables  = await app.inject({method: 'GET', url: '/gpu/list_tables'});
  t.same(JSON.parse(tables.payload), []);
});
