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

const {Float64, Float32, DataFrame, Series} = require('@rapidsai/cudf');
const {RecordBatchStreamWriter}             = require('apache-arrow');
const fastify                               = require('fastify')({logger: {level: 'debug'}});
const fastifyCors                           = require('@fastify/cors');
const cuspatial                             = require('@rapidsai/cuspatial');

const arrowPlugin = require('fastify-arrow');
const gpu_cache   = require('../../util/gpu_cache.js');
const root_schema = require('../../util/schema.js');

module.exports = async function(fastify, opts) {
  fastify.register(fastifyCors, {origin: '*'});
  fastify.register(arrowPlugin);
  fastify.decorate('cacheObject', gpu_cache.cacheObject);
  fastify.decorate('getData', gpu_cache.getData);
  fastify.decorate('listDataframes', gpu_cache.listDataframes);
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

  fastify.get('/', {...get_schema, handler: () => root_schema['quadtree']});
  fastify.post('/', {...get_schema, handler: () => root_schema['quadtree']});

  fastify.route({
    method: 'POST',
    url: '/create/:table',
    schema: {querystring: {table: {type: 'string'}}},
    handler: async (request, reply) => {
      /**
       * @api {post} /quadtree/create/:table Create Quadtree
       * @apiName CreateQuadtree
       * @apiGroup Quadtree
       * @apiDescription Create a quadtree from a table
       * @apiParam {String} table Table name
       * @apiParam {String} xAxisName Column name for x-axis
       * @apiParam {String} yAxisName Column name for y-axis
       * @apiParamExample {json} Request-Example:
       * {
       *   "xAxisName": "x",
       *   "yAxisName": "y"
       * }
       * @apiSuccessExample {json} Success-Response:
       * {
       *   "params": {
       *     "table": "test"
       *   },
       *   "success": true,
       *   "message": "Quadtree created"
       * }
       * @apiErrorExample {json} Error-Response:
       * {
       *   "params": {
       *     "table": "test"
       *   },
       *   "success": false,
       *   "message": "Error"
       * }
       */
      let message = 'Error';
      let result  = {'params': request.params, success: false, message: message};
      const table = await fastify.getData(request.params.table);
      if (request.body.xAxisName === undefined || request.body.yAxisName === undefined) {
        result.message = 'xAxisName or yAxisName undefined, specify them in POST body.';
        result.code    = 400;
        await reply.code(result.code).send(result);
        return;
      }
      if (table == undefined) {
        result.message = 'Table not found';
        await reply.code(404).send(result);
      } else {
        xCol                           = table.get(request.body.xAxisName).cast(new Float64);
        yCol                           = table.get(request.body.yAxisName).cast(new Float64);
        const [xMin, xMax, yMin, yMax] = [xCol.min(), xCol.max(), yCol.min(), yCol.max()];
        try {
          const quadtree = cuspatial.Quadtree.new(
            {x: xCol, y: yCol, xMin, xMax, yMin, yMax, scale: 0, maxDepth: 15, minSize: 1e5});
          const quadtree_name     = request.params.table + '_quadtree';
          request.params.quadtree = quadtree_name
          const saved             = await fastify.cacheObject(quadtree_name, quadtree);
          result.message          = 'Quadtree created';
          result.success          = true;
          result.statusCode       = 200;
          await reply.code(result.statusCode).send(result);
        } catch (e) {
          result.message    = e;
          result.success    = false;
          result.statusCode = 500;
          await reply.code(result.statusCode).send(result);
        }
      }
    }
  });

  fastify.route({
    method: 'POST',
    url: '/set_polygons',
    schema: {
      querystring: {
        name: {type: 'string'},
        polygon_offset: {type: 'array'},
        ring_offset: {type: 'array'},
        points: {type: 'array'}
      }
    },
    handler: async (request, reply) => {
      /**
       * @api {post} /quadtree/set_polygons_quadtree Set Polygons Quadtree
       * @apiName SetPolygonsQuadtree
       * @apiGroup Quadtree
       * @apiDescription Set polygons for quadtree
       * @apiParam {String} name Name of quadtree
       * @apiParam {Array} polygon_offset Array of polygon offsets
       * @apiParam {Array} ring_offset Array of ring offsets
       * @apiParam {Array} points Array of points
       * @apiParamExample {json} Request-Example:
       * {
       *   "name": "test_quadtree",
       *   "polygon_offset": [0, 4, 8],
       *   "ring_offset": [0, 4, 8, 12],
       *   "points": [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1]
       * }
       * @apiSuccessExample {json} Success-Response:
       * {
       *   "params": {
       *     "name": "test_quadtree",
       *     "polygon_offset": [0, 4, 8],
       *     "ring_offset": [0, 4, 8, 12],
       *     "points": [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1]
       *   },
       *   "success": true,
       *   "message": "Set polygon test_quadtree"
       * }
       * @apiErrorExample {json} Error-Response:
       * {
       *   "params": {
       *     "name": "test_quadtree",
       *     "polygon_offset": [0, 4, 8],
       *     "ring_offset": [0, 4, 8, 12],
       *     "points": [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1]
       *   },
       *   "success": false,
       *   "message": "Error"
       * }
       */
      let message = 'Error';
      let result  = {'params': request.params, success: false, message: message};
      try {
        const polygon_offset = Series.new(new Int32Array(request.body.polygon_offset));
        const ring_offset    = Series.new(new Int32Array(request.body.ring_offset));
        const points         = Series.new(new Float64Array(request.body.points));
        const cached =
          await fastify.cacheObject(request.body.name, {polygon_offset, ring_offset, points});
        result.message    = 'Set polygon ' + request.body.name;
        result.success    = true;
        result.statusCode = 200;
        result.params     = request.body;
        await reply.code(result.statusCode).send(result);
      } catch (e) {
        result.message    = e;
        result.success    = false;
        result.statusCode = 500;
        await reply.code(result.statusCode).send(result);
      }
    }
  });

  fastify.route({
    method: 'GET',
    url: '/get_points/:quadtree/:polygon/clear',
    schema:
      {querystring: {quadtree: {type: 'string'}, polygon: {type: 'string'}, n: {type: 'number'}}},
    handler: async (request, reply) => {
      let message = 'Error';
      let result  = {'params': request.params, success: false, message: message};
      try {
        const quadtree = await fastify.getData(request.params.quadtree);
        const {polygon_offset, ring_offset, points} = await fastify.getData(request.params.polygon);
        const polygons_and_served                   = await fastify.getData(points.toArray());
        let polygons = polygons_and_served ? polygons_and_served.polygons : undefined;
        let served   = polygons_and_served ? polygons_and_served.served : 0;
        if (polygons === undefined) {
          result.message    = 'No cached polygons found';
          result.success    = false;
          result.statusCode = 404;
        } else {
          await fastify.cacheObject(points.toArray(), {polygons: polygons, served: 0});
          result.message    = 'Cleared points from cache';
          result.success    = true;
          result.statusCode = 200;
        }
        await reply.code(result.statusCode).send(result);
      } catch (e) {
        result.message    = JSON.stringify(e);
        result.success    = false;
        result.statusCode = 500;
        await reply.code(result.statusCode).send(result);
      }
    }
  });

  fastify.route({
    method: 'GET',
    url: '/get_points/:quadtree/:polygon/:n/next',
    schema:
      {querystring: {quadtree: {type: 'string'}, polygon: {type: 'string'}, n: {type: 'number'}}},
    handler: async (request, reply) => {
      let message = 'Error';
      let result  = {'params': request.params, success: false, message: message};
      try {
        const quadtree = await fastify.getData(request.params.quadtree);
        const {polygon_offset, ring_offset, points} = await fastify.getData(request.params.polygon);
        const polygons_and_served                   = await fastify.getData(points);
        let polygons = polygons_and_served ? polygons_and_served.polygons : undefined;
        let served   = polygons_and_served ? polygons_and_served.served : 0;
        if (polygons === undefined) {
          const pts = cuspatial.makePoints(
            points.gather(Series.sequence({size: points.length, step: 2, init: 0})),
            points.gather(Series.sequence({size: points.length, step: 2, init: 1})));
          const polylines = cuspatial.makePolylines(pts, ring_offset);
          polygons        = cuspatial.makePolygons(polylines, polygon_offset);
          await fastify.cacheObject(points.toArray(), {polygons: polygons, served: 0});
        }
        const polyPointPairs = quadtree.pointInPolygon(polygons);
        const resultPoints   = quadtree.points.gather(polyPointPairs.get('point_index'));
        // Either return the number of requested points or the number of points left
        const numPoints =
          Math.min(parseInt(request.params.n), resultPoints.get('x').length - served);
        let result_col =
          Series.sequence({size: numPoints * 2, type: new Float32, step: 0, init: 0});
        result_col = result_col.scatter(
          resultPoints.get('x').gather(Series.sequence({size: numPoints, step: 1, init: served})),
          Series.sequence({size: numPoints, step: 2, init: served}));
        result_col = result_col.scatter(
          resultPoints.get('y').gather(Series.sequence({size: numPoints, step: 1, init: served})),
          Series.sequence({size: numPoints, step: 2, init: served + 1}));
        await fastify.cacheObject(points.toArray(),
                                  {polygons: polygons, served: served + numPoints});
        result       = new DataFrame({'points_in_polygon': result_col})
        const writer = RecordBatchStreamWriter.writeAll(result.toArrow());
        writer.close();
        await reply.code(200).send(writer.toNodeStream());
      } catch (e) {
        result.message    = e.toString();
        result.success    = false;
        result.statusCode = 500;
        await reply.code(result.statusCode).send(result);
      }
    }
  });

  fastify.route({
    method: 'GET',
    url: '/get_points/:quadtree/:polygon/:n',
    schema:
      {querystring: {quadtree: {type: 'string'}, polygon: {type: 'string'}, n: {type: 'number'}}},
    handler: async (request, reply) => {
      /**
       * @api {get} /quadtree/get_points/:quadtree/:polygon Get Points
       * @apiName GetPoints
       * @apiGroup Quadtree
       * @apiDescription This API returns uses the quadtree to return only the points that are in
       * the polygon. This API only returns the first n points.
       * @apiParam {String} quadtree Name of quadtree created with /quadtree/create/:table
       * @apiParam {String} polygon Name of polygon created with /quadtree/set_polygons_quadtree
       * @apiParam {Number} n Number of points to return
       * @apiParamExample {json} Request-Example:
       * {
       *   "quadtree": "test_quadtree",
       *   "polygon": "test_polygon"
       *   "n": 100
       * }
       * @apiSuccessExample {json} Success-Response:
       * {
       *   "params": {
       *     "quadtree": "test_quadtree",
       *     "polygon": "test_polygon"
       *   },
       *   "success": true,
       *   "message": "Get points from test_quadtree"
       * }
       * @apiErrorExample {json} Error-Response:
       * {
       *   "params": {
       *     "quadtree": "test_quadtree",
       *     "polygon": "test_polygon"
       *   },
       *   "success": false,
       *   "message": "Error"
       * }
       */
      let message = 'Error';
      let result  = {'params': request.params, success: false, message: message};
      try {
        const quadtree = await fastify.getData(request.params.quadtree);
        const {polygon_offset, ring_offset, points} = await fastify.getData(request.params.polygon);
        const polygons_and_served                   = await fastify.getData(points.toArray());
        let polygons = polygons_and_served ? polygons_and_served.polygons : undefined;
        let served   = polygons_and_served ? polygons_and_served.served : 0;
        if (polygons === undefined) {
          const pts = cuspatial.makePoints(
            points.gather(Series.sequence({size: points.length, step: 2, init: 0})),
            points.gather(Series.sequence({size: points.length, step: 2, init: 1})));
          const polylines = cuspatial.makePolylines(pts, ring_offset);
          polygons        = cuspatial.makePolygons(polylines, polygon_offset);
          await fastify.cacheObject(points.toArray(), {polygons: polygons, served: 0});
        }
        const polyPointPairs = quadtree.pointInPolygon(polygons);
        const resultPoints   = quadtree.points.gather(polyPointPairs.get('point_index'));
        const numPoints      = Math.min(parseInt(request.params.n), resultPoints.get('x').length);
        let result_col =
          Series.sequence({size: numPoints * 2, type: new Float32, step: 0, init: 0});
        result_col   = result_col.scatter(resultPoints.get('x'),
                                        Series.sequence({size: numPoints, step: 2, init: 0}));
        result_col   = result_col.scatter(resultPoints.get('y'),
                                        Series.sequence({size: numPoints, step: 2, init: 1}));
        result       = new DataFrame({'points_in_polygon': result_col})
        const writer = RecordBatchStreamWriter.writeAll(result.toArrow());
        writer.close();
        await reply.code(200).send(writer.toNodeStream());
      } catch (e) {
        result.message    = JSON.stringify(e);
        result.success    = false;
        result.statusCode = 500;
        await reply.code(result.statusCode).send(result);
      }
    }
  });

  fastify.route({
    method: 'GET',
    url: '/get_points/:quadtree/:polygon',
    schema: {querystring: {quadtree: {type: 'string'}, polygon: {type: 'string'}}},
    handler: async (request, reply) => {
      /**
       * @api {get} /quadtree/get_points/:quadtree/:polygon Get Points
       * @apiName GetPoints
       * @apiGroup Quadtree
       * @apiDescription This API returns uses the quadtree to return only the points that are in
       * the polygon.
       * @apiParam {String} quadtree Name of quadtree created with /quadtree/create/:table
       * @apiParam {String} polygon Name of polygon created with /quadtree/set_polygons_quadtree
       * @apiParamExample {json} Request-Example:
       * {
       *   "quadtree": "test_quadtree",
       *   "polygon": "test_polygon"
       * }
       * @apiSuccessExample {json} Success-Response:
       * {
       *   "params": {
       *     "quadtree": "test_quadtree",
       *     "polygon": "test_polygon"
       *   },
       *   "success": true,
       *   "message": "Get points from test_quadtree"
       * }
       * @apiErrorExample {json} Error-Response:
       * {
       *   "params": {
       *     "quadtree": "test_quadtree",
       *     "polygon": "test_polygon"
       *   },
       *   "success": false,
       *   "message": "Error"
       * }
       */
      let message = 'Error';
      let result  = {'params': request.params, success: false, message: message};
      try {
        const quadtree = await fastify.getData(request.params.quadtree);
        const {polygon_offset, ring_offset, points} = await fastify.getData(request.params.polygon);
        const data                                  = await fastify.listDataframes();
        const pts                                   = cuspatial.makePoints(
          points.gather(Series.sequence({size: points.length, step: 2, init: 0})),
          points.gather(Series.sequence({size: points.length, step: 2, init: 1})));
        const polylines      = cuspatial.makePolylines(pts, ring_offset);
        const polygons       = cuspatial.makePolygons(polylines, polygon_offset);
        const polyPointPairs = quadtree.pointInPolygon(polygons);
        const resultPoints   = quadtree.points.gather(polyPointPairs.get('point_index'));
        const numPoints      = resultPoints.get('x').length
        let result_col =
          Series.sequence({size: numPoints * 2, type: new Float32, step: 0, init: 0});
        result_col   = result_col.scatter(resultPoints.get('x'),
                                        Series.sequence({size: numPoints, step: 2, init: 0}));
        result_col   = result_col.scatter(resultPoints.get('y'),
                                        Series.sequence({size: numPoints, step: 2, init: 1}));
        result       = new DataFrame({'points_in_polygon': result_col})
        const writer = RecordBatchStreamWriter.writeAll(result.toArrow());
        writer.close();
        await reply.code(200).send(writer.toNodeStream());
      } catch (e) {
        result.message    = JSON.stringify(e);
        result.success    = false;
        result.statusCode = 500;
        await reply.code(result.statusCode).send(result);
      }
    }
  });

  fastify.route({
    method: 'GET',
    url: '/:quadtree/:polygon/count',
    schema: {querystring: {quadtree: {type: 'string'}, polygon: {type: 'string'}}},
    handler: async (request, reply) => {
      /**
       * @api {get} /quadtree/:quadtree/:polygon/count Count Points
       * @apiName CountPoints
       * @apiGroup Quadtree
       * @apiDescription This API returns uses the quadtree to return only the points that are in
       * the polygon.
       * @apiParam {String} quadtree Name of quadtree created with /quadtree/create/:table
       * @apiParam {String} polygon Name of polygon created with /quadtree/set_polygons_quadtree
       * @apiParamExample {json} Request-Example:
       * {
       *   "quadtree": "test_quadtree",
       *   "polygon": "test_polygon"
       * }
       * @apiSuccessExample {json} Success-Response:
       * {
       *   "count": 100
       * }
       * @apiErrorExample {json} Error-Response:
       * {
       *   "params": {
       *     "quadtree": "test_quadtree",
       *     "polygon": "test_polygon"
       *   },
       *   "success": false,
       *   "message": "Error"
       * }
       */
      let message = 'Error';
      let result  = {'params': request.params, success: false, message: message};
      try {
        const quadtree = await fastify.getData(request.params.quadtree);
        const {polygon_offset, ring_offset, points} = await fastify.getData(request.params.polygon);
        const data                                  = await fastify.listDataframes();
        const pts                                   = cuspatial.makePoints(
          points.gather(Series.sequence({size: points.length, step: 2, init: 0})),
          points.gather(Series.sequence({size: points.length, step: 2, init: 1})));
        const polylines = cuspatial.makePolylines(pts, ring_offset);
        const polygons  = cuspatial.makePolygons(polylines, polygon_offset);
        // TODO: This is a good place to put the polygons object into the cache,
        // and check for it before creating it. Is it worth benchmarking?
        const polyPointPairs = quadtree.pointInPolygon(polygons);
        result.count         = polyPointPairs.get('point_index').length;
        result.message       = 'Counted points in polygon';
        result.success       = true;
        result.statusCode    = 200;
        await reply.code(200).send(result);
      } catch (e) {
        result.message    = e;
        result.success    = false;
        result.statusCode = 500;
        await reply.code(result.statusCode).send(result);
      }
    }
  });
}
