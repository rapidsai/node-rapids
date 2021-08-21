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

#pragma once

// todo: including the below headers with undef guards is the only way cuml builds with raft
// locally
#include "cuml/manifold/umap.hpp"
#include "cuml/manifold/umapparams.hpp"

#include <node_cudf/column.hpp>
#include <node_cuml/coo.hpp>
#include <nv_node/objectwrap.hpp>
#include <nv_node/utilities/args.hpp>

#include <cuml/common/device_buffer.hpp>

#include <raft/handle.hpp>
#include "raft/sparse/coo.cuh"

#include <napi.h>

namespace nv {
/**
 * @brief An owning wrapper around a cuml::manifold::UMAP
 *
 */
struct UMAP : public EnvLocalObjectWrap<UMAP> {
  /**
   * @brief Initialize and export the UMAP JavaScript constructor and prototype
   *
   * @param env The active JavaScript environment
   * @param exports The exports object to decorate
   * @return Napi::Function The UMAP constructor function
   */
  static Napi::Function Init(Napi::Env const& env, Napi::Object exports);

  /**
   * @brief Construct a new UMAP instance from C++.
   */
  static wrapper_t New(Napi::Env const& env);

  /**
   * @brief Construct a new UMAP instance from JavaScript
   *
   * @param args
   */
  UMAP(CallbackArgs const& args);

  void fit(DeviceBuffer::wrapper_t const& X,
           cudf::size_type n_samples,
           cudf::size_type n_features,
           DeviceBuffer::wrapper_t const& y,
           DeviceBuffer::wrapper_t const& knn_indices,
           DeviceBuffer::wrapper_t const& knn_dists,
           bool convert_dtype,
           DeviceBuffer::wrapper_t const& embeddings);

  void refine(DeviceBuffer::wrapper_t const& X,
              cudf::size_type n_samples,
              cudf::size_type n_features,
              DeviceBuffer::wrapper_t const& y,
              COO::wrapper_t const& coo,
              bool convert_dtype,
              DeviceBuffer::wrapper_t const& embeddings);

  COO::wrapper_t get_graph(DeviceBuffer::wrapper_t const& X,
                           cudf::size_type n_samples,
                           cudf::size_type n_features,
                           DeviceBuffer::wrapper_t const& y,
                           bool convert_dtype);

  void transform(DeviceBuffer::wrapper_t const& X,
                 cudf::size_type n_samples,
                 cudf::size_type n_features,
                 DeviceBuffer::wrapper_t const& knn_indices,
                 DeviceBuffer::wrapper_t const& knn_dists,
                 DeviceBuffer::wrapper_t const& orig_X,
                 int orig_n,
                 bool convert_dtype,
                 DeviceBuffer::wrapper_t const& embeddings,
                 DeviceBuffer::wrapper_t const& transformed);

 private:
  ML::UMAPParams params_{};
  Napi::Value fit(Napi::CallbackInfo const& info);
  Napi::Value refine(Napi::CallbackInfo const& info);
  Napi::Value get_graph(Napi::CallbackInfo const& info);
  Napi::Value fit_sparse(Napi::CallbackInfo const& info);
  Napi::Value transform(Napi::CallbackInfo const& info);
  Napi::Value transform_sparse(Napi::CallbackInfo const& info);
  Napi::Value n_neighbors(Napi::CallbackInfo const& info);
  Napi::Value n_components(Napi::CallbackInfo const& info);
  Napi::Value n_epochs(Napi::CallbackInfo const& info);
  Napi::Value learning_rate(Napi::CallbackInfo const& info);
  Napi::Value min_dist(Napi::CallbackInfo const& info);
  Napi::Value spread(Napi::CallbackInfo const& info);
  Napi::Value set_op_mix_ratio(Napi::CallbackInfo const& info);
  Napi::Value local_connectivity(Napi::CallbackInfo const& info);
  Napi::Value repulsion_strength(Napi::CallbackInfo const& info);
  Napi::Value negative_sample_rate(Napi::CallbackInfo const& info);
  Napi::Value transform_queue_size(Napi::CallbackInfo const& info);
  Napi::Value a(Napi::CallbackInfo const& info);
  Napi::Value b(Napi::CallbackInfo const& info);
  Napi::Value initial_alpha(Napi::CallbackInfo const& info);
  Napi::Value init(Napi::CallbackInfo const& info);
  Napi::Value target_n_neighbors(Napi::CallbackInfo const& info);
  Napi::Value target_weight(Napi::CallbackInfo const& info);
  Napi::Value target_metric(Napi::CallbackInfo const& info);
  Napi::Value verbosity(Napi::CallbackInfo const& info);
  Napi::Value random_state(Napi::CallbackInfo const& info);
};
}  // namespace nv
