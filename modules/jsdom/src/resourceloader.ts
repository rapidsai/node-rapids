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

import * as jsdom from 'jsdom';
import * as Url from 'url';

const btoa = require('btoa') as (x: string) => string;
const svg2img = require('svg2img') as typeof import('svg2img').default;

export class ImageLoader extends jsdom.ResourceLoader {
  constructor(private _url: string) { super(); }
  fetch(url: string, options: jsdom.FetchOptions) {
    // Hack since JSDOM 16.2.2: If loading a relative file
    // from our dummy localhost URI, translate to a file:// URI.
    if (url.startsWith(this._url)) { url = url.slice(this._url.length); }
    const isDataURL = url && url.startsWith('data:');
    if (isDataURL) {
      const result = this._loadDataURL(url, options);
      if (result) { return <any>result; }
    }
    const isFilePath = !isDataURL && !Url.parse(url).protocol;
    return super.fetch(isFilePath ? `file://${process.cwd()}/${url}` : url, options);
  }
  private _loadDataURL(url: string, options: jsdom.FetchOptions) {
    const {mediaType, encoding, contents} = parseDataURLPrefix(url);
    switch (mediaType) {
      case 'image/svg+xml':  //
        return loadSVGDataUrl(encoding, contents, options);
      default: break;
    }
    return undefined;
  }
}

function parseDataURLPrefix(url: string) {
  const comma           = url.indexOf(',', 5);
  const prefix          = url.slice(5, url.indexOf(',', 5));
  let mediaType         = 'text/plain';
  let encoding          = '';
  [mediaType, encoding] = prefix.indexOf(';') ? prefix.split(';') : [prefix, ''];
  return {mediaType, encoding, prefix, contents: url.slice(comma + 1)};
}

function loadSVGDataUrl(encoding: string, contents: string, {element}: jsdom.FetchOptions) {
  const options = {width: element?.offsetWidth, height: element?.offsetHeight};
  const data    = (() => {
    switch (encoding) {
      case 'base64': return btoa(contents).trim();
      default: return decodeURIComponent(contents).trim();
    }
  })();
  return new Promise<Buffer>((resolve, reject) => {
    svg2img(data, options, (err, data: Buffer) => {  //
      err == null ? resolve(data) : reject(err);
    });
  });
}
