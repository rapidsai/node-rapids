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

const {Int32, Float32, DataFrame, Series} = require('@rapidsai/cudf');
const {RecordBatchStreamWriter}           = require('apache-arrow');
const fastify                             = require('fastify')({logger: {level: 'debug'}});
const fastifyCors                         = require('@fastify/cors');

const arrowPlugin = require('fastify-arrow');
const gpu_cache   = require('../../util/gpu_cache.js');
const root_schema = require('../../util/schema.js');

module.exports = async function(fastify, opts) {
  fastify.register(fastifyCors, {origin: '*'});
  fastify.register(arrowPlugin);
  fastify.decorate('cacheObject', gpu_cache.cacheObject);
  fastify.decorate('getData', gpu_cache.getData);
  fastify.decorate('readCSV', gpu_cache.readCSV);

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

  fastify.get('/', {...get_schema, handler: () => root_schema['particles']});
  fastify.post('/', {...get_schema, handler: () => root_schema['particles']});

  const filterPoints =
    (column, min, max) => {
      const gt   = column._col.gt(parseInt(min));
      const lt   = column._col.lt(parseInt(max));
      const mask = gt.bitwiseAnd(lt);
      return column.filter(Series.new(mask));
    }

  const handler = async (request, reply) => {
    /**
     * /particles/get_shader_column/:table/:xmin/:xmax/:ymin/:ymax returns a bounds-limited
     * set of interleaved longitude/latitude pairs as an Arrow Table containing a single column.
     * The column is a Float32Array of length 2 * N, where N is the number of points.
     * :table is the name of the table to query.
     * (optional) :xmin, :xmax, :ymin, :ymax are the bounds to limit the query to.
     * If no bounds are provided, the entire table is returned.
     *
     * The returned Arrow Table is a single column of Float32 values, where the first
     * two values are the first point's longitude and latitude, the next two values are
     * the second point's longitude and latitude, and so on.
     */
    let message = 'Error';
    let result  = {'params': request.params, success: false, message: message};
    const table = await fastify.getData(request.params.table);
    if (table == undefined) {
      result.message = 'Table not found';
      await reply.code(404).send(result);
    } else {
      try {
        let x = undefined;
        let y = undefined;
        if (request.params.xmin != undefined && request.params.xmax != undefined &&
            request.params.ymin != undefined && request.params.ymax != undefined) {
          x = filterPoints(table.get('Longitude'), request.params.xmin, request.params.xmax);
          y = filterPoints(table.get('Latitude'), request.params.ymin, request.params.ymax);
        } else {
          x = table.get('Longitude');
          y = table.get('Latitude');
        }

        // Map x, y, r, g, b to offsets for client display
        let tiled       = Series.sequence({type: new Float32, init: 0.0, size: (2 * x.length)});
        let base_offset = Series.sequence({type: new Int32, init: 0.0, size: x.length}).mul(2);
        tiled           = tiled.scatter(x, base_offset.cast(new Int32));
        x.dispose();
        tiled = tiled.scatter(y, base_offset.add(1).cast(new Int32));
        y.dispose();
        const result = new DataFrame({'gpu_buffer': tiled});
        const writer = RecordBatchStreamWriter.writeAll(result.toArrow());
        await reply.code(200).send(writer.toNodeStream());
        tiled.dispose();
        result.dispose();
        writer.close();
      } catch (e) {
        result.message = e.message;
        if (e.message.search('Unknown column name') != -1) {
          result.message = {
            error: result.message,
            message:
              'Imported CSV file must contain four columns: State, Zip_Code, Longitude, and Latitude'
          };
          await reply.code(500).send(result);
        } else {
          await reply.code(500).send(result);
        }
      }
    }
  };

  fastify.route({
    method: 'GET',
    url: '/get_shader_column/:table/:xmin/:xmax/:ymin/:ymax',
    schema: {
      querystring: {
        table: {type: 'string'},
        xmin: {type: 'number'},
        xmax: {type: 'number'},
        ymin: {type: 'number'},
        ymax: {type: 'number'}
      }
    },
    handler: handler
  });
  fastify.route({
    method: 'GET',
    url: '/get_shader_column/:table',
    schema: {querystring: {table: {type: 'string'}}},
    handler: handler
  });
}
