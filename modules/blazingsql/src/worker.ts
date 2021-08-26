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

import {UcpContext} from './addon';
import {
  BLAZING_CONTEXT_CREATED,
  CREATE_BLAZING_CONTEXT,
  CREATE_TABLE,
  DROP_TABLE,
  QUERY_RAN,
  RUN_QUERY,
  TABLE_CREATED,
  TABLE_DROPPED
} from './blazingcluster';
import {BlazingContext} from './blazingcontext';

let bc: BlazingContext;
let ucpContext: UcpContext;

process.on('message', (args: any) => {
  const {operation, ...rest} = args;

  switch (operation) {
    case CREATE_BLAZING_CONTEXT: {
      const ralId              = rest['ralId'] as number;
      const ucpMetaData: any[] = rest['ucpMetadata'] as Record<string, any>[];
      const configOptions      = rest['configOptions'] as Record<string, unknown>;
      const port               = rest['port'] as number;
      ucpContext               = new UcpContext();

      bc = new BlazingContext({
        ralId: ralId,
        ralCommunicationPort: port + ralId,
        configOptions: {...configOptions},
        workersUcpInfo: ucpMetaData.map((xs: any) => ({...xs, ucpContext}))
      });

      (<any>process).send({operation: BLAZING_CONTEXT_CREATED});
      break;
    }

    case RUN_QUERY: {
      const query     = rest['query'] as string;
      const ctxToken  = rest['ctxToken'] as number;
      const messageId = rest['messageId'] as string;

      bc.sql(query, ctxToken).sendTo(0, messageId);
      (<any>process).send({operation: QUERY_RAN, ctxToken: ctxToken, messageId: messageId});
      break;
    }

    case CREATE_TABLE: {
      const tableName = rest['tableName'] as string;
      const messageId = rest['messageId'] as string;

      bc.createTable(tableName, bc.pullFromCache(messageId));
      (<any>process).send({operation: TABLE_CREATED});
      break;
    }

    case DROP_TABLE: {
      const tableName = rest['tableName'] as string;

      bc.dropTable(tableName);
      (<any>process).send({operation: TABLE_DROPPED});
      break;
    }
  }
});
