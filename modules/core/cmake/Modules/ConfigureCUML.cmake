#=============================================================================
# Copyright (c) 2021, NVIDIA CORPORATION.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#=============================================================================

function(find_and_configure_cuml VERSION)

    include(get_cpm)

    include(ConfigureRAFT)

    _clean_build_dirs_if_not_fully_built(cuml libcuml.so)

    _set_package_dir_if_exists(cuml cuml)
    _set_package_dir_if_exists(fmt fmtlib)
    _set_package_dir_if_exists(faiss faiss)
    _set_package_dir_if_exists(Treelite treelite)
    _set_package_dir_if_exists(RapidJSON rapidjson)

    if(NOT TARGET cuml::cuml)
        _fix_rapids_cmake_dir()
        _get_major_minor_version(${VERSION} MAJOR_AND_MINOR)
        _get_update_disconnected_state(cuml ${VERSION} UPDATE_DISCONNECTED)
        CPMFindPackage(NAME     cuml
            VERSION             ${VERSION}
            GIT_REPOSITORY      https://github.com/AjayThorve/cuml.git
            GIT_TAG             fea/umap-refine
            GIT_SHALLOW         TRUE
            ${UPDATE_DISCONNECTED}
            SOURCE_SUBDIR       cpp
            OPTIONS             "SINGLEGPU ON"
                                "WITH_UCX OFF"
                                "BUILD_TESTS OFF"
                                "BUILD_BENCHMARKS OFF"
                                "DISABLE_OPENMP OFF"
                                "DETECT_CONDA_ENV OFF"
                                "ENABLE_CUMLPRIMS_MG OFF"
                                "BUILD_CUML_MG_TESTS OFF"
                                "BUILD_CUML_STD_COMMS OFF"
                                "BUILD_CUML_MPI_COMMS OFF"
                                "BUILD_CUML_TESTS OFF"
                                "BUILD_CUML_BENCH OFF"
                                "BUILD_PRIMS_TESTS OFF"
                                "BUILD_CUML_EXAMPLES OFF"
                                "BUILD_CUML_C_LIBRARY OFF"
                                "BUILD_CUML_CPP_LIBRARY ON"
                                "BUILD_CUML_PRIMS_BENCH OFF"
        )
        _fix_rapids_cmake_dir()
    endif()
    # Make sure consumers of our libs can see cuml::cuml++
    _fix_cmake_global_defaults(cuml::cuml++)
endfunction()

find_and_configure_cuml(${CUML_VERSION})
