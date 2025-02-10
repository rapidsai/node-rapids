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

const {Utf8String, Int32, Uint32, Float32, DataFrame, Series, Float64} = require('@rapidsai/cudf');
const {RecordBatchStreamWriter, Field, Vector, List}                   = require('apache-arrow');
const Path                                                             = require('path');
const {promisify}                                                      = require('util');
const Fs                                                               = require('fs');
const Stat                                                             = promisify(Fs.stat);
const fastifyCors                                                      = require('@fastify/cors');
const fastify = require('fastify')({logger: true});

const arrowPlugin = require('fastify-arrow');
const gpu_cache   = require('../../util/gpu_cache.js');
const root_schema = require('../../util/schema.js');

module.exports = async function(fastify, opts) {
  fastify.register(arrowPlugin);
  fastify.register(fastifyCors, {origin: '*'});
  fastify.decorate('cacheObject', gpu_cache.cacheObject);
  fastify.decorate('getData', gpu_cache.getData);
  fastify.decorate('readCSV', gpu_cache.readCSV);
  fastify.decorate('publicPath', gpu_cache.publicPath);
  fastify.decorate('listDataframes', gpu_cache.listDataframes);
  fastify.decorate('clearDataFrames', gpu_cache.clearDataframes);

  const get_schema = {
    logLevel: 'debug',
    schema: {
      response: {
        200: {
          type: 'object',
          properties:
            {success: {type: 'boolean'}, message: {type: 'string'}, params: {type: 'string'}}
        }
      }
    }
  };

  fastify.get('/', {...get_schema, handler: () => root_schema['gpu']});

  fastify.route({
    method: 'POST',
    url: '/DataFrame/readCSV',
    schema: {},
    handler: async (request, reply) => {
      let message = 'Error';
      let result  = {'params': request.body, success: false, message: message};
      try {
        const path             = Path.join(fastify.publicPath(), request.body.filename);
        const stats            = await Stat(path);
        const message          = 'File is available';
        const currentDataFrame = await fastify.getData(request.body.filename);
        if (currentDataFrame !== undefined) {
          console.log('Found existing dataframe.');
          console.log(request.body);
          console.log(currentDataFrame);
          currentDataFrame.dispose();
        }
        const cacheObject = await fastify.readCSV({
          header: 0,
          sourceType: 'files',
          sources: [path],
        });
        const name        = request.body.filename;
        await fastify.cacheObject(name, cacheObject);
        result.success    = true;
        result.message    = 'CSV file in GPU memory.';
        result.statusCode = 200;
        await reply.code(200).send(result);
      } catch (e) {
        result.message = e.message;
        if (e.message.search('no such file or directory') !== -1) {
          await reply.code(404).send(result);
        } else {
          await reply.code(500).send(result);
        }
      }
    }
  });

  fastify.route({
    method: 'GET',
    url: '/get_column/:table/:column',
    schema: {querystring: {table: {type: 'string'}, 'column': {type: 'string'}}},
    handler: async (request, reply) => {
      let message = 'Error';
      let result  = {'params': JSON.stringify(request.params), success: false, message: message};
      const table = await fastify.getData(request.params.table);
      if (table == undefined) {
        result.message = 'Table not found';
        await reply.code(404).send(result);
      } else {
        try {
          const name        = request.params.column;
          const column      = table.get(name);
          const newDfObject = {};
          newDfObject[name] = column;
          const result      = new DataFrame(newDfObject);
          const writer      = RecordBatchStreamWriter.writeAll(result.toArrow());
          await reply.code(200).send(writer.toNodeStream());
        } catch (e) {
          if (e.message.search('Unknown column name') != -1) {
            result.message = e;
            await reply.code(404).send(result);
          } else {
            await reply.code(500).send(result);
          }
        }
      }
    }
  });

  fastify.route({
    method: 'GET',
    url: '/list_tables',
    handler: async (request, reply) => {
      /**
       * /graphology/list_tables returns a list of DataFrames stored in
       * the GPU cache.
       */
      let message = 'Error';
      let result  = {success: false, message: message};
      const list  = await fastify.listDataframes();
      return list;
    }
  });

  fastify.route({
    method: 'POST',
    url: '/release',
    handler: async (request, reply) => {
      /**
       * /graphology/release clears the dataframes from memory.
       * This is useful for testing, but should not be used in production.
       * In production, the dataframes should be cached in memory and reused.
       * This solution allows unit tests to pass without timing out, as the
       * cached GPU objects are not cleared between tests.
       */
      await fastify.clearDataFrames();
      await reply.code(200).send({message: 'OK'})
    }
  });
}
