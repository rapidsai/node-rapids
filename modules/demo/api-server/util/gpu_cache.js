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

const {Bool8, Utf8String, Int32, Int64, DataFrame, Series, Float32, Float64} =
  require('@rapidsai/cudf');
const Path = require('path');

let timeout  = -1;
let datasets = {};

function clearCachedGPUData() {
  for (const key in datasets) {
    const dataset = datasets[key];
    datasets[key] = null;
  }
};

function json_key_attributes_to_dataframe(str) {
  let arr       = {};
  const columns = ['cluster', 'x', 'y', 'size', 'label', 'color'];
  const dtypes  = [new Int32, new Float32, new Float32, new Int32, new Utf8String, new Utf8String];
  const no_open_list = str.split('[\n').gather([1], false);
  const tokenized    = no_open_list.split('},');
  const keys         = tokenized.getJSONObject('.key');
  arr['key']         = keys.cast(new Int32);
  columns.forEach((col, ix) => {
    const parse_result = tokenized.getJSONObject('.attributes.' + columns[ix]);
    arr[col]           = parse_result.cast(dtypes[ix]);
  });
  const result = new DataFrame(arr);
  return result;
};

function json_aos_to_dataframe(str, columns, dtypes) {
  let arr = {};
  columns.forEach((col, ix) => {
    const no_open_list = str.split('[\n').gather([1], false);
    const tokenized    = no_open_list.split('},');
    const parse_result = tokenized.getJSONObject('.' + columns[ix]);
    arr[col]           = parse_result.cast(dtypes[ix]);
  });
  const result = new DataFrame(arr);
  return result;
};

function json_aoa_to_dataframe(str, dtypes) {
  let arr            = {};
  const no_open_list = str.split('[\n').gather([1], false);
  const tokenized    = no_open_list.split('],');
  dtypes.forEach((_, ix) => {
    const get_ix       = `[${ix}]`;
    const parse_result = tokenized.getJSONObject(get_ix);
    arr[ix]            = parse_result.cast(dtypes[ix]);
  });
  const result = new DataFrame(arr);
  return result;
};

let _publicPath = Path.join(__dirname, '../public');

const cacheObject = async (name, data) => {
  if (timeout) { clearTimeout(timeout); }
  timeout = setTimeout(clearCachedGPUData, 10 * 60 * 1000);
  if (datasets === null) {
    datasets = {};
  }
  datasets[name] = data;
};

module.exports = {
  async readLargeGraphDemo(path) {
    console.log('readLargeGraphDemo');
    const dataset = Series.readText(path, '');
    let split     = dataset.split('"options":');
    if (split.length <= 1) { throw 'Bad readLargeGraphDemo format: options not found.'; }
    const toptions = split.gather([1], false);
    let rest       = split.gather([0], false);
    split          = rest.split('"edges":');
    if (split.length <= 1) { throw 'Bad readLargeGraphDemo format: edges not found.'; };
    const tedges = split.gather([1], false);
    rest         = split.gather([0], false);
    split        = rest.split('"nodes":');
    if (split.length <= 1) { throw 'Bad readLargeGraphDemo format: nodes not found.'; };
    const tnodes = split.gather([1], false);
    const nodes  = json_key_attributes_to_dataframe(tnodes);
    const edges  = json_aos_to_dataframe(
      tedges, ['key', 'source', 'target'], [new Utf8String, new Int64, new Int64]);
    let optionsArr               = {};
    optionsArr['type']           = Series.new(toptions.getJSONObject('.type'));
    optionsArr['multi']          = Series.new(toptions.getJSONObject('.multi'));
    optionsArr['allowSelfLoops'] = Series.new(toptions.getJSONObject('.allowSelfLoops'));
    const options                = new DataFrame(optionsArr);
    return {nodes: nodes, edges: edges, options: options};
  },

  async readGraphology(path) {
    console.log('readGraphology');
    const dataset = Series.readText(path, '');
    if (dataset.length == 0) { throw 'File does not exist or is empty.' }
    let split = dataset.split('"tags":');
    if (split.length <= 1) { throw 'Bad graphology format: tags not found.'; }
    const ttags = split.gather([1], false);
    let rest    = split.gather([0], false);
    split       = rest.split('"clusters":');
    if (split.length <= 1) { throw 'Bad graphology format: clusters not found.'; }
    const tclusters = split.gather([1], false);
    rest            = split.gather([0], false);
    split           = rest.split('"edges":');
    if (split.length <= 1) { throw 'Bad graphology format: edges not found.'; }
    const tedges = split.gather([1], false);
    rest         = split.gather([0], false);
    split        = rest.split('"nodes":');
    if (split.length <= 1) { throw 'Bad graphology format: nodes not found.'; }
    const tnodes = split.gather([1], false);
    const tags   = json_aos_to_dataframe(ttags, ['key', 'image'], [new Utf8String, new Utf8String]);
    const clusters = json_aos_to_dataframe(
      tclusters, ['key', 'color', 'clusterLabel'], [new Int64, new Utf8String, new Utf8String]);
    const nodes =
      json_aos_to_dataframe(tnodes, ['key', 'label', 'tag', 'URL', 'cluster', 'x', 'y', 'score'], [
        new Utf8String,
        new Utf8String,
        new Utf8String,
        new Utf8String,
        new Int32,
        new Float64,
        new Float64,
        new Int32
      ]);
    const edges = json_aoa_to_dataframe(tedges, [new Utf8String, new Utf8String]);
    return {nodes: nodes, edges: edges, tags: tags, clusters: clusters};
  },

  async cacheObject(name, data) { cacheObject(name, data); },

  async getData(name) { return datasets != null ? datasets[name] : undefined; },
  getDataSync(name) { return datasets != null ? datasets[name] : undefined; },

  async listDataframes() { return datasets != null ? Object.keys(datasets) : []; },

  async clearDataframes() {
    clearCachedGPUData();
    clearTimeout(timeout);
    datasets = null;
  },

  _setPathForTesting(path) { _publicPath = path; },
  publicPath() { return _publicPath; },

  async readCSV(options) {
    const result = await DataFrame.readCSV(options);
    return result;
  }
}
