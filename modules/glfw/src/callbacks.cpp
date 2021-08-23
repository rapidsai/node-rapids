// Copyright (c) 2020-2021, NVIDIA CORPORATION.
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

#include "glfw.hpp"
#include "macros.hpp"

#include <nv_node/utilities/args.hpp>
#include <nv_node/utilities/cpp_to_napi.hpp>

namespace nv {

namespace {

template <typename R, typename... Args>
struct js_callback;

template <typename R, typename... Args>
struct js_callback<R (*)(Args...)> {
  Napi::FunctionReference cb{};
  auto Env() { return cb.Env(); }
  void Reset() { cb.Reset(); }
  void Reset(const Napi::Function& value) {
    cb = Napi::Persistent(value);
    cb.SuppressDestruct();
  }
  R operator()(Args const&... args) {
    if (!cb.IsEmpty()) {
      Napi::Env env = Env();
      auto cast_t   = CPPToNapi(env);
      std::vector<napi_value> xs{};
      std::tuple<Args...> ys{args...};
      casting::for_each(ys, [&](auto v) { xs.push_back(cast_t(v)); });
      cb.MakeCallback(env.Global(), xs);
    }
  }
};
}  // namespace

auto GLFWerror_cb_js              = js_callback<void (*)(int, std::string)>{};  // GLFWerrorfun
auto GLFWmonitor_cb_js            = js_callback<GLFWmonitorfun>{};
auto GLFWjoystick_cb_js           = js_callback<GLFWjoystickfun>{};
auto GLFWwindowpos_cb_js          = js_callback<GLFWwindowposfun>{};
auto GLFWwindowsize_cb_js         = js_callback<GLFWwindowsizefun>{};
auto GLFWwindowclose_cb_js        = js_callback<GLFWwindowclosefun>{};
auto GLFWwindowrefresh_cb_js      = js_callback<GLFWwindowrefreshfun>{};
auto GLFWwindowfocus_cb_js        = js_callback<GLFWwindowfocusfun>{};
auto GLFWwindowiconify_cb_js      = js_callback<GLFWwindowiconifyfun>{};
auto GLFWwindowmaximize_cb_js     = js_callback<GLFWwindowmaximizefun>{};
auto GLFWframebuffersize_cb_js    = js_callback<GLFWframebuffersizefun>{};
auto GLFWwindowcontentscale_cb_js = js_callback<GLFWwindowcontentscalefun>{};
auto GLFWkey_cb_js                = js_callback<GLFWkeyfun>{};
auto GLFWchar_cb_js               = js_callback<GLFWcharfun>{};
auto GLFWcharmods_cb_js           = js_callback<GLFWcharmodsfun>{};
auto GLFWmousebutton_cb_js        = js_callback<GLFWmousebuttonfun>{};
auto GLFWcursorpos_cb_js          = js_callback<GLFWcursorposfun>{};
auto GLFWcursorenter_cb_js        = js_callback<GLFWcursorenterfun>{};
auto GLFWscroll_cb_js             = js_callback<GLFWscrollfun>{};

void GLFWerror_cb(int32_t error_code, const char* description) {
  GLFWerror_cb_js(error_code, std::string{description == nullptr ? description : ""});
}
void GLFWmonitor_cb(GLFWmonitor* monitor, int32_t event) { GLFWmonitor_cb_js(monitor, event); }
void GLFWjoystick_cb(int32_t joystick, int32_t event) { GLFWjoystick_cb_js(joystick, event); }
void GLFWwindowpos_cb(GLFWwindow* window, int32_t x, int32_t y) {
  GLFWwindowpos_cb_js(window, x, y);
}
void GLFWwindowsize_cb(GLFWwindow* window, int32_t width, int32_t height) {
  GLFWwindowsize_cb_js(window, width, height);
}
void GLFWwindowclose_cb(GLFWwindow* window) { GLFWwindowclose_cb_js(window); }
void GLFWwindowrefresh_cb(GLFWwindow* window) { GLFWwindowrefresh_cb_js(window); }
void GLFWwindowfocus_cb(GLFWwindow* window, int32_t focused) {
  GLFWwindowfocus_cb_js(window, focused);
}
void GLFWwindowiconify_cb(GLFWwindow* window, int32_t iconified) {
  GLFWwindowiconify_cb_js(window, iconified);
}
void GLFWwindowmaximize_cb(GLFWwindow* window, int32_t maximized) {
  GLFWwindowmaximize_cb_js(window, maximized);
}
void GLFWframebuffersize_cb(GLFWwindow* window, int32_t width, int32_t height) {
  GLFWframebuffersize_cb_js(window, width, height);
}
void GLFWwindowcontentscale_cb(GLFWwindow* window, float xscale, float yscale) {
  GLFWwindowcontentscale_cb_js(window, xscale, yscale);
}
void GLFWkey_cb(GLFWwindow* window, int32_t key, int32_t scancode, int32_t action, int32_t mods) {
  GLFWkey_cb_js(window, key, scancode, action, mods);
}
void GLFWchar_cb(GLFWwindow* window, uint32_t codepoint) { GLFWchar_cb_js(window, codepoint); }
void GLFWcharmods_cb(GLFWwindow* window, uint32_t codepoint, int32_t mods) {
  GLFWcharmods_cb_js(window, codepoint, mods);
}
void GLFWmousebutton_cb(GLFWwindow* window, int32_t button, int32_t action, int32_t mods) {
  GLFWmousebutton_cb_js(window, button, action, mods);
}
void GLFWcursorpos_cb(GLFWwindow* window, double x, double y) { GLFWcursorpos_cb_js(window, x, y); }
void GLFWcursorenter_cb(GLFWwindow* window, int32_t entered) {
  GLFWcursorenter_cb_js(window, entered);
}
void GLFWscroll_cb(GLFWwindow* window, double x, double y) { GLFWscroll_cb_js(window, x, y); }

Napi::FunctionReference GLFWdrop_cb_js;
void GLFWdrop_cb(GLFWwindow* window, int count, const char** paths) {
  auto env    = GLFWdrop_cb_js.Env();
  auto cast_t = CPPToNapi(env);
  GLFWdrop_cb_js.MakeCallback(env.Global(),
                              {cast_t(std::vector<std::string>{paths, paths + count})});
}

// GLFWAPI GLFWerrorfun glfwSetErrorCallback(GLFWerrorfun callback);
void glfwSetErrorCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  if (info[0].IsNull() || info[0].IsEmpty()) {
    GLFWerror_cb_js.Reset();
    GLFW_TRY(env, GLFWAPI::glfwSetErrorCallback(NULL));
  } else {
    GLFWerror_cb_js.Reset(info[0].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetErrorCallback(GLFWerror_cb));
  }
}

// GLFWAPI GLFWmonitorfun glfwSetMonitorCallback(GLFWmonitorfun callback);
void glfwSetMonitorCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  if (info[0].IsNull() || info[0].IsEmpty()) {
    GLFWmonitor_cb_js.Reset();
    GLFW_TRY(env, GLFWAPI::glfwSetMonitorCallback(NULL));
  } else {
    GLFWmonitor_cb_js.Reset(info[0].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetMonitorCallback(GLFWmonitor_cb));
  }
}

// GLFWAPI GLFWjoystickfun glfwSetJoystickCallback(GLFWjoystickfun callback);
void glfwSetJoystickCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  if (info[0].IsNull() || info[0].IsEmpty()) {
    GLFWjoystick_cb_js.Reset();
    GLFW_TRY(env, GLFWAPI::glfwSetJoystickCallback(NULL));
  } else {
    GLFWjoystick_cb_js.Reset(info[0].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetJoystickCallback(GLFWjoystick_cb));
  }
}

// GLFWAPI GLFWwindowposfun glfwSetWindowPosCallback(GLFWwindow* window, GLFWwindowposfun callback);
void glfwSetWindowPosCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWwindowpos_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetWindowPosCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWwindowpos_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetWindowPosCallback(args[0], GLFWwindowpos_cb));
  }
}

// GLFWAPI GLFWwindowsizefun glfwSetWindowSizeCallback(GLFWwindow* window, GLFWwindowsizefun
// callback);
void glfwSetWindowSizeCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWwindowsize_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetWindowSizeCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWwindowsize_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetWindowSizeCallback(args[0], GLFWwindowsize_cb));
  }
}

// GLFWAPI GLFWwindowclosefun glfwSetWindowCloseCallback(GLFWwindow* window, GLFWwindowclosefun
// callback);
void glfwSetWindowCloseCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWwindowclose_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetWindowCloseCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWwindowclose_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetWindowCloseCallback(args[0], GLFWwindowclose_cb));
  }
}

// GLFWAPI GLFWwindowrefreshfun glfwSetWindowRefreshCallback(GLFWwindow* window,
// GLFWwindowrefreshfun callback);
void glfwSetWindowRefreshCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWwindowrefresh_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetWindowRefreshCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWwindowrefresh_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetWindowRefreshCallback(args[0], GLFWwindowrefresh_cb));
  }
}

// GLFWAPI GLFWwindowfocusfun glfwSetWindowFocusCallback(GLFWwindow* window, GLFWwindowfocusfun
// callback);
void glfwSetWindowFocusCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWwindowfocus_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetWindowFocusCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWwindowfocus_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetWindowFocusCallback(args[0], GLFWwindowfocus_cb));
  }
}

// GLFWAPI GLFWwindowiconifyfun glfwSetWindowIconifyCallback(GLFWwindow* window,
// GLFWwindowiconifyfun callback);
void glfwSetWindowIconifyCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWwindowiconify_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetWindowIconifyCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWwindowiconify_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetWindowIconifyCallback(args[0], GLFWwindowiconify_cb));
  }
}

// GLFWAPI GLFWwindowmaximizefun glfwSetWindowMaximizeCallback(GLFWwindow* window,
// GLFWwindowmaximizefun callback);
void glfwSetWindowMaximizeCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWwindowmaximize_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetWindowMaximizeCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWwindowmaximize_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetWindowMaximizeCallback(args[0], GLFWwindowmaximize_cb));
  }
}

// GLFWAPI GLFWframebuffersizefun glfwSetFramebufferSizeCallback(GLFWwindow* window,
// GLFWframebuffersizefun callback);
void glfwSetFramebufferSizeCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWframebuffersize_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetFramebufferSizeCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWframebuffersize_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetFramebufferSizeCallback(args[0], GLFWframebuffersize_cb));
  }
}

// GLFWAPI GLFWwindowcontentscalefun glfwSetWindowContentScaleCallback(GLFWwindow* window,
// GLFWwindowcontentscalefun callback);
void glfwSetWindowContentScaleCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWwindowcontentscale_cb_js.Reset();
    if (window != nullptr) {
      GLFW_TRY(env, GLFWAPI::glfwSetWindowContentScaleCallback(window, NULL));
    }
  } else if (window != nullptr) {
    GLFWwindowcontentscale_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetWindowContentScaleCallback(args[0], GLFWwindowcontentscale_cb));
  }
}

// GLFWAPI GLFWkeyfun glfwSetKeyCallback(GLFWwindow* window, GLFWkeyfun callback);
void glfwSetKeyCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWkey_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetKeyCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWkey_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetKeyCallback(args[0], GLFWkey_cb));
  }
}

// GLFWAPI GLFWcharfun glfwSetCharCallback(GLFWwindow* window, GLFWcharfun callback);
void glfwSetCharCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWchar_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetCharCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWchar_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetCharCallback(args[0], GLFWchar_cb));
  }
}

// GLFWAPI GLFWcharmodsfun glfwSetCharModsCallback(GLFWwindow* window, GLFWcharmodsfun callback);
void glfwSetCharModsCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWcharmods_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetCharModsCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWcharmods_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetCharModsCallback(args[0], GLFWcharmods_cb));
  }
}

// GLFWAPI GLFWmousebuttonfun glfwSetMouseButtonCallback(GLFWwindow* window, GLFWmousebuttonfun
// callback);
void glfwSetMouseButtonCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWmousebutton_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetMouseButtonCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWmousebutton_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetMouseButtonCallback(args[0], GLFWmousebutton_cb));
  }
}

void glfwSetCursorPosCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWcursorpos_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetCursorPosCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWcursorpos_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetCursorPosCallback(args[0], GLFWcursorpos_cb));
  }
}

// GLFWAPI GLFWcursorenterfun glfwSetCursorEnterCallback(GLFWwindow* window, GLFWcursorenterfun
// callback);
void glfwSetCursorEnterCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWcursorenter_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetCursorEnterCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWcursorenter_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetCursorEnterCallback(args[0], GLFWcursorenter_cb));
  }
}

// GLFWAPI GLFWscrollfun glfwSetScrollCallback(GLFWwindow* window, GLFWscrollfun callback);
void glfwSetScrollCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWscroll_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetScrollCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWscroll_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetScrollCallback(args[0], GLFWscroll_cb));
  }
}

// GLFWAPI GLFWdropfun glfwSetDropCallback(GLFWwindow* window, GLFWdropfun callback);
void glfwSetDropCallback(Napi::CallbackInfo const& info) {
  auto env = info.Env();
  CallbackArgs args{info};
  GLFWwindow* window = args[0];
  if (info[1].IsNull() || info[1].IsEmpty() || info[1].IsUndefined()) {
    GLFWdrop_cb_js.Reset();
    if (window != nullptr) { GLFW_TRY(env, GLFWAPI::glfwSetDropCallback(window, NULL)); }
  } else if (window != nullptr) {
    GLFWdrop_cb_js.Reset(info[1].As<Napi::Function>());
    GLFW_TRY(env, GLFWAPI::glfwSetDropCallback(args[0], GLFWdrop_cb));
  }
}

}  // namespace nv
