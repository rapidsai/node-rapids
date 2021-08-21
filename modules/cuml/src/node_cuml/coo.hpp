// Copyright (c) 2020-2021, NVIDIA CORPORATION.
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

#include <napi.h>
#include <memory>
#include <nv_node/objectwrap.hpp>
#include <nv_node/utilities/args.hpp>

#include "raft/handle.hpp"
#include "raft/sparse/coo.cuh"

namespace nv {

struct COO : public EnvLocalObjectWrap<COO> {
  /**
   * @brief Initialize and export the COO JavaScript constructor and prototype.
   *
   * @param env The active JavaScript environment.
   * @param exports The exports object to decorate.
   * @return Napi::Function The COO constructor function.
   */
  static Napi::Function Init(Napi::Env const& env, Napi::Object exports);

  /**
   * @brief Construct a new COO instance from an raft::sparse::COO<float>.
   *
   * @param buffer Pointer the raft::sparse::COO<float> to own.
   */
  static wrapper_t New(Napi::Env const& env, std::shared_ptr<raft::sparse::COO<float>> coo);

  /**
   * @brief Construct a new COO instance.
   *
   */
  COO(CallbackArgs const& info);

  inline raft::sparse::COO<float>* get_coo() { return coo_.get(); }
  inline int get_size() { return coo_->nnz; }

 private:
  std::shared_ptr<raft::sparse::COO<float>>
    coo_;  ///< Pointer to the underlying raft::sparse::COO<float>

  Napi::Value get_size(Napi::CallbackInfo const& info);
};

}  // namespace nv
