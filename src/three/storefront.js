// 밑줄상점 외관 — 밤의 동네 문장 가게. 불이 켜지고, 간판이 빛나고, 밑줄이 그어지고, 문이 열린다.
import * as THREE from 'three';

const SIGN_FONT = "'Noto Serif KR', serif";

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, t) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return { tex: t, canvas: c, g };
}

function rnd(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── 텍스처들 ─────────────────────────────
function woodPlanks(color, w = 512, h = 512, planks = 10, seed = 3) {
  const r = rnd(seed);
  return canvasTex(w, h, (g) => {
    const pw = w / planks;
    for (let i = 0; i < planks; i++) {
      const l = 0.9 + r() * 0.2;
      g.fillStyle = shade(color, l);
      g.fillRect(i * pw, 0, pw, h);
      g.strokeStyle = 'rgba(0,0,0,.35)';
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(i * pw, 0); g.lineTo(i * pw, h); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.08)';
      for (let k = 0; k < 6; k++) {
        const x = i * pw + r() * pw;
        g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 4, h * 0.3, x - 4, h * 0.6, x + 2, h); g.stroke();
      }
    }
  }).tex;
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const gg = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  return `rgb(${r},${gg},${b})`;
}

function plaster() {
  const r = rnd(11);
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#e8dbbf';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i++) {
      g.fillStyle = `rgba(${90 + r() * 40},${70 + r() * 30},${40},${r() * 0.06})`;
      g.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3);
    }
  }).tex;
}

function roofTiles() {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#2b3138';
    g.fillRect(0, 0, w, h);
    const rows = 9;
    for (let y = 0; y < rows; y++) {
      const ry = (y / rows) * h;
      g.fillStyle = y % 2 ? '#343b43' : '#30363e';
      g.fillRect(0, ry, w, h / rows - 3);
      g.fillStyle = 'rgba(0,0,0,.45)';
      g.fillRect(0, ry + h / rows - 3, w, 3);
      for (let x = (y % 2) * 16; x < w; x += 32) {
        g.fillRect(x, ry, 2, h / rows - 3);
      }
    }
  }).tex;
}

function awningStripes() {
  return canvasTex(512, 128, (g, w, h) => {
    const n = 14;
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 2 ? '#efe4cc' : '#2f4b3c';
      g.fillRect((i / n) * w, 0, w / n + 1, h);
    }
    // 아래쪽 물결 가장자리 그림자
    const grad = g.createLinearGradient(0, h * 0.75, 0, h);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,.25)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }).tex;
}

function stoneTiles() {
  const r = rnd(7);
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#6d6862';
    g.fillRect(0, 0, w, h);
    const s = 64;
    for (let y = 0; y < h; y += s) {
      for (let x = 0; x < w; x += s) {
        g.fillStyle = shade('#77716a', 0.9 + r() * 0.2);
        g.fillRect(x + 2, y + 2, s - 4, s - 4);
      }
    }
  }).tex;
}

// 진열창: 선반, 책등, 걸린 문장 메모, 펜던트 조명
function shopWindow(seed) {
  const r = rnd(seed);
  return canvasTex(512, 384, (g, w, h) => {
    const bg = g.createRadialGradient(w * 0.5, h * 0.15, 10, w * 0.5, h * 0.4, w * 0.75);
    bg.addColorStop(0, '#ffe2a8');
    bg.addColorStop(1, '#c98a4b');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    // 펜던트 조명
    for (const lx of [w * 0.28, w * 0.72]) {
      g.strokeStyle = '#3b2a1c'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx, 46); g.stroke();
      g.fillStyle = '#2f4b3c';
      g.beginPath(); g.moveTo(lx - 22, 64); g.lineTo(lx + 22, 64); g.lineTo(lx + 10, 44); g.lineTo(lx - 10, 44); g.closePath(); g.fill();
      g.fillStyle = '#fff6d8';
      g.beginPath(); g.arc(lx, 66, 6, 0, Math.PI * 2); g.fill();
    }
    // 선반 3단
    const spines = ['#7a2e2e', '#2f4b3c', '#1f3550', '#b78a3c', '#5a3a22', '#efe4cc', '#6a4a6e', '#8a5a3a'];
    [150, 245, 340].forEach((sy, si) => {
      g.fillStyle = '#5a3a22';
      g.fillRect(14, sy, w - 28, 10);
      let x = 22;
      while (x < w - 40) {
        if (si === 1 && x > w * 0.38 && x < w * 0.62) { x += 8; continue; }
        const bw = 10 + r() * 12;
        const bh = 46 + r() * 30;
        g.fillStyle = spines[Math.floor(r() * spines.length)];
        const lean = r() < 0.08 ? 0.18 : 0;
        g.save(); g.translate(x, sy); g.rotate(-lean);
        g.fillRect(0, -bh, bw, bh);
        g.fillStyle = 'rgba(255,240,200,.5)';
        g.fillRect(2, -bh + 8, bw - 4, 2);
        g.restore();
        x += bw + 2 + (r() < 0.12 ? 18 : 0);
      }
    });
    // 가운데 걸린 문장 메모
    g.save();
    g.translate(w * 0.5, 205); g.rotate(-0.05);
    g.fillStyle = '#fffaf0'; g.fillRect(-52, -40, 104, 74);
    g.fillStyle = 'rgba(206,192,160,.9)'; g.fillRect(-18, -46, 36, 12);
    g.fillStyle = '#3b3029';
    for (let i = 0; i < 3; i++) g.fillRect(-38, -20 + i * 14, i === 2 ? 46 : 76, 4);
    g.fillStyle = 'rgba(232,170,60,.85)'; g.fillRect(-38, 18, 50, 4);
    g.restore();
    // 창 유리 반사
    g.fillStyle = 'rgba(255,255,255,.08)';
    g.beginPath(); g.moveTo(w * 0.6, 0); g.lineTo(w * 0.75, 0); g.lineTo(w * 0.4, h); g.lineTo(w * 0.25, h); g.fill();
  });
}

function upperWindow() {
  return canvasTex(256, 320, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#ffd892');
    bg.addColorStop(1, '#d99a55');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    // 커튼
    g.fillStyle = 'rgba(122,46,46,.75)';
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(w * 0.3, h * 0.4, w * 0.12, h); g.lineTo(0, h); g.fill();
    g.beginPath(); g.moveTo(w, 0); g.quadraticCurveTo(w * 0.7, h * 0.4, w * 0.88, h); g.lineTo(w, h); g.fill();
    // 창살
    g.fillStyle = '#3b2a1c';
    g.fillRect(w / 2 - 4, 0, 8, h);
    g.fillRect(0, h / 2 - 4, w, 8);
    g.lineWidth = 14; g.strokeStyle = '#3b2a1c'; g.strokeRect(0, 0, w, h);
  });
}

function doorGlass() {
  return canvasTex(128, 192, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#ffe3a6');
    bg.addColorStop(1, '#e0a25e');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a3d31';
    g.fillRect(w / 2 - 3, 0, 6, h);
    g.fillRect(0, h / 3 - 3, w, 6);
    g.fillRect(0, (2 * h) / 3 - 3, w, 6);
  });
}

function interiorGlow() {
  return canvasTex(256, 256, (g, w, h) => {
    const bg = g.createRadialGradient(w / 2, h * 0.35, 10, w / 2, h / 2, w * 0.7);
    bg.addColorStop(0, '#fff3cf');
    bg.addColorStop(0.5, '#f2b56a');
    bg.addColorStop(1, '#8a5530');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
  }).tex;
}

// 간판: 글자 + 진행도에 따라 그려지는 손그림 밑줄
function makeSign() {
  const W = 1024;
  const H = 256;
  const base = canvasTex(W, H, () => {});
  const glow = canvasTex(W, H, () => {});
  const draw = (underline) => {
    const g = base.g;
    g.clearRect(0, 0, W, H);
    // 나무 판
    g.fillStyle = '#1f2b26';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = `rgba(255,255,255,${0.015 + i * 0.004})`;
      g.fillRect(0, (i * H) / 6, W, 2);
    }
    g.strokeStyle = '#b38a45'; g.lineWidth = 6; g.strokeRect(16, 16, W - 32, H - 32);
    g.strokeStyle = 'rgba(179,138,69,.5)'; g.lineWidth = 2; g.strokeRect(30, 30, W - 60, H - 60);
    g.fillStyle = '#c9a463';
    g.font = `500 22px ${SIGN_FONT}`;
    g.textAlign = 'center';
    g.fillText('UNDERLINE  ·  TEXT  SELECT  SHOP', W / 2, 62);
    drawLetters(g, '#e9c77d');
    drawUnderline(g, underline, '#e9c77d', 7);

    const gg = glow.g;
    gg.clearRect(0, 0, W, H);
    gg.fillStyle = '#000';
    gg.fillRect(0, 0, W, H);
    drawLetters(gg, '#ffcf7a');
    drawUnderline(gg, underline, '#ffcf7a', 7);
    base.tex.needsUpdate = true;
    glow.tex.needsUpdate = true;
  };
  function drawLetters(g, color) {
    g.fillStyle = color;
    g.font = `600 112px ${SIGN_FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.fillText('밑줄상점', W / 2, 168);
  }
  function drawUnderline(g, p, color, lw) {
    if (p <= 0) return;
    const x0 = W / 2 - 230;
    const x1 = W / 2 + 230;
    const steps = 60;
    g.strokeStyle = color;
    g.lineWidth = lw;
    g.lineCap = 'round';
    g.beginPath();
    for (let i = 0; i <= steps * p; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = 200 + Math.sin(t * Math.PI * 2.2) * 4 - t * 6;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
  draw(0);
  return { map: base.tex, emissiveMap: glow.tex, draw };
}

export function createStorefront(canvas, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x141b29, 26, 60);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };
  const std = (opts) => track(new THREE.MeshStandardMaterial(opts));
  const box = (w, h, d) => track(new THREE.BoxGeometry(w, h, d));
  const plane = (w, h) => track(new THREE.PlaneGeometry(w, h));
  const add = (geo, mat, x, y, z, parent = scene) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  // ── 하늘: 별, 달 ──
  const starGeo = track(new THREE.BufferGeometry());
  const starPos = [];
  const r = rnd(42);
  for (let i = 0; i < 420; i++) starPos.push((r() - 0.5) * 90, 6 + r() * 34, -30 - r() * 10);
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const starMat = track(new THREE.PointsMaterial({ color: 0xfff1cf, size: 0.16, transparent: true, opacity: 0.85, sizeAttenuation: true }));
  scene.add(new THREE.Points(starGeo, starMat));

  const moonTex = canvasTex(256, 256, (g, w) => {
    const grd = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    grd.addColorStop(0, 'rgba(255,246,214,1)');
    grd.addColorStop(0.32, 'rgba(255,240,200,1)');
    grd.addColorStop(0.36, 'rgba(255,230,170,.35)');
    grd.addColorStop(1, 'rgba(255,230,170,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, w);
  }).tex;
  track(moonTex);
  const moon = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: moonTex, transparent: true, depthWrite: false })));
  moon.scale.set(5, 5, 1);
  moon.position.set(-15, 17, -26);
  scene.add(moon);

  // ── 바닥 ──
  const stone = track(stoneTiles());
  stone.wrapS = stone.wrapT = THREE.RepeatWrapping;
  stone.repeat.set(10, 3);
  const sidewalk = add(plane(60, 7), std({ map: stone, roughness: 0.95 }), 0, 0, 2.6);
  sidewalk.rotation.x = -Math.PI / 2;
  const street = add(plane(80, 30), std({ color: 0x1e2128, roughness: 1 }), 0, -0.02, 20);
  street.rotation.x = -Math.PI / 2;
  add(box(60, 0.18, 0.3), std({ color: 0x8a847b, roughness: 0.9 }), 0, 0.06, 6.1);

  // 양옆 어두운 이웃 건물 실루엣
  const neighborMat = std({ color: 0x1a2030, roughness: 1 });
  add(box(7, 9, 3), neighborMat, -9.6, 4.5, -1.5);
  add(box(7, 7.5, 3), neighborMat, 9.6, 3.75, -1.5);
  const nWinMat = std({ color: 0x2a3348, emissive: 0xffc77a, emissiveIntensity: 0 });
  const neighborWins = [add(plane(0.9, 1.2), nWinMat, -8.2, 6.5, 0.01), add(plane(0.9, 1.2), nWinMat, 8.4, 5.2, 0.01)];

  // ── 가게 ──
  const shop = new THREE.Group();
  scene.add(shop);
  const W = 8.6;

  // 1층: 짙은 나무
  const woodTex = track(woodPlanks('#4a2e20', 512, 512, 14, 5));
  add(box(W, 3.4, 2.6), std({ map: woodTex, roughness: 0.85 }), 0, 1.7, -1.3, shop);
  // 2층: 회벽 + 나무 기둥 (하프팀버)
  const plasterTex = track(plaster());
  add(box(W - 0.3, 2.9, 2.4), std({ map: plasterTex, roughness: 0.95 }), 0, 5.35, -1.3, shop);
  const beamMat = std({ color: 0x3b2a1c, roughness: 0.8 });
  [-W / 2 + 0.35, -1.45, 1.45, W / 2 - 0.35].forEach((x) => add(box(0.24, 2.9, 0.12), beamMat, x, 5.35, -0.06, shop));
  add(box(W - 0.2, 0.2, 0.16), beamMat, 0, 6.72, -0.05, shop);

  // 지붕 (박공)
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-W / 2 - 0.5, 0);
  roofShape.lineTo(0, 2.1);
  roofShape.lineTo(W / 2 + 0.5, 0);
  roofShape.lineTo(-W / 2 - 0.5, 0);
  const roofGeo = track(new THREE.ExtrudeGeometry(roofShape, { depth: 3.2, bevelEnabled: false }));
  const gable = add(roofGeo, std({ map: plasterTex, roughness: 0.95 }), 0, 6.8, -2.9, shop);
  gable.scale.set(0.96, 1, 1);
  const tileTex = track(roofTiles());
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.repeat.set(3, 1);
  const roofMat = std({ map: tileTex, roughness: 0.75, side: THREE.DoubleSide });
  const slope = Math.atan2(2.1, W / 2 + 0.5);
  const slopeLen = Math.hypot(2.1, W / 2 + 0.5) + 0.2;
  const roofL = add(box(slopeLen, 0.14, 3.7), roofMat, -(W / 2 + 0.5) / 2, 6.8 + 1.05, -1.25, shop);
  roofL.rotation.z = slope;
  const roofR = add(box(slopeLen, 0.14, 3.7), roofMat, (W / 2 + 0.5) / 2, 6.8 + 1.05, -1.25, shop);
  roofR.rotation.z = -slope;
  // 다락 동그란 창
  const atticMat = std({ color: 0x2a2018, emissive: 0xffc77a, emissiveIntensity: 0 });
  const attic = add(track(new THREE.CircleGeometry(0.42, 32)), atticMat, 0, 7.75, 0.31, shop);
  add(track(new THREE.TorusGeometry(0.44, 0.06, 8, 32)), beamMat, 0, 7.75, 0.33, shop);
  attic.renderOrder = 1;

  // 2층 창문
  const upTex = upperWindow();
  track(upTex.tex);
  const upMat = std({ map: upTex.tex, emissiveMap: upTex.tex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.4 });
  [-2.85, 2.85].forEach((x) => {
    add(plane(1.5, 1.85), upMat, x, 5.35, -0.08, shop);
    add(box(1.8, 0.14, 0.3), beamMat, x, 4.35, 0.02, shop);
    // 화분 상자
    add(box(1.6, 0.3, 0.32), std({ color: 0x6b3a2a, roughness: 0.9 }), x, 4.15, 0.18, shop);
    for (let i = 0; i < 6; i++) {
      add(track(new THREE.SphereGeometry(0.16 + (i % 3) * 0.03, 10, 8)), std({ color: i % 2 ? 0x3d6b45 : 0x4f8253, roughness: 1 }), x - 0.65 + i * 0.26, 4.38, 0.2, shop);
    }
  });

  // 간판
  const sign = makeSign();
  track(sign.map); track(sign.emissiveMap);
  const signMat = std({ map: sign.map, emissiveMap: sign.emissiveMap, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.55 });
  add(box(6.6, 1.1, 0.16), std({ color: 0x2a1d14 }), 0, 3.82, 0.1, shop);
  add(plane(6.4, 1.6 * (6.4 / 6.4) * 0.25 * 4), signMat, 0, 3.82, 0.19, shop).scale.set(1, 0.6875, 1);

  // 차양
  const awnTex = track(awningStripes());
  awnTex.wrapS = THREE.RepeatWrapping;
  const awnMat = std({ map: awnTex, roughness: 0.9, side: THREE.DoubleSide });
  const awning = add(plane(W - 0.4, 1.3), awnMat, 0, 3.0, 0.55, shop);
  awning.rotation.x = -Math.PI / 2 + 0.62;
  // 차양 끝 가리개 (물결)
  const valTex = canvasTex(512, 64, (g, w, h) => {
    for (let i = 0; i < 14; i++) {
      g.fillStyle = i % 2 ? '#efe4cc' : '#2f4b3c';
      g.beginPath();
      const x0 = (i / 14) * w;
      const x1 = ((i + 1) / 14) * w;
      g.moveTo(x0, 0); g.lineTo(x1, 0); g.lineTo(x1, h * 0.55);
      g.quadraticCurveTo((x0 + x1) / 2, h * 1.1, x0, h * 0.55);
      g.fill();
    }
  });
  track(valTex.tex);
  add(plane(W - 0.4, 0.32), std({ map: valTex.tex, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide }), 0, 2.4, 1.08, shop);

  // 진열창
  const winMats = [];
  [-2.75, 2.75].forEach((x, i) => {
    const t = shopWindow(9 + i * 13);
    track(t.tex);
    const m = std({ map: t.tex, emissiveMap: t.tex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.35 });
    winMats.push(m);
    add(plane(2.7, 2.0), m, x, 1.45, 0.01, shop);
    // 창틀
    const fm = std({ color: 0x2a3d31, roughness: 0.6 });
    add(box(2.95, 0.14, 0.18), fm, x, 2.5, 0.05, shop);
    add(box(2.95, 0.22, 0.3), fm, x, 0.38, 0.1, shop);
    add(box(0.12, 2.2, 0.18), fm, x - 1.42, 1.45, 0.05, shop);
    add(box(0.12, 2.2, 0.18), fm, x + 1.42, 1.45, 0.05, shop);
  });

  // 문 (안쪽에서 빛)
  const interiorTex = track(interiorGlow());
  const interiorMat = track(new THREE.MeshBasicMaterial({ map: interiorTex, color: 0x000000 }));
  add(plane(1.7, 2.45), interiorMat, 0, 1.25, -0.3, shop);
  const doorFrameMat = std({ color: 0x2a3d31, roughness: 0.6 });
  add(box(2.0, 0.16, 0.3), doorFrameMat, 0, 2.55, 0.0, shop);
  add(box(0.14, 2.6, 0.3), doorFrameMat, -0.93, 1.3, 0.0, shop);
  add(box(0.14, 2.6, 0.3), doorFrameMat, 0.93, 1.3, 0.0, shop);
  add(box(2.2, 0.12, 0.7), std({ color: 0x5f5850, roughness: 0.9 }), 0, 0.06, 0.25, shop);

  const glass = doorGlass();
  track(glass.tex);
  const glassMat = std({ map: glass.tex, emissiveMap: glass.tex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.3 });
  const doorMat = std({ color: 0x35553f, roughness: 0.6 });
  const brass = std({ color: 0xc9a463, metalness: 0.8, roughness: 0.3 });
  const makeDoor = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.86, 1.25, 0.02);
    shop.add(pivot);
    const leaf = new THREE.Group();
    leaf.position.x = -side * 0.43;
    pivot.add(leaf);
    add(box(0.84, 2.42, 0.08), doorMat, 0, 0, 0, leaf);
    add(plane(0.56, 1.1), glassMat, 0, 0.42, 0.045, leaf);
    add(box(0.6, 0.05, 0.02), doorMat, 0, -0.55, 0.05, leaf);
    add(box(0.6, 0.05, 0.02), doorMat, 0, -0.85, 0.05, leaf);
    add(track(new THREE.SphereGeometry(0.05, 12, 8)), brass, -side * 0.32, -0.1, 0.07, leaf);
    return pivot;
  };
  const doorL = makeDoor(-1);
  const doorR = makeDoor(1);
  // OPEN 팻말
  const openTex = canvasTex(128, 64, (g, w, h) => {
    g.fillStyle = '#fffaf0'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#7a2e2e'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#7a2e2e'; g.font = `700 30px ${SIGN_FONT}`; g.textAlign = 'center'; g.fillText('OPEN', w / 2, 43);
  });
  track(openTex.tex);
  const openSign = add(plane(0.42, 0.21), std({ map: openTex.tex, roughness: 0.8 }), 0, 0.2, 0.09, doorR.children[0]);
  openSign.position.x = 0;

  // 벽등 2개
  const lampMats = [];
  [-1.35, 1.35].forEach((x) => {
    add(box(0.08, 0.3, 0.3), beamMat, x, 2.15, 0.15, shop);
    const lm = std({ color: 0x332211, emissive: 0xffc06a, emissiveIntensity: 0 });
    lampMats.push(lm);
    add(track(new THREE.SphereGeometry(0.13, 16, 12)), lm, x, 2.0, 0.32, shop);
  });

  // 우체통 (편지 = 문장)
  const post = new THREE.Group();
  post.position.set(-4.95, 0, 1.4);
  scene.add(post);
  const red = std({ color: 0xa3352b, roughness: 0.55 });
  add(track(new THREE.CylinderGeometry(0.34, 0.34, 1.1, 24)), red, 0, 0.75, 0, post);
  add(track(new THREE.SphereGeometry(0.34, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)), red, 0, 1.3, 0, post);
  add(box(0.36, 0.05, 0.05), std({ color: 0x1a1a1a }), 0, 1.05, 0.33, post);
  add(track(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 24)), std({ color: 0x2a2a2a }), 0, 0.1, 0, post);

  // 화분들
  const pot = std({ color: 0x9a5a3a, roughness: 0.9 });
  [[4.7, 1.2, 0.9], [5.35, 1.6, 0.65]].forEach(([x, z, s]) => {
    add(track(new THREE.CylinderGeometry(0.3 * s, 0.22 * s, 0.5 * s, 16)), pot, x, 0.25 * s, z);
    for (let i = 0; i < 5; i++) {
      add(track(new THREE.SphereGeometry(0.28 * s, 10, 8)), std({ color: i % 2 ? 0x3d6b45 : 0x55885a, roughness: 1 }), x + Math.sin(i * 1.3) * 0.18 * s, 0.62 * s + (i % 3) * 0.14 * s, z + Math.cos(i * 1.3) * 0.12 * s);
    }
  });

  // ── 조명 ──
  const hemi = new THREE.HemisphereLight(0x5c6f9c, 0x1a120c, 0.9);
  scene.add(hemi);
  const moonLight = new THREE.DirectionalLight(0xaebfe6, 0.7);
  moonLight.position.set(-8, 14, 10);
  scene.add(moonLight);
  const warm = new THREE.PointLight(0xffb867, 0, 14, 1.6);
  warm.position.set(0, 1.8, 1.6);
  scene.add(warm);
  const signLight = new THREE.PointLight(0xffd08a, 0, 6, 1.8);
  signLight.position.set(0, 3.9, 1.4);
  scene.add(signLight);
  const doorLight = new THREE.PointLight(0xffd59a, 0, 20, 1.2);
  doorLight.position.set(0, 1.4, 0.4);
  scene.add(doorLight);

  // ── 카메라 배치 ──
  const camBase = new THREE.Vector3();
  const target = new THREE.Vector3(0, 3.6, 0);
  let aspect = 1;
  function layout(w, h) {
    aspect = w / h;
    camera.aspect = aspect;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const portrait = aspect < 0.8;
    const needW = portrait ? 9.4 : 12; // 가게 + 소품이 들어올 너비
    const needH = portrait ? 15 : 14.5; // 아래쪽 슬로건·버튼 자리까지
    const distW = needW / 2 / (Math.tan(vFov / 2) * aspect);
    const distH = needH / 2 / Math.tan(vFov / 2);
    const dist = Math.max(distW, distH);
    // 가게를 화면 위쪽에 두고, 아래쪽 1/3은 슬로건과 버튼 자리로 남긴다
    target.set(0, portrait ? 0.4 : 1.9, 0);
    camBase.set(0, 2.4, dist);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  // ── 연출 타임라인 ──
  const T = reducedMotion
    ? { lights: [0, 0.01], sign: [0, 0.01], line: [0, 0.01] }
    : { lights: [0.45, 1.35], sign: [1.35, 2.0], line: [2.0, 2.75] };
  let t0 = performance.now();
  let enterAt = null;
  let lastLine = -1;
  let raf = 0;
  let px = 0;
  let py = 0;
  const onMove = (e) => {
    px = (e.clientX / window.innerWidth - 0.5) * 2;
    py = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove);

  const flick = (t) => (t < T.lights[1] + 0.2 ? 0.85 + 0.15 * Math.sin(t * 60) * Math.sin(t * 23) : 1);

  function frame(now) {
    const t = (now - t0) / 1000;
    const L = smooth(T.lights[0], T.lights[1], t) * flick(t);
    const S = smooth(T.sign[0], T.sign[1], t);
    const U = smooth(T.line[0], T.line[1], t);

    winMats.forEach((m) => { m.emissiveIntensity = 0.06 + L * 0.95; });
    upMat.emissiveIntensity = 0.04 + smooth(T.lights[0] + 0.3, T.lights[1] + 0.3, t) * 0.8;
    atticMat.emissiveIntensity = smooth(T.lights[0] + 0.5, T.lights[1] + 0.5, t) * 0.9;
    glassMat.emissiveIntensity = 0.05 + L * 0.9;
    lampMats.forEach((m) => { m.emissiveIntensity = L * 2.2; });
    nWinMat.emissiveIntensity = 0.5;
    neighborWins[1].visible = t > 1.2;
    warm.intensity = L * 22;
    signMat.emissiveIntensity = S * 1.6;
    signLight.intensity = S * 6;
    if (Math.abs(U - lastLine) > 0.01 || (U === 1 && lastLine !== 1)) {
      sign.draw(U);
      lastLine = U;
    }

    // 문 열기 + 카메라 진입
    let camT = 0;
    if (enterAt !== null) {
      const e = (now - enterAt) / 1000;
      const d = easeInOut(clamp01(e / 0.85));
      doorL.rotation.y = -d * 1.75;
      doorR.rotation.y = d * 1.75;
      interiorMat.color.setScalar(d);
      doorLight.intensity = d * 60;
      camT = easeInOut(clamp01((e - 0.1) / 1.15));
    } else {
      interiorMat.color.setScalar(L * 0.25);
    }

    const sway = enterAt === null && !reducedMotion ? 1 : 0;
    camera.position.set(
      camBase.x + px * 0.35 * sway,
      THREE.MathUtils.lerp(camBase.y - py * 0.15 * sway, 1.45, camT),
      THREE.MathUtils.lerp(camBase.z, 1.8, camT),
    );
    const look = new THREE.Vector3().lerpVectors(target, new THREE.Vector3(0, 1.3, -1), camT);
    camera.lookAt(look);
    starMat.opacity = 0.65 + Math.sin(now / 900) * 0.15;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  return {
    start() {
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    },
    resize: layout,
    skipIntro() {
      t0 = performance.now() - 4000;
    },
    enter() {
      if (enterAt === null) enterAt = performance.now();
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      disposables.forEach((d) => d.dispose?.());
      renderer.dispose();
    },
  };
}
