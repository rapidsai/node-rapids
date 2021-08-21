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

#include <node_cuda/utilities/error.hpp>
#include <node_cudf/utilities/buffer.hpp>
#include <node_cudf/utilities/napi_to_cpp.hpp>
#include <node_rmm/device_buffer.hpp>

#include <node_cuml/coo.hpp>

#include <napi.h>

namespace nv {

Napi::Function COO::Init(Napi::Env const& env, Napi::Object exports) {
  return DefineClass(env, "COO", {InstanceMethod<&COO::get_size>("getSize")});
}

COO::wrapper_t COO::New(Napi::Env const& env, std::shared_ptr<raft::sparse::COO<float>> coo) {
  auto buf  = EnvLocalObjectWrap<COO>::New(env);
  buf->coo_ = std::move(coo);
  return buf;
}

COO::COO(CallbackArgs const& args) : EnvLocalObjectWrap<COO>(args) {
  raft::handle_t handle;
  auto coo_ =
    std::make_shared<raft::sparse::COO<float>>(handle.get_device_allocator(), handle.get_stream());
  this->coo_ = std::move(coo_);
}

Napi::Value COO::get_size(Napi::CallbackInfo const& info) {
  return Napi::Value::From(info.Env(), get_size());
}

}  // namespace nv
