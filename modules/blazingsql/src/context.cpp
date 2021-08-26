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

#include "context.hpp"

#include <blazingsql/api.hpp>
#include <node_cudf/table.hpp>

namespace nv {

Napi::Function Context::Init(Napi::Env const &env, Napi::Object exports) {
  return DefineClass(env,
                     "Context",
                     {InstanceMethod<&Context::run_generate_graph>("runGenerateGraph"),
                      InstanceMethod<&Context::send_to_cache>("sendToCache"),
                      InstanceMethod<&Context::pull_from_cache>("pullFromCache")});
}

Context::wrapper_t Context::New(Napi::Env const &env) {
  return EnvLocalObjectWrap<Context>::New(env);
}

Context::Context(Napi::CallbackInfo const &info) : EnvLocalObjectWrap<Context>(info) {
  auto env                = info.Env();
  NapiToCPP::Object props = info[0];
  auto result_context     = nv::initialize(env, props);
  this->context           = Napi::Persistent(result_context);
}

Napi::Value Context::run_generate_graph(Napi::CallbackInfo const &info) {
  auto env = info.Env();
  nv::CallbackArgs args{info};

  uint32_t master_index                = args[0];
  std::vector<std::string> worker_ids  = args[1];
  Napi::Array data_frames              = args[2];
  std::vector<std::string> table_names = args[3];
  std::vector<std::string> table_scans = args[4];
  int32_t ctx_token                    = args[5];
  std::string query                    = args[6];
  std::string sql                      = args[8];
  std::string current_timestamp        = args[9];
  auto config_options                  = [&] {
    std::map<std::string, std::string> config{};
    auto prop = args[7];
    if (!prop.IsNull() && prop.IsObject()) {
      auto opts = prop.As<Napi::Object>();
      auto keys = opts.GetPropertyNames();
      for (auto i = 0u; i < keys.Length(); ++i) {
        std::string name = keys.Get(i).ToString();
        config[name]     = opts.Get(name).ToString();
        if (config[name] == "true") {
          config[name] = "True";
        } else if (config[name] == "false") {
          config[name] = "False";
        }
      }
    }
    return config;
  }();

  std::vector<cudf::table_view> table_views;
  std::vector<std::vector<std::string>> column_names;

  table_views.reserve(data_frames.Length());
  column_names.reserve(data_frames.Length());

  auto tables = Napi::Array::New(env, data_frames.Length());

  for (std::size_t i = 0; i < data_frames.Length(); ++i) {
    nv::NapiToCPP::Object df       = data_frames.Get(i);
    std::vector<std::string> names = df.Get("names");
    Napi::Function asTable         = df.Get("asTable");
    nv::Table::wrapper_t table     = asTable.Call(df.val, {}).ToObject();

    tables.Set(i, table);
    table_views.push_back(*table);
    column_names.push_back(names);
  }

  return nv::run_generate_graph(env,
                                this->context.Value(),
                                master_index,
                                worker_ids,
                                table_views,
                                column_names,
                                table_names,
                                table_scans,
                                ctx_token,
                                query,
                                sql,
                                current_timestamp,
                                config_options);
}

void Context::send_to_cache(Napi::CallbackInfo const &info) {
  nv::CallbackArgs args{info};

  int32_t dst_ral_id     = args[0].ToNumber();
  int ctx_token          = args[1];
  std::string message_id = args[2];
  Napi::Object dataframe = args[3].ToObject();

  nv::NapiToCPP::Object df       = dataframe;
  std::vector<std::string> names = df.Get("names");
  Napi::Function asTable         = df.Get("asTable");
  nv::Table::wrapper_t table     = asTable.Call(df.val, {}).ToObject();

  this->context.Value()->add_to_cache(-1,
                                      this->context.Value()->get_ral_id(),
                                      dst_ral_id,
                                      std::to_string(ctx_token),
                                      message_id,
                                      names,
                                      table->view(),
                                      false);
}

Napi::Value Context::pull_from_cache(Napi::CallbackInfo const &info) {
  auto env = info.Env();
  nv::CallbackArgs args{info};

  std::string message_id = args[0];

  auto [bsql_names, bsql_table] = this->context.Value()->pull_from_cache(message_id, true);

  auto result_names = Napi::Array::New(env, bsql_names.size());
  for (size_t i = 0; i < bsql_names.size(); ++i) {
    result_names.Set(i, Napi::String::New(env, bsql_names[i]));
  }

  auto result = Napi::Object::New(env);
  result.Set("names", result_names);
  result.Set("table", nv::Table::New(env, std::move(bsql_table)));
  return result;
}

}  // namespace nv
