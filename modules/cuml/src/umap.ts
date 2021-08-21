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

import {
  Bool8,
  DataFrame,
  Float32,
  Int16,
  Int32,
  Int64,
  Int8,
  Integral,
  Series,
  Uint16,
  Uint32,
  Uint64,
  Uint8
} from '@rapidsai/cudf';
import {DeviceBuffer} from '@rapidsai/rmm';
import {compareTypes} from 'apache-arrow/visitor/typecomparator';

import {COO, COOInterface} from './coo';
import {CUMLLogLevels, MetricType} from './mappings';
import {UMAPBase, UMAPInterface, UMAPParams} from './umap_base';
import {dataframeToSeries, seriesToDataframe} from './utilities/array_utils';

export type Numeric = Integral|Float32;

const allowedTypes = [
  new Int8,
  new Int16,
  new Int32,
  new Uint8,
  new Uint16,
  new Uint32,
  new Float32,
  new Bool8,
  new Int64,
  new Uint64
];

export type outputType = 'dataframe'|'series'|'devicebuffer';

class Embeddings<T extends Numeric> {
  protected _embeddings: DeviceBuffer;
  protected _dType: T;
  protected nFeatures: number;

  constructor(_embeddings: DeviceBuffer, nFeatures: number, dType: T) {
    this._embeddings = _embeddings;
    this.nFeatures   = nFeatures;
    this._dType      = dType;
  }

  public asSeries() { return Series.new({type: this._dType, data: this._embeddings}); }
  public asDataFrame() { return seriesToDataframe(this.asSeries(), this.nFeatures); }
  public asDeviceBuffer() { return this._embeddings; }
}

export class UMAP {
  protected _umap: UMAPInterface;
  protected _embeddings = new DeviceBuffer();

  /**
   * Initialize a UMAP object
   * @param input: UMAPParams
   * @param outputType: 'dataframe'|'series'|'devicebuffer'
   *
   * @example:
   * ```typescript
   * import {UMAP} from 'rapidsai/cuml';
   *
   * const umap = new UMAP({nComponents:2}, 'dataframe');
   * ```
   */
  constructor(input: UMAPParams = {}) { this._umap = new UMAPBase(input); }

  protected _generate_embeddings<D extends Numeric>(nSamples: number, dtype: D) {
    return Series.sequence({type: dtype, size: nSamples * this._umap.nComponents, init: 0, step: 0})
      ._col.data;
  }

  // throw runtime error if type isn't Integral | Float32
  protected _check_type<D extends Numeric>(features: D) {
    if (!allowedTypes.some((type) => compareTypes(features, type))) {
      throw new Error(
        `Expected input to be of type in [Integral, Float32] but got ${features.toString()}`);
    }
  }

  protected _resolveType(convertDType: boolean, value: number|bigint|null|undefined) {
    return (convertDType) ? new Float32 : (typeof value == 'bigint') ? new Int64 : new Float32;
  }

  /**
   * Fit features into an embedded space
   *
   * @param features cuDF Series containing floats or doubles in the format [x1, y1, z1, x2, y2,
   *   z2...] for features x, y & z.
   *
   * @param target cuDF Series containing target values
   * @param convertDType When set to True, the method will automatically convert the inputs to
   *   float32
   *
   * @param nFeatures number of properties in the input features, if features is of the format
   *   [x1,y1,x2,y2...]
   * @returns FittedUMAP object with updated embeddings
   */
  fitSeries<T extends Series<Numeric>, R extends Series<Numeric>>(features: T,
                                                                  target: null|R,
                                                                  nFeatures    = 1,
                                                                  convertDType = true) {
    // runtime type check
    this._check_type(features.type);
    const nSamples = Math.floor(features.length / nFeatures);

    let options = {
      features: features._col.data,
      featuresType: features.type,
      nSamples: nSamples,
      nFeatures: nFeatures,
      convertDType: convertDType,
      embeddings: this._generate_embeddings(nSamples, features.type)
    };
    if (target !== null) {
      options = {...options, ...{ target: target._col.data, targetType: target.type }};
    }
    return new FittedUMAP(this.getUMAPParams(), this._umap.fit(options));
  }

  /**
   * Fit features into an embedded space
   * @param features Dense or sparse matrix containing floats or doubles. Acceptable dense formats:
   *   cuDF DataFrame
   *
   * @param target cuDF Series containing target values
   * @param convertDType When set to True, the method will automatically convert the inputs to
   *   float32
   * @returns FittedUMAP object with updated embeddings
   */
  fitDataFrame<T extends Numeric, K extends string, R extends Series<Numeric>,>(features: DataFrame<{[P in K]: T}>,
                                                    target: null|R,
                                                    convertDType = true) {
    // runtime type check
    this._check_type(features.get(features.names[0]).type);
    return this.fitSeries(
      dataframeToSeries(features) as Series<T>, target, features.numColumns, convertDType);
  }

  /**
   * Fit features into an embedded space
   * @param features array containing floats or doubles in the format [x1, y1, z1, x2, y2, z2...]
   *   for features x, y & z.
   *
   * ```typescript
   * // For a sample dataset of colors, with properties r,g and b:
   * features = [
   *   ...Object.values({ r: xx1, g: xx2, b: xx3 }),
   *   ...Object.values({ r: xx4, g: xx5, b: xx6 }),
   * ] // [xx1, xx2, xx3, xx4, xx5, xx6]
   * ```
   *
   * @param target array containing target values
   *
   * ```typescript
   * // For a sample dataset of colors, with properties r,g and b:
   * target = [color1, color2] // len(target) = nFeatures
   * ```
   * @param convertDType When set to True, the method will automatically convert the inputs to
   *   float32
   * @param nFeatures number of properties in the input features, if features is of the format
   *   [x1, y1, x2, y2...]
   *
   * @returns FittedUMAP object with updated embeddings
   */
  fitArray<T extends Series<Numeric>>(features: (number|bigint|null|undefined)[],
                                      target: (number|bigint|null|undefined)[]|null,
                                      nFeatures    = 1,
                                      convertDType = true) {
    return this.fitSeries(
      Series.new({type: this._resolveType(convertDType, features[0]), data: features}) as T,
      (target == null)
        ? null
        : Series.new({type: this._resolveType(convertDType, target[0]), data: target}),
      nFeatures,
      convertDType);
  }

  setUMAPParams(input: UMAPParams) { this._umap = new UMAPBase(input); }

  getUMAPParams() {
    return {
      nNeighbors: this.nNeighbors,
      nComponents: this.nComponents,
      nEpochs: this.nEpochs,
      learningRate: this.learningRate,
      minDist: this.minDist,
      spread: this.spread,
      setOpMixRatio: this.setOpMixRatio,
      localConnectivity: this.localConnectivity,
      repulsionStrength: this.repulsionStrength,
      negativeSampleRate: this.negativeSampleRate,
      transformQueueSize: this.transformQueueSize,
      verbosity: this.verbosity,
      a: this.a,
      b: this.b,
      initialAlpha: this.initialAlpha,
      init: this.init,
      targetNNeighbors: this.targetNNeighbors,
      targetMetric: this.targetMetric,
      targetWeight: this.targetWeight,
      randomState: this.randomState,
    } as UMAPParams;
  }

  /**
   * @param dtype Numeric cudf DataType
   * @returns Embeddings in low-dimensional space in dtype format, which can be converted to any
   * of the following types: DataFrame, Series, DeviceBuffer.
   *  ```typescript
   *  getEmbeddings(new Float64).asDataFrame(); // returns DataFrame<{number: Series<Numeric>}>
   *  getEmbeddings(new Int32).asSeries(); // returns Series<Numeric>
   *  getEmbeddings(new UInt32).asDeviceBuffer(); //returns rmm.DeviceBuffer
   *  ```
   */
  getEmbeddings<T extends Numeric>(dtype: T) {
    return new Embeddings(this._embeddings, this.nComponents, dtype);
  }

  /**
   *  @returns Embeddings in low-dimensional space in float32 format, which can be converted to any
   * of the following types: DataFrame, Series, DeviceBuffer.
   *  ```typescript
   *  embeddings.asDataFrame(); // returns DataFrame<{number: Series<Numeric>}>
   *  embeddings.asSeries(); // returns Series<Numeric>
   *  embeddings.asDeviceBuffer(); //returns rmm.DeviceBuffer
   *  ```
   */
  get embeddings() { return new Embeddings(this._embeddings, this.nComponents, new Float32); }

  get nNeighbors(): number { return this._umap.nNeighbors; }
  get nComponents(): number { return this._umap.nComponents; }
  get nEpochs(): number { return this._umap.nEpochs; }
  get learningRate(): number { return this._umap.learningRate; }
  get minDist(): number { return this._umap.minDist; }
  get spread(): number { return this._umap.spread; }
  get setOpMixRatio(): number { return this._umap.setOpMixRatio; }
  get localConnectivity(): number { return this._umap.localConnectivity; }
  get repulsionStrength(): number { return this._umap.repulsionStrength; }
  get negativeSampleRate(): number { return this._umap.negativeSampleRate; }
  get transformQueueSize(): number { return this._umap.transformQueueSize; }
  get a(): number { return this._umap.a; }
  get b(): number { return this._umap.b; }
  get initialAlpha(): number { return this._umap.initialAlpha; }
  get init(): number { return this._umap.init; }
  get targetNNeighbors(): number { return this._umap.targetNNeighbors; }
  get targetWeight(): number { return this._umap.targetWeight; }
  get randomState(): number { return this._umap.randomState; }
  get targetMetric(): string { return MetricType[this._umap.targetMetric]; }
  get verbosity(): string { return CUMLLogLevels[this._umap.verbosity]; }
}

export class FittedUMAP extends UMAP {
  /**
   * Initialize a UMAP object
   * @param input: UMAPParams
   * @param outputType: 'dataframe'|'series'|'devicebuffer'
   *
   * @example:
   * ```typescript
   * import {UMAP} from 'rapidsai/cuml';
   *
   * const umap = new UMAP({nComponents:2}, 'dataframe');
   * ```
   */
  _coo: COOInterface;

  constructor(input: UMAPParams, embeddings: DeviceBuffer, coo: COOInterface = new COO()) {
    super(input);
    this._embeddings = embeddings;
    this._coo        = coo;
  }

  /**
   * Transform features into the existing embedded space and return that transformed output.
   *
   * @param convertDType When set to True, the method will automatically convert the inputs to
   *   float32
   * @param nFeatures number of properties in the input features, if features is of the format
   *   [x1,y1,x2,y2...]
   *  @returns Transformed `features` into the existing embedded space and return an `Embeddings`
   * instancewhich can be converted to any of the following types: DataFrame, Series, DeviceBuffer.
   *  ```typescript
   *  transformSeries(...).asDataFrame(); // returns DataFrame<{number: Series<Numeric>}>
   *  transformSeries(...).asSeries(); // returns Series<Numeric>
   *  transformSeries(...).asDeviceBuffer(); //returns rmm.DeviceBuffer
   *  ```
   */
  transformSeries<T extends Series<Numeric>>(features: T, nFeatures = 1, convertDType = true) {
    // runtime type check
    this._check_type(features.type);

    const nSamples = Math.floor(features.length / nFeatures);

    const result = this._umap.transform({
      features: features._col.data,
      featuresType: features.type,
      nSamples: nSamples,
      nFeatures: nFeatures,
      convertDType: convertDType,
      embeddings: this._embeddings,
      transformed: this._generate_embeddings(nSamples, features.type)
    });

    const dtype = (convertDType) ? new Float32 : features.type;
    return new Embeddings(result, this.nComponents, dtype);
  }

  /**
   * Transform features into the existing embedded space and return that transformed output.
   *
   * @param convertDType When set to True, the method will automatically convert the inputs to
   *   float32
   * @param nFeatures number of properties in the input features, if features is of the format
   *   [x1,y1,x2,y2...]
   *  @returns Transformed `features` into the existing embedded space and return an `Embeddings`
   * instance which can be converted to any of the following types: DataFrame, Series, DeviceBuffer
   *  ```typescript
   *  transformDataFrame(...).asDataFrame(); // returns DataFrame<{number: Series<Numeric>}>
   *  transformDataFrame(...).asSeries(); // returns Series<Numeric>
   *  transformDataFrame(...).asDeviceBuffer(); //returns rmm.DeviceBuffer
   *  ```
   */
  transformDataFrame<T extends Numeric, K extends string>(features: DataFrame<{[P in K]: T}>,
                                                          convertDType = true) {
    return this.transformSeries(
      dataframeToSeries(features) as Series<T>, features.numColumns, convertDType);
  }

  /**
   * Transform features into the existing embedded space and return that transformed output.
   *
   * @param convertDType When set to True, the method will automatically convert the inputs to
   *   float32
   * @param nFeatures number of properties in the input features, if features is of the format
   *   [x1,y1,x2,y2...]
   *  @returns Transformed `features` into the existing embedded space and return an `Embeddings`
   * instance which can be converted to any of the following types: DataFrame, Series, DeviceBuffer.
   *  ```typescript
   *  transformArray(...).asDataFrame(); // returns DataFrame<{number: Series<Numeric>}>
   *  transformArray(...).asSeries(); // returns Series<Numeric>
   *  transformArray(...).asDeviceBuffer(); //returns rmm.DeviceBuffer
   *  ```
   */
  transformArray<T extends Series<Numeric>>(features: (number|bigint|null|undefined)[],
                                            nFeatures    = 1,
                                            convertDType = true) {
    return this.transformSeries(
      Series.new({type: this._resolveType(convertDType, features[0]), data: features}) as T,
      nFeatures,
      convertDType);
  }

  /**
   * Refine features into existing embedded space as base
   *
   * @param features cuDF Series containing floats or doubles in the format [x1, y1, z1, x2, y2,
   *   z2...] for features x, y & z.
   *
   * @param target cuDF Series containing target values
   * @param convertDType When set to True, the method will automatically convert the inputs to
   *   float32
   *
   * @param nFeatures number of properties in the input features, if features is of the format
   *   [x1,y1,x2,y2...]
   * @returns FittedUMAP object with updated embeddings
   */
  refineSeries<T extends Series<Numeric>, R extends Series<Numeric>>(features: T,
                                                                     target: null|R,
                                                                     nFeatures    = 1,
                                                                     convertDType = true) {
    // runtime type check
    this._check_type(features.type);
    const nSamples = Math.floor(features.length / nFeatures);
    if (this._coo.getSize() == 0) {
      this._coo = this._umap.graph({
        features: features._col.data,
        featuresType: features.type,
        nSamples: nSamples,
        nFeatures: nFeatures,
        convertDType: convertDType,
      });
    }
    let options = {
      features: features._col.data,
      featuresType: features.type,
      nSamples: nSamples,
      nFeatures: nFeatures,
      convertDType: convertDType,
      embeddings: this._embeddings || this._generate_embeddings(nSamples, features.type),
      coo: this._coo,
    };
    if (target !== null) {
      options = {...options, ...{ target: target._col.data, targetType: target.type }};
    }
    this._embeddings = this._umap.refine(options);
  }

  /**
   * Refine features into existing embedded space as base
   * @param features Dense or sparse matrix containing floats or doubles. Acceptable dense formats:
   *   cuDF DataFrame
   *
   * @param target cuDF Series containing target values
   * @param convertDType When set to True, the method will automatically convert the inputs to
   *   float32
   * @returns FittedUMAP object with updated embeddings
   */
  refineDataFrame<T extends Numeric, K extends string, R extends Series<Numeric>,>(features: DataFrame<{[P in K]: T}>,
target: null|R, convertDType = true) {
    // runtime type check
    this._check_type(features.get(features.names[0]).type);
    return this.refineSeries(
      dataframeToSeries(features) as Series<T>, target, features.numColumns, convertDType);
  }

  /**
   * Refine features into existing embedded space as base
   * @param features array containing floats or doubles in the format [x1, y1, z1, x2, y2, z2...]
   *   for features x, y & z.
   *
   * ```typescript
   * // For a sample dataset of colors, with properties r,g and b:
   * features = [
   *   ...Object.values({ r: xx1, g: xx2, b: xx3 }),
   *   ...Object.values({ r: xx4, g: xx5, b: xx6 }),
   * ] // [xx1, xx2, xx3, xx4, xx5, xx6]
   * ```
   *
   * @param target array containing target values
   *
   * ```typescript
   * // For a sample dataset of colors, with properties r,g and b:
   * target = [color1, color2] // len(target) = nFeatures
   * ```
   * @param convertDType When set to True, the method will automatically convert the inputs to
   *   float32
   * @param nFeatures number of properties in the input features, if features is of the format
   *   [x1, y1, x2, y2...]
   *
   * @returns FittedUMAP object with updated embeddings
   */
  refineArray<T extends Series<Numeric>>(features: (number|bigint|null|undefined)[],
                                         target: (number|bigint|null|undefined)[]|null,
                                         nFeatures    = 1,
                                         convertDType = true) {
    return this.refineSeries(
      Series.new({type: this._resolveType(convertDType, features[0]), data: features}) as T,
      (target == null)
        ? null
        : Series.new({type: this._resolveType(convertDType, target[0]), data: target}),
      nFeatures,
      convertDType);
  }
}
