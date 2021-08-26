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

export const defaultContextConfigValues: Record<string, unknown> = {
  JOIN_PARTITION_SIZE_THRESHOLD: 400000000,
  CONCATENATING_CACHE_NUM_BYTES_TIMEOUT: 100,
  MAX_JOIN_SCATTER_MEM_OVERHEAD: 500000000,
  MAX_NUM_ORDER_BY_PARTITIONS_PER_NODE: 8,
  NUM_BYTES_PER_ORDER_BY_PARTITION: 400000000,
  MAX_DATA_LOAD_CONCAT_CACHE_BYTE_SIZE: 400000000,
  FLOW_CONTROL_BYTES_THRESHOLD:
    18446744073709551615,  // https://en.cppreference.com/w/cpp/types/numeric_limits/max
  MAX_ORDER_BY_SAMPLES_PER_NODE: 10000,
  BLAZING_PROCESSING_DEVICE_MEM_CONSUMPTION_THRESHOLD: 0.9,
  BLAZING_DEVICE_MEM_CONSUMPTION_THRESHOLD: 0.6,
  BLAZ_HOST_MEM_CONSUMPTION_THRESHOLD: 0.75,
  BLAZING_LOGGING_DIRECTORY: 'blazing_log',
  BLAZING_CACHE_DIRECTORY: '/tmp/',
  BLAZING_LOCAL_LOGGING_DIRECTORY: 'blazing_log',
  MEMORY_MONITOR_PERIOD: 50,
  MAX_KERNEL_RUN_THREADS: 16,
  EXECUTOR_THREADS: 10,
  MAX_SEND_MESSAGE_THREADS: 20,
  LOGGING_LEVEL: 'trace',
  LOGGING_FLUSH_LEVEL: 'warn',
  ENABLE_GENERAL_ENGINE_LOGS: false,
  ENABLE_COMMS_LOGS: false,
  ENABLE_TASK_LOGS: false,
  ENABLE_OTHER_ENGINE_LOGS: false,
  LOGGING_MAX_SIZE_PER_FILE: 1073741824,  // 1 GB
  TRANSPORT_BUFFER_BYTE_SIZE: 1048576,    // 1 MB in bytes
  TRANSPORT_POOL_NUM_BUFFERS: 1000,
  PROTOCOL: 'AUTO',
  REQUIRE_ACKNOWLEDGE: false,
};

export const defaultClusterConfigValues: Record<string, unknown> = {
  PROTOCOL: 'UCX'
};
