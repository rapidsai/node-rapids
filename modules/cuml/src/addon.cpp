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

#include <node_cuml/coo.hpp>
#include <node_cuml/metrics.hpp>
#include <node_cuml/umap.hpp>
#include <nv_node/addon.hpp>

struct node_cuml : public nv::EnvLocalAddon, public Napi::Addon<node_cuml> {
  node_cuml(Napi::Env const& env, Napi::Object exports) : nv::EnvLocalAddon(env, exports) {
    DefineAddon(exports,
                {
                  InstanceMethod("init", &node_cuml::InitAddon),
                  InstanceValue("_cpp_exports", _cpp_exports.Value()),

                  InstanceValue("COO", InitClass<nv::COO>(env, exports)),
                  InstanceValue("UMAP", InitClass<nv::UMAP>(env, exports)),
                  InstanceMethod("trustworthiness", &node_cuml::trustworthiness),
                });
  }

 private:
  Napi::Value trustworthiness(Napi::CallbackInfo const& info) {
    return nv::Metrics::trustworthiness(info);
  }
};

NODE_API_ADDON(node_cuml);
