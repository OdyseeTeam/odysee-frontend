export type ChromaKeyParams = {
  color: string;
  threshold: number;
  smoothness: number;
};

type ChromaContext = {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  texture: WebGLTexture;
  uKeyColor: WebGLUniformLocation | null;
  uThreshold: WebGLUniformLocation | null;
  uSmoothness: WebGLUniformLocation | null;
  uFlip: WebGLUniformLocation | null;
};

const VERTEX_SRC = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
uniform float u_flip;
varying vec2 v_texCoord;
void main() {
  v_texCoord = vec2(a_texCoord.x, mix(a_texCoord.y, 1.0 - a_texCoord.y, u_flip));
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SRC = `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_image;
uniform vec3 u_keyColor;
uniform float u_threshold;
uniform float u_smoothness;
void main() {
  vec4 px = texture2D(u_image, v_texCoord);
  float d = distance(px.rgb, u_keyColor);
  float alpha = smoothstep(u_threshold, u_threshold + u_smoothness, d);
  gl_FragColor = vec4(px.rgb, px.a * alpha);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createContext(): ChromaContext | null {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
  if (!gl) return null;

  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const texBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  const aTex = gl.getAttribLocation(program, 'a_texCoord');
  gl.enableVertexAttribArray(aTex);
  gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  if (!texture) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.useProgram(program);
  gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);

  return {
    canvas,
    gl,
    program,
    texture,
    uKeyColor: gl.getUniformLocation(program, 'u_keyColor'),
    uThreshold: gl.getUniformLocation(program, 'u_threshold'),
    uSmoothness: gl.getUniformLocation(program, 'u_smoothness'),
    uFlip: gl.getUniformLocation(program, 'u_flip'),
  };
}

function hexToRgb01(hex: string): [number, number, number] {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return [0, 1, 0];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}

const contexts = new Map<string, ChromaContext>();

export function applyChromaKey(
  layerId: string,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  params: ChromaKeyParams
): HTMLCanvasElement | null {
  if (sourceWidth <= 0 || sourceHeight <= 0) return null;
  let ctx = contexts.get(layerId);
  if (!ctx) {
    const created = createContext();
    if (!created) return null;
    contexts.set(layerId, created);
    ctx = created;
  }
  const { canvas, gl, program, texture, uKeyColor, uThreshold, uSmoothness, uFlip } = ctx;
  if (canvas.width !== sourceWidth || canvas.height !== sourceHeight) {
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
  }
  gl.viewport(0, 0, sourceWidth, sourceHeight);
  gl.useProgram(program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source as TexImageSource);
  } catch {
    return null;
  }
  const [r, g, b] = hexToRgb01(params.color);
  gl.uniform3f(uKeyColor, r, g, b);
  gl.uniform1f(uThreshold, params.threshold);
  gl.uniform1f(uSmoothness, Math.max(params.smoothness, 0.001));
  gl.uniform1f(uFlip, 1);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  return canvas;
}

export function releaseChromaKey(layerId: string): void {
  const ctx = contexts.get(layerId);
  if (!ctx) return;
  const { gl, program, texture } = ctx;
  gl.deleteTexture(texture);
  gl.deleteProgram(program);
  contexts.delete(layerId);
}
