/*
Growing Neural Cellular Automata, running in WebGL.

Adapted from the interactive demo in "Growing Neural Cellular Automata" by Alexander Mordvintsev,
Ettore Randazzo, Eyvind Niklasson and Michael Levin, Distill, 2020 (https://distill.pub/2020/growing-ca/).
Original shader code: https://github.com/distillpub/post--growing-ca (public/ca.js),
Copyright 2020 Google LLC, licensed under the Apache License, Version 2.0
(https://www.apache.org/licenses/LICENSE-2.0). The pretrained models in /public/nca come from the same
repository. Changes here: rewritten in TypeScript against raw WebGL instead of twgl, a non-square grid,
and a background colour for the site's light and dark themes.
*/

const CHANNEL_N = 16;
const MAX_ACTIVATION_VALUE = 10.0;

export type Layer = { data_b64: string; in_ch: number; out_ch: number; weight_scale: number; bias_scale: number };

const VS = `
attribute vec4 position;
varying vec2 uv;
void main() {
  uv = position.xy * 0.5 + 0.5;
  gl_Position = position;
}`;

const defInput = (name: string) => `
uniform Tensor ${name};
uniform sampler2D ${name}_tex;
vec4 ${name}_read(vec2 pos, float ch) { return _read(${name}, ${name}_tex, pos, ch); }
vec4 ${name}_readUV(vec2 uv) { return _readUV(${name}, ${name}_tex, uv); }
`;

// Tensors are stored in 8-bit RGBA textures, four channels per texel, with the channel groups tiled
// across the texture. Values are squashed through atan so the 8 bits cover the useful range.
const PREFIX = `
precision highp float;

struct Tensor {
  vec2 size;
  vec2 gridSize;
  float depth, depth4;
  vec2 packScaleBias;
};
uniform Tensor u_output;

vec4 _readUV(Tensor tensor, sampler2D tex, vec2 uv) {
  vec4 v = texture2D(tex, uv);
  vec2 p = tensor.packScaleBias;
  return tan((v - p.y) * p.x);
}

vec4 _read(Tensor tensor, sampler2D tex, vec2 pos, float ch) {
  vec2 p = fract(pos / tensor.size);
  ch += 0.5;
  float tx = floor(mod(ch, tensor.gridSize.x));
  float ty = floor(ch / tensor.gridSize.x);
  p += vec2(tx, ty);
  return _readUV(tensor, tex, p / tensor.gridSize);
}

vec2 getOutputXY() { return mod(gl_FragCoord.xy, u_output.size); }
float getOutputChannel() {
  vec2 xy = floor(gl_FragCoord.xy / u_output.size);
  return xy.y * u_output.gridSize.x + xy.x;
}

void setOutput(vec4 v) {
  vec2 p = u_output.packScaleBias;
  gl_FragColor = atan(v) / p.x + p.y;
}

${defInput("u_input")}
`;

const PROGRAMS = {
  // erase cells in a circle, or plant a single seed (alpha and hidden channels set to 1)
  paint: `
  uniform vec2 u_pos;
  uniform float u_r;
  uniform float u_brush;
  void main() {
    vec2 diff = abs(getOutputXY() - u_pos + 0.5);
    diff = min(diff, u_output.size - diff);
    if (length(diff) >= u_r) discard;
    vec4 result = vec4(0.0);
    if (u_brush > 0.5) {
      float ch = getOutputChannel();
      result = vec4(vec3(float(ch > 0.5)), 1.0);
    }
    setOutput(result);
  }`,
  // each cell sees itself plus Sobel gradients of its neighbourhood, optionally rotated
  perception: `
  uniform float u_angle;
  const mat3 sobel = mat3(-1.0, 0.0, 1.0, -2.0, 0.0, 2.0, -1.0, 0.0, 1.0) / 8.0;
  void main() {
    vec2 xy = getOutputXY();
    float ch = getOutputChannel();
    float filterBand = floor(ch / u_input.depth4);
    float inputCh = mod(ch, u_input.depth4);
    if (filterBand == 0.0) {
      setOutput(u_input_read(xy, inputCh));
    } else {
      vec4 dx = vec4(0.0), dy = vec4(0.0);
      for (int y = 0; y < 3; ++y)
      for (int x = 0; x < 3; ++x) {
        vec2 p = xy + vec2(float(x - 1), float(y - 1));
        vec4 a = u_input_read(p, inputCh);
        dx += sobel[y][x] * a;
        dy += sobel[x][y] * a;
      }
      float s = sin(u_angle), c = cos(u_angle);
      setOutput(filterBand == 1.0 ? dx * c - dy * s : dx * s + dy * c);
    }
  }`,
  // a 1x1 convolution: the same small dense layer applied to every cell
  dense: `
  uniform sampler2D u_weightTex;
  uniform vec3 u_weightCoefs; // weightScale, biasScale, center
  const float MAX_PACKED_DEPTH = 32.0;
  vec4 readWeight(vec2 p) { return (texture2D(u_weightTex, p) - u_weightCoefs.z) * u_weightCoefs.x; }
  vec4 readBias(vec2 p) { return (texture2D(u_weightTex, p) - u_weightCoefs.z) * u_weightCoefs.y; }
  void main() {
    vec2 xy = getOutputXY();
    float ch = getOutputChannel();
    if (ch >= u_output.depth4) return;
    float dy = 1.0 / (u_input.depth + 1.0);
    vec2 p = vec2((ch + 0.5) / u_output.depth4, dy * 0.5);
    vec4 result = vec4(0.0);
    for (float i = 0.0; i < MAX_PACKED_DEPTH; i += 1.0) {
      vec4 inVec = u_input_read(xy, i);
      result += inVec.x * readWeight(p); p.y += dy;
      result += inVec.y * readWeight(p); p.y += dy;
      result += inVec.z * readWeight(p); p.y += dy;
      result += inVec.w * readWeight(p); p.y += dy;
      if (i + 1.5 > u_input.depth4) break;
    }
    result += readBias(p);
    setOutput(result);
  }`,
  // cells update asynchronously: each one skips about half the steps at random
  dropout: `
  uniform float u_seed, u_updateProbability;
  varying vec2 uv;
  // "Hash without Sine" by David Hoskins (https://www.shadertoy.com/view/4djSRW)
  float hash13(vec3 p3) {
    p3 = fract(p3 * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  void main() {
    vec2 xy = getOutputXY();
    vec4 result = u_input_readUV(uv);
    result *= float(hash13(vec3(xy, u_seed)) <= u_updateProbability);
    setOutput(result);
  }`,
  // add the update, and kill cells with no living (alpha > 0.1) neighbour before or after
  update: `
  ${defInput("u_update")}
  varying vec2 uv;
  void main() {
    vec2 xy = getOutputXY();
    float preMaxAlpha = 0.0, postMaxAlpha = 0.0;
    for (float y = -1.0; y <= 1.0; ++y)
    for (float x = -1.0; x <= 1.0; ++x) {
      vec2 p = xy + vec2(x, y);
      float preAlpha = u_input_read(p, 0.0).a;
      float updateAlpha = u_update_read(p, 0.0).a;
      preMaxAlpha = max(preAlpha, preMaxAlpha);
      postMaxAlpha = max(preAlpha + updateAlpha, postMaxAlpha);
    }
    if (min(preMaxAlpha, postMaxAlpha) < 0.1) {
      setOutput(vec4(0.0));
      return;
    }
    setOutput(u_input_readUV(uv) + u_update_readUV(uv));
  }`,
  // the first four channels are a premultiplied RGBA image, laid over the page background
  vis: `
  uniform vec3 u_lastDamage;
  uniform vec3 u_bg;
  uniform vec3 u_highlight;
  varying vec2 uv;
  void main() {
    vec2 xy = vec2(uv.x, 1.0 - uv.y) * u_input.size;
    vec4 rgba = clamp(u_input_read(xy, 0.0), 0.0, 1.0);
    vec3 col = u_bg * (1.0 - rgba.a) + rgba.rgb;
    vec2 diff = abs(xy - u_lastDamage.xy + 0.5);
    diff = min(diff, u_input.size - diff);
    if (length(diff) < u_lastDamage.z) col = col * 0.7 + u_highlight * 0.3;
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }`,
};
type ProgramName = keyof typeof PROGRAMS;

type Tensor = {
  fb: WebGLFramebuffer;
  tex: WebGLTexture;
  w: number;
  h: number;
  depth: number;
  depth4: number;
  gridW: number;
  gridH: number;
  packScaleBias: [number, number];
};
type Dense = { tex: WebGLTexture; coefs: [number, number, number] };
type Uniform = number | number[] | Tensor | WebGLTexture;

function decode(s: string) {
  const data = atob(s);
  const buf = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) buf[i] = data.charCodeAt(i);
  return buf;
}

export class NeuralCA {
  private programs = {} as Record<ProgramName, WebGLProgram>;
  private locations = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();
  private quad: WebGLBuffer;
  private state!: Tensor;
  private next!: Tensor;
  private perception!: Tensor;
  private hidden!: Tensor;
  private update!: Tensor;
  private masked!: Tensor;
  private layers: [Dense, Dense] | null = null;
  private lastDamage = [0, 0, -1];
  angle = 0;
  steps = 0;
  w = 0;
  h = 0;

  constructor(private gl: WebGLRenderingContext) {
    for (const name of Object.keys(PROGRAMS) as ProgramName[]) this.programs[name] = this.compile(PREFIX + PROGRAMS[name]);
    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  }

  private compile(fs: string) {
    const gl = this.gl;
    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader failed to compile");
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(prog, 0, "position");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "program failed to link");
    this.locations.set(prog, new Map());
    return prog;
  }

  private texture(width: number, height: number, data: Uint8Array | null) {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    return tex;
  }

  private tensor(w: number, h: number, depth: number, relu = false): Tensor {
    const gl = this.gl;
    const depth4 = Math.ceil(depth / 4);
    const gridW = Math.ceil(Math.sqrt(depth4));
    const gridH = Math.floor((depth4 + gridW - 1) / gridW);
    const tex = this.texture(w * gridW, h * gridH, null);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const C = Math.atan(MAX_ACTIVATION_VALUE);
    return { fb, tex, w, h, depth, depth4, gridW, gridH, packScaleBias: relu ? [C, 0] : [2 * C, 127 / 255] };
  }

  private free(t: Tensor | undefined) {
    if (!t) return;
    this.gl.deleteFramebuffer(t.fb);
    this.gl.deleteTexture(t.tex);
  }

  // (re)allocate the grid; the model is translation-invariant, so any size works
  setSize(w: number, h: number) {
    if (w === this.w && h === this.h) return;
    for (const t of [this.state, this.next, this.perception, this.hidden, this.update, this.masked]) this.free(t);
    this.w = w;
    this.h = h;
    this.state = this.tensor(w, h, CHANNEL_N);
    this.next = this.tensor(w, h, CHANNEL_N);
    this.perception = this.tensor(w, h, CHANNEL_N * 3);
    this.hidden = this.tensor(w, h, 128, true);
    this.update = this.tensor(w, h, CHANNEL_N);
    this.masked = this.tensor(w, h, CHANNEL_N);
    this.reset();
  }

  setWeights(layers: Layer[]) {
    const dense = (l: Layer): Dense => ({
      tex: this.texture(l.out_ch / 4, l.in_ch + 1, decode(l.data_b64)),
      coefs: [l.weight_scale, l.bias_scale, 0.5],
    });
    if (this.layers) for (const l of this.layers) this.gl.deleteTexture(l.tex);
    this.layers = [dense(layers[0]), dense(layers[1])];
  }

  get ready() {
    return !!this.layers && this.w > 0;
  }

  private uniform(prog: WebGLProgram, name: string) {
    const cache = this.locations.get(prog)!;
    if (!cache.has(name)) cache.set(name, this.gl.getUniformLocation(prog, name));
    return cache.get(name)!;
  }

  private bind(prog: WebGLProgram, uniforms: Record<string, Uniform>) {
    const gl = this.gl;
    let unit = 0;
    const sampler = (name: string, tex: WebGLTexture) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(this.uniform(prog, name), unit++);
    };
    const tensor = (name: string, t: Tensor, withTexture: boolean) => {
      gl.uniform2f(this.uniform(prog, `${name}.size`), t.w, t.h);
      gl.uniform2f(this.uniform(prog, `${name}.gridSize`), t.gridW, t.gridH);
      gl.uniform1f(this.uniform(prog, `${name}.depth`), t.depth);
      gl.uniform1f(this.uniform(prog, `${name}.depth4`), t.depth4);
      gl.uniform2f(this.uniform(prog, `${name}.packScaleBias`), ...t.packScaleBias);
      if (withTexture) sampler(`${name}_tex`, t.tex);
    };
    for (const [name, v] of Object.entries(uniforms)) {
      if (typeof v === "number") gl.uniform1f(this.uniform(prog, name), v);
      else if (Array.isArray(v)) {
        const loc = this.uniform(prog, name);
        if (v.length === 2) gl.uniform2f(loc, v[0], v[1]);
        else gl.uniform3f(loc, v[0], v[1], v[2]);
      } else if ("fb" in v) tensor(name, v, name !== "u_output");
      else sampler(name, v);
    }
  }

  private run(name: ProgramName, output: Tensor | null, uniforms: Record<string, Uniform>, viewport?: [number, number]) {
    const gl = this.gl;
    const prog = this.programs[name];
    gl.bindFramebuffer(gl.FRAMEBUFFER, output ? output.fb : null);
    if (output) gl.viewport(0, 0, output.w * output.gridW, output.h * output.gridH);
    else if (viewport) gl.viewport(0, 0, viewport[0], viewport[1]);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.bind(prog, output ? { ...uniforms, u_output: output } : uniforms);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  paint(x: number, y: number, r: number, brush: "clear" | "seed") {
    if (!this.w) return;
    this.run("paint", this.state, { u_pos: [x, y], u_r: r, u_brush: brush === "seed" ? 1 : 0 });
    if (brush === "clear" && r < 1000) this.lastDamage = [x, y, r];
  }

  reset() {
    this.paint(0, 0, 10000, "clear");
    this.paint(this.w / 2, this.h / 2, 1, "seed");
    this.steps = 0;
  }

  step() {
    if (!this.layers) return;
    const [l1, l2] = this.layers;
    this.run("perception", this.perception, { u_input: this.state, u_angle: this.angle });
    this.run("dense", this.hidden, { u_input: this.perception, u_weightTex: l1.tex, u_weightCoefs: l1.coefs });
    this.run("dense", this.update, { u_input: this.hidden, u_weightTex: l2.tex, u_weightCoefs: l2.coefs });
    this.run("dropout", this.masked, { u_input: this.update, u_seed: Math.random() * 1000, u_updateProbability: 0.5 });
    this.run("update", this.next, { u_input: this.state, u_update: this.masked });
    [this.state, this.next] = [this.next, this.state];
    this.steps++;
  }

  draw(width: number, height: number, bg: number[], highlight: number[]) {
    if (!this.w) return;
    this.run("vis", null, { u_input: this.state, u_lastDamage: this.lastDamage, u_bg: bg, u_highlight: highlight }, [width, height]);
    // the damage marker fades over a few frames
    this.lastDamage[2] = Math.max(-0.1, this.lastDamage[2] - 1);
  }
}
