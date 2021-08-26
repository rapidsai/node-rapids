ARG FROM_IMAGE

FROM ${FROM_IMAGE} as wrtc

RUN export DEBIAN_FRONTEND=noninteractive \
 && apt update --fix-missing \
 && apt install -y --no-install-recommends \
    python3-minimal libnvidia-encode-470 \
 && (update-alternatives --remove-all python >/dev/null 2>&1 || true) \
 && update-alternatives --install /usr/bin/python python $(realpath $(which python3)) 1 \
 && update-alternatives --set python $(realpath $(which python3)) \
 # Clean up
 && apt autoremove -y && apt clean \
 && rm -rf \
    /tmp/* \
    /var/tmp/* \
    /var/lib/apt/lists/*

COPY --chown=root:root .npmrc /root/.npmrc

ARG SCCACHE_REGION
ARG SCCACHE_BUCKET
ARG SCCACHE_CACHE_SIZE
ARG SCCACHE_IDLE_TIMEOUT

ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY

RUN --mount=type=secret,id=sccache_credentials \
    if [ -f /run/secrets/sccache_credentials ]; then \
        set -a; . /run/secrets/sccache_credentials; set +a; \
    fi; \
    mkdir -p /opt/node-webrtc/build \
 && git clone --branch node-webrtc-nvenc \
    https://github.com/trxcllnt/node-webrtc.git \
    /opt/node-webrtc-nvenc \
 && cd /opt/node-webrtc-nvenc \
 && env \
    SKIP_DOWNLOAD=1 \
    CMAKE_C_COMPILER_LAUNCHER=/usr/bin/sccache \
    CMAKE_CXX_COMPILER_LAUNCHER=/usr/bin/sccache \
    CMAKE_CUDA_COMPILER_LAUNCHER=/usr/bin/sccache \
    npm install --no-audit --no-fund \
 && mv /opt/node-webrtc-nvenc/lib /opt/node-webrtc/ \
 && mv /opt/node-webrtc-nvenc/build/Release /opt/node-webrtc/build/ \
 && mv /opt/node-webrtc-nvenc/{README,LICENSE,THIRD_PARTY_LICENSES}.md /opt/node-webrtc/ \
 && bash -c 'echo -e "{\n\
  \"name\": \"wrtc\",\n\
  \"version\": \"0.4.7-dev\",\n\
  \"author\": \"Alan K <ack@modeswitch.org> (http://blog.modeswitch.org)\",\n\
  \"homepage\": \"https://github.com/node-webrtc/node-webrtc\",\n\
  \"bugs\": \"https://github.com/node-webrtc/node-webrtc/issues\",\n\
  \"license\": \"BSD-2-Clause\",\n\
  \"main\": \"lib/index.js\",\n\
  \"browser\": \"lib/browser.js\",\n\
  \"repository\": {\n\
    \"type\": \"git\",\n\
    \"url\": \"http://github.com/node-webrtc/node-webrtc.git\"\n\
  },\n\
  \"files\": [\n\
    \"lib\",\n\
    \"build\",\n\
    \"README.md\",\n\
    \"LICENSE.md\",\n\
    \"THIRD_PARTY_LICENSES.md\"\n\
  ]\n\
}\n\
" | tee /opt/node-webrtc/package.json >/dev/null' \
 && cd / \
 && npm pack --pack-destination /home/node /opt/node-webrtc \
 && rm -rf /opt/node-webrtc-nvenc /opt/node-webrtc \
 && chown -R node:node /home/node \
 && npm install --global --unsafe-perm --no-audit --no-fund /home/node/wrtc-0.4.7-dev.tgz

FROM ${FROM_IMAGE}

ENV NVIDIA_DRIVER_CAPABILITIES all

RUN export DEBIAN_FRONTEND=noninteractive \
 && apt update --fix-missing \
 && apt install -y --no-install-recommends \
    # X11 dependencies
    libxi-dev libxrandr-dev libxinerama-dev libxcursor-dev \
    # node-canvas dependencies
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    # GLFW Wayland dependencies
    extra-cmake-modules libwayland-dev wayland-protocols libxkbcommon-dev \
    # GLEW dependencies
    build-essential libxmu-dev libxi-dev libgl1-mesa-dev libegl1-mesa-dev libglu1-mesa-dev \
    # cuSpatial dependencies
    libgdal-dev \
    # blazingSQL dependencies
    maven openjdk-8-jdk libboost-regex-dev libboost-system-dev libboost-filesystem-dev \
    # UCX build dependencies
    automake autoconf libtool \
    # UCX runtime dependencies
    libibverbs-dev librdmacm-dev libnuma-dev libhwloc-dev \
 # Install UCX
 && git clone --depth 1 --branch v1.10.x https://github.com/openucx/ucx.git /tmp/ucx \
 && curl -o /tmp/cuda-alloc-rcache.patch \
         -L https://raw.githubusercontent.com/rapidsai/ucx-split-feedstock/11ad7a3c1f25514df8064930f69c310be4fd55dc/recipe/cuda-alloc-rcache.patch \
 && cd /tmp/ucx && git apply /tmp/cuda-alloc-rcache.patch && rm /tmp/cuda-alloc-rcache.patch \
 && sed -i 's/io_demo_LDADD =/io_demo_LDADD = $(CUDA_LDFLAGS)/' /tmp/ucx/test/apps/iodemo/Makefile.am \
 && /tmp/ucx/autogen.sh && mkdir /tmp/ucx/build && cd /tmp/ucx/build \
 && ../contrib/configure-release \
    --prefix=/usr/local \
    --without-java --with-cuda=/usr/local/cuda \
    --enable-mt CPPFLAGS=-I/usr/local/cuda/include \
 && make -C /tmp/ucx/build -j install \
 # Clean up
 && apt autoremove -y && apt clean \
 && rm -rf \
    /tmp/* \
    /var/tmp/* \
    /var/lib/apt/lists/*

COPY --from=wrtc --chown=root:root /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=wrtc --chown=node:node /home/node/wrtc-0.4.7-dev.tgz /home/node/wrtc-0.4.7-dev.tgz

WORKDIR /opt/rapids/node

USER node
