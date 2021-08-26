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

import {DataFrame, Table} from '@rapidsai/cudf';
export declare function getTableScanInfo(logicalPlan: string): [string[], string[]];

export declare function runGeneratePhysicalGraph(
  masterIdex: number, workerIds: string[], ctxToken: number, query: string): string;

export type WorkerUcpInfo = {
  workerId: string,
  ip: string,
  port: number,
  ucpContext: UcpContext
}

export type ContextProps = {
  ralId: number; workerId: string; networkIfaceName: string; ralCommunicationPort: number;
  workersUcpInfo: WorkerUcpInfo[];
  singleNode: boolean;
  configOptions: Record<string, unknown>;
  allocationMode: string;
  initialPoolSize: number | null;
  maximumPoolSize: number | null;
  enableLogging: boolean;
};

export declare class Context {
  constructor(props: ContextProps);

  runGenerateGraph(masterIndex: number,
                   workerIds: string[],
                   dataframes: DataFrame[],
                   tableNames: string[],
                   tableScans: string[],
                   ctxToken: number,
                   query: string,
                   configOptions: Record<string, unknown>,
                   sql: string,
                   currentTimestamp: string): ExecutionGraphWrapper;
  sendToCache(ralId: number, ctxToken: number, messageId: string, df: DataFrame): void;
  pullFromCache(messageId: string): {names: string[], table: Table};
}

export declare class ExecutionGraphWrapper {
  constructor();

  start(): void;
  result(): {names: string[], tables: Table[]};
  sendTo(ralId: number, messageId: string): ExecutionGraphWrapper;
}

export declare class UcpContext {
  constructor();
}
