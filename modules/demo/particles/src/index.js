/**
 * Copyright (c) 2022 NVIDIA Corporation
 */

// import drawCube from "./drawBackground"

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

const regl = require('regl')();
const mat4 = require('gl-mat4');

const NUM_POINTS = 1000000;
const VERT_SIZE = 4 * (4 + 3)

const props = {
  zoomLevel: 0,
  centerX: 0,
  centerY: 0,
  angle: 0
};


window.addEventListener('wheel', (event) => {
  const zoom = event.deltaY > 0 ? 1 : -1;
  props.zoomLevel = props.zoomLevel + zoom;
});

window.addEventListener('mousedown', (event) => {
  props.isHeld = true;
});
window.addEventListener('mouseup', (event) => {
  props.isHeld = false;
});
window.addEventListener('mousemove', (event) => {
  if(props.isHeld) {
    props.centerX = props.centerX + event.movementX;
    props.centerY = props.centerY + event.movementY;
  }
});

setInterval(() => {
  props.angle = (props.angle + 1)
}, 16);

const numGenerator = {
  *[Symbol.iterator]() {
    let i = 0;
    while(i < NUM_POINTS * 4){
      yield [
        Math.random() * 100 - 20.0,
        Math.random() * 100 - 20.0,
        1.0,
        1.0,
        Math.random() > 0.5 ? 255 : 0,
        Math.random() > 0.5 ? 255 : 0,
        Math.random() > 0.5 ? 255 : 0,
      ]
      i ++;
    }
  }
}
const pointBuffer = regl.buffer([...numGenerator]);

var cubePosition = [
  //[-0.5, +0.5, 0.1], [+0.5, +0.5, 0.1], [+0.5, -0.5, 0.1], [-0.5, -0.5, 0.1] // positive z face.
  [-50, 50, 0.1], [50, 50, 0.1], [50, -50, 0.1], [-50, -50, 0.1]
]

var cubeUv = [
  [1.0, 0.0], [0.0, 0.0], [0.0, 1.0], [1.0, 1.0], // positive z face.
]

const cubeElements = [
  [0, 1, 2], [0, 3, 2]       // positive z face.
]

const drawCube = regl({
  frag: `
precision mediump float;
varying vec2 vUv;
uniform sampler2D tex;
void main () {
  gl_FragColor = texture2D(tex,vUv);
}`,
  vert: `
precision mediump float;
attribute vec3 position;
attribute vec2 uv;
varying vec2 vUv;
uniform mat4 projection, view;
void main() {
  vUv = uv;
  vec3 pos = -position;
  gl_Position = projection * view * vec4(pos, 1);
}`,
  attributes: {
    position: cubePosition,
    uv: cubeUv
  },
  elements: cubeElements,
  uniforms: {
    view: ({tick}, props) => getBackgroundViewMatrix(props.props),
    projection: ({ viewportWidth, viewportHeight }) => getProjectionMatrix(),
    tex: regl.prop('data')
  }
})

const drawParticles = regl({
  vert: `
precision mediump float;
attribute vec4 freq;
attribute vec3 color;
uniform float scale;
uniform float time;
uniform mat4 view, projection;
varying vec3 fragColor;
void main() {
  vec3 position = freq.xyz;
  gl_PointSize = scale;
  gl_Position = projection * view * vec4(position, 1);
  fragColor = color;
}`,
  frag: `
precision lowp float;
varying vec3 fragColor;
void main() {
  if (length(gl_PointCoord.xy - 0.5) > 0.5) {
    discard;
  }
  gl_FragColor = vec4(fragColor, 1);
}`,
  attributes: {
    freq: {
      buffer: pointBuffer,
      stride: VERT_SIZE,
      offset: 0
    },
    color: {
      buffer: pointBuffer,
      stride: VERT_SIZE,
      offset: 16
    }
  },
  uniforms: {
    view: ({ tick }, props) => getPointsViewMatrix(props),
    scale: ({tick}, props) => {
      return 40 - (25 + Math.min(props.zoomLevel, 13));
    },
    projection: ({ viewportWidth, viewportHeight }) => getProjectionMatrix(),
    time: ({ tick }) => tick * 0.001
  },
  count: NUM_POINTS,
  primitive: 'points'
})

const getBackgroundViewMatrix = (props) => {
  const t = 0; //0.015 * (props.angle);
  const lookAtZ = 4 * Math.pow(1.1, props.zoomLevel);
  const result = mat4.lookAt([],
    [-props.centerX / 100, -props.centerY / 100, lookAtZ],
    [-props.centerX / 100, -props.centerY / 100, 0],
    [0, 1, 0]);
  const translation = mat4.translate([], result, [0, 0, 0]);
  const rotation = mat4.rotate([], translation, t, [t, t, 1]);
  return rotation;
}

const getPointsViewMatrix = (props) => {
  const t = 0;//0.015 * (props.angle);
  const lookAtZ = 4 * Math.pow(1.1, props.zoomLevel);
  const result = mat4.lookAt([],
    [props.centerX / 100, props.centerY / 100, lookAtZ],
    [props.centerX / 100, props.centerY / 100, 0],
    [0, -1, 0]);
  const translation = mat4.translate([], result, [-25, -25, 0]);
  const rotation = mat4.rotate([], translation, t, [t, t, 1]);
  return rotation;
}

const getProjectionMatrix = (props) => {

return mat4.frustum([],
  -1, 1, 1, -1, 1, 1000)
};

// Try to put an image in a context2d buffer
const backgroundCanvas = document.createElement('div');
backgroundCanvas.innerHTML = "<canvas id='hiddenBackground' width=3000 height=3000 style='visibility: hidden'/>"
const image = new Image();
image.src = "./usa_map.png";
image.style = "visibility: hidden";
backgroundCanvas.appendChild(image);
document.body.appendChild(backgroundCanvas);
const canvas = document.getElementById('hiddenBackground');
image.onload = () => {
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  const imWidth = image.width;
  const imHeight = image.height;
  const imageData = context.getImageData(0, 0, imWidth, imHeight);

  const data = regl.texture({
    width: imWidth,
    height: imHeight,
    data: imageData.data
  });

  const tick = regl.frame(() => {
    regl.clear({
      depth: 1,
      color: [0, 0, 0, 0]
    });
    drawParticles(props);
    drawCube({data, props});
  });

}

ReactDOM.render(React.createElement(App), document.getElementById('root'));
