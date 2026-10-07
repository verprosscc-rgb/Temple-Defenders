import * as THREE from 'three';
import { ActiveTool, Gender, TimelineType } from '../types/game';

export interface HumanRigOptions {
  gender: Gender;
  role: 'PLAYER' | 'ALLY' | 'NPC' | 'WEAK_GUARD' | 'RAID_SOLDIER' | 'FINAL_BOSS';
  timeline: TimelineType;
  primaryColor?: number;
  armored?: boolean;
  powerfulSword?: boolean;
  mounted?: boolean;
  playerName?: string;
}

let cachedYouBadgeTexture: THREE.CanvasTexture | null = null;
const playerTagTextureCache = new Map<string, THREE.CanvasTexture>();
const faceTextureCache = new Map<string, THREE.CanvasTexture>();

function getYouTagTexture(): THREE.CanvasTexture {
  if (cachedYouBadgeTexture) return cachedYouBadgeTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 128);

  ctx.shadowColor = 'rgba(245, 158, 11, 0.85)';
  ctx.shadowBlur = 14;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(36, 14, 184, 64, 32);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(110, 78);
  ctx.lineTo(146, 78);
  ctx.lineTo(128, 108);
  ctx.closePath();
  ctx.fillStyle = '#fbbf24';
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.font = '900 38px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fef08a';
  ctx.fillText('YOU', 128, 47);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  cachedYouBadgeTexture = tex;
  return tex;
}

function getPlayerTagTexture(name: string): THREE.CanvasTexture {
  if (playerTagTextureCache.has(name)) {
    return playerTagTextureCache.get(name)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 320, 96);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(20, 12, 280, 50, 25);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(148, 62);
  ctx.lineTo(172, 62);
  ctx.lineTo(160, 82);
  ctx.closePath();
  ctx.fillStyle = '#38bdf8';
  ctx.fill();

  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e0f2fe';
  ctx.fillText(name.slice(0, 16), 160, 38);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  playerTagTextureCache.set(name, tex);
  return tex;
}

function getRealisticHumanFaceTexture(
  gender: Gender,
  skinHex: string,
  hasBeard: boolean,
  isFemale: boolean,
  isBoss: boolean
): THREE.CanvasTexture {
  const key = `${gender}-${skinHex}-${hasBeard}-${isFemale}-${isBoss}-round-v5`;
  if (faceTextureCache.has(key)) {
    return faceTextureCache.get(key)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Smooth Warm Golden-Bronze Human Skin Base
  ctx.fillStyle = skinHex;
  ctx.fillRect(0, 0, 1024, 1024);

  const cx = 512;
  const cy = 512;

  // Soft warm facial highlight in the center of the face
  const faceGlow = ctx.createRadialGradient(cx, cy - 10, 15, cx, cy, 260);
  faceGlow.addColorStop(0, 'rgba(255, 228, 196, 0.25)');
  faceGlow.addColorStop(0.7, 'rgba(210, 125, 85, 0.08)');
  faceGlow.addColorStop(1, 'rgba(110, 50, 28, 0.12)');
  ctx.fillStyle = faceGlow;
  ctx.fillRect(0, 0, 1024, 1024);

  // Warm rosy cheek blush
  [-78, 78].forEach((offsetX) => {
    const cheekGrad = ctx.createRadialGradient(
      cx + offsetX,
      cy + 28,
      4,
      cx + offsetX,
      cy + 28,
      58
    );
    cheekGrad.addColorStop(0, isFemale ? 'rgba(225, 60, 85, 0.36)' : 'rgba(190, 68, 52, 0.22)');
    cheekGrad.addColorStop(1, 'rgba(195, 65, 55, 0)');
    ctx.fillStyle = cheekGrad;
    ctx.fillRect(0, 0, 1024, 1024);
  });

  // 2. Clean Arched Eyebrows
  ctx.strokeStyle = '#140f0c';
  ctx.lineWidth = isFemale ? 11 : 15;
  ctx.lineCap = 'round';
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(cx + side * 26, cy - 56);
    ctx.quadraticCurveTo(cx + side * 58, cy - 74, cx + side * 94, cy - 54);
    ctx.stroke();
  });

  // 3. Clean, Expressive Human Eyes (Painted smoothly onto the round head)
  [-58, 58].forEach((offsetX) => {
    const ex = cx + offsetX;
    const ey = cy - 22;

    // Soft upper eyelid shadow
    ctx.strokeStyle = 'rgba(70, 28, 16, 0.45)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(ex - 30, ey - 8);
    ctx.quadraticCurveTo(ex, ey - 26, ex + 30, ey - 8);
    ctx.stroke();

    // Almond Eye Shape & Crisp White Sclera
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ex - 28, ey);
    ctx.quadraticCurveTo(ex, ey - 20, ex + 28, ey);
    ctx.quadraticCurveTo(ex, ey + 18, ex - 28, ey);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Warm Rich Brown / Crimson Iris
    const irisGrad = ctx.createRadialGradient(ex, ey, 2, ex, ey, 14.5);
    if (isBoss) {
      irisGrad.addColorStop(0, '#991b1b');
      irisGrad.addColorStop(0.7, '#dc2626');
      irisGrad.addColorStop(1, '#18181b');
    } else {
      irisGrad.addColorStop(0, '#5c2d0c');
      irisGrad.addColorStop(0.68, '#78350f');
      irisGrad.addColorStop(1, '#1c1917');
    }
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(ex, ey, 14.5, 0, Math.PI * 2);
    ctx.fill();

    // Deep Black Pupil
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(ex, ey, 7.0, 0, Math.PI * 2);
    ctx.fill();

    // Bright Eye Catchlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex - 4.5, ey - 4.5, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + 4, ey + 3.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Crisp Upper Eyelash Line
    ctx.strokeStyle = '#0f0a07';
    ctx.lineWidth = isFemale ? 7.5 : 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - 30, ey + 1);
    ctx.quadraticCurveTo(ex, ey - 21, ex + 31, ey + 1);
    ctx.stroke();

    // Subtle Lower Lash Rim
    ctx.strokeStyle = 'rgba(25, 15, 10, 0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ex - 24, ey + 3);
    ctx.quadraticCurveTo(ex, ey + 18, ex + 24, ey + 3);
    ctx.stroke();
  });

  // 4. Traditional Forehead Bindi (Female) or Sacred Tilak (Male)
  if (isFemale) {
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(cx, cy - 54, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx, cy - 68, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (!isBoss) {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(cx - 5, cy - 82, 10, 28, 5);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(cx, cy - 58, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Subtle Nose Shading & Nostrils
  ctx.fillStyle = 'rgba(65, 28, 16, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx - 11, cy + 34, 6.5, 4, 0.25, 0, Math.PI * 2);
  ctx.ellipse(cx + 11, cy + 34, 6.5, 4, -0.25, 0, Math.PI * 2);
  ctx.fill();

  // 6. BIG, BOLD ROYAL HANDLEBAR MUSTACHE & BEARD FOR MALE CHARACTERS
  if (!isFemale) {
    ctx.fillStyle = '#110c0a';
    ctx.beginPath();
    // Center philtrum dip & thick upper mustache arch
    ctx.moveTo(cx, cy + 42);
    ctx.bezierCurveTo(cx - 28, cy + 34, cx - 64, cy + 44, cx - 86, cy + 56);
    // Upward-curled left handlebar tip
    ctx.quadraticCurveTo(cx - 102, cy + 62, cx - 106, cy + 42);
    ctx.quadraticCurveTo(cx - 110, cy + 68, cx - 84, cy + 72);
    // Thick lower mustache sweep back to center
    ctx.bezierCurveTo(cx - 56, cy + 74, cx - 26, cy + 64, cx, cy + 62);
    // Thick right lower mustache sweep
    ctx.bezierCurveTo(cx + 26, cy + 64, cx + 56, cy + 74, cx + 84, cy + 72);
    // Upward-curled right handlebar tip
    ctx.quadraticCurveTo(cx + 110, cy + 68, cx + 106, cy + 42);
    ctx.quadraticCurveTo(cx + 102, cy + 62, cx + 86, cy + 56);
    // Upper right mustache arch back to center
    ctx.bezierCurveTo(cx + 64, cy + 44, cx + 28, cy + 34, cx, cy + 42);
    ctx.closePath();
    ctx.fill();

    if (hasBeard) {
      ctx.fillStyle = 'rgba(18, 13, 10, 0.92)';
      ctx.beginPath();
      ctx.moveTo(cx - 92, cy + 32);
      ctx.quadraticCurveTo(cx - 80, cy + 142, cx, cy + 158);
      ctx.quadraticCurveTo(cx + 80, cy + 142, cx + 92, cy + 32);
      ctx.quadraticCurveTo(cx + 62, cy + 106, cx, cy + 112);
      ctx.quadraticCurveTo(cx - 62, cy + 106, cx - 92, cy + 32);
      ctx.fill();
    }
  }

  // 7. Natural, Warm Human Lips & Gentle Confident Smile
  const lipY = cy + 76;
  ctx.fillStyle = isFemale ? '#be123c' : '#944036';
  ctx.beginPath();
  ctx.moveTo(cx - 34, lipY - 2);
  ctx.quadraticCurveTo(cx - 14, lipY - 14, cx, lipY - 8);
  ctx.quadraticCurveTo(cx + 14, lipY - 14, cx + 34, lipY - 2);
  ctx.quadraticCurveTo(cx, lipY + 18, cx - 34, lipY - 2);
  ctx.fill();

  // Center mouth smile line
  ctx.strokeStyle = 'rgba(42, 14, 12, 0.75)';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 34, lipY - 2);
  ctx.quadraticCurveTo(cx, lipY + 3, cx + 34, lipY - 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  faceTextureCache.set(key, texture);
  return texture;
}

// ============================================================================
// SMOOTH, ROUND HUMAN HEAD & CONNECTED ANATOMICAL BODY GEOMETRY SCULPTORS
// ============================================================================

function gaussian(x: number, mean: number, sigma: number): number {
  const d = (x - mean) / sigma;
  return Math.exp(-0.5 * d * d);
}

/**
 * Creates a smooth, naturally proportioned human head with cranium, cheekbones, jawline, and chin
 */
function createAnatomicalHeadGeometry(isFemale: boolean): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.21, 48, 48);
  geo.rotateY(-Math.PI / 2);

  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const y = v.y / 0.21; // -1 at chin, +1 at crown
    const z = v.z / 0.21; // +1 at face front, -1 at back of skull

    // Natural human cranial width-to-height-to-depth ratio
    v.x *= isFemale ? 0.86 : 0.89;
    v.y *= 1.06;
    v.z *= 0.95;

    // Subtle cheekbone prominence around y ~ -0.1, z > 0.2
    if (z > 0) {
      const cheek = gaussian(y, -0.08, 0.22) * Math.pow(z, 0.8) * 0.035;
      v.x *= 1 + cheek;
    }

    // Smooth human jawline & tapered chin (oval/heart face for female, defined jaw for male)
    if (y < 0) {
      const jawTaper = 1.0 - Math.pow(-y, 1.55) * (isFemale ? 0.26 : 0.20);
      v.x *= jawTaper;
      v.z *= 1.0 - Math.pow(-y, 1.75) * 0.1;
    }

    // Connect the base of the skull directly into the anatomical neck column so it never pinches to a spherical tip
    if (y < -0.22 && z < 0.25) {
      const neckBlend = Math.min(1.0, (-y - 0.22) / 0.55);
      const targetR = isFemale ? 0.074 : 0.092;
      const curR = Math.hypot(v.x, v.z);
      if (curR < targetR) {
        const factor = (targetR / Math.max(0.001, curR)) * neckBlend + (1 - neckBlend);
        v.x *= factor;
        v.z *= factor;
      }
      v.y -= neckBlend * 0.035;
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Helper to compute the exact anatomical human torso cross-section (rx, rz) and spinal S-curve at height t in [0..1]
 * Features a distinct human waist, broad buff V-taper (male) / hourglass silhouette with out-bulging bust (female),
 * full trapezius shoulder slope, and a thick connected neck column.
 */
function getTorsoCrossSection(t: number, theta: number, isFemale: boolean, shellOffset: number = 0) {
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);

  let rx = 0.16;
  let rz = 0.12;

  const hipW = isFemale ? 0.158 : 0.172;
  const hipD = isFemale ? 0.118 : 0.124;
  const waistW = isFemale ? 0.102 : 0.146;
  const waistD = isFemale ? 0.078 : 0.110;
  const chestW = isFemale ? 0.160 : 0.268;
  const chestD = isFemale ? 0.118 : 0.146;
  const neckBaseW = isFemale ? 0.078 : 0.118;
  const neckBaseD = isFemale ? 0.074 : 0.112;
  const neckW = isFemale ? 0.068 : 0.102;
  const neckD = isFemale ? 0.066 : 0.098;

  if (t < 0.15) {
    // Smoothly rounded pelvis & hip curve connecting into the upper legs
    const k = t / 0.15;
    const ease = Math.sin(k * (Math.PI / 2));
    rx = hipW * (0.80 + 0.20 * ease);
    rz = hipD * (0.80 + 0.20 * ease);
  } else if (t < 0.35) {
    // Smooth curve from hips inward to the natural human waist at t = 0.35
    const k = (t - 0.15) / 0.2;
    const smoothK = k * k * (3 - 2 * k);
    rx = hipW * (1 - smoothK) + waistW * smoothK;
    rz = hipD * (1 - smoothK) + waistD * smoothK;
  } else if (t < 0.74) {
    // Ribcage & powerful latissimus dorsi V-taper from waist up to chest & shoulder line
    const k = (t - 0.35) / 0.39;
    const smoothK = Math.pow(k, isFemale ? 0.82 : 0.72);
    rx = waistW + smoothK * (chestW - waistW);
    rz = waistD + smoothK * (chestD - waistD);
  } else if (t < 0.86) {
    // Muscular trapezius & clavicle slope from shoulders into the base of the neck
    const k = (t - 0.74) / 0.12;
    const smoothK = k * k * (3 - 2 * k);
    rx = chestW * (1 - smoothK) + neckBaseW * smoothK;
    rz = chestD * (1 - smoothK) + neckBaseD * smoothK;
  } else {
    // Solid, connected human neck column extending right up into the skull
    const k = (t - 0.86) / 0.14;
    rx = neckBaseW * (1 - k) + neckW * k;
    rz = neckBaseD * (1 - k) + neckD * k;
  }

  // Lateral bust fullness for female / extra upper-lat flare for buff male
  if (isFemale && cosT > -0.1) {
    rx += gaussian(t, 0.635, 0.068) * 0.015 * Math.max(0, cosT);
  } else if (!isFemale) {
    rx += gaussian(t, 0.64, 0.095) * 0.032;
  }

  const x = sinT * (rx + shellOffset);
  // Subtle S-curve posture (lumbar lordosis & upright chest poise)
  const spinePostureZ = Math.sin(t * Math.PI) * 0.012 - gaussian(t, 0.15, 0.08) * 0.01;
  let z = cosT * (rz + shellOffset) + spinePostureZ;
  const absX = Math.abs(sinT * rx);

  if (cosT > 0.1) {
    if (!isFemale) {
      // Buff Male: Wide, flat-fronted masculine pectoral plate & subtle center sternum line (no round bulge)
      const pecY = gaussian(t, 0.63, 0.065);
      const pecX = gaussian(absX, 0.095, 0.075);
      const sternumGroove = gaussian(absX, 0.0, 0.015) * gaussian(t, 0.63, 0.065);
      z += pecY * pecX * 0.022 - sternumGroove * 0.010;

      // Chiseled 6-pack abdominal muscle blocks & obliques
      const abColumn = gaussian(absX, 0.046, 0.030) * gaussian(t, 0.42, 0.11);
      const abRowWave = Math.cos((t - 0.33) * 36.0) * 0.5 + 0.5;
      z += abColumn * (0.014 + abRowWave * 0.010);
    } else {
      // Female Avatar: Proportionate modestly contoured bust positioned gracefully on upper chest
      const bustY = gaussian(t, 0.635, 0.070);
      const bustLobe = gaussian(absX, 0.054, 0.046) + 0.28 * gaussian(absX, 0.0, 0.034);
      const cleavage = gaussian(absX, 0.0, 0.018) * gaussian(t, 0.635, 0.062);
      z += bustY * bustLobe * 0.078 * Math.pow(Math.max(0, cosT), 0.52) - cleavage * 0.024;
    }

    const navel = gaussian(t, 0.31, 0.018) * gaussian(absX, 0.0, 0.016);
    z -= navel * 0.01;

    const clavicle = gaussian(t, 0.74, 0.022) * gaussian(absX, 0.08, 0.055);
    z += clavicle * 0.014;
  } else if (cosT < -0.15) {
    const spineGroove = gaussian(absX, 0.0, 0.022) * gaussian(t, 0.5, 0.22);
    z += spineGroove * 0.014;

    if (!isFemale) {
      // Buff Male Upper Back (Massive Trapezius & Latissimus Dorsi thickness)
      const backBulk = gaussian(t, 0.64, 0.11) * gaussian(absX, 0.105, 0.075);
      z -= backBulk * 0.048;
    }

    const glute = gaussian(t, 0.16, 0.055) * gaussian(absX, 0.058, 0.045);
    z -= glute * (isFemale ? 0.028 : 0.028);
  }

  return { x, z };
}

function createTorsoSectionGeometry(
  isFemale: boolean,
  tMin: number,
  tMax: number,
  shellOffset: number,
  pleated: boolean = false
): THREE.BufferGeometry {
  const totalTorsoH = 1.12;
  const sectionH = (tMax - tMin) * totalTorsoH;
  const radialSegs = 56;
  const heightSegs = Math.max(12, Math.round((tMax - tMin) * 52));

  const geo = new THREE.CylinderGeometry(
    1,
    1,
    sectionH,
    radialSegs,
    heightSegs,
    tMin > 0.01 && tMax < 0.99
  );
  const centerOffset = ((tMin + tMax) * 0.5 - 0.5) * totalTorsoH;
  geo.translate(0, centerOffset, 0);

  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = Math.max(0, Math.min(1, (v.y + totalTorsoH / 2) / totalTorsoH));
    const theta = Math.atan2(v.x, v.z);
    const pt = getTorsoCrossSection(t, theta, isFemale, shellOffset);

    let px = pt.x;
    let pz = pt.z;
    if (pleated) {
      const pleatWave = Math.sin(theta * 20) * 0.005;
      px += Math.sin(theta) * pleatWave;
      pz += Math.cos(theta) * pleatWave;
    }

    pos.setXYZ(i, px, v.y, pz);
  }

  geo.computeVertexNormals();
  return geo;
}

function createDiagonalSashGeometry(isFemale: boolean): THREE.BufferGeometry {
  const totalTorsoH = 1.12;
  const tMin = 0.25;
  const tMax = 0.74;
  const sectionH = (tMax - tMin) * totalTorsoH;
  const geo = new THREE.CylinderGeometry(1, 1, sectionH, 56, 28, true);
  const centerOffset = ((tMin + tMax) * 0.5 - 0.5) * totalTorsoH;
  geo.translate(0, centerOffset, 0);

  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = Math.max(0, Math.min(1, (v.y + totalTorsoH / 2) / totalTorsoH));
    const theta = Math.atan2(v.x, v.z);
    const sinT = Math.sin(theta);

    const bandCenterT = 0.49 - sinT * 0.18;
    const localBandOffset = ((t - tMin) / (tMax - tMin) - 0.5) * 0.22;
    const sashT = Math.max(0.24, Math.min(0.75, bandCenterT + localBandOffset));

    const pt = getTorsoCrossSection(sashT, theta, isFemale, 0.011);
    const sashY = (sashT - 0.5) * totalTorsoH;

    pos.setXYZ(i, pt.x, sashY, pt.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Full-Length Connected Thigh Geometry (extends from inside the hip socket y = +0.06 all the way down into the knee y = -0.45!)
 */
function createTraditionalDhotiLegGeometry(isFemale: boolean): THREE.BufferGeometry {
  const len = 0.5; // Overlaps hip (+0.05) all the way down into the knee (-0.45) with ZERO gap!
  const geo = new THREE.CylinderGeometry(1, 1, len, 28, 18, false);
  geo.translate(0, -len / 2 + 0.05, 0);

  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = Math.max(0, Math.min(1, (0.05 - v.y) / len)); // 0 at upper hip, 1 at knee joint
    const theta = Math.atan2(v.x, v.z);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const topR = isFemale ? 0.082 : 0.122;
    const bottomR = isFemale ? 0.052 : 0.080;
    const quadSwell = gaussian(t, 0.42, 0.24) * (isFemale ? 0.014 : 0.038) * Math.max(0, cosT);
    const hamstringSwell = gaussian(t, 0.45, 0.25) * (isFemale ? 0.012 : 0.026) * Math.max(0, -cosT);
    const pleat = Math.sin(theta * 14) * (1 - t * 0.5) * 0.003;
    const r = topR * (1 - t) + bottomR * t + quadSwell + hamstringSwell + pleat;

    pos.setXYZ(i, sinT * r * 0.96, v.y, cosT * r * 1.05);
  }

  geo.computeVertexNormals();
  return geo;
}

function createAnatomicalCalfGeometry(isFemale: boolean): THREE.BufferGeometry {
  const len = 0.45; // Overlaps knee (+0.03) down into ankle (-0.42) with ZERO gap!
  const geo = new THREE.CylinderGeometry(1, 1, len, 28, 20, false);
  geo.translate(0, -len / 2 + 0.03, 0);

  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = Math.max(0, Math.min(1, (0.03 - v.y) / len));
    const theta = Math.atan2(v.x, v.z);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const kneeR = isFemale ? 0.052 : 0.076;
    const ankleR = isFemale ? 0.032 : 0.046;
    let r = kneeR * (1 - t) + ankleR * t;

    const calfBulge = gaussian(t, 0.30, 0.17) * (isFemale ? 0.018 : 0.040);
    if (cosT < 0.2) {
      r += calfBulge * (1.25 - cosT * 0.5);
    } else {
      r += calfBulge * 0.28;
    }

    const patella = gaussian(t, 0.08, 0.07) * Math.max(0, cosT) * (isFemale ? 0.01 : 0.014);
    pos.setXYZ(i, sinT * r * 0.94, v.y, cosT * (r + patella) * 1.04);
  }

  geo.computeVertexNormals();
  return geo;
}

function createAnatomicalUpperArmGeometry(isFemale: boolean): THREE.BufferGeometry {
  const len = 0.35; // Starts at +0.03 inside shoulder socket down to -0.32 inside elbow joint
  const geo = new THREE.CylinderGeometry(1, 1, len, 24, 16, false);
  geo.translate(0, -len / 2 + 0.03, 0);

  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = Math.max(0, Math.min(1, (0.03 - v.y) / len));
    const theta = Math.atan2(v.x, v.z);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const shoulderR = isFemale ? 0.052 : 0.096;
    const elbowR = isFemale ? 0.040 : 0.072;
    const deltoid = gaussian(t, 0.16, 0.15) * (isFemale ? 0.011 : 0.036);
    const bicep = gaussian(t, 0.52, 0.18) * (isFemale ? 0.008 : 0.044) * Math.max(0, cosT);
    const tricep = gaussian(t, 0.42, 0.18) * (isFemale ? 0.006 : 0.034) * Math.max(0, -cosT);
    const r = shoulderR * (1 - t) + elbowR * t + deltoid + bicep + tricep;

    pos.setXYZ(i, sinT * r * 0.96, v.y, cosT * r * 1.06);
  }

  geo.computeVertexNormals();
  return geo;
}

function createAnatomicalForearmGeometry(isFemale: boolean): THREE.BufferGeometry {
  const len = 0.32; // Starts at +0.03 inside elbow joint down to -0.29 inside wrist/palm
  const geo = new THREE.CylinderGeometry(1, 1, len, 24, 14, false);
  geo.translate(0, -len / 2 + 0.03, 0);

  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = Math.max(0, Math.min(1, (0.03 - v.y) / len));
    const theta = Math.atan2(v.x, v.z);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const elbowR = isFemale ? 0.040 : 0.072;
    const wristR = isFemale ? 0.028 : 0.048;
    const forearmSwell = gaussian(t, 0.26, 0.17) * (isFemale ? 0.008 : 0.032);
    const r = elbowR * (1 - t) + wristR * t + forearmSwell;

    pos.setXYZ(i, sinT * r * 1.04, v.y, cosT * r * 0.94);
  }

  geo.computeVertexNormals();
  return geo;
}

function createAnatomicalHandGroup(skinMat: THREE.Material, isLeft: boolean): THREE.Group {
  const handGroup = new THREE.Group();
  // When character faces +Z: Left arm/hand is at +X (sideSign = +1), Right arm/hand is at -X (sideSign = -1)
  const sideSign = isLeft ? 1 : -1;

  // Seamless Wrist Joint Sphere overlapping the end of the forearm
  const wristJoint = new THREE.Mesh(new THREE.SphereGeometry(0.038, 14, 14), skinMat);
  wristJoint.scale.set(1.0, 0.85, 0.82);
  wristJoint.position.set(0, 0.005, 0);
  handGroup.add(wristJoint);

  // Back of Hand / Metacarpal Palm positioned on the OUTER side of the grip channel (x = sideSign * 0.022)
  // so weapon/tool handles pass cleanly through the hollow center of the curled fingers (x = 0, y = -0.036)
  // instead of piercing through the palm!
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 14), skinMat);
  palm.scale.set(0.48, 1.05, 0.88);
  palm.position.set(sideSign * 0.022, -0.026, 0.002);
  palm.rotation.z = -sideSign * 0.18;
  handGroup.add(palm);

  // 4 Articulated Curled Fingers wrapping tightly around the cylindrical weapon hilt (at x = 0, y = -0.036)
  const fingerZOffsets = [
    { z: 0.026, r: 0.0092 }, // Index finger (front)
    { z: 0.009, r: 0.0098 }, // Middle finger
    { z: -0.009, r: 0.0094 }, // Ring finger
    { z: -0.025, r: 0.0086 }, // Little finger (back)
  ];

  fingerZOffsets.forEach((f) => {
    // 1) Outer Knuckle & Proximal Phalanx descending along the outer side of the handle
    const proximal = new THREE.Mesh(new THREE.CapsuleGeometry(f.r, 0.026, 6, 8), skinMat);
    proximal.position.set(sideSign * 0.024, -0.038, f.z);
    proximal.rotation.z = sideSign * 0.25;
    handGroup.add(proximal);

    // 2) Middle Phalanx curving directly UNDERNEATH the handle (y = -0.055)
    const middle = new THREE.Mesh(new THREE.CapsuleGeometry(f.r * 0.94, 0.026, 6, 8), skinMat);
    middle.position.set(0, -0.055, f.z);
    middle.rotation.z = Math.PI / 2;
    handGroup.add(middle);

    // 3) Distal Phalanx (Fingertip) curling UP the INNER side of the handle (x = -sideSign * 0.022)
    const distal = new THREE.Mesh(new THREE.CapsuleGeometry(f.r * 0.88, 0.022, 6, 8), skinMat);
    distal.position.set(-sideSign * 0.021, -0.038, f.z);
    distal.rotation.z = -sideSign * 0.32;
    handGroup.add(distal);
  });

  // Curled Thumb wrapping OVER the top and inner side of the handle to lock the grip
  const thumbBase = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.026, 6, 8), skinMat);
  thumbBase.position.set(sideSign * 0.012, -0.014, 0.024);
  thumbBase.rotation.z = Math.PI / 2 - sideSign * 0.35;
  handGroup.add(thumbBase);

  const thumbTip = new THREE.Mesh(new THREE.CapsuleGeometry(0.010, 0.024, 6, 8), skinMat);
  thumbTip.position.set(-sideSign * 0.014, -0.020, 0.026);
  thumbTip.rotation.z = sideSign * 0.55;
  handGroup.add(thumbTip);

  return handGroup;
}

/**
 * Creates a true diamond-cross-section, double-edged, needle-pointed razor-sharp sword blade geometry
 * with crisp facet normals so light glints off the honed cutting bevels and central spine ridge.
 */
function createRazorSharpSwordBladeGeometry(): THREE.BufferGeometry {
  const length = 1.14;
  const segs = 24;
  const positions: number[] = [];

  const getSlice = (t: number) => {
    const z = t * length;
    // Slight leaf/khanda swell up to t = 0.62, then converging to a needle-sharp point at t = 1.0
    const swell = Math.sin(Math.pow(t, 0.75) * Math.PI) * 0.010;
    const taper = t < 0.72 ? 1.0 : Math.pow(1 - (t - 0.72) / 0.28, 1.35);
    const halfH = Math.max(0.0003, (0.034 + swell) * taper);
    const halfW = Math.max(0.0002, 0.013 * (1 - t * 0.92));
    return {
      top: [0, halfH, z] as [number, number, number],
      bottom: [0, -halfH, z] as [number, number, number],
      right: [halfW, 0, z] as [number, number, number],
      left: [-halfW, 0, z] as [number, number, number],
    };
  };

  const pushTri = (
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number]
  ) => {
    positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  };

  for (let i = 0; i < segs; i++) {
    const s0 = getSlice(i / segs);
    const s1 = getSlice((i + 1) / segs);

    // 1. Top-Right Honed Cutting Bevel
    pushTri(s0.right, s0.top, s1.top);
    pushTri(s0.right, s1.top, s1.right);

    // 2. Bottom-Right Honed Cutting Bevel
    pushTri(s0.bottom, s0.right, s1.right);
    pushTri(s0.bottom, s1.right, s1.bottom);

    // 3. Top-Left Honed Cutting Bevel
    pushTri(s0.top, s0.left, s1.left);
    pushTri(s0.top, s1.left, s1.top);

    // 4. Bottom-Left Honed Cutting Bevel
    pushTri(s0.left, s0.bottom, s1.bottom);
    pushTri(s0.left, s1.bottom, s1.left);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

const razorSharpSwordBladeGeo = createRazorSharpSwordBladeGeometry();

/**
 * Full-Length Flowing Pleated Indian Lehenga / Ghagra Skirt for Female Characters!
 * Extends from the waist/kamarbandh (y = 1.08) all the way down to the ankles (y = 0.14)
 * with 32 deep vertical pleats and a graceful flared A-line bell silhouette (Never shorts!).
 */
function createIndianLehengaSkirtGeometry(): THREE.BufferGeometry {
  const height = 0.94; // From y = 1.08 (waist) down to y = 0.14 (ankles)
  const geo = new THREE.CylinderGeometry(1, 1, height, 64, 28, false);

  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // t = 0 at waist top (+height/2), t = 1 at ankle hem (-height/2)
    const t = Math.max(0, Math.min(1, (height / 2 - v.y) / height));
    const theta = Math.atan2(v.x, v.z);
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);

    // Waist hugs the slender female waist/kamarbandh smoothly, swells over the hips, then drapes into a graceful Lehenga skirt
    const waistRx = 0.118;
    const waistRz = 0.094;
    const hemRx = 0.275;
    const hemRz = 0.245;

    const bellCurve = Math.pow(t, 0.85);
    const hipCurve = gaussian(t, 0.18, 0.12) * 0.038;

    // 32 traditional Lehenga Kali pleats that deepen toward the ankle hem
    const pleatDepth = (0.003 + t * 0.01) * Math.sin(theta * 32);
    const rx = waistRx + (hemRx - waistRx) * bellCurve + hipCurve + pleatDepth;
    const rz = waistRz + (hemRz - waistRz) * bellCurve + hipCurve * 0.82 + pleatDepth;

    pos.setXYZ(i, sinT * rx, v.y, cosT * rz);
  }

  geo.computeVertexNormals();
  return geo;
}

function createAnatomicalFootGroup(
  skinMat: THREE.Material,
  goldMatRef: THREE.Material,
  isLeft: boolean
): THREE.Group {
  const footGroup = new THREE.Group();
  const sideSign = isLeft ? 1 : -1;

  const anklet = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.009, 8, 18), goldMatRef);
  anklet.rotation.x = Math.PI / 2;
  anklet.position.set(0, 0.02, 0);
  footGroup.add(anklet);

  const instep = new THREE.Mesh(new THREE.SphereGeometry(0.062, 16, 14), skinMat);
  instep.scale.set(0.82, 0.58, 1.85);
  instep.position.set(0, -0.035, 0.055);
  instep.castShadow = true;
  footGroup.add(instep);

  const heel = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 12), skinMat);
  heel.scale.set(0.85, 0.75, 1.1);
  heel.position.set(0, -0.035, -0.035);
  footGroup.add(heel);

  const toes = [
    { x: sideSign * 0.028, r: 0.013, z: 0.165 },
    { x: sideSign * 0.012, r: 0.01, z: 0.168 },
    { x: -sideSign * 0.002, r: 0.0095, z: 0.163 },
    { x: -sideSign * 0.015, r: 0.009, z: 0.156 },
    { x: -sideSign * 0.027, r: 0.0085, z: 0.146 },
  ];
  toes.forEach((t) => {
    const toe = new THREE.Mesh(new THREE.SphereGeometry(t.r, 8, 8), skinMat);
    toe.scale.set(0.9, 0.75, 1.35);
    toe.position.set(t.x, -0.048, t.z);
    footGroup.add(toe);
  });

  return footGroup;
}

// Pre-compute and cache all anatomical & traditional garment geometries
const maleHeadGeo = createAnatomicalHeadGeometry(false);
const femaleHeadGeo = createAnatomicalHeadGeometry(true);

// 1) Base Warm Human Skin Torso
const maleSkinTorsoGeo = createTorsoSectionGeometry(false, 0.0, 1.0, 0.0, false);
const femaleSkinTorsoGeo = createTorsoSectionGeometry(true, 0.0, 1.0, 0.0, false);

// 2) 3D Traditional Upper Garments (Male Silk Kurta / Female Choli Bodice)
const maleKurtaGeo = createTorsoSectionGeometry(false, 0.26, 0.74, 0.006, false);
const femaleCholiGeo = createTorsoSectionGeometry(true, 0.52, 0.75, 0.006, false);

// 3) 3D Traditional Gold Kamarbandh Waist Sash & Lower Hip Dhoti / Lehenga Wrap
const maleKamarbandhGeo = createTorsoSectionGeometry(false, 0.22, 0.28, 0.01, false);
const femaleKamarbandhGeo = createTorsoSectionGeometry(true, 0.22, 0.27, 0.01, false);
const maleHipDhotiGeo = createTorsoSectionGeometry(false, 0.0, 0.24, 0.007, true);
const femaleHipLehengaGeo = createTorsoSectionGeometry(true, 0.0, 0.24, 0.008, true);

// 4) 3D Diagonal Silk Angavastram (Male) / Sari Pallu Drape (Female)
const maleAngavastramGeo = createDiagonalSashGeometry(false);
const femaleSariPalluGeo = createDiagonalSashGeometry(true);

// 5) 3D Form-Fitting Steel Armor Cuirass (fits over both torso & garments with zero clipping!)
const maleCuirassGeo = createTorsoSectionGeometry(false, 0.22, 0.73, 0.018, false);
const femaleCuirassGeo = createTorsoSectionGeometry(true, 0.22, 0.73, 0.018, false);

// 6) Limb, Dhoti/Sari Thigh & Full-Length Indian Lehenga Skirt Geometries
const femaleIndianLehengaSkirtGeo = createIndianLehengaSkirtGeometry();
const maleDhotiThighGeo = createTraditionalDhotiLegGeometry(false);
const femaleSariThighGeo = createTraditionalDhotiLegGeometry(true);
const maleCalfGeo = createAnatomicalCalfGeometry(false);
const femaleCalfGeo = createAnatomicalCalfGeometry(true);
const maleUpperArmGeo = createAnatomicalUpperArmGeometry(false);
const femaleUpperArmGeo = createAnatomicalUpperArmGeometry(true);
const maleForearmGeo = createAnatomicalForearmGeometry(false);
const femaleForearmGeo = createAnatomicalForearmGeometry(true);

// ============================================================================
// EXTREME 3D PROCEDURAL PBR TEXTURE & HIGH-RELIEF BUMP MAP ENGINE
// Generates 512x512 / 1024x1024 Diffuse Maps + Height/Bump Maps for realistic 3D depth
// ============================================================================

const pbrTextureCache = new Map<string, { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture }>();

export function createExtreme3DPBRTextures(
  type:
    | 'CARVED_TEMPLE_STONE'
    | 'GRANITE_MASONRY'
    | 'TERRACOTTA_ROOF'
    | 'LIME_PLASTER_WALL'
    | 'CARVED_TEAKWOOD'
    | 'WOOTZ_STEEL'
    | 'ROYAL_GOLD_BROCADE'
    | 'TERRACOTTA_FLOOR'
    | 'SACRED_WATER'
    | 'TREE_BARK'
    | 'COBBLESTONE_ROAD'
    | 'TILLED_SOIL'
    | 'FOREST_FLOOR'
    | 'HORSE_COAT_HIDE'
    | 'OX_HIDE_WRINKLES'
    | 'TOOLED_SADDLE_LEATHER'
    | 'KERATIN_HORN_HOOF',
  baseHex: number = 0xffffff,
  repeatX: number = 2,
  repeatY: number = 2
): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const cacheKey = `${type}-${baseHex}-${repeatX}-${repeatY}`;
  if (pbrTextureCache.has(cacheKey)) {
    return pbrTextureCache.get(cacheKey)!;
  }

  const size = 512;
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = size;
  diffCanvas.height = size;
  const dctx = diffCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;

  const baseColor = new THREE.Color(baseHex);
  const rBase = Math.round(baseColor.r * 255);
  const gBase = Math.round(baseColor.g * 255);
  const bBase = Math.round(baseColor.b * 255);

  dctx.fillStyle = `rgb(${rBase}, ${gBase}, ${bBase})`;
  dctx.fillRect(0, 0, size, size);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  if (type === 'CARVED_TEMPLE_STONE' || type === 'GRANITE_MASONRY') {
    // Chiseled Dravidian Temple Granite Ashlar Blocks + Deep Mortar Joints + Relief Carvings
    const rows = type === 'CARVED_TEMPLE_STONE' ? 8 : 6;
    const rowH = size / rows;

    for (let r = 0; r < rows; r++) {
      const cols = r % 2 === 0 ? 4 : 5;
      const colW = size / cols;
      const offsetX = (r % 2) * (colW * 0.5);

      for (let c = -1; c <= cols; c++) {
        const bx = c * colW + offsetX;
        const by = r * rowH;
        const shade = ((r * 17 + c * 31) % 26) - 13;

        dctx.fillStyle = `rgb(${Math.max(0, Math.min(255, rBase + shade))}, ${Math.max(
          0,
          Math.min(255, gBase + shade)
        )}, ${Math.max(0, Math.min(255, bBase + shade))})`;
        dctx.fillRect(bx + 3, by + 3, colW - 6, rowH - 6);

        // Raised stone block pillow bevel in bump map
        bctx.fillStyle = '#d4d4d4';
        bctx.fillRect(bx + 4, by + 4, colW - 8, rowH - 8);
        bctx.fillStyle = '#f5f5f5';
        bctx.fillRect(bx + 8, by + 8, colW - 16, rowH - 16);

        // Deep dark recessed mortar grooves
        dctx.strokeStyle = 'rgba(28, 25, 23, 0.72)';
        dctx.lineWidth = 5;
        dctx.strokeRect(bx + 2, by + 2, colW - 4, rowH - 4);

        bctx.strokeStyle = '#18181b';
        bctx.lineWidth = 6;
        bctx.strokeRect(bx + 2, by + 2, colW - 4, rowH - 4);

        // Ornamental carved temple lotus frieze on alternate rows
        if (type === 'CARVED_TEMPLE_STONE' && r % 2 === 1) {
          dctx.strokeStyle = 'rgba(214, 211, 209, 0.45)';
          dctx.lineWidth = 2.5;
          dctx.beginPath();
          dctx.arc(bx + colW * 0.5, by + rowH * 0.5, rowH * 0.26, 0, Math.PI * 2);
          dctx.stroke();

          bctx.strokeStyle = '#ffffff';
          bctx.lineWidth = 4;
          bctx.beginPath();
          bctx.arc(bx + colW * 0.5, by + rowH * 0.5, rowH * 0.26, 0, Math.PI * 2);
          bctx.stroke();
        }
      }
    }

    // Fine granite crystalline grain & micro-pitting
    for (let i = 0; i < 3200; i++) {
      const gx = (i * 197) % size;
      const gy = (i * 313) % size;
      const grain = i % 2 === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.22)';
      dctx.fillStyle = grain;
      dctx.fillRect(gx, gy, 3, 3);
      bctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#262626';
      bctx.fillRect(gx, gy, 3, 3);
    }
  } else if (type === 'TERRACOTTA_ROOF') {
    // Interlocking Spanish/Indian Curved Clay Roof Tiles (High-Relief 3D Ribs & Overlap Shadows)
    const cols = 12;
    const rows = 10;
    const tileW = size / cols;
    const tileH = size / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tx = c * tileW;
        const ty = r * tileH;

        const grad = dctx.createLinearGradient(tx, ty, tx + tileW, ty);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
        grad.addColorStop(0.5, 'rgba(255, 200, 160, 0.22)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.48)');
        dctx.fillStyle = grad;
        dctx.fillRect(tx, ty, tileW, tileH);

        const bGrad = bctx.createLinearGradient(tx, ty, tx + tileW, ty);
        bGrad.addColorStop(0, '#1f1f1f');
        bGrad.addColorStop(0.5, '#ffffff');
        bGrad.addColorStop(1, '#1f1f1f');
        bctx.fillStyle = bGrad;
        bctx.fillRect(tx, ty, tileW, tileH);

        // Horizontal overlapping tile lip shadow
        dctx.fillStyle = 'rgba(20, 10, 5, 0.65)';
        dctx.fillRect(tx, ty + tileH - 5, tileW, 5);
        bctx.fillStyle = '#09090b';
        bctx.fillRect(tx, ty + tileH - 5, tileW, 5);
      }
    }
  } else if (type === 'LIME_PLASTER_WALL') {
    // Hand-Troweled Chuna Lime Stucco + Exposed Laterite Base Courses + Warm Ochre Border
    for (let i = 0; i < 3500; i++) {
      const px = (i * 157) % size;
      const py = (i * 283) % size;
      const rad = 4 + (i % 14);
      dctx.fillStyle =
        i % 3 === 0
          ? 'rgba(214, 211, 209, 0.25)'
          : i % 3 === 1
          ? 'rgba(168, 162, 158, 0.18)'
          : 'rgba(255, 255, 255, 0.22)';
      dctx.beginPath();
      dctx.arc(px, py, rad, 0, Math.PI * 2);
      dctx.fill();

      bctx.fillStyle = i % 2 === 0 ? '#a8a8a8' : '#585858';
      bctx.beginPath();
      bctx.arc(px, py, rad * 0.7, 0, Math.PI * 2);
      bctx.fill();
    }
    // Traditional South Indian Temple/Agraharam Red-Ochre & White Vertical Stripes along lower dado
    const stripeCount = 16;
    const stripeW = size / stripeCount;
    for (let s = 0; s < stripeCount; s++) {
      dctx.fillStyle = s % 2 === 0 ? 'rgba(185, 28, 28, 0.78)' : 'rgba(250, 250, 249, 0.85)';
      dctx.fillRect(s * stripeW, size - 96, stripeW, 96);
    }
    dctx.fillStyle = 'rgba(180, 83, 9, 0.75)';
    dctx.fillRect(0, 0, size, 26);
    dctx.fillRect(0, size - 104, size, 8);
  } else if (type === 'CARVED_TEAKWOOD' || type === 'TREE_BARK') {
    // Deep Fibrous Teakwood / Jungle Bark Grain & Knots
    for (let x = 0; x < size; x += 3) {
      const wave = Math.sin(x * 0.08) * 14;
      const isDark = (x / 3) % 2 === 0;
      dctx.strokeStyle = isDark ? 'rgba(20, 10, 4, 0.36)' : 'rgba(217, 119, 6, 0.16)';
      dctx.lineWidth = 2.5;
      dctx.beginPath();
      dctx.moveTo(x, 0);
      dctx.bezierCurveTo(x + wave, size * 0.33, x - wave, size * 0.66, x, size);
      dctx.stroke();

      bctx.strokeStyle = isDark ? '#262626' : '#e5e5e5';
      bctx.lineWidth = 3;
      bctx.beginPath();
      bctx.moveTo(x, 0);
      bctx.bezierCurveTo(x + wave, size * 0.33, x - wave, size * 0.66, x, size);
      bctx.stroke();
    }
  } else if (type === 'WOOTZ_STEEL' || type === 'ROYAL_GOLD_BROCADE') {
    // Damascus Wootz Steel Ripples or Zari Gold Diamond Brocade Weave
    const step = 32;
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        dctx.strokeStyle =
          type === 'ROYAL_GOLD_BROCADE'
            ? 'rgba(254, 240, 138, 0.45)'
            : 'rgba(255, 255, 255, 0.25)';
        dctx.lineWidth = 2;
        dctx.beginPath();
        dctx.moveTo(x + step / 2, y);
        dctx.lineTo(x + step, y + step / 2);
        dctx.lineTo(x + step / 2, y + step);
        dctx.lineTo(x, y + step / 2);
        dctx.closePath();
        dctx.stroke();

        bctx.strokeStyle = '#f4f4f5';
        bctx.lineWidth = 3;
        bctx.stroke();
      }
    }
  } else if (type === 'TERRACOTTA_FLOOR') {
    // Hand-baked Athangudi / Terracotta Courtyard Floor Tiles
    const grid = 8;
    const cell = size / grid;
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        dctx.strokeStyle = 'rgba(28, 15, 8, 0.65)';
        dctx.lineWidth = 4;
        dctx.strokeRect(c * cell + 2, r * cell + 2, cell - 4, cell - 4);
        dctx.strokeStyle = 'rgba(251, 191, 36, 0.28)';
        dctx.lineWidth = 2;
        dctx.strokeRect(c * cell + 10, r * cell + 10, cell - 20, cell - 20);

        bctx.fillStyle = '#e4e4e7';
        bctx.fillRect(c * cell + 4, r * cell + 4, cell - 8, cell - 8);
        bctx.strokeStyle = '#18181b';
        bctx.lineWidth = 5;
        bctx.strokeRect(c * cell + 2, r * cell + 2, cell - 4, cell - 4);
      }
    }
  } else if (type === 'SACRED_WATER') {
    // Rippling Caustic Water Surface
    for (let i = 0; i < 180; i++) {
      const wx = (i * 97) % size;
      const wy = (i * 179) % size;
      const wr = 14 + (i % 32);
      dctx.strokeStyle = i % 2 === 0 ? 'rgba(165, 243, 252, 0.22)' : 'rgba(8, 51, 68, 0.28)';
      dctx.lineWidth = 2.5;
      dctx.beginPath();
      dctx.arc(wx, wy, wr, 0, Math.PI * 2);
      dctx.stroke();

      bctx.strokeStyle = i % 2 === 0 ? '#ffffff' : '#27272a';
      bctx.lineWidth = 3.5;
      bctx.beginPath();
      bctx.arc(wx, wy, wr, 0, Math.PI * 2);
      bctx.stroke();
    }
  } else if (type === 'HORSE_COAT_HIDE') {
    // Sleek Brushed Equine Hair Fibers, Dapple Muscle Sheen & Fine Directional Follicle Relief
    for (let i = 0; i < 6500; i++) {
      const hx = (i * 173) % size;
      const hy = (i * 293) % size;
      const len = 10 + (i % 14);
      const curve = Math.sin(hy * 0.04 + hx * 0.02) * 3;
      const isHighlight = i % 3 === 0;
      dctx.strokeStyle = isHighlight
        ? 'rgba(255, 225, 190, 0.16)'
        : i % 3 === 1
        ? 'rgba(20, 8, 4, 0.24)'
        : 'rgba(140, 65, 30, 0.18)';
      dctx.lineWidth = 1.6;
      dctx.beginPath();
      dctx.moveTo(hx, hy);
      dctx.quadraticCurveTo(hx + len * 0.5, hy + curve, hx + len, hy + curve * 0.5);
      dctx.stroke();

      bctx.strokeStyle = isHighlight ? '#e4e4e7' : '#3f3f46';
      bctx.lineWidth = 1.8;
      bctx.beginPath();
      bctx.moveTo(hx, hy);
      bctx.quadraticCurveTo(hx + len * 0.5, hy + curve, hx + len, hy + curve * 0.5);
      bctx.stroke();
    }
    // Subtle equine dapple rings & muscular contour shading
    for (let d = 0; d < 95; d++) {
      const dx = (d * 139) % size;
      const dy = (d * 227) % size;
      const dr = 10 + (d % 18);
      const grad = dctx.createRadialGradient(dx, dy, 2, dx, dy, dr);
      grad.addColorStop(0, 'rgba(255, 235, 205, 0.11)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      dctx.fillStyle = grad;
      dctx.beginPath();
      dctx.arc(dx, dy, dr, 0, Math.PI * 2);
      dctx.fill();
    }
  } else if (type === 'OX_HIDE_WRINKLES') {
    // Rich Zebu Bull / Ox Hide with Organic Skin Folds, Dewlap Wrinkles & Coarse Bristle Grain
    for (let w = 0; w < size; w += 6) {
      const ripple = Math.sin(w * 0.09) * 10;
      const darkFold = (w / 6) % 2 === 0;
      dctx.strokeStyle = darkFold ? 'rgba(24, 13, 6, 0.32)' : 'rgba(255, 235, 200, 0.16)';
      dctx.lineWidth = 3.2;
      dctx.beginPath();
      dctx.moveTo(w, 0);
      dctx.bezierCurveTo(w + ripple, size * 0.35, w - ripple, size * 0.7, w, size);
      dctx.stroke();

      bctx.strokeStyle = darkFold ? '#27272a' : '#f4f4f5';
      bctx.lineWidth = 4.0;
      dctx.beginPath();
      bctx.moveTo(w, 0);
      bctx.bezierCurveTo(w + ripple, size * 0.35, w - ripple, size * 0.7, w, size);
      bctx.stroke();
    }
    // Coarse bovine hide pores & short bristle hair texture
    for (let i = 0; i < 4800; i++) {
      const ox = (i * 191) % size;
      const oy = (i * 317) % size;
      dctx.fillStyle = i % 2 === 0 ? 'rgba(255, 240, 215, 0.14)' : 'rgba(20, 10, 5, 0.22)';
      dctx.fillRect(ox, oy, 4, 2);
      bctx.fillStyle = i % 2 === 0 ? '#e4e4e7' : '#27272a';
      bctx.fillRect(ox, oy, 4, 2);
    }
  } else if (type === 'TOOLED_SADDLE_LEATHER') {
    // Embossed Royal Quilted Saddle Leather with Stitched Diamonds & Brass Rivets
    const step = 48;
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        dctx.strokeStyle = 'rgba(28, 12, 4, 0.65)';
        dctx.lineWidth = 3.5;
        dctx.beginPath();
        dctx.moveTo(x + step / 2, y);
        dctx.lineTo(x + step, y + step / 2);
        dctx.lineTo(x + step / 2, y + step);
        dctx.lineTo(x, y + step / 2);
        dctx.closePath();
        dctx.stroke();

        // Raised quilted leather pillow in bump map
        const bGrad = bctx.createRadialGradient(
          x + step / 2,
          y + step / 2,
          2,
          x + step / 2,
          y + step / 2,
          step * 0.45
        );
        bGrad.addColorStop(0, '#ffffff');
        bGrad.addColorStop(1, '#27272a');
        bctx.fillStyle = bGrad;
        bctx.fillRect(x + 2, y + 2, step - 4, step - 4);

        // Golden brass stud at diamond intersection
        dctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
        dctx.beginPath();
        dctx.arc(x + step / 2, y + step / 2, 3.5, 0, Math.PI * 2);
        dctx.fill();
      }
    }
  } else if (type === 'KERATIN_HORN_HOOF') {
    // Natural Keratin Growth Rings & Longitudinal Striations for Horns & Hooves
    for (let y = 0; y < size; y += 10) {
      const isGroove = (y / 10) % 2 === 0;
      dctx.fillStyle = isGroove ? 'rgba(28, 18, 10, 0.32)' : 'rgba(255, 250, 235, 0.18)';
      dctx.fillRect(0, y, size, 5);
      bctx.fillStyle = isGroove ? '#27272a' : '#f4f4f5';
      bctx.fillRect(0, y, size, 5);
    }
    for (let x = 0; x < size; x += 6) {
      dctx.strokeStyle = 'rgba(40, 25, 12, 0.22)';
      dctx.lineWidth = 1.5;
      dctx.beginPath();
      dctx.moveTo(x, 0);
      dctx.lineTo(x, size);
      dctx.stroke();
    }
  } else if (type === 'COBBLESTONE_ROAD') {
    // Hand-laid Rounded River Cobblestones with Deep Recessed Mortar
    const rows = 8;
    const cols = 8;
    const cw = size / cols;
    const ch = size / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * cw + (r % 2) * (cw * 0.35) + cw * 0.5;
        const cy = r * ch + ch * 0.5;
        dctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(120, 113, 108, 0.45)' : 'rgba(87, 83, 78, 0.45)';
        dctx.beginPath();
        dctx.ellipse(cx % size, cy, cw * 0.42, ch * 0.4, 0, 0, Math.PI * 2);
        dctx.fill();
        dctx.strokeStyle = 'rgba(28, 25, 23, 0.75)';
        dctx.lineWidth = 4;
        dctx.stroke();

        bctx.fillStyle = '#f4f4f5';
        bctx.beginPath();
        bctx.ellipse(cx % size, cy, cw * 0.38, ch * 0.36, 0, 0, Math.PI * 2);
        bctx.fill();
      }
    }
  } else if (type === 'TILLED_SOIL' || type === 'FOREST_FLOOR') {
    // Deep Ploughed Farmland Furrows or Organic Forest Humus & Pebbles
    if (type === 'TILLED_SOIL') {
      for (let y = 0; y < size; y += 32) {
        const g = bctx.createLinearGradient(0, y, 0, y + 32);
        g.addColorStop(0, '#18181b');
        g.addColorStop(0.5, '#ffffff');
        g.addColorStop(1, '#18181b');
        bctx.fillStyle = g;
        bctx.fillRect(0, y, size, 32);

        dctx.fillStyle = 'rgba(20, 10, 4, 0.42)';
        dctx.fillRect(0, y, size, 8);
      }
    }
    for (let i = 0; i < 3600; i++) {
      const sx = (i * 179) % size;
      const sy = (i * 293) % size;
      bctx.fillStyle = i % 2 === 0 ? '#e4e4e7' : '#27272a';
      bctx.fillRect(sx, sy, 4, 4);
    }
  }

  const map = new THREE.CanvasTexture(diffCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(repeatX, repeatY);
  bumpMap.needsUpdate = true;

  const res = { map, bumpMap };
  pbrTextureCache.set(cacheKey, res);
  return res;
}

// Shared Extreme 3D PBR Materials with High-Relief Bump Maps
const wootzSteelTex = createExtreme3DPBRTextures('WOOTZ_STEEL', 0xcbd5e1, 3, 3);
const darkBossSteelTex = createExtreme3DPBRTextures('WOOTZ_STEEL', 0x27272a, 3, 3);
const royalGoldTex = createExtreme3DPBRTextures('ROYAL_GOLD_BROCADE', 0xfbbf24, 3, 3);
const teakWoodTex = createExtreme3DPBRTextures('CARVED_TEAKWOOD', 0x78350f, 2, 2);

const ironArmorMat = new THREE.MeshStandardMaterial({
  color: 0xcbd5e1,
  map: wootzSteelTex.map,
  bumpMap: wootzSteelTex.bumpMap,
  bumpScale: 0.06,
  roughness: 0.22,
  metalness: 0.88,
});
const darkBossArmorMat = new THREE.MeshStandardMaterial({
  color: 0x27272a,
  map: darkBossSteelTex.map,
  bumpMap: darkBossSteelTex.bumpMap,
  bumpScale: 0.08,
  roughness: 0.2,
  metalness: 0.9,
});
const goldMat = new THREE.MeshStandardMaterial({
  color: 0xfbbf24,
  map: royalGoldTex.map,
  bumpMap: royalGoldTex.bumpMap,
  bumpScale: 0.05,
  roughness: 0.2,
  metalness: 0.9,
  emissive: 0x78350f,
  emissiveIntensity: 0.22,
});
const steelBladeMat = new THREE.MeshStandardMaterial({
  color: 0xf1f5f9,
  bumpMap: wootzSteelTex.bumpMap,
  bumpScale: 0.04,
  roughness: 0.15,
  metalness: 0.95,
});
const woodMat = new THREE.MeshStandardMaterial({
  color: 0x78350f,
  map: teakWoodTex.map,
  bumpMap: teakWoodTex.bumpMap,
  bumpScale: 0.12,
  roughness: 0.75,
});
const leatherMat = new THREE.MeshStandardMaterial({
  color: 0x451a03,
  bumpMap: teakWoodTex.bumpMap,
  bumpScale: 0.06,
  roughness: 0.65,
});
const darkHairMat = new THREE.MeshStandardMaterial({
  color: 0x110d0a,
  roughness: 0.5,
  metalness: 0.08,
});

/**
 * Vertex-Sculpted Anatomical Quadruped Torso Geometry (Zero Bricks / Zero BoxGeometry!)
 * Smoothly models the broad muscular brisket/chest, deep barrel ribcage, tucked flank,
 * rounded gluteal hindquarters, and — for the Ox — the thoracic Zebu shoulder hump!
 */
function createSculptedQuadrupedBodyGeometry(isOx: boolean): THREE.BufferGeometry {
  const length = 1.48;
  const geo = new THREE.CylinderGeometry(1, 1, length, 36, 28, false);
  geo.rotateX(Math.PI / 2); // Align cylinder axis along Z (-0.74 rear croup to +0.74 front chest)

  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // t goes from 0.0 (rear hindquarters z = -0.74) to 1.0 (front chest z = +0.74)
    const t = Math.max(0, Math.min(1, (v.z + length / 2) / length));
    const theta = Math.atan2(v.x, v.y); // 0 at top spine (+Y), PI at belly (-Y), +-PI/2 at left/right flanks
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    // Smoothly round the front brisket cap and rear croup cap so it's never flat-ended
    const endRound = Math.sin(t * Math.PI);
    const capProfile = Math.pow(endRound, 0.32);

    // Anatomical width (X) and depth (Y) profile along the spine
    const croupSwell = gaussian(t, 0.18, 0.14) * (isOx ? 0.11 : 0.09);
    const ribBarrel = gaussian(t, 0.52, 0.22) * (isOx ? 0.14 : 0.1);
    const flankTuck = -gaussian(t, 0.33, 0.09) * 0.045;
    const chestSwell = gaussian(t, 0.82, 0.14) * (isOx ? 0.12 : 0.095);

    const baseRx = (isOx ? 0.38 : 0.33) * capProfile + croupSwell + ribBarrel + chestSwell;
    const baseRy = (isOx ? 0.42 : 0.37) * capProfile + croupSwell * 0.8 + ribBarrel + flankTuck + chestSwell * 0.9;

    let px = sinT * baseRx;
    let py = cosT * baseRy;

    // Dorsal spine dip (saddle seat hollow) + Withers rise + Zebu Brahma Hump for Ox
    const saddleHollow = -gaussian(t, 0.52, 0.16) * 0.05;
    const withersRise = gaussian(t, 0.78, 0.11) * (isOx ? 0.22 : 0.08);
    const croupRise = gaussian(t, 0.18, 0.13) * 0.06;

    if (cosT > 0) {
      py += (saddleHollow + withersRise + croupRise) * Math.pow(cosT, 1.4);
    } else {
      // Deep brisket & hanging Zebu dewlap fold under the front chest for Ox
      const brisketDrop = gaussian(t, 0.82, 0.15) * (isOx ? 0.11 : 0.05);
      py -= brisketDrop * Math.pow(-cosT, 1.6);
    }

    // Defined shoulder & hip muscular definition along the sides
    const muscleFlank =
      (gaussian(t, 0.18, 0.11) + gaussian(t, 0.8, 0.11)) *
      Math.pow(Math.abs(sinT), 1.5) *
      0.045;
    px += Math.sign(sinT) * muscleFlank;

    pos.setXYZ(i, px, py, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Vertex-Sculpted Anatomical Equine / Bovine Head & Snout Geometry (Zero Bricks / Zero BoxGeometry!)
 * Smoothly transitions from a rounded cranium and muscular cheek/masseter jaws into a tapered
 * nasal bridge and rounded muzzle with flared 3D nostrils.
 */
function createSculptedAnimalHeadGeometry(isOx: boolean): THREE.BufferGeometry {
  const len = isOx ? 0.66 : 0.72;
  const geo = new THREE.CylinderGeometry(1, 1, len, 32, 24, false);
  geo.rotateX(Math.PI / 2); // Z from -len/2 (back of cranium/poll) to +len/2 (tip of muzzle/nose)

  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // t = 0 at poll/cranium back, t = 1 at muzzle tip
    const t = Math.max(0, Math.min(1, (v.z + len / 2) / len));
    const theta = Math.atan2(v.x, v.y);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const endCap = Math.pow(Math.sin(t * Math.PI), 0.28);

    // Cranium & cheek width at t ~ 0.25, tapering smoothly toward the bridge of the nose, flaring slightly at nostrils (t ~ 0.88)
    const craniumW = isOx ? 0.23 : 0.175;
    const muzzleW = isOx ? 0.165 : 0.105;
    const cheekSwell = gaussian(t, 0.28, 0.16) * (isOx ? 0.055 : 0.045);
    const nostrilFlare = gaussian(t, 0.86, 0.08) * (isOx ? 0.032 : 0.024);

    const rx = (craniumW * (1 - t * 0.58) + muzzleW * (t * 0.58) + cheekSwell + nostrilFlare) * endCap;

    // Head depth (Y): deep jaw masseter at t ~ 0.28, sleek nasal bridge, rounded chin/muzzle
    const craniumH = isOx ? 0.22 : 0.185;
    const muzzleH = isOx ? 0.145 : 0.105;
    const jawDepth = gaussian(t, 0.26, 0.16) * (isOx ? 0.06 : 0.055);
    const browBone = gaussian(t, 0.34, 0.1) * 0.025;

    const ry = (craniumH * (1 - t * 0.62) + muzzleH * (t * 0.62) + jawDepth) * endCap;

    let px = sinT * rx;
    let py = cosT * ry;

    if (cosT > 0.2) {
      py += browBone * cosT;
    }
    if (cosT < -0.2) {
      // Deeper lower jaw/jowl under the cheek
      py -= jawDepth * 0.65 * (-cosT);
    }

    pos.setXYZ(i, px, py, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

const sculptedOxBodyGeo = createSculptedQuadrupedBodyGeometry(true);
const sculptedHorseBodyGeo = createSculptedQuadrupedBodyGeometry(false);
const sculptedOxHeadGeo = createSculptedAnimalHeadGeometry(true);
const sculptedHorseHeadGeo = createSculptedAnimalHeadGeometry(false);

export function createMount3D(timeline: TimelineType, isGiantBoss: boolean = false): THREE.Group {
  const mountGroup = new THREE.Group();
  const scale = isGiantBoss ? 1.55 : 1.0;
  mountGroup.scale.set(scale, scale, scale);

  const isOx = timeline === 'MEDIEVAL';

  // Rich, realistic coat colors with high-relief 3D PBR Coat / Hide / Saddle Leather / Keratin Bump Textures!
  const coatColor = isOx
    ? isGiantBoss
      ? 0x1c1917 // Obsidian Demon-Bull Boss Coat
      : 0xc27838 // Warm Golden-Russet & Cream Indian Zebu Ox Coat
    : isGiantBoss
    ? 0x1e1b4b // Midnight Dark War-Stallion Boss Coat
    : 0x8b3a1a; // Rich Chestnut-Bay Marwari Warhorse Coat

  const underbellyColor = isOx
    ? isGiantBoss
      ? 0x27272a
      : 0xfde68a
    : isGiantBoss
    ? 0x312e81
    : 0x9a4422;

  const coatPbr = createExtreme3DPBRTextures(
    isOx ? 'OX_HIDE_WRINKLES' : 'HORSE_COAT_HIDE',
    coatColor,
    3,
    2
  );
  const underbellyPbr = createExtreme3DPBRTextures(
    isOx ? 'OX_HIDE_WRINKLES' : 'HORSE_COAT_HIDE',
    underbellyColor,
    2,
    2
  );
  const saddleColor = isGiantBoss ? 0x991b1b : isOx ? 0xb45309 : 0x7c2d12;
  const saddlePbr = createExtreme3DPBRTextures('TOOLED_SADDLE_LEATHER', saddleColor, 2, 2);
  const hornColor = isGiantBoss ? 0xdc2626 : 0xfef3c7;
  const hornPbr = createExtreme3DPBRTextures('KERATIN_HORN_HOOF', hornColor, 2, 2);
  const hoofPbr = createExtreme3DPBRTextures('KERATIN_HORN_HOOF', 0x1c1917, 2, 2);

  const coatMat = new THREE.MeshStandardMaterial({
    color: coatColor,
    map: coatPbr.map,
    bumpMap: coatPbr.bumpMap,
    bumpScale: isOx ? 0.095 : 0.075,
    roughness: isOx ? 0.58 : 0.44,
    metalness: isOx ? 0.05 : 0.1,
  });

  const underbellyMat = new THREE.MeshStandardMaterial({
    color: underbellyColor,
    map: underbellyPbr.map,
    bumpMap: underbellyPbr.bumpMap,
    bumpScale: 0.07,
    roughness: 0.56,
    metalness: 0.04,
  });

  const saddleMat = new THREE.MeshStandardMaterial({
    color: saddleColor,
    map: saddlePbr.map,
    bumpMap: saddlePbr.bumpMap,
    bumpScale: 0.11,
    roughness: 0.42,
    metalness: 0.15,
  });

  const shabrackClothTex = createExtreme3DPBRTextures(
    'ROYAL_GOLD_BROCADE',
    isGiantBoss ? 0x7f1d1d : isOx ? 0xd97706 : 0x1e3a8a,
    2,
    2
  );
  const shabrackMat = new THREE.MeshStandardMaterial({
    color: isGiantBoss ? 0x7f1d1d : isOx ? 0xd97706 : 0x1e3a8a,
    map: shabrackClothTex.map,
    bumpMap: shabrackClothTex.bumpMap,
    bumpScale: 0.08,
    roughness: 0.48,
    metalness: 0.25,
  });

  const hornMat = new THREE.MeshStandardMaterial({
    color: hornColor,
    map: hornPbr.map,
    bumpMap: hornPbr.bumpMap,
    bumpScale: 0.09,
    roughness: 0.26,
    metalness: 0.18,
  });

  const hoofMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    map: hoofPbr.map,
    bumpMap: hoofPbr.bumpMap,
    bumpScale: 0.08,
    roughness: 0.32,
    metalness: 0.22,
  });

  const muzzleMat = new THREE.MeshStandardMaterial({
    color: isOx ? 0x292524 : 0x3f2314,
    bumpMap: coatPbr.bumpMap,
    bumpScale: 0.05,
    roughness: 0.35,
    metalness: 0.08,
  });

  const eyeDarkMat = new THREE.MeshStandardMaterial({
    color: isGiantBoss ? 0xef4444 : 0x090d16,
    roughness: 0.08,
    metalness: 0.2,
    emissive: isGiantBoss ? 0xdc2626 : 0x000000,
    emissiveIntensity: isGiantBoss ? 0.7 : 0,
  });

  // ============================================================================
  // 1. SCULPTED ORGANIC QUADRUPED TORSO, MUSCULAR SHOULDERS, HAUNCHES & DEWLAP
  // ============================================================================
  const bodyMesh = new THREE.Mesh(
    isOx ? sculptedOxBodyGeo : sculptedHorseBodyGeo,
    coatMat
  );
  bodyMesh.position.set(0, 1.06, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  mountGroup.add(bodyMesh);

  // Muscular Shoulder & Hip Haunch Bulges blending legs organically into the body
  [
    [-0.31, 1.02, 0.48, 0.22, 0.32, 0.28],
    [0.31, 1.02, 0.48, 0.22, 0.32, 0.28],
    [-0.3, 1.06, -0.48, 0.24, 0.34, 0.3],
    [0.3, 1.06, -0.48, 0.24, 0.34, 0.3],
  ].forEach(([mx, my, mz, sx, sy, sz]) => {
    const haunch = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 16), coatMat);
    haunch.scale.set(sx, sy, sz);
    haunch.position.set(mx, my, mz);
    haunch.castShadow = true;
    haunch.receiveShadow = true;
    mountGroup.add(haunch);
  });

  // ============================================================================
  // 2. CONTOURED 3D ROYAL SADDLE, QUILTED SHABRACK PAD, POMMEL, CANTLE & STIRRUPS
  // ============================================================================
  const saddleGroup = new THREE.Group();
  saddleGroup.position.set(0, 1.06, -0.04);
  mountGroup.add(saddleGroup);

  // Curved Royal Gold-Trimmed Saddle Pad (Shabrack) hugging the dorsal ribcage
  const shabrack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.43, 0.45, 0.68, 24, 1, false, -Math.PI * 0.65, Math.PI * 1.3),
    shabrackMat
  );
  shabrack.rotation.z = Math.PI / 2;
  shabrack.rotation.y = Math.PI / 2;
  shabrack.position.set(0, 0.04, 0);
  shabrack.castShadow = true;
  saddleGroup.add(shabrack);

  // Gold Brocade Trim along the Saddle Pad edge
  [-0.34, 0.34].forEach((sz) => {
    const trimArch = new THREE.Mesh(
      new THREE.TorusGeometry(0.43, 0.022, 10, 24, Math.PI * 1.15),
      goldMat
    );
    trimArch.rotation.z = -Math.PI * 0.075;
    trimArch.position.set(0, 0.03, sz);
    saddleGroup.add(trimArch);
  });

  // Contoured Tooled-Leather Saddle Seat
  const saddleSeat = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 16), saddleMat);
  saddleSeat.scale.set(1.05, 0.34, 1.28);
  saddleSeat.position.set(0, 0.38, -0.02);
  saddleSeat.castShadow = true;
  saddleGroup.add(saddleSeat);

  // Raised Front Pommel Arch & Curved Rear Cantle Backrest
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), saddleMat);
  pommel.scale.set(1.25, 0.95, 0.65);
  pommel.position.set(0, 0.49, 0.28);
  saddleGroup.add(pommel);

  const cantle = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), saddleMat);
  cantle.scale.set(1.35, 0.9, 0.68);
  cantle.position.set(0, 0.51, -0.32);
  cantle.rotation.x = -0.25;
  saddleGroup.add(cantle);

  // Girth Strap wrapping around the barrel + Breastcollar with Golden Chest Medallion
  const girthStrap = new THREE.Mesh(
    new THREE.TorusGeometry(0.44, 0.028, 10, 28),
    saddleMat
  );
  girthStrap.position.set(0, -0.02, 0.14);
  saddleGroup.add(girthStrap);

  const chestCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.41, 0.026, 10, 24, Math.PI),
    saddleMat
  );
  chestCollar.rotation.x = Math.PI / 2;
  chestCollar.rotation.z = -Math.PI / 2;
  chestCollar.position.set(0, 0.06, 0.44);
  saddleGroup.add(chestCollar);

  const chestMedallion = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), goldMat);
  chestMedallion.scale.set(1.0, 1.0, 0.45);
  chestMedallion.position.set(0, 0.06, 0.85);
  saddleGroup.add(chestMedallion);

  // Hanging Leather Stirrup Straps & 3D Metallic Stirrup Irons on Both Sides
  [-1, 1].forEach((side) => {
    const stirrupStrap = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.016, 0.42, 6, 10),
      saddleMat
    );
    stirrupStrap.position.set(side * 0.44, 0.04, 0.06);
    saddleGroup.add(stirrupStrap);

    const stirrupIron = new THREE.Mesh(
      new THREE.TorusGeometry(0.055, 0.012, 8, 16),
      goldMat
    );
    stirrupIron.rotation.y = Math.PI / 2;
    stirrupIron.position.set(side * 0.45, -0.21, 0.06);
    saddleGroup.add(stirrupIron);
  });

  // ============================================================================
  // 3. SCULPTED NECK, ANATOMICAL HEAD, SNOUT, NOSTRILS, EYES, EARS, HORNS & MANE
  // ============================================================================
  const headNeckGroup = new THREE.Group();
  mountGroup.add(headNeckGroup);

  if (isOx) {
    // SACRED ZEBU OX (MEDIEVAL TIMELINE):
    // Prominent Sculpted Brahma Shoulder Hump over the Withers
    const zebuHump = new THREE.Mesh(new THREE.SphereGeometry(0.32, 22, 20), coatMat);
    zebuHump.scale.set(0.84, 1.22, 1.18);
    zebuHump.position.set(0, 1.56, 0.42);
    zebuHump.rotation.x = -0.18;
    zebuHump.castShadow = true;
    headNeckGroup.add(zebuHump);

    // Thick Muscular Bovine Neck + Wrinkled Hanging Throat Dewlap Fold
    const oxNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.34, 0.62, 20),
      coatMat
    );
    oxNeck.position.set(0, 1.32, 0.72);
    oxNeck.rotation.x = 0.95;
    oxNeck.castShadow = true;
    headNeckGroup.add(oxNeck);

    const dewlapFold = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 16), underbellyMat);
    dewlapFold.scale.set(0.36, 1.15, 1.35);
    dewlapFold.position.set(0, 1.02, 0.74);
    dewlapFold.rotation.x = 0.35;
    dewlapFold.castShadow = true;
    headNeckGroup.add(dewlapFold);

    // Sculpted Organic Bovine Head & Snout (Zero BoxGeometry!)
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.42, 1.04);
    headPivot.rotation.x = 0.36;
    headNeckGroup.add(headPivot);

    const oxHead = new THREE.Mesh(sculptedOxHeadGeo, coatMat);
    oxHead.castShadow = true;
    oxHead.receiveShadow = true;
    headPivot.add(oxHead);

    // Broad Dark Bovine Muzzle Pad & Sculpted Nostrils
    const muzzlePad = new THREE.Mesh(new THREE.SphereGeometry(0.155, 18, 16), muzzleMat);
    muzzlePad.scale.set(1.12, 0.86, 0.78);
    muzzlePad.position.set(0, -0.02, 0.31);
    headPivot.add(muzzlePad);

    [-1, 1].forEach((side) => {
      const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 10), eyeDarkMat);
      nostril.scale.set(0.8, 1.1, 0.6);
      nostril.position.set(side * 0.085, 0.015, 0.41);
      headPivot.add(nostril);
    });

    // 3D Golden Brass Septum Nose Ring (Nath) + Decorative Forehead Tilak Crest
    const noseRing = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.014, 10, 20), goldMat);
    noseRing.rotation.x = 0.35;
    noseRing.position.set(0, -0.055, 0.43);
    headPivot.add(noseRing);

    const foreheadCrest = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 14), goldMat);
    foreheadCrest.scale.set(1.1, 1.2, 0.38);
    foreheadCrest.position.set(0, 0.165, 0.02);
    foreheadCrest.rotation.x = -0.55;
    headPivot.add(foreheadCrest);

    // Glossy 3D Bovine Eyes, Brow Ridges & Drooping Zebu Leaf Ears
    [-1, 1].forEach((side) => {
      const brow = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 12), coatMat);
      brow.scale.set(0.9, 0.65, 1.35);
      brow.position.set(side * 0.185, 0.095, -0.04);
      headPivot.add(brow);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 14), eyeDarkMat);
      eye.position.set(side * 0.195, 0.062, -0.03);
      headPivot.add(eye);

      // Drooping Lateral Zebu Ear
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), coatMat);
      ear.scale.set(1.55, 0.42, 0.68);
      ear.position.set(side * 0.28, 0.04, -0.18);
      ear.rotation.z = -side * 0.38;
      ear.rotation.y = -side * 0.25;
      ear.castShadow = true;
      headPivot.add(ear);

      // Multi-Segment Sweeping 3D Curved Lyre Horns with Keratin Ridge Texture & Gold Tips!
      const hornRoot = new THREE.Group();
      hornRoot.position.set(side * 0.16, 0.16, -0.18);
      headPivot.add(hornRoot);

      // Gold decorative horn base collar
      const hornCollar = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.015, 8, 16), goldMat);
      hornCollar.rotation.y = side * 0.6;
      hornRoot.add(hornCollar);

      // Lower outward-sweeping horn segment
      const hornSeg1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.072, 0.34, 14),
        hornMat
      );
      hornSeg1.position.set(side * 0.12, 0.11, 0.02);
      hornSeg1.rotation.z = -side * 0.72;
      hornSeg1.rotation.x = 0.18;
      hornSeg1.castShadow = true;
      hornRoot.add(hornSeg1);

      // Middle upward-curving lyre horn segment
      const hornSeg2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.034, 0.052, 0.34, 14),
        hornMat
      );
      hornSeg2.position.set(side * 0.24, 0.33, 0.08);
      hornSeg2.rotation.z = -side * 0.18;
      hornSeg2.rotation.x = 0.28;
      hornSeg2.castShadow = true;
      hornRoot.add(hornSeg2);

      // Upper inward-curved pointed horn tip + Golden Brass Finial
      const hornTip = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.28, 14), hornMat);
      hornTip.position.set(side * 0.24, 0.58, 0.16);
      hornTip.rotation.z = side * 0.22;
      hornTip.rotation.x = 0.25;
      hornTip.castShadow = true;
      hornRoot.add(hornTip);

      const goldFinial = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 10), goldMat);
      goldFinial.position.set(side * 0.21, 0.71, 0.2);
      hornRoot.add(goldFinial);
    });
  } else {
    // ROYAL MARWARI WARHORSE (BRITISH TIMELINE):
    // Noble Arched Muscular Equine Neck
    const horseNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.185, 0.31, 0.86, 22),
      coatMat
    );
    horseNeck.scale.set(0.84, 1.0, 1.18);
    horseNeck.position.set(0, 1.54, 0.68);
    horseNeck.rotation.x = 0.54;
    horseNeck.castShadow = true;
    headNeckGroup.add(horseNeck);

    // Smooth Poll / Crest Junction Sphere
    const pollJoint = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 16), coatMat);
    pollJoint.scale.set(0.86, 1.05, 1.12);
    pollJoint.position.set(0, 1.88, 0.88);
    headNeckGroup.add(pollJoint);

    // Flowing Multi-Lock 3D Horse Mane along the Neck Crest
    for (let m = 0; m < 8; m++) {
      const frac = m / 7;
      const maneLock = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.048, 0.22, 8, 10),
        darkHairMat
      );
      maneLock.position.set(0.03, 1.32 + frac * 0.58, 0.42 + frac * 0.36);
      maneLock.rotation.x = 0.54;
      maneLock.rotation.z = -0.22;
      maneLock.castShadow = true;
      headNeckGroup.add(maneLock);
    }

    // Sculpted Organic Equine Head, Cheek/Jaw & Tapered Snout (Zero BoxGeometry!)
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.84, 1.08);
    headPivot.rotation.x = 0.44;
    headNeckGroup.add(headPivot);

    const horseHead = new THREE.Mesh(sculptedHorseHeadGeo, coatMat);
    horseHead.castShadow = true;
    horseHead.receiveShadow = true;
    headPivot.add(horseHead);

    // Soft Dark Equine Muzzle & Flared 3D Nostrils
    const horseMuzzle = new THREE.Mesh(new THREE.SphereGeometry(0.112, 16, 16), muzzleMat);
    horseMuzzle.scale.set(1.02, 0.92, 0.95);
    horseMuzzle.position.set(0, -0.01, 0.32);
    headPivot.add(horseMuzzle);

    // White Blaze Stripe down the Nasal Bridge
    const blaze = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.028, 0.34, 6, 10),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.55 })
    );
    blaze.rotation.x = Math.PI / 2;
    blaze.scale.set(1.1, 0.32, 1.0);
    blaze.position.set(0, 0.115, 0.06);
    headPivot.add(blaze);

    // Forelock Hair Tuft between the Ears
    const forelock = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, 0.22, 10),
      darkHairMat
    );
    forelock.position.set(0, 0.19, -0.14);
    forelock.rotation.x = 1.15;
    headPivot.add(forelock);

    // Glossy 3D Equine Eyes, Flared Nostrils & Inward-Curved Marwari Ears
    [-1, 1].forEach((side) => {
      const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), eyeDarkMat);
      nostril.position.set(side * 0.072, 0.015, 0.39);
      headPivot.add(nostril);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.038, 14, 14), eyeDarkMat);
      eye.position.set(side * 0.158, 0.068, -0.04);
      headPivot.add(eye);

      // Alert Marwari Warhorse Ear (curving inward at the tips!)
      const earGroup = new THREE.Group();
      earGroup.position.set(side * 0.115, 0.18, -0.24);
      earGroup.rotation.z = side * 0.18;
      earGroup.rotation.x = -0.18;
      headPivot.add(earGroup);

      const earLower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.044, 0.14, 10),
        coatMat
      );
      earLower.position.y = 0.07;
      earGroup.add(earLower);

      const earTip = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.11, 10), coatMat);
      earTip.position.set(-side * 0.018, 0.17, 0);
      earTip.rotation.z = side * 0.38; // Characteristic inward Marwari curve!
      earGroup.add(earTip);
    });

    // 3D Tooled Leather Bridle: Noseband, Browband, Cheekpieces, Brass Bit Rings & Reins
    const noseband = new THREE.Mesh(
      new THREE.TorusGeometry(0.122, 0.016, 8, 20),
      saddleMat
    );
    noseband.position.set(0, 0.005, 0.22);
    headPivot.add(noseband);

    const browband = new THREE.Mesh(
      new THREE.TorusGeometry(0.175, 0.015, 8, 20),
      goldMat
    );
    browband.position.set(0, 0.05, -0.12);
    headPivot.add(browband);

    [-1, 1].forEach((side) => {
      const bitRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.036, 0.009, 8, 16),
        goldMat
      );
      bitRing.rotation.y = Math.PI / 2;
      bitRing.position.set(side * 0.122, -0.035, 0.25);
      headPivot.add(bitRing);

      // Draped Leather Rein connecting Bit Ring back to the Saddle Pommel
      const rein = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.92, 8),
        saddleMat
      );
      rein.rotation.x = Math.PI / 2 - 0.32;
      rein.position.set(side * 0.15, 1.56, 0.68);
      headNeckGroup.add(rein);
    });
  }

  // ============================================================================
  // 4. FOUR ARTICULATED MUSCULAR LEGS WITH KNEES/HOCKS, FETLOCKS & 3D HOOVES
  // ============================================================================
  const makeMountLeg = (lx: number, lz: number, isHind: boolean) => {
    const legRoot = new THREE.Group();
    legRoot.position.set(lx, 0.96, lz);

    // Upper Muscular Gaskin (Hind) / Forearm (Front)
    const upperGeo = new THREE.CylinderGeometry(
      isOx ? 0.145 : 0.13,
      isOx ? 0.095 : 0.082,
      0.48,
      16
    );
    const upper = new THREE.Mesh(upperGeo, coatMat);
    upper.position.set(0, -0.22, isHind ? -0.03 : 0.02);
    upper.rotation.x = isHind ? 0.14 : -0.06;
    upper.castShadow = true;
    legRoot.add(upper);

    // Sculpted Knee (Front) / Hock (Hind) Joint Pivot & Sphere
    const lowerPivot = new THREE.Group();
    lowerPivot.position.set(0, -0.45, isHind ? -0.06 : 0.01);
    legRoot.add(lowerPivot);

    const kneeJoint = new THREE.Mesh(
      new THREE.SphereGeometry(isOx ? 0.092 : 0.082, 14, 14),
      coatMat
    );
    lowerPivot.add(kneeJoint);

    // Lower Cannon Bone
    const cannon = new THREE.Mesh(
      new THREE.CylinderGeometry(isOx ? 0.078 : 0.066, isOx ? 0.068 : 0.056, 0.38, 14),
      coatMat
    );
    cannon.position.set(0, -0.19, isHind ? 0.02 : 0);
    cannon.rotation.x = isHind ? -0.08 : 0.03;
    cannon.castShadow = true;
    lowerPivot.add(cannon);

    // Fetlock Joint & Pastern above the Hoof
    const fetlock = new THREE.Mesh(
      new THREE.SphereGeometry(isOx ? 0.074 : 0.064, 12, 12),
      underbellyMat
    );
    fetlock.position.set(0, -0.38, 0.02);
    lowerPivot.add(fetlock);

    // Sculpted 3D Keratin Hoof (Cloven for Ox, Shod Warhorse Hoof for Horse)
    if (isOx) {
      [-0.036, 0.036].forEach((cloveX) => {
        const clove = new THREE.Mesh(
          new THREE.CylinderGeometry(0.038, 0.048, 0.11, 12),
          hoofMat
        );
        clove.scale.set(0.95, 1.0, 1.35);
        clove.position.set(cloveX, -0.46, 0.045);
        clove.castShadow = true;
        lowerPivot.add(clove);
      });
    } else {
      const hoof = new THREE.Mesh(
        new THREE.CylinderGeometry(0.068, 0.088, 0.12, 16),
        hoofMat
      );
      hoof.scale.set(0.96, 1.0, 1.22);
      hoof.position.set(0, -0.46, 0.04);
      hoof.castShadow = true;
      lowerPivot.add(hoof);

      const horseshoe = new THREE.Mesh(
        new THREE.TorusGeometry(0.078, 0.012, 8, 16, Math.PI * 1.5),
        ironArmorMat
      );
      horseshoe.rotation.x = Math.PI / 2;
      horseshoe.rotation.z = -Math.PI * 0.25;
      horseshoe.position.set(0, -0.51, 0.04);
      lowerPivot.add(horseshoe);
    }

    mountGroup.add(legRoot);
    return { legRoot, lowerPivot };
  };

  const fl = makeMountLeg(-0.3, 0.52, false);
  const fr = makeMountLeg(0.3, 0.52, false);
  const bl = makeMountLeg(-0.3, -0.52, true);
  const br = makeMountLeg(0.3, -0.52, true);

  // ============================================================================
  // 5. ANIMATED FLOWING 3D TAIL (Long Equine Hair Tail / Ox Tail with Switch Tuft)
  // ============================================================================
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 1.26, -0.72);
  tailPivot.rotation.x = -0.32;
  mountGroup.add(tailPivot);

  if (isOx) {
    const tailCord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.024, 0.62, 10),
      coatMat
    );
    tailCord.position.set(0, -0.31, -0.06);
    tailCord.rotation.x = -0.15;
    tailPivot.add(tailCord);

    const tailTuft = new THREE.Mesh(
      new THREE.ConeGeometry(0.078, 0.28, 12),
      darkHairMat
    );
    tailTuft.position.set(0, -0.68, -0.1);
    tailTuft.rotation.x = Math.PI - 0.15;
    tailTuft.castShadow = true;
    tailPivot.add(tailTuft);
  } else {
    const tailUpper = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.075, 0.42, 10, 14),
      darkHairMat
    );
    tailUpper.position.set(0, -0.24, -0.08);
    tailUpper.rotation.x = -0.22;
    tailUpper.castShadow = true;
    tailPivot.add(tailUpper);

    const tailLower = new THREE.Mesh(
      new THREE.ConeGeometry(0.095, 0.52, 14),
      darkHairMat
    );
    tailLower.position.set(0, -0.58, -0.16);
    tailLower.rotation.x = Math.PI - 0.18;
    tailLower.castShadow = true;
    tailPivot.add(tailLower);
  }

  mountGroup.userData = {
    flLeg: fl.legRoot,
    frLeg: fr.legRoot,
    blLeg: bl.legRoot,
    brLeg: br.legRoot,
    flLower: fl.lowerPivot,
    frLower: fr.lowerPivot,
    blLower: bl.lowerPivot,
    brLower: br.lowerPivot,
    tailPivot,
    headNeckGroup,
  };
  return mountGroup;
}

export function createHumanRig(opts: HumanRigOptions): THREE.Group {
  const root = new THREE.Group();
  const humanGroup = new THREE.Group();
  root.add(humanGroup);

  const isBoss = opts.role === 'FINAL_BOSS';
  const isEnemy =
    opts.role === 'WEAK_GUARD' || opts.role === 'RAID_SOLDIER' || opts.role === 'FINAL_BOSS';
  const isFemale = opts.gender === 'female';
  const isEnemyBritish = isEnemy && opts.timeline === 'BRITISH';

  // Rich, Warm Human Skin Tone (Golden-Bronze Indian Complexion #c68652 — Never Gray!)
  const skinHex = isEnemyBritish ? 0xe8b896 : 0xc68652;
  const skinCss = isEnemyBritish ? '#e8b896' : '#c68652';

  // Vibrant Traditional Indian Attire Materials
  const upperGarmentHex =
    opts.primaryColor ??
    (isBoss
      ? 0x18181b
      : isEnemy
      ? isEnemyBritish
        ? 0xb91c1c // Scarlet British Redcoat
        : 0x3f3f46 // Medieval Raider Charcoal Tunic
      : isFemale
      ? 0xbe123c // Royal Crimson-Rose Silk Choli
      : 0xc2410c); // Royal Saffron-Terracotta Silk Kurta

  const lowerGarmentHex = isEnemy
    ? 0x1e293b
    : isFemale
    ? 0x881337 // Deep Ruby-Maroon Pleated Silk Lehenga / Kachcha Sari
    : 0xfef3c7; // Traditional Cream-Ivory Pleated Silk Dhoti

  const sashGarmentHex = isEnemyBritish
    ? 0xf8fafc // White cross-belt for British Redcoat
    : isFemale
    ? 0xe11d48 // Vibrant Rose-Gold Silk Sari Pallu Drape
    : 0xd97706; // Golden-Saffron Silk Angavastram Shoulder Stole

  const charSkinMat = new THREE.MeshStandardMaterial({
    color: skinHex,
    roughness: 0.48,
    metalness: 0.02,
  });

  const upperClothMat = new THREE.MeshStandardMaterial({
    color: upperGarmentHex,
    roughness: 0.55,
    metalness: 0.06,
  });

  const lowerClothMat = new THREE.MeshStandardMaterial({
    color: lowerGarmentHex,
    roughness: 0.58,
    metalness: 0.05,
  });

  const sashClothMat = new THREE.MeshStandardMaterial({
    color: sashGarmentHex,
    roughness: 0.42,
    metalness: 0.18,
  });

  // ============================================================================
  // 1. SCULPTED HUMAN TORSO + ACTUAL 3D TRADITIONAL INDIAN CLOTHING LAYERS
  // ============================================================================
  const upperBodyGroup = new THREE.Group();
  humanGroup.add(upperBodyGroup);

  // Layer A: Sculpted Warm Human Skin Body (Neck, Collarbones, Midriff/Navel)
  const skinTorsoMesh = new THREE.Mesh(
    isFemale ? femaleSkinTorsoGeo : maleSkinTorsoGeo,
    charSkinMat
  );
  skinTorsoMesh.position.set(0, 1.38, 0);
  skinTorsoMesh.castShadow = true;
  skinTorsoMesh.receiveShadow = true;
  upperBodyGroup.add(skinTorsoMesh);

  // Layer B: 3D Traditional Upper Garment (Female Choli Bodice / Male Silk Kurta)
  const upperGarmentMesh = new THREE.Mesh(
    isFemale ? femaleCholiGeo : maleKurtaGeo,
    upperClothMat
  );
  upperGarmentMesh.position.set(0, 1.38, 0);
  upperGarmentMesh.castShadow = true;
  upperGarmentMesh.receiveShadow = true;
  upperBodyGroup.add(upperGarmentMesh);

  // Naturally Contoured Sculpted Bust Cups on Female Avatar (Modestly scaled)
  if (isFemale) {
    [-1, 1].forEach((side) => {
      // Main naturally proportioned choli bust dome positioned gracefully on the upper chest
      const bustCup = new THREE.Mesh(
        new THREE.SphereGeometry(0.054, 24, 18),
        upperClothMat
      );
      bustCup.scale.set(0.90, 0.88, 1.04);
      bustCup.position.set(side * 0.052, 1.49, 0.096);
      bustCup.castShadow = true;
      bustCup.receiveShadow = true;
      upperBodyGroup.add(bustCup);

      // Upper bust slope blending smoothly into the neckline
      const upperBustSlope = new THREE.Mesh(
        new THREE.SphereGeometry(0.042, 16, 12),
        charSkinMat
      );
      upperBustSlope.scale.set(0.88, 0.82, 0.95);
      upperBustSlope.position.set(side * 0.046, 1.535, 0.082);
      upperBustSlope.castShadow = true;
      upperBodyGroup.add(upperBustSlope);
    });
  }

  // Layer C: 3D Diagonal Silk Sari Pallu (Female) / Angavastram Stole (Male)
  const diagonalSashMesh = new THREE.Mesh(
    isFemale ? femaleSariPalluGeo : maleAngavastramGeo,
    sashClothMat
  );
  diagonalSashMesh.position.set(0, 1.38, 0);
  diagonalSashMesh.castShadow = true;
  upperBodyGroup.add(diagonalSashMesh);

  // Layer D: 3D Ornate Gold Kamarbandh (Waist Sash / Belt)
  const kamarbandhMesh = new THREE.Mesh(
    isFemale ? femaleKamarbandhGeo : maleKamarbandhGeo,
    isEnemyBritish ? sashClothMat : goldMat
  );
  kamarbandhMesh.position.set(0, 1.38, 0);
  upperBodyGroup.add(kamarbandhMesh);

  // Layer E: 3D Pleated Hip Dhoti (Male) / Pleated Lehenga Sari Wrap (Female)
  const hipGarmentMesh = new THREE.Mesh(
    isFemale ? femaleHipLehengaGeo : maleHipDhotiGeo,
    lowerClothMat
  );
  hipGarmentMesh.position.set(0, 1.38, 0);
  hipGarmentMesh.castShadow = true;
  hipGarmentMesh.receiveShadow = true;
  upperBodyGroup.add(hipGarmentMesh);

  // Layer F: Traditional Gold Kanthahara (Royal Necklace at Collarbone)
  if (!isEnemyBritish) {
    const necklace = new THREE.Mesh(
      new THREE.TorusGeometry(isFemale ? 0.088 : 0.125, 0.013, 10, 24),
      goldMat
    );
    necklace.rotation.x = Math.PI / 2 + 0.25;
    necklace.position.set(0, isFemale ? 1.59 : 1.69, 0.020);
    upperBodyGroup.add(necklace);
  }

  // Layer G: Form-Fitting Sculpted Anatomical Steel Armour Cuirass & Pauldrons
  const armorGroup = new THREE.Group();
  const activeArmorMat = isBoss ? darkBossArmorMat : ironArmorMat;

  const steelCuirass = new THREE.Mesh(
    isFemale ? femaleCuirassGeo : maleCuirassGeo,
    activeArmorMat
  );
  steelCuirass.position.set(0, 1.38, 0);
  steelCuirass.castShadow = true;
  steelCuirass.receiveShadow = true;
  armorGroup.add(steelCuirass);

  if (isFemale) {
    [-1, 1].forEach((side) => {
      const armorBustCup = new THREE.Mesh(
        new THREE.SphereGeometry(0.080, 22, 18),
        activeArmorMat
      );
      armorBustCup.scale.set(1.0, 0.95, 1.30);
      armorBustCup.position.set(side * 0.056, 1.515, 0.128);
      armorBustCup.castShadow = true;
      armorGroup.add(armorBustCup);
    });
  }

  [-1, 1].forEach((side) => {
    const pauldron = new THREE.Mesh(
      new THREE.SphereGeometry(isFemale ? 0.092 : 0.145, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
      activeArmorMat
    );
    pauldron.position.set(side * (isFemale ? 0.172 : 0.268), 1.64, 0.01);
    pauldron.rotation.z = -side * 0.32;
    armorGroup.add(pauldron);
  });
  armorGroup.visible = Boolean(opts.armored || isBoss);
  upperBodyGroup.add(armorGroup);

  // ============================================================================
  // 2. SEAMLESSLY ATTACHED HUMAN HEAD, THICK MUSCULAR NECK & TRAPEZIUS BRIDGE
  // ============================================================================
  // Flared Anatomical Neck Cylinder embedded deep inside the chest and deep inside the head
  const neckMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      isFemale ? 0.082 : 0.096,
      isFemale ? 0.112 : 0.134,
      isFemale ? 0.32 : 0.36,
      28
    ),
    charSkinMat
  );
  neckMesh.position.set(0, isFemale ? 1.66 : 1.76, 0.008);
  neckMesh.castShadow = true;
  upperBodyGroup.add(neckMesh);

  // Sculpted Trapezius & Submental Jaw-to-Neck Bridge so the head is 100% attached with ZERO gap!
  const neckTrapeziusBase = new THREE.Mesh(
    new THREE.SphereGeometry(isFemale ? 0.128 : 0.158, 24, 18),
    charSkinMat
  );
  neckTrapeziusBase.scale.set(isFemale ? 1.25 : 1.32, isFemale ? 0.85 : 0.75, 0.94);
  neckTrapeziusBase.position.set(0, isFemale ? 1.60 : 1.68, 0.005);
  neckTrapeziusBase.castShadow = true;
  upperBodyGroup.add(neckTrapeziusBase);

  const submentalJawBridge = new THREE.Mesh(
    new THREE.SphereGeometry(isFemale ? 0.092 : 0.106, 20, 16),
    charSkinMat
  );
  submentalJawBridge.scale.set(1.02, 0.90, 1.15);
  submentalJawBridge.position.set(0, isFemale ? 1.68 : 1.82, 0.020);
  upperBodyGroup.add(submentalJawBridge);

  // Flared throat & nape skin connector embedding the lower jaw, ears, and base of skull seamlessly into the torso
  const throatNapeConnector = new THREE.Mesh(
    new THREE.CapsuleGeometry(isFemale ? 0.082 : 0.102, isFemale ? 0.16 : 0.18, 12, 16),
    charSkinMat
  );
  throatNapeConnector.position.set(0, isFemale ? 1.66 : 1.76, 0.005);
  throatNapeConnector.castShadow = true;
  upperBodyGroup.add(throatNapeConnector);

  // Seamless Rounded Pelvis & Hip Bridge connecting the bottom of the torso directly to both legs!
  const pelvisBridge = new THREE.Mesh(
    new THREE.SphereGeometry(isFemale ? 0.154 : 0.162, 28, 20),
    lowerClothMat
  );
  pelvisBridge.scale.set(1.0, 0.64, 0.76);
  pelvisBridge.position.set(0, 0.89, 0);
  pelvisBridge.castShadow = true;
  pelvisBridge.receiveShadow = true;
  upperBodyGroup.add(pelvisBridge);

  // Head seamlessly embedded into the neck and collarbones with zero gap!
  const headGroup = new THREE.Group();
  headGroup.position.set(0, isFemale ? 1.76 : 1.92, isFemale ? 0.006 : 0.016);
  upperBodyGroup.add(headGroup);

  const faceTex = getRealisticHumanFaceTexture(
    opts.gender,
    skinCss,
    Boolean(!isFemale && (isEnemy || opts.role === 'ALLY')),
    isFemale,
    isBoss
  );

  const headFaceMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    roughness: 0.46,
    metalness: 0.02,
  });

  // Smooth, naturally round 3D Human Head with crisp painted facial features
  const headMesh = new THREE.Mesh(isFemale ? femaleHeadGeo : maleHeadGeo, headFaceMat);
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headGroup.add(headMesh);

  // Subtle, smooth 3D rounded nose button on the center of the face
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.018, 14, 14), charSkinMat);
  noseTip.scale.set(0.95, 1.1, 1.05);
  noseTip.position.set(0, -0.012, 0.214);
  headGroup.add(noseTip);

  // Big, Bold 3D Royal Handlebar Mustache for Male Characters
  if (!isFemale) {
    const mustacheGroup = new THREE.Group();
    mustacheGroup.position.set(0, -0.042, 0.208);

    [-1, 1].forEach((side) => {
      // Thick main sweeping mustache wing
      const mainWing = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.016, 0.058, 8, 12),
        darkHairMat
      );
      mainWing.rotation.z = Math.PI / 2 + side * 0.22;
      mainWing.rotation.y = -side * 0.28;
      mainWing.scale.set(1.0, 1.0, 0.68);
      mainWing.position.set(side * 0.034, -0.004, -0.004);
      mustacheGroup.add(mainWing);

      // Upward-curled royal handlebar tip at outer cheek
      const curlTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.013, 0.038, 10),
        darkHairMat
      );
      curlTip.position.set(side * 0.074, 0.006, -0.018);
      curlTip.rotation.z = -side * 0.45;
      curlTip.rotation.y = -side * 0.35;
      mustacheGroup.add(curlTip);
    });

    headGroup.add(mustacheGroup);
  }

  // Smooth Rounded 3D Human Ears & Traditional Gold Earrings (Kundala / Jhumka)
  const earXOffset = isFemale ? 0.198 : 0.206;
  [-earXOffset, earXOffset].forEach((earX) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.038, 14, 14), charSkinMat);
    ear.scale.set(0.42, 1.15, 0.68);
    ear.position.set(earX, -0.01, -0.01);
    headGroup.add(ear);

    if (!isEnemyBritish) {
      const earring = new THREE.Mesh(
        new THREE.TorusGeometry(isFemale ? 0.024 : 0.018, 0.0055, 8, 16),
        goldMat
      );
      earring.position.set(earX * 1.03, -0.068, -0.01);
      earring.rotation.y = Math.PI / 2;
      headGroup.add(earring);
    }
  });

  // LUSH, VOLUMINOUS 3D HUMAN HAIR (Hugs the round head smoothly & gives the woman rich, flowing hair!)
  const hairGroup = new THREE.Group();

  // 1) Smooth Rounded Scalp & Crown Hair Dome
  const hairCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.232, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.58),
    darkHairMat
  );
  hairCrown.scale.set(isFemale ? 0.98 : 0.98, 1.08, 1.02);
  hairCrown.position.set(0, 0.025, -0.018);
  hairCrown.rotation.x = -0.38; // Swept back smoothly so the forehead, eyebrows, and eyes are 100% clear!
  hairCrown.castShadow = true;
  hairGroup.add(hairCrown);

  // 2) Full Rounded Back-of-Head Hair Volume
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.224, 24, 24), darkHairMat);
  hairBack.scale.set(isFemale ? 0.98 : 0.94, 1.06, 0.98);
  hairBack.position.set(0, -0.02, -0.055);
  hairBack.castShadow = true;
  hairGroup.add(hairBack);

  if (isFemale) {
    // EXTRA LUSH VOLUMINOUS FEMALE HAIRSTYLE:
    // Soft side-swept temple waves & long shoulder-draping tresses framing both sides of her head
    [-1, 1].forEach((side) => {
      const templeWave = new THREE.Mesh(
        new THREE.SphereGeometry(0.088, 16, 16),
        darkHairMat
      );
      templeWave.scale.set(0.58, 1.35, 0.88);
      templeWave.position.set(side * 0.175, 0.05, 0.045);
      templeWave.rotation.z = side * 0.22;
      hairGroup.add(templeWave);

      // Thick flowing side locks cascading past her ears down onto her shoulders
      const shoulderTress = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.058, 0.34, 10, 14),
        darkHairMat
      );
      shoulderTress.position.set(side * 0.185, -0.18, -0.035);
      shoulderTress.rotation.z = -side * 0.08;
      shoulderTress.rotation.x = 0.08;
      shoulderTress.castShadow = true;
      hairGroup.add(shoulderTress);
    });

    // Wide, thick cascading back hair curtain flowing down her upper back
    const backHairCascade = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.165, 0.38, 12, 18),
      darkHairMat
    );
    backHairCascade.scale.set(1.12, 1.0, 0.62);
    backHairCascade.position.set(0, -0.22, -0.145);
    backHairCascade.rotation.x = 0.14;
    backHairCascade.castShadow = true;
    hairGroup.add(backHairCascade);

    // Royal Braided Juda Bun at the back of the head
    const hairBun = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 18), darkHairMat);
    hairBun.position.set(0, -0.02, -0.22);
    hairGroup.add(hairBun);

    const gajraGoldRing = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.018, 10, 22), goldMat);
    gajraGoldRing.position.set(0, -0.02, -0.2);
    hairGroup.add(gajraGoldRing);

    // Long, thick braided plait flowing down her spine with a gold Parandi ornament
    const longBraid = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.56, 10, 16), darkHairMat);
    longBraid.position.set(0, -0.32, -0.21);
    longBraid.rotation.x = 0.18;
    longBraid.castShadow = true;
    hairGroup.add(longBraid);

    const braidGoldTie = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 8, 16), goldMat);
    braidGoldTie.rotation.x = Math.PI / 2;
    braidGoldTie.position.set(0, -0.56, -0.26);
    hairGroup.add(braidGoldTie);

    // Traditional Gold Maang Tikka at the upper center hairline
    const maangTikka = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), goldMat);
    maangTikka.position.set(0, 0.155, 0.192);
    hairGroup.add(maangTikka);
  } else {
    // Male Warrior Hairstyle: Smooth side locks + neck mane + royal warrior topknot (Jata/Shikha)
    [-1, 1].forEach((side) => {
      const sideburnLock = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.042, 0.14, 8, 12),
        darkHairMat
      );
      sideburnLock.position.set(side * 0.182, -0.01, -0.02);
      hairGroup.add(sideburnLock);
    });

    const neckMane = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.185, 0.22, 16),
      darkHairMat
    );
    neckMane.position.set(0, -0.14, -0.095);
    hairGroup.add(neckMane);

    if (!isEnemyBritish) {
      const warriorTopknot = new THREE.Mesh(new THREE.SphereGeometry(0.088, 16, 16), darkHairMat);
      warriorTopknot.position.set(0, 0.255, -0.055);
      hairGroup.add(warriorTopknot);

      const topknotBand = new THREE.Mesh(new THREE.TorusGeometry(0.074, 0.014, 8, 18), goldMat);
      topknotBand.rotation.x = Math.PI / 2;
      topknotBand.position.set(0, 0.205, -0.055);
      hairGroup.add(topknotBand);
    }
  }
  headGroup.add(hairGroup);

  // Helmet Group (Open-Face Crown Helmet tilted backward so the Face is 100% Visible!)
  const helmetGroup = new THREE.Group();
  if (isEnemyBritish && !isBoss) {
    const shako = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.18, 0.26, 20),
      darkHairMat
    );
    shako.position.set(0, 0.24, -0.02);
    helmetGroup.add(shako);
    const badge = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), goldMat);
    badge.position.set(0, 0.22, 0.165);
    helmetGroup.add(badge);
  } else {
    const helmDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.242, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.42),
      activeArmorMat
    );
    helmDome.scale.set(0.96, 1.08, 1.02);
    helmDome.position.set(0, 0.06, -0.02);
    helmDome.rotation.x = -0.45; // Open-face war helmet leaving eyes, nose, and mouth clearly visible!
    helmetGroup.add(helmDome);

    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.18, 10), goldMat);
    spire.position.set(0, 0.35, -0.03);
    helmetGroup.add(spire);
  }
  helmetGroup.visible = Boolean(opts.armored || isEnemy);
  headGroup.add(helmetGroup);

  // ============================================================================
  // 3. ANATOMICAL HUMAN ARMS + 3D TRADITIONAL SLEEVES, GOLD BAJUBAND & BANGLES
  // Embedded directly into the upper torso with Clavicle/Shoulder Bridges (Zero Floating Arms/Hands!)
  // ============================================================================
  const shoulderX = isFemale ? 0.158 : 0.262;
  const uArmGeo = isFemale ? femaleUpperArmGeo : maleUpperArmGeo;
  const fArmGeo = isFemale ? femaleForearmGeo : maleForearmGeo;

  const makeArmSide = (isLeft: boolean) => {
    // Character faces +Z: anatomical Left arm/hand is at +X (sideSign = +1), Right arm/hand is at -X (sideSign = -1)
    const sideSign = isLeft ? 1 : -1;

    // Clavicle / Muscular Trapezius Bridge physically connecting upper chest into the deltoid socket
    const shoulderBridge = new THREE.Mesh(
      new THREE.CapsuleGeometry(isFemale ? 0.050 : 0.088, shoulderX * 0.92, 10, 14),
      upperClothMat
    );
    shoulderBridge.rotation.z = Math.PI / 2 - sideSign * (isFemale ? 0.08 : 0.14);
    shoulderBridge.position.set(sideSign * (shoulderX * 0.48), 1.63, 0.008);
    shoulderBridge.castShadow = true;
    upperBodyGroup.add(shoulderBridge);

    const armPivot = new THREE.Group();
    armPivot.position.set(sideSign * shoulderX, 1.61, 0.008);
    upperBodyGroup.add(armPivot);

    // Sculpted Deltoid Shoulder Joint (Massive boulder deltoids on buff male, smooth rounded shoulders on female)
    const shoulderJoint = new THREE.Mesh(
      new THREE.SphereGeometry(isFemale ? 0.058 : 0.106, 16, 16),
      upperClothMat
    );
    shoulderJoint.scale.set(isFemale ? 0.94 : 1.08, 1.12, isFemale ? 0.94 : 1.08);
    armPivot.add(shoulderJoint);

    // Warm Human Upper Arm overlapping the shoulder joint down into the elbow joint
    const upperArm = new THREE.Mesh(uArmGeo, charSkinMat);
    upperArm.castShadow = true;
    armPivot.add(upperArm);

    // Traditional Silk Short Sleeve Cap hugging the upper arm
    const sleeveMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        isFemale ? 0.056 : 0.102,
        isFemale ? 0.050 : 0.094,
        0.16,
        20
      ),
      upperClothMat
    );
    sleeveMesh.position.set(0, -0.065, 0);
    sleeveMesh.castShadow = true;
    armPivot.add(sleeveMesh);

    // Gold Zari Sleeve Border / Bajuband Armlet
    const bajuband = new THREE.Mesh(
      new THREE.TorusGeometry(isFemale ? 0.050 : 0.093, 0.0095, 8, 20),
      goldMat
    );
    bajuband.rotation.x = Math.PI / 2;
    bajuband.position.set(0, -0.145, 0);
    armPivot.add(bajuband);

    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(0, -0.3, 0);
    elbowPivot.rotation.x = isLeft ? -0.2 : -0.28;
    armPivot.add(elbowPivot);

    // Spherical Elbow Joint connecting upper arm and forearm seamlessly
    const elbowJoint = new THREE.Mesh(
      new THREE.SphereGeometry(isFemale ? 0.042 : 0.073, 14, 14),
      charSkinMat
    );
    elbowPivot.add(elbowJoint);

    const forearm = new THREE.Mesh(fArmGeo, charSkinMat);
    forearm.castShadow = true;
    elbowPivot.add(forearm);

    // Traditional Gold Wrist Bangles / Kara
    const wristBangle = new THREE.Mesh(
      new THREE.TorusGeometry(isFemale ? 0.032 : 0.048, 0.008, 8, 16),
      goldMat
    );
    wristBangle.rotation.x = Math.PI / 2;
    wristBangle.position.set(0, -0.23, 0);
    elbowPivot.add(wristBangle);

    // Connected Hand overlapping the wrist at y = -0.27 with zero gap!
    const hand = createAnatomicalHandGroup(charSkinMat, isLeft);
    hand.position.set(0, -0.27, 0);
    if (!isFemale) {
      hand.scale.set(1.18, 1.15, 1.18);
    }
    elbowPivot.add(hand);

    return { armPivot, elbowPivot };
  };

  const leftArm = makeArmSide(true);
  const rightArm = makeArmSide(false);
  const leftArmPivot = leftArm.armPivot;
  const leftElbowPivot = leftArm.elbowPivot;
  const rightArmPivot = rightArm.armPivot;
  const rightElbowPivot = rightArm.elbowPivot;

  // Sculpted Convex Royal Indian Dhal War Shield on Left Forearm
  const shieldMesh = new THREE.Group();
  shieldMesh.position.set(-0.065, -0.15, 0.055);
  shieldMesh.rotation.set(0.12, -1.05, -0.08);

  const shieldRadius = 0.46;
  const shieldThetaMax = 0.76; // Rim radius = 0.46 * sin(0.76) = 0.317, apex height = 0.127
  const shieldZOffset = -shieldRadius * Math.cos(shieldThetaMax); // -0.3334 so rim sits at z = 0

  const shieldFrontMat = isBoss
    ? darkBossArmorMat
    : isEnemyBritish
    ? ironArmorMat
    : new THREE.MeshStandardMaterial({
        color: 0x3b0a18, // Deep Royal Crimson-Obsidian Lacquered Wootz Steel
        map: wootzSteelTex.map,
        bumpMap: royalGoldTex.bumpMap,
        bumpScale: 0.07,
        roughness: 0.22,
        metalness: 0.85,
      });

  const shieldInnerMat = new THREE.MeshStandardMaterial({
    color: 0x5c1916,
    map: teakWoodTex.map,
    bumpMap: royalGoldTex.bumpMap,
    bumpScale: 0.06,
    roughness: 0.62,
    metalness: 0.12,
    side: THREE.BackSide,
  });

  // 1) Convex Domed Outer Shield Plate
  const shieldDomeGeo = new THREE.SphereGeometry(
    shieldRadius,
    40,
    20,
    0,
    Math.PI * 2,
    0,
    shieldThetaMax
  );
  shieldDomeGeo.rotateX(Math.PI / 2);
  const shieldDome = new THREE.Mesh(shieldDomeGeo, shieldFrontMat);
  shieldDome.position.z = shieldZOffset;
  shieldDome.castShadow = true;
  shieldDome.receiveShadow = true;
  shieldMesh.add(shieldDome);

  // Quilted Velvet & Leather Concave Inner Backing
  const shieldInnerBacking = new THREE.Mesh(shieldDomeGeo, shieldInnerMat);
  shieldInnerBacking.position.z = shieldZOffset - 0.008;
  shieldMesh.add(shieldInnerBacking);

  // 2) Beveled Heavy Outer Gold Rim & Concentric Koftgari Filigree Rings
  const outerRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.317, 0.022, 16, 48),
    goldMat
  );
  outerRim.position.z = 0.004;
  outerRim.castShadow = true;
  shieldMesh.add(outerRim);

  const outerSteelLip = new THREE.Mesh(
    new THREE.TorusGeometry(0.296, 0.009, 12, 44),
    ironArmorMat
  );
  outerSteelLip.position.z = 0.019;
  shieldMesh.add(outerSteelLip);

  const midKoftgariRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.245, 0.011, 12, 44),
    goldMat
  );
  midKoftgariRing.position.z =
    Math.sqrt(shieldRadius * shieldRadius - 0.245 * 0.245) + shieldZOffset + 0.003;
  shieldMesh.add(midKoftgariRing);

  const innerLotusRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.112, 0.01, 12, 36),
    goldMat
  );
  innerLotusRing.position.z =
    Math.sqrt(shieldRadius * shieldRadius - 0.112 * 0.112) + shieldZOffset + 0.003;
  shieldMesh.add(innerLotusRing);

  // 3) 16 Raised Golden Perimeter Rivet Studs around the Outer Rim
  const rivetGeo = new THREE.SphereGeometry(0.013, 10, 10);
  const rivetRadius = 0.282;
  const rivetZ =
    Math.sqrt(shieldRadius * shieldRadius - rivetRadius * rivetRadius) +
    shieldZOffset +
    0.004;
  for (let rIdx = 0; rIdx < 16; rIdx++) {
    const rAngle = (rIdx / 16) * Math.PI * 2;
    const rivet = new THREE.Mesh(rivetGeo, goldMat);
    rivet.position.set(
      Math.cos(rAngle) * rivetRadius,
      Math.sin(rAngle) * rivetRadius,
      rivetZ
    );
    shieldMesh.add(rivet);
  }

  // 4) 8 Radiating Golden Sunburst / Padma Ribs from Center to Mid-Ring
  for (let rayIdx = 0; rayIdx < 8; rayIdx++) {
    const rayAngle = (rayIdx / 8) * Math.PI * 2;
    const rayR = 0.175;
    const rayZ =
      Math.sqrt(shieldRadius * shieldRadius - rayR * rayR) + shieldZOffset + 0.002;
    const rayPetal = new THREE.Mesh(
      new THREE.ConeGeometry(0.018, 0.11, 6),
      goldMat
    );
    rayPetal.position.set(
      Math.cos(rayAngle) * rayR,
      Math.sin(rayAngle) * rayR,
      rayZ
    );
    rayPetal.rotation.z = rayAngle - Math.PI / 2;
    rayPetal.rotation.x = -0.28;
    shieldMesh.add(rayPetal);
  }

  // 5) 4 Iconic Indian Dhal Shield Bosses (Chahar-Phul Knobs) with Lotus Collars
  const bossDist = 0.172;
  const bossSurfaceZ =
    Math.sqrt(shieldRadius * shieldRadius - bossDist * bossDist) + shieldZOffset;
  [
    Math.PI * 0.25,
    Math.PI * 0.75,
    Math.PI * 1.25,
    Math.PI * 1.75,
  ].forEach((bAngle) => {
    const bx = Math.cos(bAngle) * bossDist;
    const by = Math.sin(bAngle) * bossDist;
    const bossNode = new THREE.Group();
    bossNode.position.set(bx, by, bossSurfaceZ);
    // Align boss node with convex dome normal
    bossNode.lookAt(
      bx * 2.2,
      by * 2.2,
      (bossSurfaceZ - shieldZOffset) * 2.2 + shieldZOffset
    );

    const lotusCollar = new THREE.Mesh(
      new THREE.TorusGeometry(0.035, 0.008, 10, 20),
      goldMat
    );
    bossNode.add(lotusCollar);

    const bossCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.031, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
      ironArmorMat
    );
    bossCap.rotation.x = Math.PI / 2;
    bossCap.position.z = 0.004;
    bossNode.add(bossCap);

    const bossSpike = new THREE.Mesh(
      new THREE.ConeGeometry(0.013, 0.032, 10),
      goldMat
    );
    bossSpike.rotation.x = Math.PI / 2;
    bossSpike.position.z = 0.04;
    bossNode.add(bossSpike);

    shieldMesh.add(bossNode);
  });

  // 6) Central Surya (Sun-Crest) Umbo Medallion & Ruby Jewel Core at Dome Apex
  const apexZ = shieldRadius + shieldZOffset; // +0.1266
  const centerUmboCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.064, 0.012, 12, 28),
    goldMat
  );
  centerUmboCollar.position.z = apexZ - 0.006;
  shieldMesh.add(centerUmboCollar);

  const centerUmboDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.056, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
    goldMat
  );
  centerUmboDome.rotation.x = Math.PI / 2;
  centerUmboDome.position.z = apexZ - 0.004;
  centerUmboDome.castShadow = true;
  shieldMesh.add(centerUmboDome);

  const centerJewel = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.024, 1),
    new THREE.MeshStandardMaterial({
      color: isBoss ? 0xef4444 : 0xe11d48,
      emissive: isBoss ? 0xdc2626 : 0x9f1239,
      emissiveIntensity: 0.65,
      roughness: 0.12,
      metalness: 0.4,
    })
  );
  centerJewel.position.z = apexZ + 0.052;
  shieldMesh.add(centerJewel);

  // 7) Interior Forearm Cushion Pad, Hand-Grip Bar & Leather Enarme Straps on Back (-Z)
  const armPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.24, 0.028),
    leatherMat
  );
  armPad.position.set(0, 0, -0.006);
  shieldMesh.add(armPad);

  // Sculpted Leather-Wrapped Shield Grip Handle held directly inside the Left Hand's closed fist!
  const shieldGripHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.017, 0.017, 0.16, 12),
    leatherMat
  );
  shieldGripHandle.position.set(0, -0.04, -0.052);
  shieldMesh.add(shieldGripHandle);

  [-0.075, 0.075].forEach((strapY) => {
    const enarmeStrap = new THREE.Mesh(
      new THREE.TorusGeometry(0.058, 0.013, 10, 20),
      leatherMat
    );
    enarmeStrap.rotation.x = Math.PI / 2;
    enarmeStrap.position.set(0, strapY, -0.042);
    shieldMesh.add(enarmeStrap);
  });

  // Equipped in the Left Hand (leftElbowPivot at hand level y = -0.28)
  shieldMesh.position.set(0.055, isFemale ? -0.285 : -0.295, 0.055);
  shieldMesh.rotation.set(0.12, 1.05, 0.08);
  shieldMesh.visible = true;
  leftElbowPivot.add(shieldMesh);

  // 3D Weapon & Tool Mount in Right Hand — aligned with the hollow center of the closed right fist
  // so the player's curled fingers wrap around the sword hilt rather than the sword passing through the palm!
  const toolHolder = new THREE.Group();
  toolHolder.position.set(0, isFemale ? -0.312 : -0.318, 0.002);
  rightElbowPivot.add(toolHolder);

  const swordGroup = new THREE.Group();

  // 1) Ribbed Leather & Gold-Wire Wrapped Hilt held directly inside the closed right fist (z = -0.09..+0.09)
  const hilt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.017, 0.19, 16),
    leatherMat
  );
  hilt.rotation.x = Math.PI / 2;
  swordGroup.add(hilt);

  // Gold Grip Rings around the hilt on either side of the gripping fingers
  [-0.065, 0.0, 0.065].forEach((gz) => {
    const gripRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.0175, 0.0035, 8, 16),
      goldMat
    );
    gripRing.position.set(0, 0, gz);
    swordGroup.add(gripRing);
  });

  // 2) Traditional Indian Talwar Disk Pommel & Finial Spike behind the fist (z = -0.105)
  const pommelDisk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.036, 0.016, 20),
    goldMat
  );
  pommelDisk.rotation.x = Math.PI / 2;
  pommelDisk.position.set(0, 0, -0.102);
  swordGroup.add(pommelDisk);

  const pommelSpike = new THREE.Mesh(
    new THREE.ConeGeometry(0.011, 0.038, 12),
    goldMat
  );
  pommelSpike.rotation.x = -Math.PI / 2;
  pommelSpike.position.set(0, 0, -0.128);
  swordGroup.add(pommelSpike);

  // 3) Ornate Khanda / Talwar Crossguard with Flared Quillons & Protective Knuckle-Bow (z = +0.10)
  const guardBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.18, 0.038),
    goldMat
  );
  guardBlock.position.set(0, 0, 0.102);
  swordGroup.add(guardBlock);

  [-1, 1].forEach((qSide) => {
    const quillonTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.022, 0.055, 10),
      goldMat
    );
    quillonTip.position.set(0, qSide * 0.112, 0.102);
    quillonTip.rotation.z = qSide > 0 ? 0 : Math.PI;
    swordGroup.add(quillonTip);
  });

  // Curved Gold Knuckle-Bow protecting the fingers
  const knuckleBow = new THREE.Mesh(
    new THREE.TorusGeometry(0.052, 0.007, 10, 20, Math.PI),
    goldMat
  );
  knuckleBow.rotation.y = Math.PI / 2;
  knuckleBow.position.set(0, -0.028, 0.045);
  swordGroup.add(knuckleBow);

  // Golden Langet Collar extending onto the base of the blade
  const bladeLanget = new THREE.Mesh(
    new THREE.ConeGeometry(0.026, 0.11, 4),
    goldMat
  );
  bladeLanget.rotation.x = Math.PI / 2;
  bladeLanget.rotation.z = Math.PI / 4;
  bladeLanget.scale.set(0.55, 1.0, 1.0);
  bladeLanget.position.set(0, 0, 0.165);
  swordGroup.add(bladeLanget);

  // 4) Razor-Sharp Diamond-Cross-Section Double-Edged Blade with Needle Point
  const bladeMesh = new THREE.Mesh(
    razorSharpSwordBladeGeo,
    opts.powerfulSword ? goldMat : steelBladeMat
  );
  bladeMesh.position.set(0, 0, 0.115);
  bladeMesh.castShadow = true;
  swordGroup.add(bladeMesh);

  // Central Fuller (Blood Groove) along the lower blade for authentic razor-honed contrast
  const bladeFuller = new THREE.Mesh(
    new THREE.BoxGeometry(0.027, 0.011, 0.64),
    goldMat
  );
  bladeFuller.position.set(0, 0, 0.46);
  swordGroup.add(bladeFuller);

  toolHolder.add(swordGroup);

  const hoeGroup = new THREE.Group();
  const hoeShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.018, 1.1, 12), woodMat);
  hoeShaft.rotation.x = Math.PI / 2;
  hoeShaft.position.set(0, 0, 0.42);
  hoeGroup.add(hoeShaft);
  const hoeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.024), steelBladeMat);
  hoeBlade.position.set(0, -0.13, 0.94);
  hoeGroup.add(hoeBlade);
  hoeGroup.visible = false;
  toolHolder.add(hoeGroup);

  const axeGroup = new THREE.Group();
  const axeShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.019, 1.0, 12), woodMat);
  axeShaft.rotation.x = Math.PI / 2;
  axeShaft.position.set(0, 0, 0.4);
  axeGroup.add(axeShaft);
  const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.34, 0.24), steelBladeMat);
  axeHead.position.set(0, -0.09, 0.82);
  axeGroup.add(axeHead);
  axeGroup.visible = false;
  toolHolder.add(axeGroup);

  // 3D Curry Rice Bowl for when holding Curry Rice!
  const curryBowlGroup = new THREE.Group();
  const bowlMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.5, metalness: 0.25 })
  );
  bowlMesh.rotation.x = Math.PI;
  curryBowlGroup.add(bowlMesh);
  const riceMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.095, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.9 })
  );
  riceMesh.position.set(-0.02, 0.02, 0);
  curryBowlGroup.add(riceMesh);
  const curryStew = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.075, 0.04, 14),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.15 })
  );
  curryStew.position.set(0.02, 0.015, 0);
  curryBowlGroup.add(curryStew);
  const herbMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.012, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 })
  );
  herbMesh.position.set(0.01, 0.045, 0);
  curryBowlGroup.add(herbMesh);

  curryBowlGroup.position.set(0, -0.04, 0.22);
  curryBowlGroup.visible = false;
  toolHolder.add(curryBowlGroup);

  // ============================================================================
  // 4. SEAMLESSLY CONNECTED HUMAN LEGS + FULL-LENGTH INDIAN LEHENGA SKIRT (FEMALE) / DHOTI (MALE)
  // ============================================================================
  if (isFemale) {
    // Full-Length Flowing Pleated Indian Lehenga / Ghagra Skirt for Female Avatars (Ankle-length, NEVER shorts!)
    const lehengaSkirtGroup = new THREE.Group();
    lehengaSkirtGroup.position.set(0, 0.61, 0); // Spans from y = 1.08 (waist) down to y = 0.14 (ankles)!
    humanGroup.add(lehengaSkirtGroup);

    const lehengaSkirtMesh = new THREE.Mesh(femaleIndianLehengaSkirtGeo, lowerClothMat);
    lehengaSkirtMesh.castShadow = true;
    lehengaSkirtMesh.receiveShadow = true;
    lehengaSkirtGroup.add(lehengaSkirtMesh);

    // Triple Ornate Gold Zari Borders along the Bottom Hem of the Indian Lehenga Skirt
    [
      { y: -0.44, r: 0.264, tube: 0.013 },
      { y: -0.36, r: 0.252, tube: 0.009 },
      { y: -0.28, r: 0.240, tube: 0.007 },
    ].forEach((b) => {
      const hemZari = new THREE.Mesh(
        new THREE.TorusGeometry(b.r, b.tube, 10, 36),
        goldMat
      );
      hemZari.rotation.x = Math.PI / 2;
      hemZari.scale.set(1.02, 0.90, 1.0);
      hemZari.position.set(0, b.y, 0);
      lehengaSkirtGroup.add(hemZari);
    });
  } else {
    // Central Pleated Silk Dhoti / Angarkha Front Patka Fold for Male Characters
    const centralPatka = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.42, 0.035),
      sashClothMat
    );
    centralPatka.position.set(0, 0.78, 0.115);
    centralPatka.castShadow = true;
    humanGroup.add(centralPatka);

    const patkaGoldTip = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.035, 0.038),
      goldMat
    );
    patkaGoldTip.position.set(0, 0.58, 0.116);
    humanGroup.add(patkaGoldTip);
  }

  const dhotiThighGeo = isFemale ? femaleSariThighGeo : maleDhotiThighGeo;
  const calfGeo = isFemale ? femaleCalfGeo : maleCalfGeo;

  const makeHumanLeg = (hipX: number, isLeft: boolean) => {
    const hipPivot = new THREE.Group();
    hipPivot.position.set(hipX, 0.92, 0);

    // Spherical Hip Ball-Joint embedded inside the pelvis so the leg is 100% connected to the body!
    const hipBallJoint = new THREE.Mesh(
      new THREE.SphereGeometry(isFemale ? 0.080 : 0.112, 16, 16),
      lowerClothMat
    );
    hipBallJoint.position.set(0, 0.02, 0);
    hipPivot.add(hipBallJoint);

    // Full-Length Pleated Silk Dhoti / Lehenga Inner Drape extending from hip (+0.05) into knee (-0.45)
    const thighGarment = new THREE.Mesh(dhotiThighGeo, lowerClothMat);
    thighGarment.castShadow = true;
    thighGarment.receiveShadow = true;
    hipPivot.add(thighGarment);

    // Gold Zari Hem Border Ring
    const zariBorder = new THREE.Mesh(
      new THREE.TorusGeometry(isFemale ? 0.054 : 0.076, 0.0085, 8, 22),
      goldMat
    );
    zariBorder.rotation.x = Math.PI / 2;
    zariBorder.position.set(0, -0.39, 0);
    hipPivot.add(zariBorder);

    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.43, 0);
    hipPivot.add(kneePivot);

    // Spherical Knee Joint connecting the thigh and calf with zero gap
    const kneeJoint = new THREE.Mesh(
      new THREE.SphereGeometry(isFemale ? 0.052 : 0.072, 14, 14),
      isFemale ? lowerClothMat : charSkinMat
    );
    kneePivot.add(kneeJoint);

    // Lower Leg overlapping the knee down to the ankle (draped in silk skirt fabric for female so she never looks like she's in shorts!)
    const calfMesh = new THREE.Mesh(calfGeo, isFemale ? lowerClothMat : charSkinMat);
    calfMesh.castShadow = true;
    calfMesh.receiveShadow = true;
    kneePivot.add(calfMesh);

    const footGroup = createAnatomicalFootGroup(charSkinMat, goldMat, isLeft);
    footGroup.position.set(0, -0.41, 0);
    kneePivot.add(footGroup);

    humanGroup.add(hipPivot);
    return { hipPivot, kneePivot };
  };

  const hipOffset = isFemale ? 0.078 : 0.098;
  const leftLeg = makeHumanLeg(-hipOffset, true);
  const rightLeg = makeHumanLeg(hipOffset, false);

  // 5. Mount Group (3D Ox in Medieval, 3D Horse in British)
  const mountGroup = createMount3D(opts.timeline, false);
  mountGroup.visible = Boolean(opts.mounted);
  root.add(mountGroup);

  // 6. Floating "YOU" Tag on Player's Head, or Multiplayer Name Tag, or Health Bar
  let hpBarBg: THREE.Mesh | null = null;
  let hpBarFill: THREE.Mesh | null = null;
  let visionConeMesh: THREE.Mesh | null = null;
  let youTagSprite: THREE.Sprite | null = null;

  if (opts.role === 'PLAYER') {
    const spriteMat = new THREE.SpriteMaterial({
      map: getYouTagTexture(),
      transparent: true,
      depthTest: false,
    });
    youTagSprite = new THREE.Sprite(spriteMat);
    youTagSprite.scale.set(1.35, 0.68, 1);
    youTagSprite.position.set(0, 2.82, 0);
    youTagSprite.renderOrder = 999;
    root.add(youTagSprite);

    const playerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.46, 0.56, 32),
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      })
    );
    playerRing.rotation.x = -Math.PI / 2;
    playerRing.position.y = 0.03;
    root.add(playerRing);
  } else if (opts.playerName) {
    const spriteMat = new THREE.SpriteMaterial({
      map: getPlayerTagTexture(opts.playerName),
      transparent: true,
      depthTest: false,
    });
    youTagSprite = new THREE.Sprite(spriteMat);
    youTagSprite.scale.set(1.4, 0.42, 1);
    youTagSprite.position.set(0, 2.75, 0);
    youTagSprite.renderOrder = 990;
    root.add(youTagSprite);
  }

  if (isEnemy || ((opts.role === 'ALLY' || opts.role === 'PLAYER') && !opts.playerName)) {
    const barWidth = isBoss ? 3.2 : 1.35;
    const barY = isBoss ? 5.3 : opts.role === 'PLAYER' ? 2.42 : 2.65;
    hpBarBg = new THREE.Mesh(
      new THREE.BoxGeometry(barWidth + 0.08, 0.16, 0.06),
      new THREE.MeshBasicMaterial({ color: 0x090d16 })
    );
    hpBarBg.position.set(0, barY, 0);
    hpBarBg.visible = isEnemy;
    root.add(hpBarBg);

    hpBarFill = new THREE.Mesh(
      new THREE.BoxGeometry(barWidth, 0.12, 0.08),
      new THREE.MeshBasicMaterial({
        color: isBoss
          ? 0xdc2626
          : opts.role === 'RAID_SOLDIER'
          ? 0xf97316
          : isEnemy
          ? 0xef4444
          : opts.role === 'PLAYER'
          ? 0x10b981
          : 0x38bdf8,
      })
    );
    hpBarFill.position.set(0, barY, 0);
    hpBarFill.visible = isEnemy;
    root.add(hpBarFill);

    if (opts.role === 'WEAK_GUARD') {
      const coneGeo = new THREE.CircleGeometry(14, 16, -Math.PI / 2 - 0.48, 0.96);
      coneGeo.rotateX(-Math.PI / 2);
      visionConeMesh = new THREE.Mesh(
        coneGeo,
        new THREE.MeshBasicMaterial({
          color: 0xef4444,
          transparent: true,
          opacity: 0.22,
          side: THREE.DoubleSide,
        })
      );
      visionConeMesh.position.set(0, 0.06, 0);
      visionConeMesh.rotation.y = Math.PI;
      root.add(visionConeMesh);
    }
  }

  if (isBoss) {
    const bossScale = 1.62;
    humanGroup.scale.set(bossScale, bossScale, bossScale);
    mountGroup.visible = true;
    mountGroup.scale.set(1.55, 1.55, 1.55);
  }

  root.userData = {
    humanGroup,
    upperBodyGroup,
    armorGroup,
    helmetGroup,
    hairGroup,
    leftArmPivot,
    leftElbowPivot,
    rightArmPivot,
    rightElbowPivot,
    leftLegPivot: leftLeg.hipPivot,
    leftKneePivot: leftLeg.kneePivot,
    rightLegPivot: rightLeg.hipPivot,
    rightKneePivot: rightLeg.kneePivot,
    shieldMesh,
    swordGroup,
    bladeMesh,
    hoeGroup,
    axeGroup,
    curryBowlGroup,
    mountGroup,
    hpBarBg,
    hpBarFill,
    visionConeMesh,
    youTagSprite,
    isBoss,
    isEnemy,
  };

  return root;
}

export function updateHumanRig3D(
  root: THREE.Group,
  state: {
    x: number;
    z: number;
    facing: number;
    walkCycle: number;
    attackAnim: number;
    armored: boolean;
    powerfulSword: boolean;
    mounted: boolean;
    stealth: boolean;
    activeTool?: ActiveTool | 'none';
    isBlocking?: boolean;
    hpRatio?: number;
    alerted?: boolean;
    isAPose?: boolean;
  }
) {
  const ud = root.userData;
  if (!ud) return;

  const worldX = (state.x - 460) * 0.1;
  const worldZ = (state.z - 280) * 0.1;
  root.position.set(worldX, 0, worldZ);
  root.rotation.y = Math.PI / 2 - state.facing;

  if (ud.youTagSprite) {
    const baseTagY = state.mounted ? 3.72 : state.stealth ? 2.55 : 2.82;
    ud.youTagSprite.position.y = baseTagY + Math.sin(performance.now() * 0.005) * 0.06;
  }

  if (ud.hpBarFill && state.hpRatio !== undefined) {
    const r = Math.max(0.01, Math.min(1, state.hpRatio));
    ud.hpBarFill.visible = true;
    if (ud.hpBarBg) ud.hpBarBg.visible = true;
    ud.hpBarFill.scale.x = r;
    const barY = ud.isBoss ? 5.3 : state.mounted ? 3.35 : 2.42;
    ud.hpBarFill.position.y = barY;
    if (ud.hpBarBg) ud.hpBarBg.position.y = barY;
  }

  if (ud.visionConeMesh) {
    ud.visionConeMesh.visible = !state.alerted;
    const coneScale = state.stealth ? 0.42 : 1.0;
    ud.visionConeMesh.scale.set(coneScale, 1, coneScale);
  }

  const isMounted = Boolean(state.mounted || ud.isBoss);
  ud.mountGroup.visible = isMounted;

  const phase = state.walkCycle * 8;

  if (isMounted) {
    ud.humanGroup.position.y = ud.isBoss ? 1.45 : 0.92;
    ud.leftLegPivot.rotation.x = -0.65;
    ud.leftLegPivot.rotation.z = -0.38;
    ud.leftKneePivot.rotation.x = 0.75;
    ud.rightLegPivot.rotation.x = -0.65;
    ud.rightLegPivot.rotation.z = 0.38;
    ud.rightKneePivot.rotation.x = 0.75;

    const mData = ud.mountGroup.userData;
    if (mData) {
      const mSwing = Math.sin(phase) * 0.52;
      const oppSwing = Math.sin(phase + Math.PI) * 0.52;
      mData.flLeg.rotation.x = mSwing;
      mData.brLeg.rotation.x = mSwing;
      mData.frLeg.rotation.x = oppSwing;
      mData.blLeg.rotation.x = oppSwing;

      // Natural knee/hock flexion & tail swish while riding!
      if (mData.flLower) mData.flLower.rotation.x = Math.max(0, -mSwing * 0.65);
      if (mData.frLower) mData.frLower.rotation.x = Math.max(0, -oppSwing * 0.65);
      if (mData.blLower) mData.blLower.rotation.x = -Math.max(0, mSwing * 0.55);
      if (mData.brLower) mData.brLower.rotation.x = -Math.max(0, oppSwing * 0.55);
      if (mData.tailPivot) {
        mData.tailPivot.rotation.z = Math.sin(phase * 0.75 + performance.now() * 0.003) * 0.22;
      }
      if (mData.headNeckGroup) {
        mData.headNeckGroup.rotation.x = Math.sin(phase * 2) * 0.04;
      }
    }
  } else {
    const stride = Math.sin(phase);
    const oppStride = Math.sin(phase + Math.PI);
    const verticalBob = Math.abs(Math.cos(phase)) * 0.038;

    ud.humanGroup.position.y = (state.stealth ? -0.22 : 0) + verticalBob;
    ud.upperBodyGroup.rotation.x = state.stealth ? 0.25 : 0.02;
    ud.upperBodyGroup.rotation.y = stride * 0.07;

    ud.leftLegPivot.rotation.x = stride * 0.52 + (state.stealth ? -0.32 : 0);
    ud.leftLegPivot.rotation.z = -0.03;
    ud.leftKneePivot.rotation.x = Math.max(0.04, -stride * 0.62) + (state.stealth ? 0.52 : 0);

    ud.rightLegPivot.rotation.x = oppStride * 0.52 + (state.stealth ? -0.32 : 0);
    ud.rightLegPivot.rotation.z = 0.03;
    ud.rightKneePivot.rotation.x = Math.max(0.04, -oppStride * 0.62) + (state.stealth ? 0.52 : 0);
  }

  const armSwing = Math.sin(phase) * 0.36;
  if (state.isAPose) {
    ud.leftArmPivot.rotation.set(0, 0, 0.14);
    ud.leftElbowPivot.rotation.set(-0.16, 0, -0.05);
    ud.rightArmPivot.rotation.set(0, 0, -0.14);
    ud.rightElbowPivot.rotation.set(-0.16, 0, 0.05);
    ud.shieldMesh.visible = false;
  } else if (state.isBlocking) {
    ud.leftArmPivot.rotation.x = -0.95;
    ud.leftArmPivot.rotation.y = -0.55;
    ud.leftArmPivot.rotation.z = 0.08;
    ud.leftElbowPivot.rotation.x = -0.85;
    ud.shieldMesh.position.set(0.035, -0.26, 0.085);
    ud.shieldMesh.rotation.set(0.08, 0.45, -0.15);
    ud.shieldMesh.visible = true;
  } else {
    ud.leftArmPivot.rotation.x = -armSwing;
    ud.leftArmPivot.rotation.y = 0;
    ud.leftArmPivot.rotation.z = 0.08;
    ud.leftElbowPivot.rotation.x = -0.26 - Math.max(0, armSwing * 0.22);
    ud.shieldMesh.position.set(0.055, -0.285, 0.055);
    ud.shieldMesh.rotation.set(0.12, 1.05, 0.08);
    // Shield is equipped in the left hand whenever tools/weapons are active
    ud.shieldMesh.visible = state.activeTool !== 'none';
  }

  if (!state.isAPose) {
    if (state.attackAnim > 0) {
      ud.rightArmPivot.rotation.x = -2.0 + (1 - state.attackAnim) * 2.5;
      ud.rightArmPivot.rotation.z = -0.08 + 0.28 * Math.sin(state.attackAnim * Math.PI);
      ud.rightElbowPivot.rotation.x = -0.22;
    } else {
      ud.rightArmPivot.rotation.x = -0.18 + armSwing * 0.45;
      ud.rightArmPivot.rotation.z = -0.06;
      ud.rightElbowPivot.rotation.x = -0.3;
    }
  }

  if (!ud.isEnemy) {
    ud.armorGroup.visible = state.armored;
    ud.helmetGroup.visible = state.armored;
  }

  const tool = state.activeTool ?? 'sword';
  ud.swordGroup.visible = tool === 'sword';
  ud.hoeGroup.visible = tool === 'hoe';
  ud.axeGroup.visible = tool === 'axe';
  if (ud.curryBowlGroup) {
    ud.curryBowlGroup.visible = tool === 'curry';
  }

  if (ud.bladeMesh) {
    ud.bladeMesh.material = state.powerfulSword ? goldMat : steelBladeMat;
  }
}

let cachedSpiritLobbyBubbleTexture: THREE.CanvasTexture | null = null;
let cachedSpiritTimelineTagTexture: THREE.CanvasTexture | null = null;
let cachedBedTagTexture: THREE.CanvasTexture | null = null;

function getSpiritLobbyBubbleTexture(): THREE.CanvasTexture {
  if (cachedSpiritLobbyBubbleTexture) return cachedSpiritLobbyBubbleTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 920;
  canvas.height = 140;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 920, 140);

  ctx.fillStyle = 'rgba(7, 24, 46, 0.92)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(12, 10, 896, 116, 26);
  ctx.fill();
  ctx.stroke();

  ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('➡ RIGHT TIME MACHINES (R1–R4): MEDIEVAL INDIA TIMELINE', 460, 48);

  ctx.fillStyle = '#38bdf8';
  ctx.fillText('⬅ LEFT TIME MACHINES (L1–L4): BRITISH RULE TIMELINE', 460, 92);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  cachedSpiritLobbyBubbleTexture = tex;
  return tex;
}

function getSpiritTimelineTagTexture(): THREE.CanvasTexture {
  if (cachedSpiritTimelineTagTexture) return cachedSpiritTimelineTagTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 100;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 480, 100);
  ctx.fillStyle = 'rgba(8, 47, 73, 0.92)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(14, 12, 452, 72, 24);
  ctx.fill();
  ctx.stroke();

  ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fef08a';
  ctx.fillText('✦ Follow me!', 240, 48);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  cachedSpiritTimelineTagTexture = tex;
  return tex;
}

function getBedTagTexture(): THREE.CanvasTexture {
  if (cachedBedTagTexture) return cachedBedTagTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 440, 96);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(16, 14, 408, 56, 28);
  ctx.fill();
  ctx.stroke();

  ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fde68a';
  ctx.fillText('BED · PRESS [E] AT NIGHT TO SLEEP', 220, 43);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  cachedBedTagTexture = tex;
  return tex;
}

/**
 * Creates the 3D Friendly Guardian Spirit (rendered ONLY for the local player!)
 */
export function createFriendlySpirit3D(isLobby: boolean = false): THREE.Group {
  const spiritGroup = new THREE.Group();

  const spiritCoreMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.2,
    roughness: 0.15,
    metalness: 0.3,
    transparent: true,
    opacity: 0.88,
  });

  const spiritGoldMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.1,
    roughness: 0.2,
    metalness: 0.8,
  });

  // Ethereal Spirit Robe / Flowing Wisp Body
  const robe = new THREE.Mesh(
    new THREE.ConeGeometry(0.34, 1.25, 24, 1, true),
    spiritCoreMat
  );
  robe.position.y = 1.35;
  spiritGroup.add(robe);

  // Luminous Spirit Chest & Shoulders
  const torso = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 20, 20),
    spiritCoreMat
  );
  torso.scale.set(1.05, 1.25, 0.8);
  torso.position.y = 1.75;
  spiritGroup.add(torso);

  // Smooth Round Celestial Spirit Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.19, 24, 24),
    new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.95,
      roughness: 0.2,
    })
  );
  head.position.y = 2.18;
  spiritGroup.add(head);

  // Glowing Golden Eyes on Spirit
  [-0.06, 0.06].forEach((ex) => {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    eye.position.set(ex, 2.2, 0.175);
    spiritGroup.add(eye);
  });

  // Sacred Golden Chakra Halo behind Spirit's Head
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.022, 12, 32),
    spiritGoldMat
  );
  halo.position.set(0, 2.22, -0.08);
  spiritGroup.add(halo);

  // Orbiting Sacred Light Orbs
  const orbGroup = new THREE.Group();
  orbGroup.position.y = 1.75;
  [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach((angle) => {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    orb.position.set(Math.cos(angle) * 0.52, 0, Math.sin(angle) * 0.52);
    orbGroup.add(orb);
  });
  spiritGroup.add(orbGroup);

  // Warm Celestial Point Light
  const spiritLight = new THREE.PointLight(0x38bdf8, 8, 9);
  spiritLight.position.set(0, 2.0, 0.2);
  spiritGroup.add(spiritLight);

  // Compact Overhead Tag (never blocks the 3D camera view!)
  const tagSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: isLobby ? getSpiritLobbyBubbleTexture() : getSpiritTimelineTagTexture(),
      transparent: true,
      depthTest: true,
    })
  );
  if (isLobby) {
    tagSprite.scale.set(2.2, 0.34, 1);
  } else {
    tagSprite.scale.set(1.2, 0.25, 1);
  }
  tagSprite.position.set(0, 2.52, 0);
  spiritGroup.add(tagSprite);

  spiritGroup.userData = { halo, orbGroup, isLobby };
  return spiritGroup;
}

export function updateFriendlySpirit3D(
  spiritGroup: THREE.Group,
  x2d: number,
  y2d: number,
  facingOrTimeSec: number,
  nowMs?: number
) {
  // If nowMs is provided, (x2d, y2d) is the player's position and facingOrTimeSec is playerFacing (Lobby mode)
  if (typeof nowMs === 'number') {
    const px3d = (x2d - 460) * 0.1;
    const pz3d = (y2d - 280) * 0.1;
    const sideAngle = facingOrTimeSec - 0.78;
    const targetX = px3d + Math.cos(sideAngle) * 2.45;
    const targetZ = pz3d + Math.sin(sideAngle) * 2.45;

    spiritGroup.position.x += (targetX - spiritGroup.position.x) * 0.14;
    spiritGroup.position.z += (targetZ - spiritGroup.position.z) * 0.14;
    spiritGroup.position.y = Math.sin(nowMs * 0.0035) * 0.16;

    const angleToPlayer = Math.atan2(
      pz3d - spiritGroup.position.z,
      px3d - spiritGroup.position.x
    );
    spiritGroup.rotation.y = Math.PI / 2 - angleToPlayer;

    if (spiritGroup.userData?.halo) {
      spiritGroup.userData.halo.rotation.z = nowMs * 0.002;
    }
    if (spiritGroup.userData?.orbGroup) {
      spiritGroup.userData.orbGroup.rotation.y = nowMs * 0.0032;
    }
  } else {
    // Direct target 2D coordinates (x2d, y2d) in TimelineWorld where the Spirit leads the player!
    const targetX = (x2d - 460) * 0.1;
    const targetZ = (y2d - 280) * 0.1;
    const tSec = facingOrTimeSec;

    spiritGroup.position.x += (targetX - spiritGroup.position.x) * 0.16;
    spiritGroup.position.z += (targetZ - spiritGroup.position.z) * 0.16;
    spiritGroup.position.y = Math.sin(tSec * 3.5) * 0.18;

    if (spiritGroup.userData?.halo) {
      spiritGroup.userData.halo.rotation.z = tSec * 2.0;
    }
    if (spiritGroup.userData?.orbGroup) {
      spiritGroup.userData.orbGroup.rotation.y = tSec * 3.2;
    }
  }
}

export interface BuildingCollider2D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  requiresShelter?: boolean;
}

const VILLAGE_HOUSE_SPECS: [number, number, number, number, number, number][] = [
  // Old Man's Next-Door House & Core Trade Pavilions
  [485, 72, 5.2, 2.9, 4.2, 0x78350f],
  [575, 205, 4.8, 2.8, 4.0, 0xb45309], // Cook's Kitchen Pavilion
  [575, 325, 5.4, 2.9, 4.4, 0x78350f], // Animal Owner's Stables
  [575, 445, 5.0, 3.0, 4.2, 0x44403c], // Blacksmith's Forge
  // Expanded North Agraharam Street Houses
  [-140, 65, 5.8, 3.1, 4.6, 0x9a3412],
  [-20, 65, 5.4, 3.0, 4.4, 0x78350f],
  [100, 65, 5.6, 3.2, 4.5, 0xb45309],
  [235, 65, 5.2, 2.9, 4.2, 0x7c2d12],
  [600, 68, 5.6, 3.1, 4.4, 0x92400e],
  [715, 68, 5.4, 3.0, 4.2, 0x9a3412],
  [825, 68, 5.2, 2.9, 4.2, 0x78350f],
  // Outer Northern Quarter
  [120, -95, 6.2, 3.3, 4.8, 0xb45309],
  [260, -95, 5.6, 3.1, 4.5, 0x7c2d12],
  [400, -95, 6.0, 3.2, 4.6, 0x92400e],
  [540, -95, 5.8, 3.1, 4.5, 0x9a3412],
  [680, -95, 5.4, 2.9, 4.3, 0x78350f],
  // Expanded Southern Artisan & Granary Quarter
  [-140, 485, 5.8, 3.1, 4.6, 0xb45309],
  [-15, 485, 5.6, 3.0, 4.4, 0x7c2d12],
  [115, 525, 6.0, 3.2, 4.6, 0x92400e],
  [225, 545, 5.4, 2.9, 4.4, 0x9a3412],
  [520, 585, 5.8, 3.1, 4.5, 0x78350f],
  [655, 585, 6.2, 3.2, 4.8, 0xb45309],
  [785, 585, 5.6, 3.0, 4.4, 0x7c2d12],
  // Far Western Temple Pilgrim Quarter
  [-160, 200, 6.0, 3.2, 4.8, 0x92400e],
  [-160, 345, 6.0, 3.2, 4.8, 0x9a3412],
];

export const WORLD_BUILDING_COLLIDERS: BuildingCollider2D[] = [
  // 1. Anantha Padmanabha Swamy Temple Sanctum & Plinth (centered at 165, 275; size 160x130)
  { minX: 85, maxX: 228, minY: 210, maxY: 340 },
  // 2. Sacred Pushkarini Stepped Water Tank north of Temple (centered at 165, 115; size 140x100)
  { minX: 95, maxX: 235, minY: 65, maxY: 165 },
  // 3. Reinforced Shelter Bunker & Bastion Walls (active once shelter is built)
  { minX: 82, maxX: 145, minY: 354, maxY: 406, requiresShelter: true },
  { minX: 55, maxX: 275, minY: 174, maxY: 186, requiresShelter: true },
  { minX: 55, maxX: 275, minY: 364, maxY: 376, requiresShelter: true },
  // 4. Walkable Open-Interior Player House Walls & Bed Frame (South Veranda doorway is wide open!)
  // North Back Wall of Player House
  { minX: 330, maxX: 420, minY: 56, maxY: 65 },
  // West Wall of Player House
  { minX: 329, maxX: 337, minY: 58, maxY: 131 },
  // East Wall of Player House
  { minX: 413, maxX: 421, minY: 58, maxY: 131 },
  // Solid Teakwood Bed Frame inside Player House (player stands beside it at 378, 96 to press [E])
  { minX: 341, maxX: 361, minY: 68, maxY: 94 },
  // 5. All 25 Closed Village Houses & Trade Pavilions
  ...VILLAGE_HOUSE_SPECS.map(([vx, vy, vw, , vd]) => ({
    minX: vx - vw * 5 - 2,
    maxX: vx + vw * 5 + 2,
    minY: vy - vd * 5 - 2,
    maxY: vy + vd * 5 + 2,
  })),
  // 6. Central Village Sacred Well at (320, 275)
  { minX: 301, maxX: 339, minY: 256, maxY: 294 },
  // 7. Sacred River North & South of the Arched Stone Bridge (Bridge deck at y2d = 246..304 is walkable!)
  { minX: 900, maxX: 1020, minY: -4000, maxY: 244 },
  { minX: 900, maxX: 1020, minY: 306, maxY: 4500 },
  // 8. Deep Forest Enemy Stronghold Palisade Walls, Watchtowers & War Tents at (4350, -1150) (West Gate is open!)
  { minX: 4180, maxX: 4520, minY: -1321, maxY: -1309 }, // North Palisade
  { minX: 4180, maxX: 4520, minY: -991, maxY: -979 }, // South Palisade
  { minX: 4514, maxX: 4526, minY: -1317, maxY: -983 }, // East Palisade
  { minX: 4168, maxX: 4202, minY: -1327, maxY: -1293 }, // NW Watchtower
  { minX: 4498, maxX: 4532, minY: -1327, maxY: -1293 }, // NE Watchtower
  { minX: 4168, maxX: 4202, minY: -1007, maxY: -973 }, // SW Watchtower
  { minX: 4498, maxX: 4532, minY: -1007, maxY: -973 }, // SE Watchtower
  { minX: 4415, maxX: 4495, minY: -1190, maxY: -1110 }, // East Command War Tent
  { minX: 4332, maxX: 4398, minY: -1295, maxY: -1229 }, // North War Tent
  { minX: 4332, maxX: 4398, minY: -1071, maxY: -1005 }, // South War Tent
];

// Winding Deep Forest Trail Waypoints from the Village / River Bridge to the Hidden Enemy Stronghold (4350, -1150)
export const FOREST_PATH_WAYPOINTS_2D: { x: number; y: number }[] = [
  { x: 560, y: 275 },
  { x: 960, y: 275 },
  { x: 1380, y: 220 },
  { x: 1850, y: -90 },
  { x: 2380, y: -460 },
  { x: 2960, y: -340 },
  { x: 3520, y: -760 },
  { x: 3980, y: -1110 },
  { x: 4215, y: -1150 },
];

/**
 * Resolves 2D player/character movement against all 3D buildings, walls, temples, and riverbanks
 * with smooth wall-sliding so the player NEVER passes through buildings like a ghost!
 */
export function resolveBuildingCollisions2D(
  prevX: number,
  prevY: number,
  nextX: number,
  nextY: number,
  radius: number = 11,
  shelterBuilt: boolean = false
): { x: number; y: number } {
  const collidesAt = (cx: number, cy: number): boolean => {
    for (const box of WORLD_BUILDING_COLLIDERS) {
      if (box.requiresShelter && !shelterBuilt) continue;
      if (
        cx + radius > box.minX &&
        cx - radius < box.maxX &&
        cy + radius > box.minY &&
        cy - radius < box.maxY
      ) {
        return true;
      }
    }
    return false;
  };

  let resolvedX = nextX;
  let resolvedY = nextY;

  // Try full (nextX, nextY) first
  if (!collidesAt(resolvedX, resolvedY)) {
    return { x: resolvedX, y: resolvedY };
  }

  // Try sliding along X only
  if (!collidesAt(nextX, prevY)) {
    resolvedX = nextX;
    resolvedY = prevY;
    return { x: resolvedX, y: resolvedY };
  }

  // Try sliding along Y only
  if (!collidesAt(prevX, nextY)) {
    resolvedX = prevX;
    resolvedY = nextY;
    return { x: resolvedX, y: resolvedY };
  }

  // If prev position itself was somehow overlapping, push out to nearest non-colliding edge
  for (const box of WORLD_BUILDING_COLLIDERS) {
    if (box.requiresShelter && !shelterBuilt) continue;
    if (
      prevX + radius > box.minX &&
      prevX - radius < box.maxX &&
      prevY + radius > box.minY &&
      prevY - radius < box.maxY
    ) {
      const dLeft = Math.abs(prevX - (box.minX - radius));
      const dRight = Math.abs(box.maxX + radius - prevX);
      const dTop = Math.abs(prevY - (box.minY - radius));
      const dBot = Math.abs(box.maxY + radius - prevY);
      const minD = Math.min(dLeft, dRight, dTop, dBot);
      if (minD === dLeft) return { x: box.minX - radius - 1, y: prevY };
      if (minD === dRight) return { x: box.maxX + radius + 1, y: prevY };
      if (minD === dTop) return { x: prevX, y: box.minY - radius - 1 };
      return { x: prevX, y: box.maxY + radius + 1 };
    }
  }

  return { x: prevX, y: prevY };
}

export function createTempleAndVillage3D(): {
  envGroup: THREE.Group;
  templeGroup: THREE.Group;
  shelterGroup: THREE.Group;
  gopuramTiers: THREE.Mesh[];
  forestArrowsGroup: THREE.Group;
  templeDeityGroup: THREE.Group;
  shelterStages: THREE.Group[];
} {
  const envGroup = new THREE.Group();
  const templeGroup = new THREE.Group();
  templeGroup.position.set((165 - 460) * 0.1, 0, (275 - 280) * 0.1);
  envGroup.add(templeGroup);

  const templeStoneTex = createExtreme3DPBRTextures('CARVED_TEMPLE_STONE', 0xa8a29e, 3, 2);
  const graniteMasonryTex = createExtreme3DPBRTextures('GRANITE_MASONRY', 0x78716c, 4, 3);
  const mossyGraniteTex = createExtreme3DPBRTextures('GRANITE_MASONRY', 0x4b5563, 2, 2);
  const sacredWaterTex = createExtreme3DPBRTextures('SACRED_WATER', 0x0e7490, 6, 6);
  const limePlasterTex = createExtreme3DPBRTextures('LIME_PLASTER_WALL', 0xf5f5f4, 2, 1);
  const terracottaFloorTex = createExtreme3DPBRTextures('TERRACOTTA_FLOOR', 0x7c2d12, 4, 4);
  const treeBarkTex = createExtreme3DPBRTextures('TREE_BARK', 0x451a03, 2, 3);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xa8a29e,
    map: templeStoneTex.map,
    bumpMap: templeStoneTex.bumpMap,
    bumpScale: 0.15,
    roughness: 0.78,
    metalness: 0.1,
  });
  const carvedGraniteMat = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    map: graniteMasonryTex.map,
    bumpMap: graniteMasonryTex.bumpMap,
    bumpScale: 0.16,
    roughness: 0.7,
    metalness: 0.16,
  });
  const mossyRockMat = new THREE.MeshStandardMaterial({
    color: 0x4b5563,
    map: mossyGraniteTex.map,
    bumpMap: mossyGraniteTex.bumpMap,
    bumpScale: 0.18,
    roughness: 0.86,
    metalness: 0.06,
  });
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0e7490,
    map: sacredWaterTex.map,
    bumpMap: sacredWaterTex.bumpMap,
    bumpScale: 0.08,
    roughness: 0.08,
    metalness: 0.85,
  });

  // ============================================================================
  // 1. ANANTHA PADMANABHA SWAMY TEMPLE & SACRED PUSHKARINI LOTUS POND
  // ============================================================================
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 13), stoneMat);
  plinth.position.set(0, 0.6, 0);
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  templeGroup.add(plinth);

  // Outer Prakarams (Courtyard Flagstone Apron)
  const courtyardApron = new THREE.Mesh(
    new THREE.BoxGeometry(24, 0.16, 21),
    carvedGraniteMat
  );
  courtyardApron.position.set(0, 0.08, 0);
  courtyardApron.receiveShadow = true;
  templeGroup.add(courtyardApron);

  const pillarGeo = new THREE.CylinderGeometry(0.32, 0.38, 4.2, 12);
  [
    [-6, -4.5],
    [-6, 0],
    [-6, 4.5],
    [6, -4.5],
    [6, 0],
    [6, 4.5],
    [2, -4.5],
    [2, 4.5],
  ].forEach(([px, pz]) => {
    const pillar = new THREE.Mesh(pillarGeo, stoneMat);
    pillar.position.set(px, 3.2, pz);
    pillar.castShadow = true;
    templeGroup.add(pillar);
  });

  const gopuramTiers: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const w = 11 - i * 1.6;
    const d = 9 - i * 1.2;
    const tierTex = createExtreme3DPBRTextures(
      'CARVED_TEMPLE_STONE',
      i % 2 === 0 ? 0x78716c : 0xa8a29e,
      2,
      1
    );
    const tierMat = new THREE.MeshStandardMaterial({
      color: i % 2 === 0 ? 0x78716c : 0xa8a29e,
      map: tierTex.map,
      bumpMap: tierTex.bumpMap,
      bumpScale: 0.16,
      roughness: 0.56,
      metalness: 0.24,
    });
    const tier = new THREE.Mesh(new THREE.BoxGeometry(w, 1.8, d), tierMat);
    tier.position.set(-1.2, 5.8 + i * 1.75, 0);
    tier.castShadow = true;
    tier.receiveShadow = true;
    templeGroup.add(tier);
    gopuramTiers.push(tier);
  }

  [-1.5, 0, 1.5].forEach((kz) => {
    const kalasha = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 1), goldMat);
    kalasha.position.set(-1.2, 14.8, kz);
    templeGroup.add(kalasha);
  });

  [-3.8, 3.8].forEach((lz) => {
    const lampPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.2, 3.2, 8),
      goldMat
    );
    lampPost.position.set(7.2, 2.2, lz);
    templeGroup.add(lampPost);

    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    flame.position.set(7.2, 3.9, lz);
    templeGroup.add(flame);
  });

  // Sacred Pushkarini Stepped Water Tank north of the Temple
  const tankGroup = new THREE.Group();
  tankGroup.position.set(0, 0, -16);
  const tankBorder = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 10), stoneMat);
  tankBorder.position.y = 0.3;
  tankBorder.receiveShadow = true;
  tankGroup.add(tankBorder);
  const tankWater = new THREE.Mesh(new THREE.PlaneGeometry(11.6, 7.6), waterMat);
  tankWater.rotation.x = -Math.PI / 2;
  tankWater.position.y = 0.62;
  tankGroup.add(tankWater);
  templeGroup.add(tankGroup);

  const templeLight = new THREE.PointLight(0xfbbf24, 18, 28);
  templeLight.position.set(6, 5, 0);
  templeGroup.add(templeLight);

  // ============================================================================
  // 1B. SACRED DEITY (LORD SRI ANANTHA PADMANABHA SWAMY) IN SANCTUM (GARBHAGRIHA)
  // Added during Day 6 Temple Restoration: Divine Sheshanaga Serpent & Deity Murti
  // ============================================================================
  const templeDeityGroup = new THREE.Group();
  templeDeityGroup.position.set(0, 1.2, 0); // Center of the sacred temple plinth

  // Sanctum Polished Shaligram / Black Granite Pedestal
  const peedamMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.25,
    metalness: 0.35,
  });
  const peedam = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.55, 3.2), peedamMat);
  peedam.position.set(0, 0.28, 0);
  peedam.castShadow = true;
  peedam.receiveShadow = true;
  templeDeityGroup.add(peedam);

  // Golden Carved Lotus Petal Rim around Pedestal
  const lotusBorder = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.12, 3.4), goldMat);
  lotusBorder.position.set(0, 0.58, 0);
  templeDeityGroup.add(lotusBorder);

  // Divine Celestial Serpent Adisesha (Sheshanaga) Coiled Bed
  const serpentScalesMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b,
    roughness: 0.45,
    metalness: 0.4,
  });
  [-0.6, 0, 0.6].forEach((cz, idx) => {
    const coil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.42, 3.4, 12),
      serpentScalesMat
    );
    coil.rotation.z = Math.PI / 2;
    coil.position.set(0, 0.82 + idx * 0.12, cz);
    coil.castShadow = true;
    templeDeityGroup.add(coil);
  });

  // 5 Majestic Divine Cobra Hoods arching over the Deity's Head like an umbrella
  const serpentHoodsGroup = new THREE.Group();
  serpentHoodsGroup.position.set(1.4, 1.35, 0);
  [-0.65, -0.32, 0, 0.32, 0.65].forEach((hz, i) => {
    const hoodH = 1.35 - Math.abs(i - 2) * 0.16;
    const hood = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, hoodH, 8),
      serpentScalesMat
    );
    hood.rotation.x = (i - 2) * 0.12;
    hood.rotation.z = -0.35; // Arching forward toward west
    hood.position.set(0, hoodH * 0.45, hz);
    hood.castShadow = true;
    serpentHoodsGroup.add(hood);

    // Glowing Golden Nagaratna (Crest Jewel) on each serpent hood
    const gem = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    gem.position.set(0.08, hoodH * 0.8, hz);
    serpentHoodsGroup.add(gem);
  });
  templeDeityGroup.add(serpentHoodsGroup);

  // Sacred Deity (Lord Sri Anantha Padmanabha Swamy) in reclining Ananthasayana posture
  const deityStoneMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Deep sacred black/indigo granite
    roughness: 0.3,
    metalness: 0.25,
  });

  // Torso & Divine Upper Body
  const deityTorso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 0.75), deityStoneMat);
  deityTorso.position.set(0.3, 1.3, 0);
  deityTorso.castShadow = true;
  templeDeityGroup.add(deityTorso);

  // Golden Royal Kirita Mukuta (Tiered Temple Crown)
  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.28, 0.85, 12),
    goldMat
  );
  crown.rotation.z = -Math.PI / 2;
  crown.position.set(1.45, 1.38, 0);
  crown.castShadow = true;
  templeDeityGroup.add(crown);

  // Head of the Deity
  const deityHead = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), deityStoneMat);
  deityHead.position.set(1.15, 1.35, 0);
  templeDeityGroup.add(deityHead);

  // Golden Pitambara Silk Dhoti over Lower Body & Legs
  const pitambara = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.48, 0.65),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.65 })
  );
  pitambara.position.set(-0.95, 1.25, 0);
  pitambara.castShadow = true;
  templeDeityGroup.add(pitambara);

  // Golden Sacred Kaustubha Jewel & Ornaments
  const kaustubha = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 1), goldMat);
  kaustubha.position.set(0.4, 1.45, 0.38);
  templeDeityGroup.add(kaustubha);

  // Golden Lotus Flower in Deity's Hand
  const sacredLotus = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 1), goldMat);
  sacredLotus.position.set(-0.15, 1.48, 0.42);
  templeDeityGroup.add(sacredLotus);

  // Prabhavali / Makara Torana (Golden Divine Aureole Arch around Deity)
  const prabhavali = new THREE.Mesh(
    new THREE.TorusGeometry(2.35, 0.12, 8, 24, Math.PI),
    goldMat
  );
  prabhavali.rotation.y = Math.PI / 2;
  prabhavali.position.set(0, 1.3, 0);
  templeDeityGroup.add(prabhavali);

  // Radiant Golden Divine Sanctum Light
  const deityDivineLight = new THREE.PointLight(0xffd700, 24, 22);
  deityDivineLight.position.set(0, 2.4, 0);
  templeDeityGroup.add(deityDivineLight);

  // 4 Brass Standing Oil Lamps (Deepams / Kuthuvilakku) on Sanctum Corners
  [
    [-1.9, -1.3],
    [-1.9, 1.3],
    [1.9, -1.3],
    [1.9, 1.3],
  ].forEach(([lx, lz]) => {
    const lampStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.14, 1.6, 8),
      goldMat
    );
    lampStem.position.set(lx, 0.8, lz);
    lampStem.castShadow = true;
    templeDeityGroup.add(lampStem);

    const lampCup = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.1, 0.14, 8), goldMat);
    lampCup.position.set(lx, 1.62, lz);
    templeDeityGroup.add(lampCup);

    const diyaFlame = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    diyaFlame.position.set(lx, 1.76, lz);
    templeDeityGroup.add(diyaFlame);
  });

  // Hanging Temple Bell (Ghanta) in Sanctum Portal
  const templeBell = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.42, 10), goldMat);
  templeBell.position.set(2.4, 3.4, 0);
  templeDeityGroup.add(templeBell);

  // Auspicious Marigold (Genda) Flower Garlands draped across the Sanctum
  const garlandMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.6,
  });
  [-1.2, 1.2].forEach((gx) => {
    const garland = new THREE.Mesh(
      new THREE.TorusGeometry(0.8, 0.08, 8, 20, Math.PI),
      garlandMat
    );
    garland.rotation.x = Math.PI / 2;
    garland.position.set(gx, 2.2, 0);
    templeDeityGroup.add(garland);
  });

  // Sacred Brass Kalasha Urns on Sanctum Corners
  [-2.1, 2.1].forEach((kx) => {
    const kalashBase = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), goldMat);
    kalashBase.position.set(kx, 0.45, -1.6);
    templeDeityGroup.add(kalashBase);
    const coconut = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 8), timberMat);
    coconut.position.set(kx, 0.72, -1.6);
    templeDeityGroup.add(coconut);
  });

  // Initially hidden until Consecrated on Day 6!
  templeDeityGroup.visible = false;
  templeGroup.add(templeDeityGroup);

  // ============================================================================
  // 1C. FORTIFIED VILLAGER BASE (6 Progressive Construction Stages)
  // Truly looks like an authentic fortified medieval military base!
  // ============================================================================
  const shelterGroup = new THREE.Group();
  shelterGroup.position.set(0, 0, 10.5); // South of temple around SHELTER_SITE_POS

  const timberTex = createExtreme3DPBRTextures('TREE_BARK', 0x3f2212, 2, 3);
  const timberMat = new THREE.MeshStandardMaterial({
    color: 0x4a2a18,
    map: timberTex.map,
    bumpMap: timberTex.bumpMap,
    bumpScale: 0.18,
    roughness: 0.88,
  });

  const stoneFortTex = createExtreme3DPBRTextures('GRANITE_MASONRY', 0x57534e, 3, 2);
  const stoneFortMat = new THREE.MeshStandardMaterial({
    color: 0x57534e,
    map: stoneFortTex.map,
    bumpMap: stoneFortTex.bumpMap,
    bumpScale: 0.18,
    roughness: 0.75,
  });

  const thatchRoofMat = new THREE.MeshStandardMaterial({
    color: 0x9a3412,
    roughness: 0.9,
  });

  const royalBannerMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.5,
  });

  const shelterStages: THREE.Group[] = [];

  // STAGE 1: Stone & Earthwork Foundations, Ground Apron & Central Campfire
  const stage1 = new THREE.Group();
  const earthBermN = new THREE.Mesh(new THREE.BoxGeometry(23, 0.6, 1.8), stoneFortMat);
  earthBermN.position.set(0, 0.3, -9);
  const earthBermS = new THREE.Mesh(new THREE.BoxGeometry(23, 0.6, 1.8), stoneFortMat);
  earthBermS.position.set(0, 0.3, 9);
  const earthBermW = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 18), stoneFortMat);
  earthBermW.position.set(-11, 0.3, 0);
  const earthBermE = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 18), stoneFortMat);
  earthBermE.position.set(11, 0.3, 0);
  [earthBermN, earthBermS, earthBermW, earthBermE].forEach((m) => {
    m.receiveShadow = true;
    m.castShadow = true;
    stage1.add(m);
  });

  // Central Stone Campfire Pit with Embers
  const campFireRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.28, 8, 16),
    stoneFortMat
  );
  campFireRing.rotation.x = -Math.PI / 2;
  campFireRing.position.set(0, 0.2, 0);
  stage1.add(campFireRing);

  const fireWood1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.6, 6), timberMat);
  fireWood1.rotation.z = 0.5;
  fireWood1.position.set(0, 0.3, 0);
  stage1.add(fireWood1);
  const fireWood2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.6, 6), timberMat);
  fireWood2.rotation.z = -0.5;
  fireWood2.position.set(0, 0.3, 0);
  stage1.add(fireWood2);

  const fireFlames = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 1.1, 8),
    new THREE.MeshBasicMaterial({ color: 0xf97316 })
  );
  fireFlames.position.set(0, 0.75, 0);
  stage1.add(fireFlames);

  const shelterFireLight = new THREE.PointLight(0xf97316, 12, 18);
  shelterFireLight.position.set(0, 1.2, 0);
  stage1.add(shelterFireLight);

  shelterGroup.add(stage1);
  shelterStages.push(stage1);

  // STAGE 2: Heavy Timber Palisade Stockade Walls with Pointed Logs
  const stage2 = new THREE.Group();
  // North Palisade (22m wide)
  const palisadeN = new THREE.Mesh(new THREE.BoxGeometry(22, 3.4, 0.8), timberMat);
  palisadeN.position.set(0, 2.0, -9);
  palisadeN.castShadow = true;
  stage2.add(palisadeN);

  // Pointed Log Spikes along North Wall
  for (let s = -10; s <= 10; s += 1.8) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 6), timberMat);
    spike.position.set(s, 4.0, -9);
    stage2.add(spike);
  }

  // West Palisade (18m wide)
  const palisadeW = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.4, 18), timberMat);
  palisadeW.position.set(-11, 2.0, 0);
  palisadeW.castShadow = true;
  stage2.add(palisadeW);

  // East Palisade (18m wide)
  const palisadeE = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.4, 18), timberMat);
  palisadeE.position.set(11, 2.0, 0);
  palisadeE.castShadow = true;
  stage2.add(palisadeE);

  // South Palisade Left & Right Flanks (leaves center gateway open)
  const palisadeS1 = new THREE.Mesh(new THREE.BoxGeometry(7.5, 3.4, 0.8), timberMat);
  palisadeS1.position.set(-7.25, 2.0, 9);
  palisadeS1.castShadow = true;
  stage2.add(palisadeS1);
  const palisadeS2 = new THREE.Mesh(new THREE.BoxGeometry(7.5, 3.4, 0.8), timberMat);
  palisadeS2.position.set(7.25, 2.0, 9);
  palisadeS2.castShadow = true;
  stage2.add(palisadeS2);

  shelterGroup.add(stage2);
  shelterStages.push(stage2);

  // STAGE 3: Two High Corner Watchtowers (NW and NE corners) with Flaming Braziers
  const stage3 = new THREE.Group();
  [
    [-11, -9],
    [11, -9],
  ].forEach(([tx, tz]) => {
    // 4 Heavy Corner Support Pillars
    [-1.2, 1.2].forEach((px) => {
      [-1.2, 1.2].forEach((pz) => {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.26, 0.32, 6.2, 8),
          timberMat
        );
        post.position.set(tx + px, 3.1, tz + pz);
        post.castShadow = true;
        stage3.add(post);
      });
    });

    // Elevated Guard Platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 3.6), timberMat);
    platform.position.set(tx, 4.3, tz);
    platform.castShadow = true;
    stage3.add(platform);

    // Platform Railings
    const railing = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.9, 3.4),
      new THREE.MeshStandardMaterial({ color: 0x4a2a18, wireframe: false })
    );
    railing.position.set(tx, 4.85, tz);
    stage3.add(railing);

    // Thatched/Tile Pyramidal Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.8, 4), thatchRoofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(tx, 6.4, tz);
    roof.castShadow = true;
    stage3.add(roof);

    // Watchtower Flaming Torch Brazier with Light
    const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.18, 0.5, 8), stoneFortMat);
    brazier.position.set(tx, 4.7, tz + 1.6);
    stage3.add(brazier);

    const torchLight = new THREE.PointLight(0xf59e0b, 10, 16);
    torchLight.position.set(tx, 5.2, tz + 1.6);
    stage3.add(torchLight);
  });

  shelterGroup.add(stage3);
  shelterStages.push(stage3);

  // STAGE 4: Fortified South Gatehouse & Heavy Stockade Entrance Portal
  const stage4 = new THREE.Group();
  // Gateway Left & Right Bastion Posts
  const gatePostL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.4, 1.6), stoneFortMat);
  gatePostL.position.set(-3.5, 2.7, 9);
  gatePostL.castShadow = true;
  stage4.add(gatePostL);

  const gatePostR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.4, 1.6), stoneFortMat);
  gatePostR.position.set(3.5, 2.7, 9);
  gatePostR.castShadow = true;
  stage4.add(gatePostR);

  // Overhead Heavy Defensive Lintel & Walkway
  const gateBridge = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.6, 2.4), timberMat);
  gateBridge.position.set(0, 5.1, 9);
  gateBridge.castShadow = true;
  stage4.add(gateBridge);

  // Open Reinforced Stockade Doors (Angled open for troop transit)
  const doorL = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.8, 0.3), timberMat);
  doorL.rotation.y = 0.65;
  doorL.position.set(-2.2, 2.1, 8.4);
  doorL.castShadow = true;
  stage4.add(doorL);

  const doorR = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.8, 0.3), timberMat);
  doorR.rotation.y = -0.65;
  doorR.position.set(2.2, 2.1, 8.4);
  doorR.castShadow = true;
  stage4.add(doorR);

  shelterGroup.add(stage4);
  shelterStages.push(stage4);

  // STAGE 5: Interior Villager Barracks Huts (West & East Cabins with Terracotta Roofs)
  const stage5 = new THREE.Group();
  // West Barracks (Soldier Quarters)
  const hutW = new THREE.Mesh(new THREE.BoxGeometry(6.2, 3.2, 5.0), timberMat);
  hutW.position.set(-6.5, 1.8, -3.5);
  hutW.castShadow = true;
  hutW.receiveShadow = true;
  stage5.add(hutW);

  const hutWRoof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 1.8, 4), thatchRoofMat);
  hutWRoof.rotation.y = Math.PI / 4;
  hutWRoof.position.set(-6.5, 4.0, -3.5);
  hutWRoof.castShadow = true;
  stage5.add(hutWRoof);

  // East Supply Cabin & Mess
  const hutE = new THREE.Mesh(new THREE.BoxGeometry(6.2, 3.2, 5.0), timberMat);
  hutE.position.set(6.5, 1.8, -3.5);
  hutE.castShadow = true;
  hutE.receiveShadow = true;
  stage5.add(hutE);

  const hutERoof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 1.8, 4), thatchRoofMat);
  hutERoof.rotation.y = Math.PI / 4;
  hutERoof.position.set(6.5, 4.0, -3.5);
  hutERoof.castShadow = true;
  stage5.add(hutERoof);

  shelterGroup.add(stage5);
  shelterStages.push(stage5);

  // STAGE 6: Armory, Weapon Racks, Training Dummy, Supply Crates & Kingdom Banners
  const stage6 = new THREE.Group();
  // Covered Weapon Rack
  const weaponRack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.6), timberMat);
  weaponRack.position.set(-4.5, 1.0, 4.5);
  weaponRack.castShadow = true;
  stage6.add(weaponRack);

  // Spears on Rack
  for (let sp = -0.8; sp <= 0.8; sp += 0.4) {
    const spear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6),
      stoneFortMat
    );
    spear.position.set(-4.5 + sp, 1.3, 4.5);
    stage6.add(spear);
  }

  // Straw Training Combat Dummy
  const dummyPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.0, 8), timberMat);
  dummyPole.position.set(4.5, 1.0, 3.5);
  stage6.add(dummyPole);
  const dummyBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.9, 0.4),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 })
  );
  dummyBody.position.set(4.5, 1.45, 3.5);
  stage6.add(dummyBody);

  // Supply Crates
  [-1.5, 0, 1.5].forEach((cx, i) => {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.2), timberMat);
    crate.position.set(-8.5, 0.5, 2.0 + cx);
    crate.castShadow = true;
    stage6.add(crate);
  });

  // Tall Flagstaffs with Royal Saffron Triangular Banners at Gateway
  [-4.2, 4.2].forEach((bx) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 7.2, 8), timberMat);
    pole.position.set(bx, 3.6, 9.8);
    pole.castShadow = true;
    stage6.add(pole);

    const banner = new THREE.Mesh(new THREE.ConeGeometry(0.75, 2.4, 3), royalBannerMat);
    banner.rotation.z = Math.PI / 2;
    banner.position.set(bx + (bx > 0 ? 1.0 : -1.0), 6.2, 9.8);
    banner.castShadow = true;
    stage6.add(banner);
  });

  shelterGroup.add(stage6);
  shelterStages.push(stage6);

  // Villager military base stages start hidden and reveal as player constructs them with multiple 'E' presses
  shelterStages.forEach((st) => {
    st.visible = false;
  });
  shelterGroup.visible = true;
  templeGroup.add(shelterGroup);

  // ============================================================================
  // 2A. WALKABLE OPEN-INTERIOR PLAYER HOUSE WITH 3D BED (Spawns at x2d=375, y2d=95)
  // ============================================================================
  const playerHouseGroup = new THREE.Group();
  playerHouseGroup.position.set((375 - 460) * 0.1, 0, (95 - 280) * 0.1); // (-8.5, 0, -18.5)
  envGroup.add(playerHouseGroup);

  const wallPlasterMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f4,
    map: limePlasterTex.map,
    bumpMap: limePlasterTex.bumpMap,
    bumpScale: 0.12,
    roughness: 0.8,
  });
  const floorTileMat = new THREE.MeshStandardMaterial({
    color: 0x7c2d12,
    map: terracottaFloorTex.map,
    bumpMap: terracottaFloorTex.bumpMap,
    bumpScale: 0.12,
    roughness: 0.62,
  });

  // Walkable Terracotta & Stone Interior Floor
  const houseFloor = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.16, 7.2), floorTileMat);
  houseFloor.position.set(0, 0.08, 0);
  houseFloor.receiveShadow = true;
  playerHouseGroup.add(houseFloor);

  // North Back Wall, West Wall & East Wall (South front is an open colonnade so you can see inside & walk out!)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(8.8, 3.4, 0.35), wallPlasterMat);
  backWall.position.set(0, 1.78, -3.42);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  playerHouseGroup.add(backWall);

  const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.4, 7.2), wallPlasterMat);
  westWall.position.set(-4.22, 1.78, 0);
  westWall.castShadow = true;
  westWall.receiveShadow = true;
  playerHouseGroup.add(westWall);

  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.4, 7.2), wallPlasterMat);
  eastWall.position.set(4.22, 1.78, 0);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;
  playerHouseGroup.add(eastWall);

  // Front Veranda Wooden Pillars & Cutaway Gable Roof Beam
  [-3.8, -1.6, 1.6, 3.8].forEach((px) => {
    const verandaPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.2, 3.4, 10),
      woodMat
    );
    verandaPillar.position.set(px, 1.78, 3.4);
    verandaPillar.castShadow = true;
    playerHouseGroup.add(verandaPillar);
  });

  const frontBeam = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.38, 0.45), woodMat);
  frontBeam.position.set(0, 3.55, 3.4);
  playerHouseGroup.add(frontBeam);

  // Back-half Terracotta Roof Canopy (leaves the front interior and bed clearly visible from 3rd-person & overview cameras!)
  const playerRoofTex = createExtreme3DPBRTextures('TERRACOTTA_ROOF', 0x9a3412, 3, 2);
  const cutawayRoof = new THREE.Mesh(
    new THREE.BoxGeometry(9.4, 0.35, 3.8),
    new THREE.MeshStandardMaterial({
      color: 0x9a3412,
      map: playerRoofTex.map,
      bumpMap: playerRoofTex.bumpMap,
      bumpScale: 0.16,
      roughness: 0.65,
    })
  );
  cutawayRoof.position.set(0, 3.72, -1.8);
  cutawayRoof.rotation.x = -0.18;
  cutawayRoof.castShadow = true;
  playerHouseGroup.add(cutawayRoof);

  // 3D BED INSIDE THE PLAYER'S HOUSE (at x2d = 352, y2d = 82 -> local (-2.3, 0, -1.3))
  const bedGroup = new THREE.Group();
  bedGroup.position.set(-2.3, 0.16, -1.3);
  playerHouseGroup.add(bedGroup);

  // Carved Teakwood Bed Frame
  const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.42, 3.2), woodMat);
  bedFrame.position.y = 0.28;
  bedFrame.castShadow = true;
  bedFrame.receiveShadow = true;
  bedGroup.add(bedFrame);

  // Carved Wooden Headboard
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.35, 0.24), woodMat);
  headboard.position.set(0, 0.72, -1.48);
  headboard.castShadow = true;
  bedGroup.add(headboard);

  // 4 Wooden Corner Bedposts
  [
    [-1.12, -1.5],
    [1.12, -1.5],
    [-1.12, 1.5],
    [1.12, 1.5],
  ].forEach(([bx, bz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.45, 8), woodMat);
    post.position.set(bx, 0.72, bz);
    bedGroup.add(post);
  });

  // Royal Crimson & Gold Quilted Mattress & Blanket
  const mattressTex = createExtreme3DPBRTextures('ROYAL_GOLD_BROCADE', 0xbe123c, 2, 2);
  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(2.16, 0.28, 2.95),
    new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      map: mattressTex.map,
      bumpMap: mattressTex.bumpMap,
      bumpScale: 0.06,
      roughness: 0.52,
    })
  );
  mattress.position.set(0, 0.56, 0.04);
  mattress.castShadow = true;
  bedGroup.add(mattress);

  const goldBlanketTrim = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.3, 1.65),
    goldMat
  );
  goldBlanketTrim.position.set(0, 0.57, 0.65);
  bedGroup.add(goldBlanketTrim);

  // Soft Ivory Bolster Pillow
  const pillow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 1.75, 14),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 })
  );
  pillow.rotation.z = Math.PI / 2;
  pillow.position.set(0, 0.78, -1.05);
  pillow.castShadow = true;
  bedGroup.add(pillow);

  // Floating 3D "BED · PRESS [E] AT NIGHT TO SLEEP" Tag above Bed
  const bedTag = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getBedTagTexture(),
      transparent: true,
      depthTest: false,
    })
  );
  bedTag.scale.set(2.4, 0.52, 1);
  bedTag.position.set(0, 2.35, 0);
  bedTag.renderOrder = 995;
  bedGroup.add(bedTag);

  // Warm Interior House Lantern Light
  const houseLight = new THREE.PointLight(0xfbbf24, 12, 18);
  houseLight.position.set(0, 2.8, 0);
  playerHouseGroup.add(houseLight);

  // ============================================================================
  // 2B. EXPANDED LARGE TRADITIONAL INDIAN TEMPLE TOWN & VILLAGE (26+ Buildings!)
  // ============================================================================
  const addVillageBuilding = (
    x2d: number,
    y2d: number,
    w: number,
    h: number,
    d: number,
    roofColor: number
  ) => {
    const bGroup = new THREE.Group();
    bGroup.position.set((x2d - 460) * 0.1, 0, (y2d - 280) * 0.1);

    const foundation = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.6, 0.45, d + 0.6),
      carvedGraniteMat
    );
    foundation.position.y = 0.225;
    foundation.receiveShadow = true;
    bGroup.add(foundation);

    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      wallPlasterMat
    );
    walls.position.y = 0.45 + h / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    bGroup.add(walls);

    const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.1, 0.15), woodMat);
    door.position.set(0, 1.5, d / 2 + 0.04);
    bGroup.add(door);

    const rTex = createExtreme3DPBRTextures('TERRACOTTA_ROOF', roofColor, 2, 2);
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(w, d) * 0.82, h * 0.78, 4),
      new THREE.MeshStandardMaterial({
        color: roofColor,
        map: rTex.map,
        bumpMap: rTex.bumpMap,
        bumpScale: 0.16,
        roughness: 0.65,
      })
    );
    roof.position.y = 0.45 + h + (h * 0.78) / 2 - 0.15;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    bGroup.add(roof);

    envGroup.add(bGroup);
  };

  VILLAGE_HOUSE_SPECS.forEach(([vx, vy, vw, vh, vd, rCol]) => {
    addVillageBuilding(vx, vy, vw, vh, vd, rCol);
  });

  // Central Village Sacred Well & Banyan Courtyard Platform at (320, 275)
  const wellGroup = new THREE.Group();
  wellGroup.position.set((320 - 460) * 0.1, 0, (275 - 280) * 0.1);
  const wellBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 2.0, 0.9, 18),
    carvedGraniteMat
  );
  wellBase.position.y = 0.45;
  wellBase.castShadow = true;
  wellGroup.add(wellBase);
  const wellWater = new THREE.Mesh(new THREE.CircleGeometry(1.45, 18), waterMat);
  wellWater.rotation.x = -Math.PI / 2;
  wellWater.position.y = 0.85;
  wellGroup.add(wellWater);
  envGroup.add(wellGroup);

  // ============================================================================
  // 3. WINDING SACRED RIVER & ANCIENT ARCHED STONE BRIDGE (Between Village & Forest)
  // ============================================================================
  // River runs North-South at x2d = 960 (worldX = 50.0), separating the Village from the Deep Eastern Jungle
  const riverX = (960 - 460) * 0.1; // +50.0
  const riverWater = new THREE.Mesh(new THREE.PlaneGeometry(14, 750), waterMat);
  riverWater.rotation.x = -Math.PI / 2;
  riverWater.position.set(riverX, 0.05, 0);
  envGroup.add(riverWater);

  // Stone & Sand Riverbanks
  const bankMat = carvedGraniteMat;
  [-7.8, 7.8].forEach((bx) => {
    const bank = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 750), bankMat);
    bank.rotation.x = -Math.PI / 2;
    bank.position.set(riverX + bx, 0.04, 0);
    bank.receiveShadow = true;
    envGroup.add(bank);
  });

  // Arched Stone Bridge at x2d = 960, y2d = 275 (worldX = 50.0, worldZ = -0.5)
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(riverX, 0, -0.5);
  const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(18, 0.55, 6.2), stoneMat);
  bridgeDeck.position.y = 0.45;
  bridgeDeck.receiveShadow = true;
  bridgeDeck.castShadow = true;
  bridgeGroup.add(bridgeDeck);

  [-2.8, 2.8].forEach((bz) => {
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(18, 0.95, 0.45), carvedGraniteMat);
    parapet.position.set(0, 1.1, bz);
    parapet.castShadow = true;
    bridgeGroup.add(parapet);

    [-8.5, 0, 8.5].forEach((px) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.55, 0.75), stoneMat);
      post.position.set(px, 1.25, bz);
      bridgeGroup.add(post);
      const lantern = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
      );
      lantern.position.set(px, 2.15, bz);
      bridgeGroup.add(lantern);
    });
  });
  envGroup.add(bridgeGroup);

  // ============================================================================
  // 4. DENSE 3D EASTERN JUNGLE, TORCH-LIT TRAIL & MOSSY GRANITE BOULDERS
  // ============================================================================
  const treeTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    map: treeBarkTex.map,
    bumpMap: treeBarkTex.bumpMap,
    bumpScale: 0.16,
    roughness: 0.88,
  });
  const deepLeafMat1 = new THREE.MeshStandardMaterial({
    color: 0x14532d,
    bumpMap: mossyGraniteTex.bumpMap,
    bumpScale: 0.08,
    roughness: 0.72,
  });
  const deepLeafMat2 = new THREE.MeshStandardMaterial({
    color: 0x166534,
    bumpMap: mossyGraniteTex.bumpMap,
    bumpScale: 0.08,
    roughness: 0.68,
  });
  const bushMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    bumpMap: mossyGraniteTex.bumpMap,
    bumpScale: 0.08,
    roughness: 0.78,
  });

  const addRealisticForestTree = (tx3d: number, tz3d: number, scale: number, variant: number) => {
    const tg = new THREE.Group();
    tg.position.set(tx3d, 0, tz3d);
    tg.scale.set(scale, scale, scale);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.58, 3.8, 8),
      treeTrunkMat
    );
    trunk.position.y = 1.9;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tg.add(trunk);

    const lMat = variant % 2 === 0 ? deepLeafMat1 : deepLeafMat2;
    const mainCanopy = new THREE.Mesh(new THREE.DodecahedronGeometry(2.35, 1), lMat);
    mainCanopy.scale.set(1.15, 0.82, 1.15);
    mainCanopy.position.set(0, 4.3, 0);
    mainCanopy.castShadow = true;
    tg.add(mainCanopy);

    const upperCanopy = new THREE.Mesh(new THREE.DodecahedronGeometry(1.65, 1), lMat);
    upperCanopy.scale.set(1.1, 0.85, 1.1);
    upperCanopy.position.set(0.6, 5.3, 0.4);
    upperCanopy.castShadow = true;
    tg.add(upperCanopy);

    const lowerCanopy = new THREE.Mesh(new THREE.DodecahedronGeometry(1.75, 1), lMat);
    lowerCanopy.scale.set(1.1, 0.8, 1.1);
    lowerCanopy.position.set(-0.75, 3.8, -0.5);
    tg.add(lowerCanopy);

    envGroup.add(tg);
  };

  // Helper to check distance from any point (x2d, y2d) to the winding forest trail segments
  const isNearWindingForestPath = (px: number, py: number, clearance: number): boolean => {
    for (let s = 0; s < FOREST_PATH_WAYPOINTS_2D.length - 1; s++) {
      const a = FOREST_PATH_WAYPOINTS_2D[s];
      const b = FOREST_PATH_WAYPOINTS_2D[s + 1];
      const abx = b.x - a.x;
      const aby = b.y - a.y;
      const lenSq = abx * abx + aby * aby || 1;
      const t = Math.max(0, Math.min(1, ((px - a.x) * abx + (py - a.y) * aby) / lenSq));
      const projX = a.x + t * abx;
      const projY = a.y + t * aby;
      if (Math.hypot(px - projX, py - projY) < clearance) return true;
    }
    return false;
  };

  // Populate 280+ trees forming an ultra-deep, dense jungle from x2d = 1050 to x2d = 5150
  for (let i = 0; i < 285; i++) {
    const gx2d = 1055 + ((i * 197) % 4080);
    const rawY2d = -2150 + ((i * 353) % 3650);
    // Keep the winding secret forest trail and the Deep Forest Enemy Stronghold clearing (4350, -1150) navigable!
    if (isNearWindingForestPath(gx2d, rawY2d, 78)) continue;
    if (gx2d > 4130 && gx2d < 4580 && rawY2d > -1370 && rawY2d < -930) continue;

    const tx3d = (gx2d - 460) * 0.1;
    const tz3d = (rawY2d - 280) * 0.1;
    const sc = 0.88 + ((i * 37) % 62) * 0.01;
    addRealisticForestTree(tx3d, tz3d, sc, i);

    if (i % 3 === 0) {
      const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), mossyRockMat);
      boulder.scale.set(1.3, 0.75, 1.1);
      boulder.position.set(tx3d + 1.4, 0.35, tz3d - 1.1);
      boulder.castShadow = true;
      boulder.receiveShadow = true;
      envGroup.add(boulder);
    }
    if (i % 2 === 0) {
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 1), bushMat);
      bush.scale.set(1.25, 0.75, 1.25);
      bush.position.set(tx3d - 1.2, 0.38, tz3d + 0.9);
      envGroup.add(bush);
    }
  }

  // ============================================================================
  // 4B. 3D FOREST MAP GUIDE ARROWS (Revealed ONLY after borrowing the Map from the Old Man!)
  // ============================================================================
  const forestArrowsGroup = new THREE.Group();
  forestArrowsGroup.visible = false; // Hidden until the Old Man lends the player the Map!
  envGroup.add(forestArrowsGroup);

  const arrowGoldMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  const arrowCyanMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
  });

  for (let s = 0; s < FOREST_PATH_WAYPOINTS_2D.length - 1; s++) {
    const startPt = FOREST_PATH_WAYPOINTS_2D[s];
    const endPt = FOREST_PATH_WAYPOINTS_2D[s + 1];
    const segDx = endPt.x - startPt.x;
    const segDy = endPt.y - startPt.y;
    const segAngle = Math.atan2(segDy, segDx);
    const stepsInSeg = 3;

    for (let k = 0; k < stepsInSeg; k++) {
      const frac = (k + 0.45) / stepsInSeg;
      const ax2d = startPt.x + segDx * frac;
      const ay2d = startPt.y + segDy * frac;
      const ax3d = (ax2d - 460) * 0.1;
      const az3d = (ay2d - 280) * 0.1;

      const arrowNode = new THREE.Group();
      arrowNode.position.set(ax3d, 0.58, az3d);
      arrowNode.rotation.y = -segAngle;

      // Glowing 3D Arrow Shaft pointing along +X in local space
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.16, 0.42), arrowGoldMat);
      shaft.position.set(-0.35, 0, 0);
      arrowNode.add(shaft);

      // Glowing 3D Arrowhead Cone pointing toward +X
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.35, 4), arrowGoldMat);
      head.rotation.z = -Math.PI / 2;
      head.rotation.x = Math.PI / 4;
      head.position.set(0.95, 0, 0);
      arrowNode.add(head);

      // Glowing Cyan Holo-Ring on the forest floor beneath each arrow
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.25, 20), arrowCyanMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.48;
      arrowNode.add(ring);

      forestArrowsGroup.add(arrowNode);
    }
  }

  // ============================================================================
  // 5. DEEP FOREST ENEMY STRONGHOLD (Hidden Deep in the NE Jungle at x2d = 4350, y2d = -1150!)
  // ============================================================================
  const campCenterX = (4350 - 460) * 0.1; // +389.0 in 3D world units
  const campCenterZ = (-1150 - 280) * 0.1; // -143.0 in 3D world units

  const campGroup = new THREE.Group();
  campGroup.position.set(campCenterX, 0, campCenterZ);
  envGroup.add(campGroup);

  // Cleared Trampled Earth Stronghold Floor
  const campGround = new THREE.Mesh(
    new THREE.CircleGeometry(21, 32),
    new THREE.MeshStandardMaterial({
      color: 0x3b2818,
      bumpMap: mossyGraniteTex.bumpMap,
      bumpScale: 0.12,
      roughness: 0.95,
    })
  );
  campGround.rotation.x = -Math.PI / 2;
  campGround.position.y = 0.04;
  campGround.receiveShadow = true;
  campGroup.add(campGround);

  // Timber Palisade Walls enclosing the Deep Forest Stronghold (with West Gate opening)
  const palisadeMat = treeTrunkMat;
  const northPalisade = new THREE.Mesh(new THREE.BoxGeometry(34, 3.0, 0.8), palisadeMat);
  northPalisade.position.set(0, 1.5, -16.5);
  northPalisade.castShadow = true;
  campGroup.add(northPalisade);

  const southPalisade = new THREE.Mesh(new THREE.BoxGeometry(34, 3.0, 0.8), palisadeMat);
  southPalisade.position.set(0, 1.5, 16.5);
  southPalisade.castShadow = true;
  campGroup.add(southPalisade);

  const eastPalisade = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.0, 33), palisadeMat);
  eastPalisade.position.set(17, 1.5, 0);
  eastPalisade.castShadow = true;
  campGroup.add(eastPalisade);

  // 4 Corner Wooden Watchtowers
  const watchtowerRoofTex = createExtreme3DPBRTextures('TERRACOTTA_ROOF', 0x7f1d1d, 2, 2);
  const watchtowerRoofMat = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d,
    map: watchtowerRoofTex.map,
    bumpMap: watchtowerRoofTex.bumpMap,
    bumpScale: 0.14,
    roughness: 0.72,
  });
  [
    [-16.5, -16.0],
    [16.5, -16.0],
    [-16.5, 16.0],
    [16.5, 16.0],
  ].forEach(([tx, tz]) => {
    const tower = new THREE.Group();
    tower.position.set(tx, 0, tz);
    const towerBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 5.4, 3.2), palisadeMat);
    towerBase.position.y = 2.7;
    towerBase.castShadow = true;
    tower.add(towerBase);

    const towerRoof = new THREE.Mesh(
      new THREE.ConeGeometry(2.8, 2.2, 4),
      watchtowerRoofMat
    );
    towerRoof.position.y = 6.5;
    towerRoof.rotation.y = Math.PI / 4;
    tower.add(towerRoof);
    campGroup.add(tower);
  });

  // 3 Enemy War Tents inside the Deep Forest Stronghold
  const warTentTex = createExtreme3DPBRTextures('ROYAL_GOLD_BROCADE', 0x7f1d1d, 3, 3);
  const warTentMat = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d,
    map: warTentTex.map,
    bumpMap: warTentTex.bumpMap,
    bumpScale: 0.09,
    roughness: 0.74,
  });
  [
    [10.5, 0, 5.2, 5.2],
    [1.5, -11.2, 4.2, 4.4],
    [1.5, 11.2, 4.2, 4.4],
  ].forEach(([tx, tz, r, h]) => {
    const tentMesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), warTentMat);
    tentMesh.position.set(tx, h / 2, tz);
    tentMesh.castShadow = true;
    tentMesh.receiveShadow = true;
    campGroup.add(tentMesh);
  });

  // Central Blazing Campfire & Firelight inside the Deep Forest Camp
  const firePit = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.25, 8, 16), mossyRockMat);
  firePit.rotation.x = Math.PI / 2;
  firePit.position.set(0, 0.2, 0);
  campGroup.add(firePit);

  const fireFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.75, 1.6, 8),
    new THREE.MeshBasicMaterial({ color: 0xf97316 })
  );
  fireFlame.position.set(0, 0.85, 0);
  campGroup.add(fireFlame);

  const enemyCampFireLight = new THREE.PointLight(0xf97316, 22, 34);
  enemyCampFireLight.position.set(0, 2.8, 0);
  campGroup.add(enemyCampFireLight);

  // ============================================================================
  // 6. REALISTIC WESTERN GHATS MOUNTAIN RIDGES ALONG THE HORIZON
  // ============================================================================
  const mountainMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    map: mossyGraniteTex.map,
    bumpMap: mossyGraniteTex.bumpMap,
    bumpScale: 0.22,
    roughness: 0.92,
    metalness: 0.04,
  });
  for (let m = 0; m < 28; m++) {
    const angle = (m / 28) * Math.PI * 2;
    const distX = 390 + (m % 3) * 35;
    const distZ = 270 + (m % 4) * 28;
    const mx = Math.cos(angle) * distX;
    const mz = Math.sin(angle) * distZ;
    const mh = 38 + ((m * 19) % 42);
    const mr = 36 + ((m * 23) % 28);
    const peak = new THREE.Mesh(new THREE.ConeGeometry(mr, mh, 7), mountainMat);
    peak.position.set(mx, mh / 2 - 2, mz);
    envGroup.add(peak);
  }

  return {
    envGroup,
    templeGroup,
    shelterGroup,
    gopuramTiers,
    forestArrowsGroup,
    templeDeityGroup,
    shelterStages,
  };
}
