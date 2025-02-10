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
const {csv_quadtree}                          = require('../fixtures.js');
const gpu_cache                               = require('../../util/gpu_cache');

test('quadtree/create/:table', async (t) => {
  const dir   = t.testdir(csv_quadtree);
  const rpath = 'test/routes/' + dir.substring(dir.lastIndexOf('/'));
  const app   = await build(t);
  gpu_cache._setPathForTesting(rpath);
  const load = await app.inject(
    {method: 'POST', url: '/gpu/DataFrame/readCSV', body: {filename: 'csv_quadtree.csv'}});
  const res     = await app.inject({
    method: 'POST',
    url: '/quadtree/create/csv_quadtree.csv',
    body: {xAxisName: 'x', yAxisName: 'y'}
  });
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
  const result  = JSON.parse(res.payload);
  t.same(result, {
    statusCode: 200,
    message: 'Quadtree created',
    params: {table: 'csv_quadtree.csv', quadtree: 'csv_quadtree.csv_quadtree'},
    success: true
  })
});

test('quadtree/set_polygons', async (t) => {
  const dir   = t.testdir(csv_quadtree);
  const rpath = 'test/routes/' + dir.substring(dir.lastIndexOf('/'));
  const app   = await build(t);
  gpu_cache._setPathForTesting(rpath);
  const load = await app.inject(
    {method: 'POST', url: '/gpu/DataFrame/readCSV', body: {filename: 'csv_quadtree.csv'}});
  const res     = await app.inject({
    method: 'POST',
    url: '/quadtree/set_polygons',
    body:
      {name: 'test', polygon_offset: [0, 1], ring_offset: [0, 4], points: [0, 0, 1, 1, 2, 2, 3, 3]}
  });
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
  const result  = JSON.parse(res.payload);
  t.same(result, {
    statusCode: 200,
    message: 'Set polygon test',
    params:
      {name: 'test', polygon_offset: [0, 1], ring_offset: [0, 4], points: [0, 0, 1, 1, 2, 2, 3, 3]},
    success: true
  })
});

test('quadtree/get_points_float', async (t) => {
  const dir   = t.testdir(csv_quadtree);
  const rpath = 'test/routes/' + dir.substring(dir.lastIndexOf('/'));
  const app   = await build(t);
  gpu_cache._setPathForTesting(rpath);
  const load = await app.inject(
    {method: 'POST', url: '/gpu/DataFrame/readCSV', body: {filename: 'csv_quadtree.csv'}});
  const create        = await app.inject({
    method: 'POST',
    url: '/quadtree/create/csv_quadtree.csv',
    body: {xAxisName: 'x', yAxisName: 'y'}
  });
  const quadtree_name = JSON.parse(create.payload).params.quadtree;
  const set_poly      = await app.inject({
    method: 'POST',
    url: '/quadtree/set_polygons',
    body: {
      name: 'test',
      polygon_offset: [0, 1],
      ring_offset: [0, 4],
      points: [-2, -2, -2, 2, 2, 2, 2, -2]
    }
  });
  const polygons_name = JSON.parse(set_poly.payload).params.name;
  const res           = await app.inject({
    method: 'GET',
    url: 'quadtree/get_points/' + quadtree_name + '/' + polygons_name,
  })
  const release       = await app.inject({method: 'POST', url: '/gpu/release'});
  const table         = tableFromIPC(res.rawPayload);
  const got           = table.getChild('points_in_polygon').toArray();
  const expected      = [1.0, -1.0, -1.0, 1.0, 0.0, 0.0];
  t.same(expected, got);
});

test('quadtree/get_points_int', async (t) => {
  const dir   = t.testdir(csv_quadtree);
  const rpath = 'test/routes/' + dir.substring(dir.lastIndexOf('/'));
  const app   = await build(t);
  gpu_cache._setPathForTesting(rpath);
  const load = await app.inject(
    {method: 'POST', url: '/gpu/DataFrame/readCSV', body: {filename: 'csv_quadtree.csv'}});
  const create        = await app.inject({
    method: 'POST',
    url: '/quadtree/create/csv_quadtree.csv',
    body: {xAxisName: 'x', yAxisName: 'y'}
  });
  const quadtree_name = JSON.parse(create.payload).params.quadtree;
  const set_poly      = await app.inject({
    method: 'POST',
    url: '/quadtree/set_polygons',
    body: {
      name: 'test',
      polygon_offset: [0, 1],
      ring_offset: [0, 4],
      points: [-2, -2, -2, 2, 2, 2, 2, -2]
    }
  });
  const polygons_name = JSON.parse(set_poly.payload).params.name;
  const res           = await app.inject({
    method: 'GET',
    url: 'quadtree/get_points/' + quadtree_name + '/' + polygons_name,
  })
  const release       = await app.inject({method: 'POST', url: '/gpu/release'});
  const table         = tableFromIPC(res.rawPayload);
  const got           = table.getChild('points_in_polygon').toArray();
  const expected      = [1, -1, -1, 1, 0, 0];
  t.same(expected, got);
});

test('quadtree/:quadtree/:polygon/count', async (t) => {
  const dir   = t.testdir(csv_quadtree);
  const rpath = 'test/routes/' + dir.substring(dir.lastIndexOf('/'));
  const app   = await build(t);
  gpu_cache._setPathForTesting(rpath);
  const load = await app.inject(
    {method: 'POST', url: '/gpu/DataFrame/readCSV', body: {filename: 'csv_quadtree.csv'}});
  const create        = await app.inject({
    method: 'POST',
    url: '/quadtree/create/csv_quadtree.csv',
    body: {xAxisName: 'x', yAxisName: 'y'}
  });
  const quadtree_name = JSON.parse(create.payload).params.quadtree;
  const set_poly      = await app.inject({
    method: 'POST',
    url: '/quadtree/set_polygons',
    body: {
      name: 'test',
      polygon_offset: [0, 1],
      ring_offset: [0, 4],
      points: [-2, -2, -2, 2, 2, 2, 2, -2]
    }
  });
  const polygons_name = JSON.parse(set_poly.payload).params.name;
  const res           = await app.inject({
    method: 'GET',
    url: 'quadtree/' + quadtree_name + '/' + polygons_name + '/count',
  })
  const release       = await app.inject({method: 'POST', url: '/gpu/release'});
  const result        = JSON.parse(res.payload);
  t.same(result, {
    statusCode: 200,
    message: 'Counted points in polygon',
    params: {quadtree: quadtree_name, polygon: polygons_name},
    count: 3,
    success: true
  })
});

test('quadtree/:quadtree/:polygon/:n', async (t) => {
  const dir   = t.testdir(csv_quadtree);
  const rpath = 'test/routes/' + dir.substring(dir.lastIndexOf('/'));
  const app   = await build(t);
  gpu_cache._setPathForTesting(rpath);
  const load = await app.inject(
    {method: 'POST', url: '/gpu/DataFrame/readCSV', body: {filename: 'csv_quadtree.csv'}});
  const create        = await app.inject({
    method: 'POST',
    url: '/quadtree/create/csv_quadtree.csv',
    body: {xAxisName: 'x', yAxisName: 'y'}
  });
  const quadtree_name = JSON.parse(create.payload).params.quadtree;
  const set_poly      = await app.inject({
    method: 'POST',
    url: '/quadtree/set_polygons',
    body: {
      name: 'test',
      polygon_offset: [0, 1],
      ring_offset: [0, 4],
      points: [-2, -2, -2, 2, 2, 2, 2, -2]
    }
  });
  const polygons_name = JSON.parse(set_poly.payload).params.name;
  const res           = await app.inject({
    method: 'GET',
    url: 'quadtree/get_points/' + quadtree_name + '/' + polygons_name + '/2',
  })
  const release       = await app.inject({method: 'POST', url: '/gpu/release'});
  const table         = tableFromIPC(res.rawPayload);
  const got           = table.getChild('points_in_polygon').toArray();
  const expected      = [1.0, -1.0, -1.0, 1.0];
  t.same(got, expected);
});

test('quadtree/:quadtree/:polygon/:n/next', {only: true}, async (t) => {
  const dir   = t.testdir(csv_quadtree);
  const rpath = 'test/routes/' + dir.substring(dir.lastIndexOf('/'));
  const app   = await build(t);
  gpu_cache._setPathForTesting(rpath);
  const load = await app.inject(
    {method: 'POST', url: '/gpu/DataFrame/readCSV', body: {filename: 'csv_quadtree.csv'}});
  const create        = await app.inject({
    method: 'POST',
    url: '/quadtree/create/csv_quadtree.csv',
    body: {xAxisName: 'x', yAxisName: 'y'}
  });
  const quadtree_name = JSON.parse(create.payload).params.quadtree;
  const set_poly      = await app.inject({
    method: 'POST',
    url: '/quadtree/set_polygons',
    body: {
      name: 'test',
      polygon_offset: [0, 1],
      ring_offset: [0, 4],
      points: [-4, -4, -4, 4, 4, 4, 4, -4]
    }
  });
  const polygons_name = JSON.parse(set_poly.payload).params.name;
  let res             = await app.inject({
    method: 'GET',
    url: 'quadtree/get_points/' + quadtree_name + '/' + polygons_name + '/2/next',
  })
  let table           = tableFromIPC(res.rawPayload);
  let got             = table.getChild('points_in_polygon').toArray();
  let expected        = [3.0, -3.0, 1.0, -1.0];
  t.same(got, expected);
  res      = await app.inject({
    method: 'GET',
    url: 'quadtree/get_points/' + quadtree_name + '/' + polygons_name + '/2/next',
  })
  table    = tableFromIPC(res.rawPayload);
  got      = table.getChild('points_in_polygon').toArray();
  expected = [-1.0, 1.0, 2.0, -2.0];
  t.same(got, expected);
  res      = await app.inject({
    method: 'GET',
    url: 'quadtree/get_points/' + quadtree_name + '/' + polygons_name + '/2/next',
  })
  table    = tableFromIPC(res.rawPayload);
  got      = table.getChild('points_in_polygon').toArray();
  expected = [-3.0, 3.0, -2.0, 2.0];
  t.same(got, expected);
  res      = await app.inject({
    method: 'GET',
    url: 'quadtree/get_points/' + quadtree_name + '/' + polygons_name + '/2/next',
  })
  table    = tableFromIPC(res.rawPayload);
  got      = table.getChild('points_in_polygon').toArray();
  expected = [0.0, 0.0];
  t.same(got, expected);
  res      = await app.inject({
    method: 'GET',
    url: 'quadtree/get_points/' + quadtree_name + '/' + polygons_name + '/2/next',
  })
  table    = tableFromIPC(res.rawPayload);
  got      = table.getChild('points_in_polygon').toArray();
  expected = [];
  t.same(got, expected);
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
});

test('quadtree/:quadtree/:polygon/:n max', {only: true}, async (t) => {
  const dir   = t.testdir(csv_quadtree);
  const rpath = 'test/routes/' + dir.substring(dir.lastIndexOf('/'));
  const app   = await build(t);
  gpu_cache._setPathForTesting(rpath);
  const load = await app.inject(
    {method: 'POST', url: '/gpu/DataFrame/readCSV', body: {filename: 'csv_quadtree.csv'}});
  const create        = await app.inject({
    method: 'POST',
    url: '/quadtree/create/csv_quadtree.csv',
    body: {xAxisName: 'x', yAxisName: 'y'}
  });
  const quadtree_name = JSON.parse(create.payload).params.quadtree;
  const set_poly      = await app.inject({
    method: 'POST',
    url: '/quadtree/set_polygons',
    body: {
      name: 'test',
      polygon_offset: [0, 1],
      ring_offset: [0, 4],
      points: [-4, -4, -4, 4, 4, 4, 4, -4]
    }
  });
  const polygons_name = JSON.parse(set_poly.payload).params.name;
  let res             = await app.inject({
    method: 'GET',
    url: 'quadtree/get_points/' + quadtree_name + '/' + polygons_name + '/20',
  })
  let table           = tableFromIPC(res.rawPayload);
  let got             = table.getChild('points_in_polygon').length;
  let expected        = 14;
  const release       = await app.inject({method: 'POST', url: '/gpu/release'});
  t.same(got, expected);
});

test('quadtree/:quadtree/:polygon/:n/next max', {only: true}, async (t) => {
  const dir   = t.testdir(csv_quadtree);
  const rpath = 'test/routes/' + dir.substring(dir.lastIndexOf('/'));
  const app   = await build(t);
  gpu_cache._setPathForTesting(rpath);
  const load = await app.inject(
    {method: 'POST', url: '/gpu/DataFrame/readCSV', body: {filename: 'csv_quadtree.csv'}});
  const create        = await app.inject({
    method: 'POST',
    url: '/quadtree/create/csv_quadtree.csv',
    body: {xAxisName: 'x', yAxisName: 'y'}
  });
  const quadtree_name = JSON.parse(create.payload).params.quadtree;
  const set_poly      = await app.inject({
    method: 'POST',
    url: '/quadtree/set_polygons',
    body: {
      name: 'test',
      polygon_offset: [0, 1],
      ring_offset: [0, 4],
      points: [-4, -4, -4, 4, 4, 4, 4, -4]
    }
  });
  const polygons_name = JSON.parse(set_poly.payload).params.name;
  let res             = await app.inject({
    method: 'GET',
    url: 'quadtree/get_points/' + quadtree_name + '/' + polygons_name + '/20/next',
  })
  let table           = tableFromIPC(res.rawPayload);
  let got             = table.getChild('points_in_polygon').length;
  let expected        = 14;
  const release       = await app.inject({method: 'POST', url: '/gpu/release'});
  t.same(got, expected);
});

test('quadtree/:quadtree/:polygon/clear', {only: true}, async (t) => {
  const dir   = t.testdir(csv_quadtree);
  const rpath = 'test/routes/' + dir.substring(dir.lastIndexOf('/'));
  const app   = await build(t);
  gpu_cache._setPathForTesting(rpath);
  const load = await app.inject(
    {method: 'POST', url: '/gpu/DataFrame/readCSV', body: {filename: 'csv_quadtree.csv'}});
  const create        = await app.inject({
    method: 'POST',
    url: '/quadtree/create/csv_quadtree.csv',
    body: {xAxisName: 'x', yAxisName: 'y'}
  });
  const quadtree_name = JSON.parse(create.payload).params.quadtree;
  const set_poly      = await app.inject({
    method: 'POST',
    url: '/quadtree/set_polygons',
    body: {
      name: 'test',
      polygon_offset: [0, 1],
      ring_offset: [0, 4],
      points: [-4, -4, -4, 4, 4, 4, 4, -4]
    }
  });
  const polygons_name = JSON.parse(set_poly.payload).params.name;
  let res             = await app.inject({
    method: 'GET',
    url: 'quadtree/get_points/' + quadtree_name + '/' + polygons_name + '/20/next',
  })
  let table           = tableFromIPC(res.rawPayload);
  let got             = table.getChild('points_in_polygon').length;
  let expected        = 14;
  t.same(got, expected);
  res      = await app.inject({
    method: 'GET',
    url: 'quadtree/get_points/' + quadtree_name + '/' + polygons_name + '/clear',
  })
  got      = JSON.parse(res.payload);
  expected = {
    statusCode: 200,
    success: true,
    message: 'Cleared points from cache',
    params: {quadtree: quadtree_name, polygon: polygons_name}
  };
  t.same(got, expected);
  res           = await app.inject({
    method: 'GET',
    url: 'quadtree/get_points/' + quadtree_name + '/' + polygons_name + '/20/next',
  })
  table         = tableFromIPC(res.rawPayload);
  got           = table.getChild('points_in_polygon').length;
  expected      = 14;
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
  t.same(got, expected);
});
