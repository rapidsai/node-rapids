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

'use strict';

const schema = {
  gpu: {
    description: 'An abstract interface to the node-rapids api, supported by a server.',
    schema: {
      '/': {
        method: 'The name of the method to apply to gpu_cache data.',
        caller: 'Either an object that has been stored in the gpu_cache or a static module name.',
        arguments: 'Correctly specified arguments to the gpu_cache method.',
        result: 'Either a result code specifying success or failure or an arrow data buffer.',
      },
      'DataFrame/readCSV': {
        method: 'POST',
        params: {
          filename: 'The name of the file, stored in the server\'s public/ folder, of the csv file.'
        },
        result: `Causes the node-rapids backend to attempt to load the csv file specified
           by :filename. The GPU will attempt to parse the CSV file asynchronously and will
           return OK/ Not Found/ or Fail based on the file status.`,
        returns: '500/404/200'
      },
      'get_column/:table/:column': {
        method: 'GET',
        params: {
          ':table':
            'The filename of a previously loaded dataset, for example with `DataFrame/readCSV`',
          ':column': 'A valid column name in a DataFrame that has been previously loaded.'
        },
        returns: 'An Arrow `RecordBatchStreamWriter` stream of the columnar data.'
      }
    }
  },
  graphology: {
    description: 'The graphology api provides GPU acceleration of graphology datasets.',
    schema: {
      read_json: {
        filename: 'A URI to a graphology json dataset file.',
        result: `Causes the node-rapids backend to attempt to load the json object specified
                     by :filename. The GPU will attempt to parse the json file asynchronously and will
                     return OK/ Not Found/ or Fail based on the file status.
                     If the load is successful, four tables will be created in the node-rapids backend:
                     nodes, edges, clusters, and tags. The root objects in the json target must match
                     these names and order.`,
        returns: 'Result OK/Not Found/Fail'
      },
      read_large_demo: {
        filename:
          'A URI to a graphology json dataset file matching the sigma.js/examples/large-demos spec.',
        result: `Produces the same result as 'read_json'.
                     If the load is successful, three tables will be created in the node-rapids backend:
                     nodes, edges, and options.`,
        returns: 'Result OK/Not Found/Fail'
      },
      list_tables: {returns: 'Tables that are available presently in GPU memory.'},
      get_table: {
        ':table':
          {table: 'The name of the table that has been allocated previously into GPU memory.'}
      },
      get_column: {':table': {':column': {table: 'The table name', column: 'The column name'}}},
      nodes: {
        returns:
          'Returns the existing nodes table after applying normalization functions for sigma.js'
      },
      nodes: {bounds: {returns: 'Returns the x and y bounds to be used in rendering.'}},
      edges: {return: 'Returns the existing edges table after applying normalization for sigma.js'}
    }
  },
  particles: {
    description:
      'The API responsible for parsing particles CSV files for the point-budget API demo.',
    schema: {
      'get_shader_column/:table/:xmin/:xmax/:ymin/:ymax': {
        method: 'POST',
        params: {
          ':table': 'The name of the CSV file previously loaded with `DataFrame/readCSV`',
          'xmin (optional)': 'Don\'t return results outside of xmin',
          'xmax (optional)': 'Don\'t return results outside of xmax',
          'ymin (optional)': 'Don\'t return results outside of ymin',
          'ymax (optional)': 'Don\'t return results outside of ymax'
        },
        result: `Returns the Longitude and Latitude columns of a table that has been read previously
        with DataFrame/readCSV. The Longitude and Latitude will be packed into a a single column and
        interleaved.`,
        return: 'Returns an Arrow stream of lon/lat values as a Table containing a single column.'
      }
    }
  },
  quadtree: {
    description: 'The API responsible for making quadtree API server requests.',
    schema: {
      'create/:table': {
        method: 'POST',
        params: {':table': 'The name of the CSV file previously loaded with `DataFrame/readCSV`'},
        result: 'Create a quadtree from the table specified by :table.',
        return: {
          '200': 'Quadtree created successfully.',
          '404': 'Table not found.',
          '500': 'Quadtree creation failed.'
        }
      },
      'set_polygons': {
        method: 'POST',
        params: {
          'name': 'The name of the polygon set.',
          'points': 'A list of points that define the polygons.',
          'polygon_offset': 'The GeoArrow offset defining the polygons in the points list.',
          'ring_offset':
            'The GeoArrow offset defining the rings of the polygons in the points list.',
        },
        result: 'Create a polygon set from the points specified.',
        return: {'200': 'Polygon set created successfully.', '500': 'Polygon set creation failed.'}
      },
      'get_points/:quadtree/:polygon': {
        method: 'GET',
        params: {
          ':quadtree': 'The name of the quadtree previously created with `quadtree/create`',
          ':polygon': 'The name of the polygon set previously created with `quadtree/set_polygons`'
        },
        result: 'Returns the points that are contained within the polygons specified by :polygon.',
        return: 'Returns an Arrow stream of points that are contained within the polygons.'
      },
      ':quadtree/:polygon/count': {
        method: 'GET',
        params: {
          ':quadtree': 'The name of the quadtree previously created with `quadtree/create`',
          ':polygon': 'The name of the polygon set previously created with `quadtree/set_polygons`'
        },
        result:
          'Returns the number of points that are contained within the polygons specified by :polygon.',
        return: {count: 'The number of points that are contained within the polygons.'}
      }
    }
  }
};

module.exports = schema;
