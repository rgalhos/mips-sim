import React, { useCallback, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { EWorkerCommand, WorkerMessageResponse } from '../../../../hardware/common/worker-service';
import { useSimulator } from '../../../../hooks/simulator.hook';

const SCREEN_DIV_SIZE = 500;

type GLContext = WebGL2RenderingContext | WebGLRenderingContext;

function compileShader(gl: GLContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: GLContext, vsSrc: string, fsSrc: string): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

const VS_WEBGL2 = `#version 300 es
in vec2 a_pos;
in vec2 a_uv;
out vec2 v_uv;
void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FS_WEBGL2 = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
in vec2 v_uv;
out vec4 outColor;
void main() {
  vec2 uv = v_uv;
  float v = texture(u_tex, uv).r * 255.0;
  float r3 = floor(v / 32.0);
  float g3 = floor(mod(v, 32.0) / 4.0);
  float b2 = mod(v, 4.0);
  outColor = vec4(r3 / 7.0, g3 / 7.0, b2 / 3.0, 1.0);
}`;

const VS_WEBGL1 = `attribute vec2 a_pos;
attribute vec2 a_uv;
varying vec2 v_uv;
void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FS_WEBGL1 = `precision mediump float;
uniform sampler2D u_tex;
varying vec2 v_uv;
void main() {
  vec2 uv = v_uv;
  float v = texture2D(u_tex, uv).r * 255.0;
  float r3 = floor(v / 32.0);
  float g3 = floor(mod(v, 32.0) / 4.0);
  float b2 = mod(v, 4.0);
  gl_FragColor = vec4(r3 / 7.0, g3 / 7.0, b2 / 3.0, 1.0);
}`;

type GlBundle = {
  gl: GLContext;
  program: WebGLProgram;
  texture: WebGLTexture;
  buffer: WebGLBuffer;
  vao?: WebGLVertexArrayObject;
  loc: {
    a_pos: number;
    a_uv: number;
    u_tex: WebGLUniformLocation | null;
  };
  isWebGL2: boolean;
  screenSize: number;
};

export default function Screen({ visible = false }: { visible?: boolean }) {
  const { simulator } = useSimulator();

  const FB_START = Number(simulator.processor.FB_START);
  const FB_END = Number(simulator.processor.FB_END);
  const FB_BYTE_LEN = Math.max(0, FB_END - FB_START + 1);
  const SCREEN_SIZE = Math.floor(Math.sqrt(FB_BYTE_LEN));
  const CANVAS_PIXELS = SCREEN_SIZE * SCREEN_SIZE;

  const screenRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fbSnapshotRef = useRef(new Uint8Array(0));
  const uploadPadRef = useRef<Uint8Array | null>(null);
  const uploadPadZeroedFromRef = useRef<number>(0);
  const glBundleRef = useRef<GlBundle | null>(null);

  if (fbSnapshotRef.current.length !== FB_BYTE_LEN) {
    fbSnapshotRef.current = new Uint8Array(FB_BYTE_LEN);
  }

  const initGl = useCallback((canvas: HTMLCanvasElement, size: number): GlBundle | null => {
    if (size < 1) return null;

    const gl2 = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    }) as WebGL2RenderingContext | null;

    let gl: GLContext | null = gl2;
    let isWebGL2 = !!gl2;

    if (!gl) {
      gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
      }) as WebGLRenderingContext | null;
      isWebGL2 = false;
    }

    if (!gl) return null;

    const vsSrc = isWebGL2 ? VS_WEBGL2 : VS_WEBGL1;
    const fsSrc = isWebGL2 ? FS_WEBGL2 : FS_WEBGL1;
    const program = createProgram(gl, vsSrc, fsSrc);
    if (!program) return null;

    const texture = gl.createTexture();
    const buffer = gl.createBuffer();
    if (!texture || !buffer) {
      gl.deleteProgram(program);
      return null;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const empty = new Uint8Array(size * size);
    if (isWebGL2) {
      const g2 = gl as WebGL2RenderingContext;
      g2.texImage2D(g2.TEXTURE_2D, 0, g2.R8, size, size, 0, g2.RED, g2.UNSIGNED_BYTE, empty);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, size, size, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, empty);
    }

    gl.useProgram(program);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    const a_pos = gl.getAttribLocation(program, 'a_pos');
    const a_uv = gl.getAttribLocation(program, 'a_uv');
    const u_tex = gl.getUniformLocation(program, 'u_tex');
    gl.uniform1i(u_tex, 0);

    // TRIANGLE_STRIP: TL, TR, BL, BR — UV (0,0)  bitmap top-left
    const quad = new Float32Array([-1, 1, 0, 0, 1, 1, 1, 0, -1, -1, 0, 1, 1, -1, 1, 1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    let vao: WebGLVertexArrayObject | undefined;
    if (isWebGL2) {
      const g2 = gl as WebGL2RenderingContext;
      vao = g2.createVertexArray() ?? undefined;
      if (vao) {
        g2.bindVertexArray(vao);
        g2.bindBuffer(g2.ARRAY_BUFFER, buffer);
        const stride = 16;
        g2.enableVertexAttribArray(a_pos);
        g2.vertexAttribPointer(a_pos, 2, g2.FLOAT, false, stride, 0);
        g2.enableVertexAttribArray(a_uv);
        g2.vertexAttribPointer(a_uv, 2, g2.FLOAT, false, stride, 8);
        g2.bindVertexArray(null);
      }
    }

    return {
      gl,
      program,
      texture,
      buffer,
      vao,
      loc: { a_pos, a_uv, u_tex },
      isWebGL2,
      screenSize: size,
    };
  }, []);

  const releaseGl = useCallback((bundle: GlBundle) => {
    const { gl, program, texture, buffer, vao } = bundle;
    if (vao && 'deleteVertexArray' in gl) {
      (gl as WebGL2RenderingContext).deleteVertexArray(vao);
    }
    gl.deleteProgram(program);
    gl.deleteTexture(texture);
    gl.deleteBuffer(buffer);
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (SCREEN_SIZE < 1) return;

    let bundle = glBundleRef.current;
    if (!bundle || bundle.screenSize !== SCREEN_SIZE || bundle.gl.canvas !== canvas) {
      if (bundle) releaseGl(bundle);
      bundle = initGl(canvas, SCREEN_SIZE);
      glBundleRef.current = bundle;
    }

    if (!bundle) return;

    const { gl, program, texture, buffer, loc, isWebGL2 } = bundle;
    const fb = fbSnapshotRef.current;

    let upload: Uint8Array;
    if (fb.length >= CANVAS_PIXELS) {
      upload = fb.subarray(0, CANVAS_PIXELS);
    } else {
      let pad = uploadPadRef.current;
      if (!pad || pad.length !== CANVAS_PIXELS) {
        pad = new Uint8Array(CANVAS_PIXELS);
        uploadPadRef.current = pad;
        uploadPadZeroedFromRef.current = 0;
      } else {
        const zeroFrom = Math.min(uploadPadZeroedFromRef.current, pad.length);
        if (zeroFrom < pad.length) pad.fill(0, zeroFrom);
      }
      pad.set(fb);
      uploadPadZeroedFromRef.current = Math.min(fb.length, pad.length);
      upload = pad;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    if (isWebGL2) {
      const g2 = gl as WebGL2RenderingContext;
      g2.texImage2D(g2.TEXTURE_2D, 0, g2.R8, SCREEN_SIZE, SCREEN_SIZE, 0, g2.RED, g2.UNSIGNED_BYTE, upload);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, SCREEN_SIZE, SCREEN_SIZE, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, upload);
    }

    gl.useProgram(program);
    if (isWebGL2 && bundle.vao && 'bindVertexArray' in gl) {
      (gl as WebGL2RenderingContext).bindVertexArray(bundle.vao);
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const stride = 16;
      gl.enableVertexAttribArray(loc.a_pos);
      gl.vertexAttribPointer(loc.a_pos, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(loc.a_uv);
      gl.vertexAttribPointer(loc.a_uv, 2, gl.FLOAT, false, stride, 8);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (isWebGL2 && bundle.vao && 'bindVertexArray' in gl) {
      (gl as WebGL2RenderingContext).bindVertexArray(null);
    } else {
      gl.disableVertexAttribArray(loc.a_pos);
      gl.disableVertexAttribArray(loc.a_uv);
    }
  }, [SCREEN_SIZE, CANVAS_PIXELS, initGl, releaseGl]);

  const onDump = useCallback(
    (response: Extract<WorkerMessageResponse, { command: EWorkerCommand.CPU_DUMP }>) => {
      const newDump = response.data;

      const isFullMemory = newDump.memory.length > 0;
      const diff = newDump.memoryDiff;
      let framebufferTouched = isFullMemory;
      const fb = fbSnapshotRef.current;

      if (isFullMemory) {
        const memory = newDump.memory;
        const copyLen = Math.min(fb.length, FB_BYTE_LEN, Math.max(0, memory.length - FB_START));
        fb.set(memory.subarray(FB_START, FB_START + copyLen));
      }

      for (const addrStr in diff) {
        if (!Object.prototype.hasOwnProperty.call(diff, addrStr)) continue;

        const addr = Number(addrStr);
        if (addr < FB_START || addr > FB_END) continue;

        const fbIdx = addr - FB_START;
        if (fbIdx >= fb.length) continue;

        fb[fbIdx] = diff[addrStr]!;
        framebufferTouched = true;
      }

      if (!framebufferTouched) {
        return;
      }

      if (visible) {
        redraw();
      }
    },
    [redraw, FB_START, FB_END, FB_BYTE_LEN, visible],
  );

  useEffect(() => {
    if (!visible) return;
    redraw();
  }, [visible, redraw, SCREEN_SIZE]);

  useEffect(() => {
    const ws = simulator.workerService;
    ws.on(EWorkerCommand.CPU_DUMP, onDump);
    ws.requestCpuDump();

    return () => {
      ws.off(EWorkerCommand.CPU_DUMP, onDump);
    };
  }, [simulator.workerService, onDump]);

  useEffect(() => {
    return () => {
      const b = glBundleRef.current;
      if (b) releaseGl(b);
      glBundleRef.current = null;
    };
  }, [releaseGl]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!visible) return;

      e.preventDefault();
      e.stopPropagation();

      simulator.handleKeyPress(e);
    },
    [simulator, visible],
  );

  useEffect(() => {
    const ref = screenRef.current;

    ref?.addEventListener('keydown', handleKeyPress, true);

    return () => ref?.removeEventListener('keydown', handleKeyPress, true);
  }, [handleKeyPress]);

  return (
    <Draggable>
      <div
        style={{
          cursor: 'grab',
          backgroundColor: 'grey',
          width: SCREEN_DIV_SIZE,
          height: SCREEN_DIV_SIZE,
          left: window.innerWidth / 2 - SCREEN_DIV_SIZE / 2,
          top: window.innerHeight / 2 - SCREEN_DIV_SIZE / 2,
          zIndex: 10,
          position: 'absolute',
          boxShadow: '0 2px 10px 20px rgba(0, 0, 0, 0.5)',
        }}
        onClick={() => screenRef.current?.focus({ preventScroll: true })}
      >
        <canvas
          ref={canvasRef}
          width={SCREEN_SIZE}
          height={SCREEN_SIZE}
          style={{
            imageRendering: 'pixelated',
            position: 'absolute',
            width: SCREEN_DIV_SIZE,
            height: SCREEN_DIV_SIZE,
          }}
        />

        <input type="text" style={{ opacity: 0, maxWidth: 0, maxHeight: 0 }} ref={screenRef} />
      </div>
    </Draggable>
  );
}
