"use client";

import { useEffect, useRef, useState } from "react";

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  uniform sampler2D u_texture;
  uniform vec2 u_mouse;
  uniform float u_time;
  uniform float u_force;
  uniform float u_aspect;
  varying vec2 v_uv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec2 uv = v_uv;
    vec2 delta = uv - u_mouse;
    delta.x *= u_aspect;
    float distanceToPointer = length(delta);
    vec2 direction = delta / (distanceToPointer + 0.001);
    direction.x /= u_aspect;

    float ripple = sin(distanceToPointer * 48.0 - u_time * 5.2);
    ripple *= exp(-distanceToPointer * 6.4);
    float liquidNoise = noise(uv * 8.0 + vec2(u_time * 0.11, -u_time * 0.08)) - 0.5;
    float wake = exp(-distanceToPointer * 4.2) * u_force;

    vec2 displacement = direction * ripple * (0.005 + u_force * 0.032);
    displacement += vec2(
      sin(uv.y * 24.0 + u_time * 1.7),
      cos(uv.x * 19.0 - u_time * 1.45)
    ) * liquidNoise * (0.0025 + wake * 0.013);

    float chroma = 0.001 + wake * 0.006 + abs(ripple) * u_force * 0.002;
    vec2 redOffset = displacement + vec2(chroma, 0.0);
    vec2 blueOffset = displacement - vec2(chroma, 0.0);

    vec3 color;
    color.r = texture2D(u_texture, uv + redOffset).r;
    color.g = texture2D(u_texture, uv + displacement).g;
    color.b = texture2D(u_texture, uv + blueOffset).b;

    float violetGlow = exp(-distanceToPointer * 5.5) * (0.15 + u_force * 0.85);
    color += vec3(0.19, 0.035, 0.55) * violetGlow;
    color += vec3(0.02, 0.22, 0.36) * max(0.0, ripple) * wake * 0.5;
    color *= 0.965 + 0.035 * sin(v_uv.y * 820.0 + u_time * 2.0);

    float vignette = smoothstep(0.96, 0.24, length(v_uv - 0.5));
    gl_FragColor = vec4(color * (0.72 + vignette * 0.38), 1.0);
  }
`;

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
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

function drawIntroTexture(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#030308";
  context.fillRect(0, 0, width, height);

  const atmosphere = context.createRadialGradient(
    width * 0.5,
    height * 0.5,
    0,
    width * 0.5,
    height * 0.5,
    width * 0.68,
  );
  atmosphere.addColorStop(0, "rgba(71, 29, 196, 0.72)");
  atmosphere.addColorStop(0.42, "rgba(23, 13, 76, 0.44)");
  atmosphere.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = atmosphere;
  context.fillRect(0, 0, width, height);

  const gridSize = Math.max(38, Math.round(width / 34));
  context.lineWidth = Math.max(1, width / 1900);
  for (let x = -gridSize; x <= width + gridSize; x += gridSize) {
    context.strokeStyle =
      x % (gridSize * 4) === 0
        ? "rgba(137, 111, 255, 0.28)"
        : "rgba(174, 164, 255, 0.12)";
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = -gridSize; y <= height + gridSize; y += gridSize) {
    context.strokeStyle =
      y % (gridSize * 4) === 0
        ? "rgba(137, 111, 255, 0.28)"
        : "rgba(174, 164, 255, 0.12)";
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.save();
  context.translate(width * 0.5, height * 0.5);
  context.beginPath();
  context.moveTo(0, -height * 0.43);
  context.lineTo(width * 0.24, height * 0.36);
  context.lineTo(-width * 0.24, height * 0.36);
  context.closePath();
  context.fillStyle = "rgba(94, 50, 255, 0.2)";
  context.fill();
  context.lineWidth = Math.max(2, width / 700);
  context.strokeStyle = "rgba(168, 142, 255, 0.65)";
  context.stroke();
  context.restore();

  let fontSize = Math.round(Math.min(height * 0.4, width * 0.205));
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `900 ${fontSize}px Arial Black, Inter, sans-serif`;
  while (context.measureText("Phyrex").width > width * 0.84 && fontSize > 40) {
    fontSize -= 4;
    context.font = `900 ${fontSize}px Arial Black, Inter, sans-serif`;
  }
  context.fillStyle = "#ffffff";
  context.shadowColor = "rgba(255,255,255,0.2)";
  context.shadowBlur = Math.max(3, width / 420);
  context.fillText("Phyrex", width * 0.5, height * 0.515);
  context.shadowBlur = 0;
}

export function FluidIntro() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program, "u_texture"), 0);

    const timeLocation = gl.getUniformLocation(program, "u_time");
    const mouseLocation = gl.getUniformLocation(program, "u_mouse");
    const forceLocation = gl.getUniformLocation(program, "u_force");
    const aspectLocation = gl.getUniformLocation(program, "u_aspect");
    const textureCanvas = document.createElement("canvas");
    const target = { x: 0.5, y: 0.5 };
    const pointer = { x: 0.5, y: 0.5 };
    let force = 0.38;
    let animationFrame = 0;
    let previousPointer = { x: 0.5, y: 0.5 };
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      textureCanvas.width = width;
      textureCanvas.height = height;
      drawIntroTexture(textureCanvas);
      gl.viewport(0, 0, width, height);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        textureCanvas,
      );
      gl.uniform1f(aspectLocation, width / height);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      target.x = (event.clientX - rect.left) / rect.width;
      target.y = 1 - (event.clientY - rect.top) / rect.height;
      const movement = Math.hypot(
        target.x - previousPointer.x,
        target.y - previousPointer.y,
      );
      force = Math.min(1, force + movement * 5.5);
      previousPointer = { x: target.x, y: target.y };
    };

    const onPointerLeave = () => {
      target.x = 0.5;
      target.y = 0.5;
    };

    const start = performance.now();
    const render = (now: number) => {
      pointer.x += (target.x - pointer.x) * 0.075;
      pointer.y += (target.y - pointer.y) * 0.075;
      force += ((reducedMotion ? 0.12 : 0.28) - force) * 0.025;
      gl.uniform1f(timeLocation, reducedMotion ? 0 : (now - start) / 1000);
      gl.uniform2f(mouseLocation, pointer.x, pointer.y);
      gl.uniform1f(forceLocation, force);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!reducedMotion) animationFrame = requestAnimationFrame(render);
    };

    resize();
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", resize);
    setReady(true);
    render(performance.now());

    return () => {
      cancelAnimationFrame(animationFrame);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", resize);
      gl.deleteTexture(texture);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <section id="top" className="intro-scroll" aria-label="Phyrex 开场">
      <div className="fluid-intro">
        <canvas ref={canvasRef} className="fluid-canvas" aria-hidden="true" />
        <div className="fluid-fallback-grid" aria-hidden="true" />
        <h1 className={ready ? "intro-title is-rendered" : "intro-title"}>
          Phyrex
        </h1>

        <div className="intro-topline">
          <span>PHYREX®</span>
          <span>INTERACTIVE AIGC ARCHIVE</span>
          <span>2026 / CN</span>
        </div>

        <div className="intro-side-data intro-side-data-left" aria-hidden="true">
          <span>LIQUID FIELD</span>
          <span>POINTER FORCE&nbsp;&nbsp;0.78</span>
          <span>REFRACTION&nbsp;&nbsp;&nbsp;&nbsp;1.24</span>
        </div>
        <div className="intro-side-data intro-side-data-right" aria-hidden="true">
          <span>REALTIME DISTORTION</span>
          <span>MOVE POINTER TO DEFORM</span>
          <span>SCROLL TO ACCESS WORKS</span>
        </div>

        <a className="intro-enter" href="#works">
          <span>ENTER WORKS</span>
          <i />
        </a>
      </div>
    </section>
  );
}
