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

#include <iostream>
#include <laz.hpp>

#include <cudf/io/datasource.hpp>

#include <cudf/column/column_factories.hpp>
#include <cudf/detail/sequence.hpp>
#include <cudf/scalar/scalar_factories.hpp>
#include <cudf/table/table.hpp>
#include <cudf/utilities/bit.hpp>
#include <cudf/utilities/error.hpp>
#include <cudf/utilities/traits.hpp>
#include <rmm/cuda_stream_view.hpp>
#include <rmm/device_uvector.hpp>

__global__ void parse_header(char const* laz_data) {}

void Laz::parse_header_host() {
  const size_t header_size = 227;
  auto header              = read(0, header_size, rmm::cuda_stream_default);
  std::cout << header->size() << std::endl;

  throw std::invalid_argument("end test");
}

std::unique_ptr<cudf::io::datasource::buffer> Laz::read(size_t offset,
                                                        size_t size,
                                                        rmm::cuda_stream_view stream) {
  if (_datasource->supports_device_read()) {
    return _datasource->device_read(offset, size, stream);
  }
  auto device_buffer = rmm::device_buffer(size, stream);
  CUDA_TRY(cudaMemcpyAsync(device_buffer.data(),
                           _datasource->host_read(offset, size)->data(),
                           size,
                           cudaMemcpyHostToDevice,
                           stream.value()));
  return cudf::io::datasource::buffer::create(std::move(device_buffer));
}
