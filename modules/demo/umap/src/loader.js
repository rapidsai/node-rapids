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

import { clampRange as clamp } from '@nvidia/cuda';
import { DataFrame, Float32, Series, Uint32, Uint64, Uint8, Utf8String } from '@rapidsai/cudf';
import * as Arrow from 'apache-arrow';
import { concat as concatAsync, zip as zipAsync } from 'ix/asynciterable';
import { flatMap as flatMapAsync } from 'ix/asynciterable/operators';
const { UMAP } = require('@rapidsai/cuml');

const defaultLayoutParams = {
  simulating: { name: 'simulating', val: true },
  autoCenter: { name: 'auto-center', val: false },
  nEpochs: {
    name: 'start iterative training',
    val: false,
  },
  controlsVisible: { name: 'controls visible', val: true },
};
const df = DataFrame.readCSV({ header: 0, sourceType: 'files', sources: ['/opt/rapids/node/modules/demo/umap/data/data.csv'] }).castAll(new Float32);

const layoutParamNames = Object.keys(defaultLayoutParams);


export default async function* loadGraphData(props = {}) {
  const layoutParams = { ...defaultLayoutParams };
  if (props.layoutParams) {
    layoutParamNames.forEach((name) => {
      if (props.layoutParams.hasOwnProperty(name)) {
        const { val, min, max } = layoutParams[name];
        switch (typeof val) {
          case 'boolean': layoutParams[name].val = !!props.layoutParams[name]; break;
          case 'number':
            layoutParams[name].val = Math.max(min, Math.min(max, props.layoutParams[name]));
            break;
        }
      }
    });
  }

  let selectedParameter = 0;

  window.addEventListener('keydown', (e) => {
    if ('1234567890'.includes(e.key)) {
      selectedParameter = +e.key;
    } else if (e.code === 'ArrowUp') {
      selectedParameter =
        clamp(layoutParamNames.length, selectedParameter - 1)[0] % layoutParamNames.length;
    } else if (e.code === 'ArrowDown') {
      selectedParameter =
        clamp(layoutParamNames.length, selectedParameter + 1)[0] % layoutParamNames.length;
    } else if (['PageUp', 'PageDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) !== -1) {
      const key = layoutParamNames[selectedParameter];
      const { val, min, max, step } = layoutParams[key];
      if (typeof val === 'boolean') {
        layoutParams[key].val = !val;
      } else if (e.code === 'PageUp') {
        layoutParams[key].val = Math.min(max, parseFloat(Number(val + step * 10).toPrecision(3)));
      } else if (e.code === 'PageDown') {
        layoutParams[key].val = Math.max(min, parseFloat(Number(val - step * 10).toPrecision(3)));
      } else if (e.code === 'ArrowLeft') {
        layoutParams[key].val = Math.max(min, parseFloat(Number(val - step).toPrecision(3)));
      } else if (e.code === 'ArrowRight') {
        layoutParams[key].val = Math.min(max, parseFloat(Number(val + step).toPrecision(3)));
      }
    }
  });

  async function* getDataFrames(source, getDefault, dataTypes) {
    if (!source) {
      if (typeof getDefault === 'function') { yield getDefault(); }
      return;
    }
    if (source instanceof DataFrame) { return yield source; }
    if (typeof source === 'string' && dataTypes) {
      return yield DataFrame.readCSV(
        { header: 0, sourceType: 'files', sources: [source], dataTypes });
    }
    if (typeof source[Symbol.iterator] === 'function' ||
      typeof source[Symbol.asyncIterator] === 'function') {
      let count = 0;
      for await (const x of flatMapAsync((x) => getDataFrames(x, undefined, dataTypes))(source)) {
        count++;
        yield x;
      }
      if (count == 0) { yield* getDataFrames(null, getDefault, dataTypes); }
    }
  }

  let nodeDFs = getDataFrames(props.nodes, getDefaultNodes, {
    name: 'str',
    id: 'uint32',
    color: 'uint32',
    size: 'uint8',
    data: 'str',
  });

  let edgeDFs = getDataFrames(props.edges, getDefaultEdges, {
    name: 'str',
    src: 'uint32',
    dst: 'uint32',
    edge: 'uint64',
    color: 'uint64',
    bundle: 'uint64',
    data: 'str',
  });

  function getDefaultEdges() {
    return null;
  }

  /**
   * @type DataFrame<{name: Utf8String, id: Uint32, color: Uint32, size: Uint8, x: Float32, y: Float32}>
   */
  let nodes = null;
  let embeddings = null;
  let graphDesc = {};
  let bbox = [0, 0, 0, 0];
  let onAfterRender = () => { };
  let rendered = new Promise(() => { });

  console.log(nodeDFs);
  let dataframes = concatAsync(zipAsync(nodeDFs, edgeDFs), (async function* () {
    datasourceCompleted = true;
    nextFrames = new Promise(() => { });
  })())[Symbol.asyncIterator]();

  let nextFrames = dataframes.next();
  let datasourceCompleted = false;
  let graphUpdated = false;
  let training_finished = true;
  while (true) {
    graphUpdated = false;
    // Wait for a new set of source dataframes or for the
    // most recent frame to finish rendering before advancing
    const newDFs = await (datasourceCompleted
      ? rendered
      : Promise.race([rendered, nextFrames.then(({ value } = {}) => value)]));

    if (newDFs) {
      console.log(newDFs);
      if (newDFs[0] !== nodes) {
        graphUpdated = true;
        [nodes, embeddings] = generateUMAP(newDFs[0], embeddings, layoutParams.nEpochs.val);
        nextFrames = dataframes.next();
      }
    }

    if (layoutParams.nEpochs.val) {
      training_finished = false;
    } else {
      training_finished = true;
    }

    if (!training_finished) {
      [nodes, embeddings] = generateUMAP(nodes, embeddings);
    } else {
      training_finished = true;
    }

    if (!layoutParams.simulating.val && !graphUpdated) {
      // If user paused rendering, wait a bit and continue
      rendered = new Promise((r) => (onAfterRender = () => setTimeout(r, 0)));
    } else {
      // Compute the positions minimum bounding box [xMin, xMax, yMin, yMax]
      bbox = [...nodes.get('x').minmax(), ...nodes.get('y').minmax()];

      graphDesc = createGraphRenderProps(nodes);
      ({ promise: rendered, resolve: onAfterRender } = promiseSubject());
    }

    // Yield the results to the caller for rendering
    yield {
      graph: graphDesc,
      params: layoutParams,
      selectedParameter: layoutParams.controlsVisible.val ? selectedParameter : undefined,
      bbox,
      autoCenter: layoutParams.autoCenter.val,
      onAfterRender
    };

    // Wait for the frame to finish rendering before advancing
    rendered = rendered.catch(() => { }).then(() => { });
  }
}


function promiseSubject() {
  let resolve, reject;
  let promise = new Promise((r1, r2) => {
    resolve = r1;
    reject = r2;
  });
  return { promise, resolve, reject };
}

/**
 *
 * @param {DataFrame<{
 *  name: Utf8String, id: Uint32, color: Uint32, size: Uint8, x: Float32,  y: Float32,
 * }>} nodes
 * @param {DataFrame<{
 *  name: Utf8String, src: Uint32, dst: Uint32, edge: Uint64,  color: Uint64,  bundle: Uint64,
 * }>} edges
 * @param {*} graph
 */
function createGraphRenderProps(nodes) {
  const numNodes = nodes.numRows;
  const numEdges = 0;
  return {
    numNodes, numEdges, nodeRadiusScale: 1 / 75,
    // nodeRadiusScale: 1/255,
    nodeRadiusMinPixels: 5, nodeRadiusMaxPixels: 150, data: {
      nodes: {
        offset: 0,
        length: numNodes,
        attributes: {
          nodeName: nodes.get('name'),
          nodeRadius: nodes.get('size').data,
          nodeXPositions: nodes.get('x').data,
          nodeYPositions: nodes.get('y').data,
          nodeFillColors: nodes.get('color').data,
          nodeElementIndices: nodes.get('id').data,
          nodeData: nodes.has('data') ? nodes.get('data') : null
        }
      }, edges: {
        offset: 0,
        length: numEdges,
        attributes: { edgeName: null, edgeList: null, edgeColors: null, edgeBundles: null, edgeData: null }
      },
    },
  }
}

function generateUMAP(nodesDF, fittedUMAP = null, nEpochs = 1) {
  if (fittedUMAP == null) {
    const options = { nNeighbors: 5, init: 1, nEpochs: nEpochs, randomState: 42 };
    fittedUMAP = (new UMAP(options)).fitDataFrame(df.drop(['target']), null);
  } else {
    console.log("calling refine");
    fittedUMAP.refineDataFrame(df.drop(['target']), null);
  }
  const lowDimensionEmbeddingDF = fittedUMAP.embeddings.asDataFrame();
  return [
    nodesDF.assign({
      x: lowDimensionEmbeddingDF.get(0),
      y: lowDimensionEmbeddingDF.get(1),
      size: Series.sequence({ type: new Uint8, init: 0.1, step: 0, size: nodesDF.numRows })
    }), fittedUMAP];
}

function getDefaultNodes() {
  console.log("called getDefaultNodes");
  const colorData = ["-12451426", "-11583787", "-12358156", "-10375427", "-7610114", "-4194305", "-6752794", "-5972565", "-5914010", "-4356046"];
  const labelsData = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const nodesDF = new DataFrame({
    id: Series.sequence({ type: new Uint32, init: 0, step: 1, size: df.numRows }),
    name: df.get('target')
  });
  const labelsUnique = [...nodesDF.get('name').unique()];

  let color = Series.sequence({ type: new Uint32, init: 0, step: 1, size: df.numRows });
  let data = Series.new({ type: new Utf8String, data: [...color] });
  labelsUnique.forEach(e => {
    color = color.scatter(colorData[e], nodesDF.filter(nodesDF.get('name').eq(e)).get('id'));
    data = data.scatter(labelsData[e], nodesDF.filter(nodesDF.get('name').eq(e)).get('id'));
  });

  return nodesDF.assign({
    color, data
  });
}
