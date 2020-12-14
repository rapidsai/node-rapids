// Copyright (c) 2020, NVIDIA CORPORATION.
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

#include <node_cudf/column.hpp>

#include <cudf/stream_compaction.hpp>
#include <cudf/table/table_view.hpp>

#include <memory>

namespace nv {

ObjectUnwrap<Column> Column::apply_boolean_mask(Column const& boolean_mask,
                                                rmm::mr::device_memory_resource* mr) const {
  auto result = std::move(cudf::apply_boolean_mask(cudf::table_view{{*this}}, boolean_mask, mr));
  std::vector<std::unique_ptr<cudf::column>> contents = std::move(result->release());
  return Column::New(std::move(contents[0]));
}

}  // namespace nv
