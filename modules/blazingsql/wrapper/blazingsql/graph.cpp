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

#include "graph.hpp"
#include "api.hpp"

#include <node_cudf/table.hpp>
#include <nv_node/utilities/args.hpp>

#include <execution_graph/graph.h>

namespace nv {

Napi::Function ExecutionGraph::Init(Napi::Env const& env, Napi::Object exports) {
  return DefineClass(env,
                     "ExecutionGraph",
                     {InstanceMethod<&ExecutionGraph::start>("start"),
                      InstanceMethod<&ExecutionGraph::result>("result"),
                      InstanceMethod<&ExecutionGraph::send_to>("sendTo")});
}

ExecutionGraph::wrapper_t ExecutionGraph::New(Napi::Env const& env,
                                              std::shared_ptr<ral::cache::graph> const& graph,
                                              nv::Wrapper<nv::ContextWrapper> const& context) {
  auto inst      = EnvLocalObjectWrap<ExecutionGraph>::New(env, {});
  inst->_graph   = graph;
  inst->_context = Napi::Persistent(context);
  return inst;
}

ExecutionGraph::ExecutionGraph(Napi::CallbackInfo const& info)
  : EnvLocalObjectWrap<ExecutionGraph>(info) {}

void ExecutionGraph::start(Napi::CallbackInfo const& info) {
  if (!_started) {
    start_execute_graph(*this, _graph->get_context_token());
    _started = true;
  }
}

Napi::Value ExecutionGraph::result(Napi::CallbackInfo const& info) {
  Napi::Env env = info.Env();
  start(info);

  if (!_results) {
    auto [names, tables] = nv::get_execute_graph_result(*this, _graph->get_context_token());
    _names               = std::move(names);
    _tables              = Napi::Persistent(Napi::Array::New(env, tables.size()));
    for (size_t i = 0; i < tables.size(); ++i) {
      _tables.Value().Set(i, nv::Table::New(env, std::move(tables[i])));
    }
    _results = true;
  }

  auto result_names = Napi::Array::New(env, _names.size());
  for (size_t i = 0; i < _names.size(); ++i) {
    result_names.Set(i, Napi::String::New(env, _names[i]));
  }

  auto result_tables = Napi::Array::New(env, _tables.Value().Length());
  for (size_t i = 0; i < _tables.Value().Length(); ++i) {
    result_tables.Set(i, _tables.Value().Get(i));
  }

  auto result = Napi::Object::New(env);
  result.Set("names", result_names);
  result.Set("tables", result_tables);
  return result;
}

Napi::Value ExecutionGraph::send_to(Napi::CallbackInfo const& info) {
  Napi::Env env          = info.Env();
  int32_t dst_ral_id     = info[0].ToNumber();
  std::string message_id = info[1].ToString();
  auto tables            = result(info).ToObject().Get("tables").As<Napi::Array>();
  auto first_table       = Table::Unwrap(tables.Get(0u).ToObject());

  auto last_kernel   = _graph->get_last_kernel();
  auto input_cache   = last_kernel->input_cache();
  auto query_context = input_cache->get_context();

  auto src_ral_id = _context.Value()->get_ral_id();
  int32_t node_id =
    query_context->getNodeIndex(ral::communication::CommunicationData::getInstance().getSelfNode());
  std::string ctx_token = std::to_string(query_context->getContextToken());

  _context.Value()->add_to_cache(
    node_id, src_ral_id, dst_ral_id, ctx_token, message_id, _names, first_table->view(), false);

  return this->Value();
}

}  // namespace nv
