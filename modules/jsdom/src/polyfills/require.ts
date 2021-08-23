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

import * as Module from 'module';
import * as path from 'path';
import * as vm from 'vm';

/**
 * Creates a custom Module object which runs all required scripts in a provided vm context.
 */
export function createContextRequire(options: CreateContextRequireOptions) {
  return createRequire(new ContextModule(options));
}

let moduleId = 0;

/**
 * Patch nodejs module system to support context,
 * compilation and module resolution overrides.
 */
const Module_: any      = Module;
const originalLoad      = Module_._load;
const originalResolve   = Module_._resolveFilename;
const originalCompile   = Module_.prototype._compile;
const originalProtoLoad = Module_.prototype.load;

interface CreateContextRequireOptions {
  /** The directory from which to resolve requires for this module. */
  dir: string;
  /** A vm context which will be used as the context for any required modules. */
  context: any;
  /** A function to which will override the native module resolution. */
  resolve?: (from: string, request: string) => string;
  /** An object containing any context specific require hooks to be used in this module. */
  extensions?: NodeJS.RequireExtensions;
}

class ContextModule extends Module {
  declare public _context: any;
  declare public _cache: any;
  declare public _relativeResolveCache: Record<string, string>;
  declare public _resolve?: (from: string, request: string) => string;
  declare public _hooks?: NodeJS.RequireExtensions;

  /**
   * Custom nodejs Module implementation which uses a provided
   * resolver, require hooks, and context.
   */
  constructor({dir, context, resolve, extensions}: CreateContextRequireOptions) {
    const filename = path.join(dir, `index.${moduleId++}.ctx`);
    super(filename);

    this.filename              = filename;
    this._context              = context;
    this._resolve              = resolve;
    this._hooks                = extensions;
    this._cache                = {};
    this._relativeResolveCache = {};
    this.paths                 = Module_._nodeModulePaths(dir);

    if (!vm.isContext(context) && typeof context.runVMScript !== 'function' &&
        typeof context.getInternalVMContext !== 'function') {
      vm.createContext(context);
    }
  }
}

/**
 * Use custom require cache for context modules
 *
 * @param request The file to resolve.
 * @param parentModule The module requiring this file.
 * @param isMain
 */
function _load(request: string, parentModule: Module, isMain: boolean): string {
  const isNotBuiltin  = Module.builtinModules.indexOf(request) === -1;
  const contextModule = isNotBuiltin && findNearestContextModule(parentModule);

  if (!contextModule) { return originalLoad(request, parentModule, isMain); }

  const cached = contextModule._cache[_resolveFilename(request, parentModule, isMain)];
  if (cached) {
    if (parentModule.children.indexOf(cached) === -1) { parentModule.children.push(cached); }

    return cached.exports;
  }

  const previousCache = Module_._cache;
  Module_._cache      = contextModule._cache;

  try {
    return originalLoad(request, parentModule, isMain);
  } finally { Module_._cache = previousCache; }
}

/**
 * Hijack native file resolution using closest custom resolver.
 *
 * @param request The file to resolve.
 * @param parentModule The module requiring this file.
 */
function _resolveFilename(
  request: string, parentModule: Module, isMain?: boolean, options?: {paths?: string[]|undefined;}):
  string {
  const isNotBuiltin  = Module.builtinModules.indexOf(request) === -1;
  const contextModule = isNotBuiltin && findNearestContextModule(parentModule);

  if (contextModule) {
    const resolver = contextModule._resolve;

    if (resolver) {
      // Normalize paths for custom resolvers.
      const dir = path.dirname(parentModule.filename);

      if (path.isAbsolute(request)) {
        request = path.relative(dir, request);

        if (request[0] !== '.') { request = './' + request; }
      }

      const relResolveCacheKey = `${dir}\x00${request}`;
      return (contextModule._relativeResolveCache[relResolveCacheKey] ||
              (contextModule._relativeResolveCache[relResolveCacheKey] = resolver(dir, request)));
    } else {
      return originalResolve(request, parentModule, isMain, options);
    }
  }

  return originalResolve(request, parentModule, isMain, options);
}

/**
 * Patch module.load to use the context's custom extensions if provided.
 *
 * @param filename
 */
function load(this: NodeModule, filename: string) {
  const contextModule = findNearestContextModule(this) as ContextModule;
  if (contextModule) {
    const extensions = contextModule._hooks;
    const ext        = path.extname(filename);
    const compiler   = extensions && extensions[ext];
    if (compiler) {
      const originalCompiler   = Module_._extensions[ext];
      Module_._extensions[ext] = compiler;
      try {
        return originalProtoLoad.call(this, filename);
      } finally { Module_._extensions[ext] = originalCompiler; }
    }
  }
  return originalProtoLoad.call(this, filename);
}

/**
 * This overrides script compilation to ensure the nearest context module is used.
 *
 * @param content The file contents of the script.
 * @param filename The filename for the script.
 */
function _compile(this: Module, content: string, filename: string) {
  const contextModule = findNearestContextModule(this);

  if (contextModule) {
    const context = contextModule._context;
    const script =
      new vm.Script(Module.wrap(content), {filename, lineOffset: 0, displayErrors: true});

    return runScript(context, script)
      .call(
        this.exports, this.exports, createRequire(this), this, filename, path.dirname(filename));
  }

  return originalCompile.call(this, content, filename);
}

/**
 * Walks up a module tree to find the nearest context module.
 *
 * @param cur The starting module.
 */
function findNearestContextModule(mod: Module) {
  let cur: Module|null|undefined = mod;
  do {
    if (cur instanceof ContextModule) { return cur; }
    // eslint-disable-next-line no-cond-assign
  } while (cur = cur && cur.parent);
  return undefined;
}

/**
 * Helper which will run a vm script in a context.
 * Special case for JSDOM where `runVMScript` is used.
 *
 * @param context The vm context to run the script in (or a jsdom instance).
 * @param script The vm script to run.
 */
function runScript(context: any, script: vm.Script) {
  return context.runVMScript
           ? context.runVMScript(script)
           : script.runInContext(context.getInternalVMContext ? context.getInternalVMContext()
                                                              : context);
}

/**
 * Creates a require function bound to a module
 * and adds a `resolve` function the same as nodejs.
 *
 * @param mod The module to create a require function for.
 */
function createRequire(mod: Module): NodeJS.Require {
  const main = findNearestContextModule(mod);
  function require(id: string) {
    let exported;
    installModuleHooks(Module);
    try {
      exported = mod.require(id);
    } catch (e) {
      uninstallModuleHooks(Module);
      throw e;
    }
    uninstallModuleHooks(Module);
    return exported;
  }
  function resolve(id: string, options?: {paths?: string[]|undefined;}) {
    return _resolveFilename(id, mod, false, options);
  }
  require.main       = main;
  require.cache      = main && main._cache;
  require.resolve    = resolve as NodeJS.RequireResolve;
  require.extensions = main && main._hooks || Module_._extensions;
  return require;
}

function installModuleHooks(Module: any) {
  const M            = Module.__proto__ && Module.__proto__.prototype ? Module.__proto__ : Module;
  const P            = M.prototype;
  M._load            = _load;
  M._resolveFilename = _resolveFilename;
  P._compile         = _compile;
  P.load             = load;
}

function uninstallModuleHooks(Module: any) {
  const M            = Module.__proto__ && Module.__proto__.prototype ? Module.__proto__ : Module;
  const P            = M.prototype;
  M._load            = originalLoad;
  M._resolveFilename = originalResolve;
  P._compile         = originalCompile;
  P.load             = originalProtoLoad;
}
