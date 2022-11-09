/**
 * Copyright (c) 2022 NVIDIA Corporation
 */

// import drawCube from "./drawBackground"

import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import background from './background';
import points from './points';

const {tableFromIPC}  = require('apache-arrow');
const regl            = require('regl')();
const mat4            = require('gl-mat4');
const {getProjection} = require('./matrices');

const worldCoords = [
  -135,
  49,  // top right
  -60,
  49,  // top left
  -60,
  17.5,  // bottom left
  -135,
  17.5,  // bottom right
];
const screenCoords = [
  0,
  0,
  document.documentElement.clientWidth,
  0,
  0,
  document.documentElement.clientHeight,
  document.documentElement.clientWidth,
  document.documentElement.clientHeight,
];

const props = {
  // Define world coords
  w: () => [...worldCoords, 0, 0, 0, 0, 0, 0, 0, 0],
  // Define screen coords
  s: () => [...screenCoords, 0, 0, 0, 0, 0, 0, 0, 0],
  zoomLevel: 0,
  angle: 0,
  screenWidth: document.documentElement.clientHeight,
  screenHeight: document.documentElement.clientWidth,
  centerX: document.documentElement.clientWidth / 2.0,
  centerY: document.documentElement.clientHeight / 2.0,
};

window.addEventListener('wheel', (event) => {
  const zoom      = event.deltaY > 0 ? 1 : -1;
  props.zoomLevel = props.zoomLevel + zoom;
  console.log(event);
});

window.addEventListener('mousedown', (event) => { props.isHeld = true; });
window.addEventListener('mouseup', (event) => { props.isHeld = false; });
window.addEventListener('mousemove', (event) => {
  if (props.isHeld) {
    props.centerX = props.centerX + event.movementX;
    props.centerY = props.centerY + event.movementY;
  }
});

setInterval(() => {props.angle = (props.angle + 1)}, 16);

const SERVER           = 'http://localhost';
const PORT             = '3010';
const READ_CSV_URL     = '/gpu/DataFrame/readCSV';
const READ_CSV_OPTIONS = {
  method: 'POST',
  headers: {
    'access-control-allow-origin': '*',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'Content-Type'
  },
  // body: '"NAD_State_ZIP_LonLat.csv"',
  body: '"NAD_Shuffled_1000000.csv"',
};
const FETCH_POINTS_URL     = '/particles/get_shader_column';
const FETCH_POINTS_OPTIONS = {
  method: 'GET',
  headers: {'access-control-allow-origin': '*', 'access-control-allow-headers': 'Content-Type'},
};

(async () => {
  var hostPoints = undefined;
  try {
    const readCsvResultPromise = await fetch(SERVER + ':' + PORT + READ_CSV_URL, READ_CSV_OPTIONS);
    const readCsvResult        = await readCsvResultPromise.json()
    const csvPath              = readCsvResult.params;
    const remotePoints =
      await fetch(SERVER + ':' + PORT + FETCH_POINTS_URL + '/' + csvPath, FETCH_POINTS_OPTIONS);
    const arrowTable = await tableFromIPC(remotePoints);
    hostPoints       = arrowTable.getChild('gpu_buffer').toArray();
    points({hostPoints, props});
    background(props);
  } catch (e) { console.log(e); }
})();

ReactDOM.render(React.createElement(App), document.getElementById('root'));
