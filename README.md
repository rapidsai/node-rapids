# NOTE: Not in active development

# <div align="left"><img src="https://rapids.ai/assets/images/rapids_logo.png" width="90px"/>&nbsp; node-rapids</div>

[`node-rapids`](https://github.com/rapidsai/node) is a collection of Node.js native addons for the [NVIDIA RAPIDS](https://rapids.ai/) suite of GPU-accelerated data-science and ETL libraries on Linux and WSL2.

* [`@rapidsai/rmm`](https://github.com/rapidsai/node/tree/main/modules/rmm) - [RAPIDS Memory Manager](https://github.com/rapidsai/rmm)
* [`@rapidsai/cudf`](https://github.com/rapidsai/node/tree/main/modules/cudf) - [RAPIDS GPU DataFrame](https://github.com/rapidsai/cudf)
* [`@rapidsai/cuml`](https://github.com/rapidsai/node/tree/main/modules/cuml) - [RAPIDS Machine Learning Library](https://github.com/rapidsai/cuml)
* [`@rapidsai/cugraph`](https://github.com/rapidsai/node/tree/main/modules/cugraph) - [RAPIDS Graph Analytics Library](https://github.com/rapidsai/cugraph)
* [`@rapidsai/cuspatial`](https://github.com/rapidsai/node/tree/main/modules/cuspatial) - [RAPIDS Accelerated GIS Library](https://github.com/rapidsai/cuspatial)
* [`@rapidsai/sql`](https://github.com/rapidsai/node/tree/main/modules/sql) - Multi-node/multi-GPU accelerated SQL execution engine

`node-rapids` includes limited bindings to other necessary native APIs:

* [`@rapidsai/cuda`](https://github.com/rapidsai/node/tree/main/modules/cuda) - Interact with GPUs via the [CUDA Runtime APIs](https://developer.nvidia.com/cuda-toolkit)
* [`@rapidsai/glfw`](https://github.com/rapidsai/node/tree/main/modules/glfw) - Create platform-agnostic native windows with OpenGL contexts via [GLFW](https://github.com/glfw/glfw)
* [`@rapidsai/webgl`](https://github.com/rapidsai/node/tree/main/modules/webgl) - Provides a [`WebGL2RenderingContext`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext) via [OpenGL ES](https://www.khronos.org/opengles)

`node-rapids` uses the ABI-stable [`N-API`](https://nodejs.org/api/n-api.html) via [`node-addon-api`](https://github.com/nodejs/node-addon-api), so the libraries work in node and Electron without recompiling.

See the [API docs](https://rapidsai.github.io/node/) for detailed information about each module.

## Getting started

Due to native dependency distribution complexity, pre-packaged builds of the `node-rapids` modules are presently only available via our [public docker images](https://github.com/orgs/rapidsai/packages/container/package/node). See [USAGE.md](https://github.com/rapidsai/node/tree/main/USAGE.md) for more details.

## Getting involved

See [DEVELOP.md](https://github.com/rapidsai/node/blob/main/DEVELOP.md) for details on setting up a local dev environment and building the code.

We want your input! Join us in the [#node-rapids channel](https://rapids-goai.slack.com/archives/C0237JMVBRS) in the [RAPIDS-GoAI Slack workspace](https://rapids.ai/slack-invite).

## Tracking Progress

You can review [BINDINGS.md](https://github.com/rapidsai/node/blob/main/BINDINGS.md) to see which bindings have been completed for each of the RAPIDS libraries.

## Demos

Check out our [demos](https://github.com/rapidsai/node/tree/main/modules/demo) to see various visualization and compute capabilities:

* [Library of deck.gl demos in OpenGL](https://github.com/rapidsai/node/tree/main/modules/demo/deck/)
* [Cross filtering millions of rows with cuDF](https://github.com/rapidsai/node/tree/main/modules/demo/client-server)
* [Simulating & rendering with cuGraph](https://github.com/rapidsai/node/tree/main/modules/demo/graph/)
* [Querying millions of points with cuSpatial](https://github.com/rapidsai/node/tree/main/modules/demo/spatial/)
* [Multi-GPU SQL queries on GBs of CSVs](https://github.com/rapidsai/node/tree/main/modules/demo/sql/sql-cluster-server/)

Check out our [Jupyter Lab Notebook Demos](https://github.com/rapidsai/node/tree/main/modules/cudf/notebooks) to see how to use Node.js for GPU accelerated data science.

## License

This work is licensed under the [Apache-2.0 license](https://github.com/rapidsai/node/tree/main/LICENSE).

---
