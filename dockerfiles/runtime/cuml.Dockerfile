ARG FROM_IMAGE
ARG DEVEL_IMAGE

FROM ${DEVEL_IMAGE} as devel

WORKDIR /home/node

RUN rm /home/node/wrtc-0.4.7-dev.tgz           \
 && cp                                         \
    /opt/rapids/node/.npmrc                    \
    /opt/rapids/node/build/rapidsai-core-*.tgz \
    /opt/rapids/node/build/nvidia-cuda-*.tgz   \
    /opt/rapids/node/build/rapidsai-rmm-*.tgz  \
    /opt/rapids/node/build/rapidsai-cudf-*.tgz \
    /opt/rapids/node/build/rapidsai-cuml-*.tgz \
    . \
 && npm install --production --omit dev --omit peer --omit optional --legacy-peer-deps --force *.tgz


FROM ${FROM_IMAGE}

SHELL ["/bin/bash", "-c"]

ENV NVIDIA_DRIVER_CAPABILITIES compute,utility

COPY --from=devel --chown=node:node /home/node/node_modules/ /home/node/node_modules/

WORKDIR /home/node

SHELL ["/bin/bash", "-l"]

CMD ["node"]
