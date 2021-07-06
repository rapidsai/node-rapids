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

import {DataFrame, TypeMap} from '@rapidsai/cudf';
import {ArrayList} from './algebra';
import {Context, default_config} from './context';

export class BlazingContext {
  private context: Context;
  private db: any;

  constructor() {
    this.db      = ArrayList;
    this.context = new Context({
      ralId: 0,
      workerId: 'self',
      network_iface_name: 'lo',
      ralCommunicationPort: 0,
      workersUcpInfo: [],  // TODO: Fix.
      singleNode: true,
      configOptions: default_config,
      allocationMode: 'cuda_memory_resource',
      initialPoolSize: 0,
      maximumPoolSize: null,
      enableLogging: false,
    });
    console.log(this.context);
    console.log(this.db);
  }

  createTable<T extends TypeMap>(tableName: string, input: DataFrame<T>): DataFrame {
    tableName = 'test';
    if (tableName == 'test') { return input; }
    return input;
  }

  sql(query: string) { return query; }
}
