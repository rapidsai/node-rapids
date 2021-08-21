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

import {DataType, Numeric} from '@rapidsai/cudf';
import {DeviceBuffer} from '@rapidsai/rmm';

import {CUML} from './addon';
import {COOInterface} from './coo';
import {CUMLLogLevels, MetricType} from './mappings';

/**
 * UMAPParams parameters from https://docs.rapids.ai/api/cuml/stable/api.html#cuml.UMAP
 */
export type UMAPParams = {
  nNeighbors?: number,
  nComponents?: number,
  nEpochs?: number,
  learningRate?: number,
  minDist?: number,
  spread?: number,
  setOpMixRatio?: number,
  localConnectivity?: number,
  repulsionStrength?: number,
  negativeSampleRate?: number,
  transformQueueSize?: number,
  verbosity?: keyof typeof CUMLLogLevels,
  a?: number,
  b?: number,
  initialAlpha?: number,
  init?: number,
  targetNNeighbors?: number,
  targetMetric?: keyof typeof MetricType,
  targetWeight?: number,
  randomState?: number,
};

export type FitProps<T extends Numeric = any, R extends Numeric = any> = {
  features: DeviceBuffer|(T['scalarType']|null|undefined)[],
  featuresType: T,
  nSamples: number,
  nFeatures: number,
  convertDType: boolean,
  embeddings: DeviceBuffer,
  target?: DeviceBuffer|(R['scalarType']|null|undefined)[],
  targetType?: R,
  knnIndices?: DeviceBuffer,
  knnDists?: DeviceBuffer
};

export type RefineProps<T extends Numeric = any, R extends Numeric = any> = {
  features: DeviceBuffer|(T['scalarType']|null|undefined)[],
  featuresType: T,
  nSamples: number,
  nFeatures: number,
  convertDType: boolean,
  embeddings: DeviceBuffer,
  target?: DeviceBuffer|(R['scalarType']|null|undefined)[],
  targetType?: R, coo: COOInterface
};

export type GetGraphProps<T extends Numeric = any, R extends Numeric = any> = {
  features: DeviceBuffer|(T['scalarType']|null|undefined)[],
  featuresType: T,
  nSamples: number,
  nFeatures: number,
  convertDType: boolean,
  target?: DeviceBuffer|(R['scalarType']|null|undefined)[],
  targetType?: R
};

export type transformProps<T extends Numeric = any> = {
  features: DeviceBuffer|(T['scalarType']|null|undefined)[],
  featuresType: DataType,
  nSamples: number,
  nFeatures: number,
  convertDType: boolean,
  embeddings: DeviceBuffer,
  transformed: DeviceBuffer,
  knnIndices?: DeviceBuffer,
  knnDists?: DeviceBuffer,
};

interface UMAPConstructor {
  new(options?: UMAPParams): UMAPInterface;
}

export interface UMAPInterface {
  readonly nNeighbors: number;
  readonly nComponents: number;
  readonly nEpochs: number;
  readonly learningRate: number;
  readonly minDist: number;
  readonly spread: number;
  readonly setOpMixRatio: number;
  readonly localConnectivity: number;
  readonly repulsionStrength: number;
  readonly negativeSampleRate: number;
  readonly transformQueueSize: number;
  readonly verbosity: number;
  readonly a: number;
  readonly b: number;
  readonly initialAlpha: number;
  readonly init: number;
  readonly targetNNeighbors: number;
  readonly targetMetric: number;
  readonly targetWeight: number;
  readonly randomState: number;

  fit<T extends Numeric, R extends Numeric>(options?: FitProps<T, R>): DeviceBuffer;

  transform<T extends Numeric>(options?: transformProps<T>): DeviceBuffer;

  refine<T extends Numeric, R extends Numeric>(options?: RefineProps<T, R>): DeviceBuffer;

  graph<T extends Numeric, R extends Numeric>(options?: GetGraphProps<T, R>): COOInterface;
}
export const UMAPBase: UMAPConstructor = CUML.UMAP;
