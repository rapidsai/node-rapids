# RAPIDS Bindings

The tables below show the bindings that have been implemented in `node-rapids`:

- [cuDF](#cuDF)
- [cuGraph](#cuGraph)
- [cuSpatial](#cuSpatial)
- [cuML](#cuML)


## cuDF

### Series

#### Numeric Series

| cuDF                 |      node-rapids      |
| -------------------- | :-------------------: |
| `abs`                |          ✅           |
| `acos`               |          ✅           |
| `add`                |          ✅           |
| `all`                |          ✅           |
| `any`                |          ✅           |
| `append`             |     ✅ (`concat`)     |
| `applymap`           |                       |
| `argsort`            |                       |
| `as_index`           |                       |
| `as_mask`            |                       |
| `asin`               |          ✅           |
| `astype`             |      ✅ (`cast`)      |
| `atan`               |          ✅           |
| `ceil`               |          ✅           |
| `clip`               |                       |
| `copy`               |          ✅           |
| `corr`               |                       |
| `cos`                |          ✅           |
| `count`              | ✅ (`countNonNulls`)  |
| `cov`                |                       |
| `cummax`             | ✅ (`cumulativeMax`)  |
| `cummin`             | ✅ (`cumulativeMin`)  |
| `cumprod`            | ✅ (`cumulativeProduct`) |
| `cumsum`             | ✅ (`cumulativeSum`)  |
| `describe`           |                       |
| `diff`               |                       |
| `digitize`           |                       |
| `drop_duplicates`    | ✅ (`dropDuplicates`) |
| `dropna`             |   ✅ (`dropNulls`)    |
| `eq`                 |          ✅           |
| `equals`             |                       |
| `exp`                |          ✅           |
| `factorize`          |                       |
| `fillna`             |  ✅ (`replaceNulls`)  |
| `floor`              |          ✅           |
| `floordiv`           |          ✅           |
| `from_arrow`         |          ✅           |
| `from_categorical`   |                       |
| `from_masked_array`  |                       |
| `from_pandas`        |                       |
| `ge`                 |          ✅           |
| `groupby`            |                       |
| `gt`                 |          ✅           |
| `hash_encode`        |                       |
| `hash_values`        |                       |
| `head`               |          ✅           |
| `interleave_columns` |                       |
| `isin`               |                       |
| `isna`               |     ✅ (`isNull`)     |
| `isnull`             |          ✅           |
| `keys`               |                       |
| `kurt`               |    ✅ (`kurtosis`)    |
| `kurtosis`           |          ✅           |
| `label_encoding`     |                       |
| `le`                 |          ✅           |
| `log`                |          ✅           |
| `lt`                 |          ✅           |
| `map`                |                       |
| `mask`               |                       |
| `max`                |          ✅           |
| `mean`               |          ✅           |
| `median`             |          ✅           |
| `memory_usage`       |                       |
| `min`                |          ✅           |
| `mod`                |          ✅           |
| `mode`               |                       |
| `mul`                |          ✅           |
| `nans_to_nulls`      |  ✅ (`nansToNulls`)   |
| `ne`                 |          ✅           |
| `nlargest`           |    ✅ (`nLargest`)    |
| `notna`              |   ✅ (`isNotNull`)    |
| `notnull`            |   ✅ (`isNotNull`)    |
| `nsmallest`          |   ✅ (`nSmallest`)    |
| `nunique`            |          ✅           |
| `one_hot_encoding`   |                       |
| `pipe`               |                       |
| `pow`                |          ✅           |
| `prod`               |                       |
| `product`            |          ✅           |
| `quantile`           |          ✅           |
| `radd`               |                       |
| `rank`               |                       |
| `reindex`            |                       |
| `rename`             |                       |
| `repeat`             |                       |
| `replace`            |                       |
| `reset_index`        |                       |
| `reverse`            |          ✅           |
| `rfloordiv`          |                       |
| `rmod`               |                       |
| `rmul`               |                       |
| `rolling`            |                       |
| `round`              |                       |
| `rpow`               |                       |
| `rsub`               |                       |
| `rtruediv`           |                       |
| `sample`             |                       |
| `scale`              |                       |
| `scatter_by_map`     |                       |
| `searchsorted`       |                       |
| `set_index`          |                       |
| `set_mask`           |                       |
| `shift`              |                       |
| `sin`                |          ✅           |
| `skew`               |          ✅           |
| `sort_index`         |                       |
| `sort_values`        |   ✅ (`sortValues`)   |
| `sqrt`               |          ✅           |
| `std`                |          ✅           |
| `sub`                |          ✅           |
| `sum`                |          ✅           |
| `tail`               |          ✅           |
| `take`               |     ✅ (`gather`)     |
| `tan`                |          ✅           |
| `tile`               |                       |
| `to_array`           |                       |
| `to_arrow`           |                       |
| `to_dlpack`          |                       |
| `to_frame`           |                       |
| `to_gpu_array`       |                       |
| `to_hdf`             |                       |
| `to_json`            |                       |
| `to_pandas`          |                       |
| `to_string`          |                       |
| `truediv`            |          ✅           |
| `unique`             |          ✅           |
| `value_counts`       |          ✅           |
| `values_to_string`   |                       |
| `var`                |          ✅           |
| `where`              |                       |

#### List, String, Struct Series

| cuDF                 |      List Series      |     String Series     |     Struct Series     |
| -------------------- | :-------------------: | :-------------------: | :-------------------: |
| `add`                |                       |                       |                       |
| `all`                |          ✅           |          ✅           |          ✅           |
| `any`                |          ✅           |          ✅           |          ✅           |
| `append`             |     ✅ (`concat`)     |     ✅ (`concat`)     |     ✅ (`concat`)     |
| `applymap`           |                       |                       |                       |
| `argsort`            |                       |                       |                       |
| `as_index`           |                       |                       |                       |
| `as_mask`            |                       |                       |                       |
| `astype`             |      ✅ (`cast`)      |      ✅ (`cast`)      |      ✅ (`cast`)      |
| `byte_count`         |         N/A           |   ✅ (`byteCount`)   |       N/A           |
| `clip`               |                       |                       |                       |
| `copy`               |          ✅           |          ✅           |          ✅           |
| `count`              | ✅ (`countNonNulls`)  | ✅ (`countNonNulls`)  | ✅ (`countNonNulls`)  |
| `describe`           |                       |                       |                       |
| `diff`               |                       |                       |                       |
| `digitize`           |                       |                       |                       |
| `drop_duplicates`    | ✅ (`dropDuplicates`) | ✅ (`dropDuplicates`) | ✅ (`dropDuplicates`) |
| `dropna`             |   ✅ (`dropNulls`)    |   ✅ (`dropNulls`)    |   ✅ (`dropNulls`)    |
| `equals`             |                       |                       |                       |
| `factorize`          |                       |                       |                       |
| `fillna`             |  ✅ (`replaceNulls`)  |  ✅ (`replaceNulls`)  |  ✅ (`replaceNulls`)  |
| `from_arrow`         |                       |                       |                       |
| `from_categorical`   |                       |                       |                       |
| `from_masked_array`  |                       |                       |                       |
| `from_pandas`        |                       |                       |                       |
| `get_json_object`    |                       | ✅ (`getJSONObject`)  |                       |
| `groupby`            |                       |                       |                       |
| `hash_encode`        |                       |                       |                       |
| `hash_values`        |                       |                       |                       |
| `head`               |          ✅           |          ✅           |          ✅           |
| `interleave_columns` |                       |                       |                       |
| `isin`               |                       |                       |                       |
| `isna`               |     ✅ (`isNull`)     |     ✅ (`isNull`)     |     ✅ (`isNull`)     |
| `isnull`             |          ✅           |          ✅           |          ✅           |
| `keys`               |                       |                       |                       |
| `kurt`               |    ✅ (`kurtosis`)    |    ✅ (`kurtosis`)    |    ✅ (`kurtosis`)    |
| `kurtosis`           |          ✅           |          ✅           |          ✅           |
| `label_encoding`     |                       |                       |                       |
| `len`                |                       |         ✅             |       N/A           |
| `map`                |                       |                       |                       |
| `mask`               |                       |                       |                       |
| `memory_usage`       |                       |                       |                       |
| `nans_to_nulls`      |  ✅ (`nansToNulls`)   |  ✅ (`nansToNulls`)   |  ✅ (`nansToNulls`)   |
| `notna`              |   ✅ (`isNotNull`)    |   ✅ (`isNotNull`)    |   ✅ (`isNotNull`)    |
| `notnull`            |   ✅ (`isNotNull`)    |   ✅ (`isNotNull`)    |   ✅ (`isNotNull`)    |
| `nunique`            |                       |                       |                       |
| `one_hot_encoding`   |                       |                       |                       |
| `pad`                |         N/A           |         ✅             |       N/A           |
| `pipe`               |                       |                       |                       |
| `quantile`           |                       |                       |                       |
| `rank`               |                       |                       |                       |
| `reindex`            |                       |                       |                       |
| `rename`             |                       |                       |                       |
| `repeat`             |                       |                       |                       |
| `replace`            |                       |                       |                       |
| `reset_index`        |                       |                       |                       |
| `reverse`            |          ✅           |          ✅           |          ✅           |
| `rolling`            |                       |                       |                       |
| `sample`             |                       |                       |                       |
| `scatter_by_map`     |                       |                       |                       |
| `searchsorted`       |                       |                       |                       |
| `set_index`          |                       |                       |                       |
| `set_mask`           |                       |                       |                       |
| `shift`              |                       |                       |                       |
| `skew`               |          ✅           |          ✅           |          ✅           |
| `sort_index`         |                       |                       |                       |
| `sort_values`        |   ✅ (`sortValues`)   |   ✅ (`sortValues`)   |   ✅ (`sortValues`)   |
| `tail`               |          ✅           |          ✅           |          ✅           |
| `take`               |     ✅ (`gather`)     |     ✅ (`gather`)     |     ✅ (`gather`)     |
| `tile`               |                       |                       |                       |
| `to_array`           |                       |                       |                       |
| `to_arrow`           |                       |                       |                       |
| `to_dlpack`          |                       |                       |                       |
| `to_frame`           |                       |                       |                       |
| `to_gpu_array`       |                       |                       |                       |
| `to_hdf`             |                       |                       |                       |
| `to_json`            |                       |                       |                       |
| `to_pandas`          |                       |                       |                       |
| `to_string`          |                       |                       |                       |
| `unique`             |          ✅           |          ✅           |          ✅           |
| `value_counts`       |          ✅           |          ✅           |          ✅           |
| `values_to_string`   |                       |                       |                       |
| `where`              |                       |                       |                       |
| `zfill`              |         N/A           |         ✅             |       N/A           |

### DataFrame

| cuDF                 |      node-rapids      |
| -------------------- | :-------------------: |
| `acos`               |          ✅           |
| `add`                |                       |
| `agg`                |                       |
| `all`                |                       |
| `any`                |                       |
| `append`             |     ✅ (`concat`)     |
| `apply_chunks`       |                       |
| `apply_rows`         |                       |
| `argsort`            |                       |
| `as_gpu_matrix`      |                       |
| `as_matrix`          |                       |
| `asin`               |          ✅           |
| `assign`             |          ✅           |
| `astype`             |      ✅ (`cast`)      |
| `atan`               |          ✅           |
| `clip`               |                       |
| `copy`               |                       |
| `corr`               |                       |
| `cos`                |          ✅           |
| `count`              |                       |
| `cov`                |                       |
| `cummax`             |                       |
| `cummin`             |                       |
| `cumprod`            |                       |
| `cumsum`             |                       |
| `describe`           |                       |
| `div`                |                       |
| `drop`               |          ✅           |
| `drop_duplicates`    | ✅ (`dropDuplicates`) |
| `dropna`             |   ✅ (`dropNulls`)    |
| `equals`             |                       |
| `exp`                |          ✅           |
| `fillna`             |  ✅ (`replaceNulls`)  |
| `floordiv`           |                       |
| `from_arrow`         |                       |
| `from_pandas`        |                       |
| `from_records`       |                       |
| `hash_columns`       |                       |
| `head`               |          ✅           |
| `info`               |                       |
| `insert`             |                       |
| `interleave_columns` |          ✅           |
| `isin`               |                       |
| `isna`               |     ✅ (`isNaN`)      |
| `isnull`             |          ✅           |
| `iteritems`          |                       |
| `join`               |                       |
| `keys`               |                       |
| `kurt`               |    ✅ (`kurtosis`)    |
| `kurtosis`           |          ✅           |
| `label_encoding`     |                       |
| `log`                |          ✅           |
| `mask`               |                       |
| `max`                |                       |
| `mean`               |                       |
| `melt`               |                       |
| `memory_usage`       |                       |
| `merge`              |                       |
| `min`                |                       |
| `mod`                |                       |
| `mode`               |                       |
| `mul`                |                       |
| `nans_to_nulls`      |  ✅ (`nansToNulls`)   |
| `nlargest`           |                       |
| `notna`              |    ✅ (`isNotNaN`)    |
| `notnull`            |   ✅ (`isNotNull`)    |
| `nsmallest`          |                       |
| `one_hot_encoding`   |                       |
| `partition_by_hash`  |                       |
| `pipe`               |                       |
| `pivot`              |                       |
| `pop`                |                       |
| `pow`                |                       |
| `prod`               |                       |
| `product`            |                       |
| `quantile`           |                       |
| `quantiles`          |                       |
| `query`              |                       |
| `radd`               |                       |
| `rank`               |                       |
| `rdiv`               |                       |
| `reindex`            |                       |
| `rename`             |                       |
| `repeat`             |                       |
| `replace`            |                       |
| `reset_index`        |                       |
| `rfloordiv`          |                       |
| `rmod`               |                       |
| `rmul`               |                       |
| `round`              |                       |
| `rpow`               |                       |
| `rsub`               |                       |
| `rtruediv`           |                       |
| `sample`             |                       |
| `scatter_by_map`     |                       |
| `searchsorted`       |                       |
| `select_dtypes`      |                       |
| `set_index`          |                       |
| `shift`              |                       |
| `sin`                |          ✅           |
| `skew`               |          ✅           |
| `sort_index`         |                       |
| `sort_values`        |   ✅ (`sortValues`)   |
| `sqrt`               |          ✅           |
| `stack`              |                       |
| `std`                |                       |
| `sub`                |                       |
| `sum`                |                       |
| `tail`               |          ✅           |
| `take`               |     ✅ (`gather`)     |
| `tan`                |          ✅           |
| `tile`               |                       |
| `to_arrow`           |    ✅ (`toArrow`)     |
| `to_csv`             |     ✅ (`toCSV`)      |
| `to_dlpack`          |                       |
| `to_feather`         |                       |
| `to_hdf`             |                       |
| `to_json`            |                       |
| `to_orc`             |                       |
| `to_pandas`          |                       |
| `to_parquet`         |                       |
| `to_records`         |                       |
| `to_string`          |                       |
| `transpose`          |                       |
| `truediv`            |                       |
| `unstack`            |                       |
| `update`             |                       |
| `var`                |                       |
| `where`              |                       |

### GroupBy

| cuDF            | node-rapids |
| --------------- | :---------: |
| `agg`           |             |
| `aggregate`     |             |
| `apply`         |             |
| `apply_grouped` |             |
| `nth`           |     ✅      |
| `pipe`          |             |
| `rolling`       |             |
| `size`          |             |



## cuGraph

| cuGraph                      |   node-rapids   |
| ---------------------------- | :-------------: |
| `add_internal_vertex_id`     |                 |
| `add_nodes_from`             |                 |
| `clear`                      |                 |
| `compute_renumber_edge_list` |                 |
| `degree`                     |                 |
| `degrees`                    |                 |
| `delete_adj_list`            |                 |
| `delete_edge_list`           |                 |
| `edges`                      |                 |
| `from_cudf_adjlist`          |                 |
| `from_cudf_edgelist`         |                 |
| `from_dask_cudf_edgelist`    |                 |
| `from_numpy_array`           |                 |
| `from_numpy_matrix`          |                 |
| `from_pandas_adjacency`      |                 |
| `from_pandas_edgelist`       |                 |
| `get_two_hop_neighbors`      |                 |
| `has_edge`                   |                 |
| `has_node`                   |                 |
| `in_degree`                  |                 |
| `is_bipartite`               |                 |
| `is_multigraph`              |                 |
| `is_multipartite`            |                 |
| `lookup_internal_vertex_id`  |                 |
| `nodes`                      |                 |
| `number_of_edges`            | ✅ (`numEdges`) |
| `number_of_nodes`            | ✅ (`numNodes`) |
| `number_of_vertices`         |                 |
| `out_degree`                 |                 |
| `sets`                       |                 |
| `to_directed`                |                 |
| `to_numpy_array`             |                 |
| `to_numpy_matrix`            |                 |
| `to_pandas_adjacency`        |                 |
| `to_pandas_edgelist`         |                 |
| `to_undirected`              |                 |
| `unrenumber`                 |                 |
| `view_adj_list`              |                 |
| `view_edge_list`             |                 |
| `view_transposed_adj_list`   |                 |



## cuSpatial

| cuSpatial                            |                  node-rapids                   |
| ------------------------------------ | :--------------------------------------------: |
| `directed_hausdorff_distance`        |                                                |
| `haversine_distance`                 |                                                |
| `lonlat_to_cartesian`                |                                                |
| `point_in_polygon`                   |                                                |
| `polygon_bounding_boxes`             |       ✅ (`computePolygonBoundingBoxes`)       |
| `polyline_bounding_boxes`            |      ✅ (`computePolylineBoundingBoxes`)       |
| `quadtree_on_points`                 |             ✅ (`createQuadtree`)              |
| `points_in_spatial_window`           |                                                |
| `join_quadtree_and_bounding_boxes`   | ✅ (`findQuadtreeAndBoundingBoxIntersections`) |
| `quadtree_point_in_polygon`          |          ✅ (`findPointsInPolygons`)           |
| `quadtree_point_to_nearest_polyline` |     ✅ (`findPolylineNearestToEachPoint`)      |
| `derive_trajectories`                |                                                |
| `trajectory_bounding_boxes`          |                                                |
| `trajectory_distances_and_speeds`    |                                                |
| `read_polygon_shapefile`             |                                                |


## cuML

#### Clustering
| cuML                                 |                  node-rapids                   |
| ------------------------------------ | :--------------------------------------------: |
| `AC`                                 |                                                |
| `DBSCAN`                             |                                                |
| `K-Means`                            |                                                |


#### Dimensionality Reduction and Manifold Learning
| cuML                                 |                  node-rapids                   |
| ------------------------------------ | :--------------------------------------------: |
| `K-Means`                            |                                                |
| `PCA`                                |                                                |
| `Random Projection`                  |                                                |
| `tSVD`                               |                                                |
| `TSNE`                               |                                                |
| `UMAP`                               |                                                |


#### Linear / Nonlinear Models for Regression or Classification
| cuML                                 |                  node-rapids                   |
| ------------------------------------ | :--------------------------------------------: |
| `ElasticNet Regression`              |                                                |
| `KNN`                                |                                                |
| `LARS Regression`                    |                                                |
| `Linear Regression (OLS)`            |                                                |
| `Linear Regression Lasso`            |                                                |
| `Linear Regression Ridge`            |                                                |
| `Logistic Regression`                |                                                |
| `Naive Bayes`                        |                                                |
| `SGD`                                |                                                |
| `CD`                                 |                                                |
| `QN`                                 |                                                |
| `Random Forest`                      |                                                |
| `SVC`                                |                                                |
| `SVR`                                |                                                |


#### Misc
| cuML                                       |                  node-rapids                   |
| ------------------------------------------ | :--------------------------------------------: |
| `Preprocessing Misc`                       |                                                |
| `Holt-Winters Exponential Smoothing`       |                                                |
| `Auto-regressive Integrated Moving Average`|                                                |
| `SHAP Kernel Explainer`                    |                                                |
| `SHAP Permutation Explainer`               |                                                |

#### EOF
