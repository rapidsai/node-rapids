ARG FROM_IMAGE
ARG DEVEL_IMAGE

FROM ${DEVEL_IMAGE} as devel

WORKDIR /home/node

RUN cp                                               \
    /opt/rapids/node/.npmrc                          \
    /opt/rapids/node/build/rapidsai-core-*.tgz       \
    /opt/rapids/node/build/nvidia-cuda-*.tgz         \
    /opt/rapids/node/build/nvidia-glfw-*.tgz         \
    /opt/rapids/node/build/nvidia-webgl-*.tgz        \
    /opt/rapids/node/build/rapidsai-rmm-*.tgz        \
    /opt/rapids/node/build/rapidsai-cudf-*.tgz       \
    /opt/rapids/node/build/rapidsai-blazingsql-*.tgz \
    /opt/rapids/node/build/rapidsai-cuml-*.tgz       \
    /opt/rapids/node/build/rapidsai-cugraph-*.tgz    \
    /opt/rapids/node/build/rapidsai-cuspatial-*.tgz  \
    /opt/rapids/node/build/rapidsai-deck.gl-*.tgz    \
    /opt/rapids/node/build/rapidsai-jsdom-*.tgz      \
    /opt/rapids/node/build/rapidsai-demo-*.tgz       \
    . \
 && npm install --production --omit dev --omit peer --omit optional --legacy-peer-deps --force *.tgz


FROM ${FROM_IMAGE}

SHELL ["/bin/bash", "-c"]

ENV NVIDIA_DRIVER_CAPABILITIES all

USER root

# Install UCX
COPY --from=devel /usr/local/bin/ucx_info         /usr/local/bin/
COPY --from=devel /usr/local/bin/ucx_perftest     /usr/local/bin/
COPY --from=devel /usr/local/bin/ucx_read_profile /usr/local/bin/
COPY --from=devel /usr/local/include/ucm          /usr/local/include/
COPY --from=devel /usr/local/include/ucp          /usr/local/include/
COPY --from=devel /usr/local/include/ucs          /usr/local/include/
COPY --from=devel /usr/local/include/uct          /usr/local/include/
COPY --from=devel /usr/local/lib/libucm.a         /usr/local/lib/
COPY --from=devel /usr/local/lib/libucm.la        /usr/local/lib/
COPY --from=devel /usr/local/lib/libucm.so.0.0.0  /usr/local/lib/
COPY --from=devel /usr/local/lib/libucp.a         /usr/local/lib/
COPY --from=devel /usr/local/lib/libucp.la        /usr/local/lib/
COPY --from=devel /usr/local/lib/libucp.so.0.0.0  /usr/local/lib/
COPY --from=devel /usr/local/lib/libucs.a         /usr/local/lib/
COPY --from=devel /usr/local/lib/libucs.la        /usr/local/lib/
COPY --from=devel /usr/local/lib/libucs.so.0.0.0  /usr/local/lib/
COPY --from=devel /usr/local/lib/libuct.a         /usr/local/lib/
COPY --from=devel /usr/local/lib/libuct.la        /usr/local/lib/
COPY --from=devel /usr/local/lib/libuct.so.0.0.0  /usr/local/lib/
COPY --from=devel /usr/local/lib/pkgconfig        /usr/local/lib/
COPY --from=devel /usr/local/lib/ucx              /usr/local/lib/

RUN cd /usr/local/lib \
 && ln -s libucm.so.0.0.0 libucm.so \
 && ln -s libucp.so.0.0.0 libucp.so \
 && ln -s libucs.so.0.0.0 libucs.so \
 && ln -s libuct.so.0.0.0 libuct.so \
 \
 # Install dependencies
 && export DEBIAN_FRONTEND=noninteractive \
 && apt update --fix-missing \
 && apt install -y --no-install-recommends \
    # cuSpatial dependencies
    libgdal-dev \
    # X11 dependencies
    libxrandr-dev libxinerama-dev libxcursor-dev \
    # Wayland dependencies
    libwayland-dev wayland-protocols libxkbcommon-dev \
    # GLEW dependencies
    libgl1-mesa-dev libegl1-mesa-dev libglu1-mesa-dev \
    # UCX runtime dependencies
    libibverbs-dev librdmacm-dev libnuma-dev libhwloc-dev \
    # node-canvas dependencies
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    # blazingSQL dependencies
    openjdk-8-jre libboost-regex-dev libboost-system-dev libboost-filesystem-dev \
 # Clean up
 && apt autoremove -y && apt clean \
 && rm -rf \
    /tmp/* \
    /var/tmp/* \
    /var/lib/apt/lists/*

COPY --from=devel --chown=node:node /home/node/node_modules/ /home/node/node_modules/

USER node

WORKDIR /home/node

SHELL ["/bin/bash", "-l"]

CMD ["node"]
