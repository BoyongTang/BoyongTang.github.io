// The living Pillars of Creation: the picture drawn with WebGL so it has depth and quietly moves.
// A depth mask (public/sky/pillars-maps.png, R) splits it into near pillars and far haze and stars, so the
// far layer slides behind the near one (parallax); gas streams off the pillars toward the light above;
// the red star-forming knots (G) pulse; stars, found from the photo's own local contrast, twinkle.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface View {
  /** Where the whole image (its near layer) sits on the canvas, in CSS px. */
  rect: Rect;
  /** How far the far layer is shifted against the near one, in CSS px. */
  par: [number, number];
  /** 0 = full brightness, 1 = black. */
  dim: number;
  /** Like dim, but only for the sky round the pillars: the pillars keep their light. */
  skyDim: number;
  /** Mip bias: 0 = sharp, ~2 = soft. */
  blur: number;
  /** 0 = still, 1 = fully alive (flow, twinkle, pulse). */
  life: number;
  /** How wide the image's left edge fades into the dark (fraction of its width). */
  edge: number;
}

const VERT = `#version 300 es
in vec2 aPos;
uniform vec2 uRes;
out vec2 vPx;
void main() {
  vPx = vec2((aPos.x * 0.5 + 0.5) * uRes.x, (0.5 - aPos.y * 0.5) * uRes.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uImg;
uniform sampler2D uMap;
uniform vec2 uRes;
uniform vec4 uRect;
uniform vec2 uPar;
uniform vec2 uImgPx;
uniform float uTime;
uniform float uDim;
uniform float uSky;
uniform float uBlur;
uniform float uLife;
uniform float uEdge;
in vec2 vPx;
out vec4 o;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int k = 0; k < 4; k++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s;
}
float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
// past the image's edges the sky continues as its own mirror image (and is quietened below)
vec2 mir(vec2 u) { return abs(mod(u - 1.0, 2.0) - 1.0); }
float depthAt(vec2 uv) { return texture(uMap, mir(uv)).r; }
vec3 img(vec2 uv, float bias) { return texture(uImg, mir(uv), bias).rgb; }

void main() {
  vec2 uv0 = (vPx - uRect.xy) / uRect.zw;

  // parallax: the far layer is shifted against the near pillars (refined twice)
  vec2 sh = uPar / uRect.zw;
  float d = depthAt(uv0);
  vec2 uv = uv0 - sh * (1.0 - d);
  d = depthAt(uv);
  uv = uv0 - sh * (1.0 - d);
  d = depthAt(uv);

  float t = uTime * uLife;

  // gas streaming off the pillars: a two-phase flow, strongest at their edges, toward the light above
  vec2 e = 1.0 / vec2(textureSize(uMap, 0));
  vec2 grad = vec2(depthAt(uv + vec2(e.x, 0.0)) - depthAt(uv - vec2(e.x, 0.0)), depthAt(uv + vec2(0.0, e.y)) - depthAt(uv - vec2(0.0, e.y)));
  float edge = clamp(length(grad) * 5.0, 0.0, 1.0);
  vec2 wob = vec2(fbm(uv * 6.0 + 3.1), fbm(uv * 6.0 + 7.7)) - 0.5;
  vec2 dir = normalize(vec2(0.2, -1.0) + wob * 1.6);
  float ph = t * 0.05 + fbm(uv * 2.0) * 0.6;
  float f0 = fract(ph);
  float f1 = fract(ph + 0.5);
  float amp = (0.0028 * edge + 0.0008 * (1.0 - d)) * uLife;
  vec3 cA = img(uv - dir * amp * f0, uBlur);
  vec3 cB = img(uv - dir * amp * f1, uBlur);
  float wA = 1.0 - abs(1.0 - 2.0 * f0);
  vec3 col = cA * wA + cB * (1.0 - wA);

  // refine: the picture is small and stretched, so restore edge contrast. An unsharp mask whose radius
  // follows how much each picture pixel is magnified on screen (kept off the smooth black sky).
  vec2 tp = 1.0 / uImgPx;
  float mag = clamp(uRect.z / uImgPx.x, 1.0, 4.0);       // screen px per texture px
  vec2 r1 = tp * (0.9 + 0.35 * mag);
  vec3 ring = 0.25 * (img(uv + vec2(r1.x, 0.0), 0.0) + img(uv - vec2(r1.x, 0.0), 0.0) +
                      img(uv + vec2(0.0, r1.y), 0.0) + img(uv - vec2(0.0, r1.y), 0.0));
  vec3 ring2 = 0.25 * (img(uv + r1 * 2.2, 0.6) + img(uv - r1 * 2.2, 0.6) +
                       img(uv + vec2(r1.x, -r1.y) * 2.2, 0.6) + img(uv + vec2(-r1.x, r1.y) * 2.2, 0.6));
  vec3 base = img(uv, 0.0);
  float body = smoothstep(0.03, 0.14, lum(base));        // where there is cloud, not empty sky
  col += ((base - ring) * 0.45 + (base - ring2) * 0.3) * body * (1.0 - 0.6 * uBlur);

  // fine grain in the dust: filaments a few screen pixels wide, following the cloud's own light,
  // so a close look finds texture rather than a smear
  vec2 gq = uv * uImgPx / 1.6;
  float fil = fbm(gq * vec2(1.0, 2.3) + fbm(gq * 0.35) * 2.0) - 0.5;
  float grain = noise(uv * uRect.zw / 1.3) - 0.5;
  col *= 1.0 + (fil * 0.16 + grain * 0.05) * body * smoothstep(0.25, 0.6, d) * smoothstep(1.2, 2.5, mag);
  col = max(col, 0.0);

  // stars twinkle: points brighter than the ring round them
  float lc = lum(img(uv, 0.0));
  float lr = 0.25 * (lum(img(uv + vec2(2.5, 0.0) * tp, 0.0)) + lum(img(uv - vec2(2.5, 0.0) * tp, 0.0)) +
                     lum(img(uv + vec2(0.0, 2.5) * tp, 0.0)) + lum(img(uv - vec2(0.0, 2.5) * tp, 0.0)));
  float star = smoothstep(0.1, 0.32, lc - lr) * smoothstep(0.45, 0.85, lc) * (1.0 - 0.6 * smoothstep(0.5, 0.9, d));
  vec2 cell = floor(uv * uImgPx / 4.0);
  float tw = sin(t * (0.8 + 2.2 * hash(cell)) + 6.2831 * hash(cell + 3.7));
  col *= 1.0 + star * tw * 0.25 * uLife;

  // a few crisp stars of our own over the dark sky, scattered sparsely as in the picture:
  // at most one per (large) cell, and only in a few cells, each a point a pixel or two across on screen
  vec2 cellUV = uv * vec2(70.0, 70.0 * uRect.w / uRect.z);
  vec2 ci = floor(cellUV);
  float hs = hash(ci + 11.3);
  if (hs > 0.955) {
    vec2 sp = (ci + vec2(hash(ci + 1.7), hash(ci + 5.1))) / vec2(70.0, 70.0 * uRect.w / uRect.z);
    float dpx = length((uv - sp) * uRect.zw);
    float size = 0.6 + 1.3 * pow(hash(ci + 9.2), 4.0);
    float tw2 = 0.75 + 0.25 * sin(t * (0.6 + 2.0 * hash(ci + 2.2)) + 6.28 * hs);
    float pt = exp(-dpx * dpx / (size * size)) * (0.35 + 0.65 * hash(ci + 4.4)) * tw2;
    vec3 tint = mix(vec3(0.8, 0.9, 1.0), vec3(1.0, 0.85, 0.7), step(0.8, hash(ci + 6.6)));
    col += tint * pt * (1.0 - smoothstep(0.3, 0.7, d)) * 0.85;
  }

  // the red knots where stars are forming breathe
  float glow = texture(uMap, mir(uv)).g;
  col += vec3(1.0, 0.3, 0.24) * glow * (0.12 + 0.12 * sin(t * 0.7 + uv.y * 40.0)) * uLife;

  // the far haze drifts
  float hz = fbm(uv * 3.0 + vec2(t * 0.004, -t * 0.007));
  col += vec3(0.08, 0.32, 0.38) * (hz - 0.45) * 0.07 * (1.0 - d) * uLife;

  // beyond the image the sky carries on: tiles (mirrored, so seamless) of a pillar-free patch of the image's
  // own starfield, its top-left corner, blended in across the edge and a little darker further out
  vec2 cuv = clamp(uv0, 0.0, 1.0);
  float outside = length((uv0 - cuv) * vec2(1.0, uRect.w / uRect.z));   // in image widths
  // signed distance past the left or right edge (negative inside), to start the blend just inside
  float edgeX = max(-uv0.x, uv0.x - 1.0);
  if (edgeX > -0.07) {
    vec2 sp = vec2(0.0, 0.0);
    vec2 sz = vec2(0.55, 0.3);
    // it is far sky: it shifts with the far layer, so it moves with the mouse like the rest
    vec2 skyUV = sp + mir((uv0 - sh - sp) / sz) * sz;
    vec3 sky = texture(uImg, skyUV, uBlur).rgb;
    float hz2 = fbm(skyUV * 3.0 + vec2(t * 0.004, -t * 0.007));
    sky += vec3(0.08, 0.32, 0.38) * (hz2 - 0.45) * 0.07 * uLife;
    col = mix(col, sky, smoothstep(-0.07, 0.09, edgeX));
    col *= mix(1.0, 0.66, smoothstep(0.0, 0.5, outside));
  }

  // the sky round the pillars sits darker; the pillars (deep in the mask, and only inside the image) keep
  // their light
  float beyond = smoothstep(-0.02, 0.06, max(-uv0.x, uv0.x - 1.0));
  float pillar = smoothstep(0.14, 0.32, d) * (1.0 - beyond);
  col *= 1.0 - uSky * (1.0 - pillar);

  // dim, and a gentle vignette
  vec2 q = vPx / uRes - 0.5;
  col *= (1.0 - uDim) * (1.0 - 0.35 * dot(q, q));
  o = vec4(col, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
  return s;
}

function load(src: string) {
  return new Promise<HTMLImageElement>((ok, fail) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => ok(im);
    im.onerror = fail;
    im.src = src;
  });
}

export class LivingPillars {
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private imgPx: [number, number] = [1, 1];
  private view: View = { rect: { x: 0, y: 0, w: 1, h: 1 }, par: [0, 0], dim: 0, skyDim: 0, blur: 0, life: 1, edge: 0.02 };
  private scale = 1;

  private constructor(
    private canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
  ) {
    this.gl = gl;
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
    this.prog = p;
    for (const n of ['uImg', 'uMap', 'uRes', 'uRect', 'uPar', 'uImgPx', 'uTime', 'uDim', 'uSky', 'uBlur', 'uLife', 'uEdge']) this.u[n] = gl.getUniformLocation(p, n);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  /** Null when WebGL 2 or the images are not available: the page then keeps its still image. */
  static async create(canvas: HTMLCanvasElement, photo: string, maps: string): Promise<LivingPillars | null> {
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return null;
    try {
      const lp = new LivingPillars(canvas, gl);
      const [a, b] = await Promise.all([load(photo), load(maps)]);
      lp.texture(0, a, true);
      lp.texture(1, b, false);
      lp.imgPx = [a.naturalWidth, a.naturalHeight];
      return lp;
    } catch (e) {
      console.warn('[pillars] living sky unavailable, showing the still image:', e);
      return null;
    }
  }

  private texture(unit: number, im: HTMLImageElement, mips: boolean) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    if (mips) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  /** Swap in a sharper copy of the photo (on large, sharp screens). */
  replacePhoto(im: HTMLImageElement) {
    this.texture(0, im, true);
    this.imgPx = [im.naturalWidth, im.naturalHeight];
  }

  /** Render resolution: fewer pixels where the sky is dim and soft anyway. */
  setScale(s: number) {
    this.scale = s;
  }

  set(v: Partial<View>) {
    Object.assign(this.view, v);
  }

  get current(): View {
    return this.view;
  }

  draw(time: number) {
    const gl = this.gl;
    const c = this.canvas;
    const cw = c.clientWidth;
    const ch = c.clientHeight;
    const k = Math.min(devicePixelRatio || 1, 2) * this.scale; // full Retina resolution
    const w = Math.max(1, Math.round(cw * k));
    const h = Math.max(1, Math.round(ch * k));
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.useProgram(this.prog);
    const v = this.view;
    gl.uniform1i(this.u.uImg, 0);
    gl.uniform1i(this.u.uMap, 1);
    gl.uniform2f(this.u.uRes, cw, ch);
    gl.uniform4f(this.u.uRect, v.rect.x, v.rect.y, v.rect.w, v.rect.h);
    gl.uniform2f(this.u.uPar, v.par[0], v.par[1]);
    gl.uniform2f(this.u.uImgPx, this.imgPx[0], this.imgPx[1]);
    gl.uniform1f(this.u.uTime, time);
    gl.uniform1f(this.u.uDim, v.dim);
    gl.uniform1f(this.u.uSky, v.skyDim);
    gl.uniform1f(this.u.uBlur, v.blur);
    gl.uniform1f(this.u.uLife, v.life);
    gl.uniform1f(this.u.uEdge, Math.max(0.001, v.edge));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
