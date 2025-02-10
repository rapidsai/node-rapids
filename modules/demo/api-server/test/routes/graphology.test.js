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

test('graphology root returns api description', async t => {
  const app = await build(t);
  const res = await app.inject({url: '/graphology'})
  t.same(JSON.parse(res.payload), {
    description: 'The graphology api provides GPU acceleration of graphology datasets.',
    schema: {
      read_json: {
        filename: 'A URI to a graphology json dataset file.',
        result: `Causes the node-rapids backend to attempt to load the json object specified
                     by :filename. The GPU will attempt to parse the json file asynchronously and will
                     return OK/ Not Found/ or Fail based on the file status.
                     If the load is successful, four tables will be created in the node-rapids backend:
                     nodes, edges, clusters, and tags. The root objects in the json target must match
                     these names and order.`,
        returns: 'Result OK/Not Found/Fail'
      },
      read_large_demo: {
        filename:
          'A URI to a graphology json dataset file matching the sigma.js/examples/large-demos spec.',
        result: `Produces the same result as 'read_json'.
                     If the load is successful, three tables will be created in the node-rapids backend:
                     nodes, edges, and options.`,
        returns: 'Result OK/Not Found/Fail'
      },
      list_tables: {returns: 'Tables that are available presently in GPU memory.'},
      get_table: {
        ':table':
          {table: 'The name of the table that has been allocated previously into GPU memory.'}
      },
      get_column: {':table': {':column': {table: 'The table name', column: 'The column name'}}},
      nodes: {
        returns:
          'Returns the existing nodes table after applying normalization functions for sigma.js'
      },
      nodes: {bounds: {returns: 'Returns the x and y bounds to be used in rendering.'}},
      edges: {return: 'Returns the existing edges table after applying normalization for sigma.js'}
    }
  })
});

test('read_json no filename', async t => {
  const app = await build(t);
  const res = await app.inject({method: 'POST', url: '/graphology/read_json'});
  t.same(
    JSON.parse(res.payload),
    {success: false, message: 'Parameter filename is required', params: '{}', statusCode: 400});
});

test('read_json no file', async (t) => {
  const app = await build(t);
  const res =
    await app.inject({method: 'POST', url: '/graphology/read_json?filename=filenotfound.txt'});
  const payload = JSON.parse(res.payload);
  t.ok(payload.message.includes('no such file or directory'));
  t.equal(payload.statusCode, 404);
});

test('read_json incorrect format', async (t) => {
  const dir   = t.testdir({
    'json_bad.txt': ` {
            [
              {
                "key": "customer data management",
                "label": "Customer data management",
                "cluster": "7",
                "x": -278.2200012207031,
                "y": 436.0100402832031,
                "score": 0
              },
              {
                "key": "educational data mining",
                "label": "Educational data mining",
                "cluster": "7",
                "x": -1.9823756217956543,
                "y": 250.4990692138672,
                "score": 0
              },
            ],
            "edges":
              [
                ["office suite", "human interactome"],
                ["educational data mining", "human interactome"],
              ],
            "clusters":
              [
                {"key": "0", "color": "#6c3e81", "clusterLabel": "human interactome"},
                {"key": "1", "color": "#666666", "clusterLabel": "Spreadsheets"},
              ],
            "tags": [
              {"key": "Chart type", "image": "charttype.svg"},
              {"key": "Company", "image": "company.svg"},
            ]
        } `
  });
  const rpath = '../../test/routes/' + dir.substring(dir.lastIndexOf('/')) + '/json_bad.txt';
  const app   = await build(t);
  const res   = await app.inject({method: 'POST', url: '/graphology/read_json?filename=' + rpath});
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
  const payload = JSON.parse(res.payload);
  t.equal(payload.message, 'Bad graphology format: nodes not found.');
  t.equal(payload.success, false);
});

test('read_json file good', async (t) => {
  const dir   = t.testdir(json_good);
  const rpath = '../../test/routes/' + dir.substring(dir.lastIndexOf('/')) + '/json_good.txt';
  /* This comment is left for working out mocking with tap in fastify
       see: https://github.com/tapjs/node-tap/issues/846
  const build = t.mock('../../routes/graphology/index.js',
                       {'../../util/gpu_cache.js': {publicPath: () => rpath}});
  */
  const app = await build(t);
  const res = await app.inject({method: 'POST', url: '/graphology/read_json?filename=' + rpath});
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
  const payload = JSON.parse(res.payload);
  t.equal(payload.message, 'File read onto GPU.');
  t.equal(payload.success, true);
});

test('list_tables', async (t) => {
  const dir   = t.testdir(json_good);
  const rpath = '../../test/routes/' + dir.substring(dir.lastIndexOf('/')) + '/json_good.txt';
  const app   = await build(t);
  const load  = await app.inject({method: 'POST', url: '/graphology/read_json?filename=' + rpath});
  const res   = await app.inject({method: 'GET', url: '/gpu/list_tables'});
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
  const payload = JSON.parse(res.payload);
  t.ok(payload.includes('nodes'));
});

test('get_table', async (t) => {
  const dir   = t.testdir(json_good);
  const rpath = '../../test/routes/' + dir.substring(dir.lastIndexOf('/')) + '/json_good.txt';
  const app   = await build(t);
  const load  = await app.inject({method: 'POST', url: '/graphology/read_json?filename=' + rpath});
  const res   = await app.inject({
    method: 'GET',
    url: '/graphology/get_table/nodes',
    header: {'accepts': 'application/octet-stream'}
  });
  t.same(res.statusCode, 200);
  const table   = tableFromIPC(res.rawPayload);
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
  t.same(table.schema.names, ['key', 'label', 'tag', 'URL', 'cluster', 'x', 'y', 'score']);
  t.equal(table.numRows, 2);
  t.equal(table.numCols, 8);
});

test('get_column', async (t) => {
  const dir   = t.testdir(json_good);
  const rpath = '../../test/routes/' + dir.substring(dir.lastIndexOf('/')) + '/json_good.txt';
  const app   = await build(t);
  const load  = await app.inject({method: 'POST', url: '/graphology/read_json?filename=' + rpath});
  const res   = await app.inject({
    method: 'GET',
    url: '/graphology/get_column/nodes/score',
    header: {'accepts': 'application/octet-stream'}
  });
  t.same(res.statusCode, 200);
  const table   = tableFromIPC(res.rawPayload);
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
  t.same(table.schema.names, ['score']);
  t.equal(table.numRows, 2);
  t.equal(table.numCols, 1);
});

test('nodes', async (t) => {
  const dir   = t.testdir(json_large);
  const rpath = '../../test/routes/' + dir.substring(dir.lastIndexOf('/')) + '/json_large.txt';
  const app   = await build(t);
  const load =
    await app.inject({method: 'POST', url: '/graphology/read_large_demo?filename=' + rpath});
  const res = await app.inject(
    {method: 'GET', url: '/graphology/nodes', headers: {'accepts': 'application/octet-stream'}});
  t.same(res.statusCode, 200);
  const table = await tableFromIPC(res.rawPayload);
  t.ok(table.getChild('nodes'));
  t.same(table.getChild('nodes').toArray(), new Float32Array([
           0.02944733388721943,
           1,
           0,
           -1.4006860109112203e+29,
           0.9705526828765869,
           0,
           2,
           -5.515159729197043e+28
         ]))
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
});

test('nodes/bounds', async (t) => {
  const dir   = t.testdir(json_large);
  const rpath = '../../test/routes/' + dir.substring(dir.lastIndexOf('/')) + '/json_large.txt';
  const app   = await build(t);
  const load =
    await app.inject({method: 'POST', url: '/graphology/read_large_demo?filename=' + rpath});
  const res = await app.inject({method: 'GET', url: '/graphology/nodes/bounds'});
  t.same(JSON.parse(res.payload), {
    'success': true,
    'message': 'Success',
    'bounds': {
      'xmin': -13.364311218261719,
      'xmax': 1.3836898803710938,
      'ymin': -11.536596298217773,
      'ymax': 4.134339332580566,
    }
  });
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
});

test('nodes then nodes/bounds', async (t) => {
  const dir   = t.testdir(json_large);
  const rpath = '../../test/routes/' + dir.substring(dir.lastIndexOf('/')) + '/json_large.txt';
  const app   = await build(t);
  const load =
    await app.inject({method: 'POST', url: '/graphology/read_large_demo?filename=' + rpath});
  const nodes = await app.inject(
    {method: 'GET', url: '/graphology/nodes', headers: {'accepts': 'application/octet-stream'}});
  t.same(nodes.statusCode, 200);
  const table = await tableFromIPC(nodes.rawPayload);
  t.ok(table.getChild('nodes'));
  t.same(table.getChild('nodes').toArray(), new Float32Array([
           0.02944733388721943,
           1,
           0,
           -1.4006860109112203e+29,
           0.9705526828765869,
           0,
           2,
           -5.515159729197043e+28
         ]))
  const bounds = await app.inject({method: 'GET', url: '/graphology/nodes/bounds'});
  t.same(JSON.parse(bounds.payload), {
    'success': true,
    'message': 'Success',
    'bounds': {
      'xmin': -13.364311218261719,
      'xmax': 1.3836898803710938,
      'ymin': -11.536596298217773,
      'ymax': 4.134339332580566,
    }
  });
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
});

test('edges', async (t) => {
  const dir   = t.testdir(json_large);
  const rpath = '../../test/routes/' + dir.substring(dir.lastIndexOf('/')) + '/json_large.txt';
  const app   = await build(t);
  const load =
    await app.inject({method: 'POST', url: '/graphology/read_large_demo?filename=' + rpath});
  const res = await app.inject(
    {method: 'GET', url: '/graphology/edges', header: {'accepts': 'application/octet-stream'}});
  t.equal(res.statusCode, 200);
  const table   = tableFromIPC(res.rawPayload);
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
  t.ok(table.getChild('edges'));
  t.same(table.getChild('edges').toArray(), new Float32Array([
           0.9705526828765869,
           0,
           -1.701910173408654e+38,
           0.02944733388721943,
           1,
           -1.701910173408654e+38,
           0.02944733388721943,
           1,
           -1.701910173408654e+38,
           0.9705526828765869,
           0,
           -1.701910173408654e+38
         ]))
});

test('edges and nodes do not begin with 0', async (t) => {
  const dir = t.testdir(json_out_of_order);
  const rpath =
    '../../test/routes/' + dir.substring(dir.lastIndexOf('/')) + '/json_out_of_order.txt';
  const app = await build(t);
  const load =
    await app.inject({method: 'POST', url: '/graphology/read_large_demo?filename=' + rpath});
  const res = await app.inject(
    {method: 'GET', url: '/graphology/edges', header: {'accepts': 'application/octet-stream'}});
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
  t.equal(res.statusCode, 200);
  const table = tableFromIPC(res.rawPayload);
  t.ok(table.getChild('edges'));
  t.same(table.getChild('edges').toArray(), new Float32Array([
           0.02944733388721943,
           1,
           -1.701910173408654e+38,
           0.9705526828765869,
           0,
           -1.701910173408654e+38,
           0.9705526828765869,
           0,
           -1.701910173408654e+38,
           0.02944733388721943,
           1,
           -1.701910173408654e+38,
         ]))
});

test('edge keys do not match node keys', async (t) => {
  const dir   = t.testdir(json_bad_map);
  const rpath = '../../test/routes/' + dir.substring(dir.lastIndexOf('/')) + '/json_bad_map.txt';
  const app   = await build(t);
  const load =
    await app.inject({method: 'POST', url: '/graphology/read_large_demo?filename=' + rpath});
  const res = await app.inject(
    {method: 'GET', url: '/graphology/edges', header: {'accepts': 'application/octet-stream'}});
  const release = await app.inject({method: 'POST', url: '/gpu/release'});
  t.equal(res.statusCode, 422);
  t.same(JSON.parse(res.payload),
         {success: false, message: 'Edge sources do not match node keys', statusCode: 422});
});
