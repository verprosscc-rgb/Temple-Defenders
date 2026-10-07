import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Gender, LobbyTraveler, TimelineType, TimePod, DeviceMode } from '../types/game';
import {
  createExtreme3DPBRTextures,
  createFriendlySpirit3D,
  createHumanRig,
  updateFriendlySpirit3D,
  updateHumanRig3D,
} from '../utils/threeModels';
import { sound } from '../utils/sound';
import { Clock, ArrowRight, ArrowLeft, Camera, Sparkles, Smartphone, Monitor } from 'lucide-react';
import { VirtualJoystick, JoystickData } from './VirtualJoystick';

interface LobbyRoomProps {
  gender: Gender;
  completedTimelines: TimelineType[];
  onTeleport: (timeline: TimelineType, podId: string, squadSize: number) => void;
  onChangeGender: () => void;
  deviceMode?: DeviceMode;
  onToggleDeviceMode?: () => void;
}

const INITIAL_PODS: TimePod[] = [
  // Left 4 Time Machines -> British Rule Timeline
  { id: 'L1', label: 'Chrono Pod L-01', side: 'left', timeline: 'BRITISH', x: 55, y: 75, width: 145, height: 95, occupants: [], countdown: null },
  { id: 'L2', label: 'Chrono Pod L-02', side: 'left', timeline: 'BRITISH', x: 55, y: 190, width: 145, height: 95, occupants: [], countdown: null },
  { id: 'L3', label: 'Chrono Pod L-03', side: 'left', timeline: 'BRITISH', x: 55, y: 305, width: 145, height: 95, occupants: [], countdown: null },
  { id: 'L4', label: 'Chrono Pod L-04', side: 'left', timeline: 'BRITISH', x: 55, y: 420, width: 145, height: 95, occupants: [], countdown: null },
  // Right 4 Time Machines -> Medieval India Timeline
  { id: 'R1', label: 'Chrono Pod R-01', side: 'right', timeline: 'MEDIEVAL', x: 680, y: 75, width: 145, height: 95, occupants: [], countdown: null },
  { id: 'R2', label: 'Chrono Pod R-02', side: 'right', timeline: 'MEDIEVAL', x: 680, y: 190, width: 145, height: 95, occupants: [], countdown: null },
  { id: 'R3', label: 'Chrono Pod R-03', side: 'right', timeline: 'MEDIEVAL', x: 680, y: 305, width: 145, height: 95, occupants: [], countdown: null },
  { id: 'R4', label: 'Chrono Pod R-04', side: 'right', timeline: 'MEDIEVAL', x: 680, y: 420, width: 145, height: 95, occupants: [], countdown: null },
];

const INITIAL_TRAVELERS: LobbyTraveler[] = [
  { id: 't1', name: 'Aarav', gender: 'male', x: 320, y: 150, targetX: 320, targetY: 150, podId: null, color: '#0ea5e9', walkCycle: 0, facing: 0 },
  { id: 't2', name: 'Meera', gender: 'female', x: 540, y: 150, targetX: 540, targetY: 150, podId: null, color: '#ec4899', walkCycle: 1, facing: Math.PI },
  { id: 't3', name: 'Vikram', gender: 'male', x: 350, y: 260, targetX: 350, targetY: 260, podId: null, color: '#14b8a6', walkCycle: 2, facing: 0 },
  { id: 't4', name: 'Ananya', gender: 'female', x: 520, y: 270, targetX: 520, targetY: 270, podId: null, color: '#f43f5e', walkCycle: 3, facing: Math.PI },
  { id: 't5', name: 'Rohan', gender: 'male', x: 360, y: 380, targetX: 360, targetY: 380, podId: null, color: '#6366f1', walkCycle: 0.5, facing: 0 },
  { id: 't6', name: 'Kavya', gender: 'female', x: 510, y: 390, targetX: 510, targetY: 390, podId: null, color: '#a855f7', walkCycle: 1.5, facing: Math.PI },
  { id: 't7', name: 'Dev', gender: 'male', x: 440, y: 180, targetX: 440, targetY: 180, podId: null, color: '#22c55e', walkCycle: 2.5, facing: 1.5 },
  { id: 't8', name: 'Priya', gender: 'female', x: 440, y: 430, targetX: 440, targetY: 430, podId: null, color: '#eab308', walkCycle: 0.8, facing: -1.5 },
  { id: 't9', name: 'Arjun', gender: 'male', x: 290, y: 310, targetX: 290, targetY: 310, podId: null, color: '#3b82f6', walkCycle: 1.2, facing: 0 },
];

export const LobbyRoom: React.FC<LobbyRoomProps> = ({
  gender,
  completedTimelines,
  onTeleport,
  onChangeGender,
  deviceMode = 'computer',
  onToggleDeviceMode,
}) => {
  const mountContainerRef = useRef<HTMLDivElement | null>(null);
  const joystickRef = useRef<JoystickData>({ x: 0, y: 0, active: false, angle: 0, distance: 0 });
  const [pods, setPods] = useState<TimePod[]>(INITIAL_PODS);
  const [activePodId, setActivePodId] = useState<string | null>(null);
  const [autoCompanionJoin, setAutoCompanionJoin] = useState<boolean>(true);
  // Camera view is locked strictly to 3rd-person behind-the-back view (no switching allowed)
  const camView = 'THIRD_PERSON' as const;
  const [selectedSlot, setSelectedSlot] = useState<number>(2);
  const selectedSlotRef = useRef<number>(2);
  const [realPlayersCount, setRealPlayersCount] = useState<number>(1);
  const [lobbyFullError, setLobbyFullError] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);

  const clientIdRef = useRef<string>(
    (() => {
      const saved = sessionStorage.getItem('chrono_guardian_player_id');
      if (saved) return saved;
      const generated = 'plr_' + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('chrono_guardian_player_id', generated);
      return generated;
    })()
  );

  const remotePlayersRef = useRef<
    Map<
      string,
      {
        id: string;
        name: string;
        gender: Gender;
        x: number;
        y: number;
        facing: number;
        walkCycle: number;
        podId: string | null;
        color: string;
      }
    >
  >(new Map());

  const camViewRef = useRef<'THIRD_PERSON'>('THIRD_PERSON');

  const playerRef = useRef({
    x: 440,
    y: 460,
    facing: -Math.PI / 2, // Facing North (-Y / -Z) into the lobby corridor so Left pods are on Left and Right pods are on Right!
    walkCycle: 0,
    targetX: null as number | null,
    targetY: null as number | null,
  });
  const keysRef = useRef<Record<string, boolean>>({});
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseXRef = useRef<number>(0);

  const travelersRef = useRef<LobbyTraveler[]>(
    INITIAL_TRAVELERS.map((t) => ({ ...t }))
  );
  const podsRef = useRef<TimePod[]>(INITIAL_PODS.map((p) => ({ ...p, occupants: [] })));
  const teleportTriggeredRef = useRef<boolean>(false);

  const threeCtxRef = useRef<{
    camera: THREE.PerspectiveCamera;
    floorPlane: THREE.Mesh;
    podMeshes: { podId: string; mesh: THREE.Object3D }[];
  } | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        playerRef.current.targetX = null;
        playerRef.current.targetY = null;
      }
      if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(k)) {
        const slotNum = k === '0' ? 10 : parseInt(k, 10);
        selectedSlotRef.current = slotNum;
        setSelectedSlot(slotNum);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const enterPodWithSquad = (podId: string, desiredCompanions: number = 2) => {
    const pod = podsRef.current.find((p) => p.id === podId);
    if (!pod) return;

    playerRef.current.targetX = pod.x + pod.width / 2 - 15;
    playerRef.current.targetY = pod.y + pod.height / 2;

    const count = Math.max(0, Math.min(9, desiredCompanions));
    travelersRef.current.forEach((t, idx) => {
      if (idx < count) {
        t.podId = podId;
        t.targetX = pod.x + 28 + (idx % 4) * 28;
        t.targetY = pod.y + 28 + Math.floor(idx / 4) * 35;
      } else if (t.podId === podId) {
        t.podId = null;
        t.targetX = 330 + ((idx * 37) % 220);
        t.targetY = 140 + ((idx * 53) % 300);
      }
    });
    sound.playGather();
  };

  const adjustPodOccupants = (podId: string, delta: number) => {
    const currentInPod = travelersRef.current.filter((t) => t.podId === podId).length;
    const nextCompanions = Math.max(0, Math.min(9, currentInPod + delta));
    enterPodWithSquad(podId, nextCompanions);
  };

  useEffect(() => {
    const container = mountContainerRef.current;
    if (!container) return;

    const width = 880;
    const height = 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03060c);
    scene.fog = new THREE.FogExp2(0x050914, 0.0065);

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.2, 400);
    camera.position.set(0, 4.5, 24);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    renderer.domElement.className = 'w-full h-auto block cursor-grab active:cursor-grabbing';

    const ambientLight = new THREE.AmbientLight(0x94a3b8, 1.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xe2e8f0, 1.85);
    keyLight.position.set(15, 38, 22);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -50;
    keyLight.shadow.camera.right = 50;
    keyLight.shadow.camera.top = 35;
    keyLight.shadow.camera.bottom = -35;
    scene.add(keyLight);

    const leftRimLight = new THREE.PointLight(0x38bdf8, 35, 55);
    leftRimLight.position.set(-32, 9, 0);
    scene.add(leftRimLight);

    const rightRimLight = new THREE.PointLight(0xf59e0b, 35, 55);
    rightRimLight.position.set(32, 9, 0);
    scene.add(rightRimLight);

    const coreLight = new THREE.PointLight(0x38bdf8, 25, 36);
    coreLight.position.set(0, 7, -6);
    scene.add(coreLight);

    // =========================================================================
    // 1. DEEP SPACE STARFIELD & ORBITAL PLANET BEYOND CHAMBER VIEWPORTS
    // =========================================================================
    const starCount = 1600;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 95 + Math.random() * 140;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) - 15;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const tint = Math.random();
      starColors[i * 3] = tint > 0.7 ? 0.75 : 0.95;
      starColors[i * 3 + 1] = tint > 0.4 ? 0.88 : 0.95;
      starColors[i * 3 + 2] = 1.0;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starField = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ size: 0.65, vertexColors: true, transparent: true, opacity: 0.9 })
    );
    scene.add(starField);

    // Distant Orbital Planet & Atmosphere Glow visible through Forward Space Viewport
    const planetGroup = new THREE.Group();
    planetGroup.position.set(0, 14, -95);
    const planetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(34, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x0c4a6e,
        emissive: 0x082f49,
        emissiveIntensity: 0.45,
        roughness: 0.65,
      })
    );
    planetGroup.add(planetMesh);
    const atmoRing = new THREE.Mesh(
      new THREE.RingGeometry(34.2, 37.5, 48),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      })
    );
    planetGroup.add(atmoRing);
    scene.add(planetGroup);

    // =========================================================================
    // 2. PROCEDURAL METALLIC SPACE CHAMBER DECK (NO SIMPLE GRID!)
    // =========================================================================
    const deckCanvas = document.createElement('canvas');
    deckCanvas.width = 1024;
    deckCanvas.height = 1024;
    const dctx = deckCanvas.getContext('2d')!;

    // Brushed dark titanium base
    dctx.fillStyle = '#0b111e';
    dctx.fillRect(0, 0, 1024, 1024);

    // Interlocking Octagonal / Hexagonal Space Hull Plates
    dctx.strokeStyle = '#1e293b';
    dctx.lineWidth = 3;
    const tileSize = 64;
    for (let y = 0; y < 1024; y += tileSize) {
      for (let x = 0; x < 1024; x += tileSize) {
        dctx.fillStyle = (x / tileSize + y / tileSize) % 2 === 0 ? '#0f172a' : '#111c33';
        dctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
        dctx.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      }
    }

    // Central Walkway Spine & Glowing Plasma Conduits feeding Left (Cyan) and Right (Amber) Pods
    dctx.fillStyle = '#162238';
    dctx.fillRect(360, 0, 304, 1024);
    dctx.strokeStyle = '#334155';
    dctx.lineWidth = 6;
    dctx.strokeRect(360, 0, 304, 1024);

    // Glowing Cyan Energy Traces to Left 4 British-Rule Pods
    dctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
    dctx.lineWidth = 5;
    [160, 380, 600, 820].forEach((py) => {
      dctx.beginPath();
      dctx.moveTo(512, 512);
      dctx.lineTo(380, py);
      dctx.lineTo(140, py);
      dctx.stroke();
    });

    // Glowing Amber Energy Traces to Right 4 Medieval-India Pods
    dctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
    dctx.lineWidth = 5;
    [160, 380, 600, 820].forEach((py) => {
      dctx.beginPath();
      dctx.moveTo(512, 512);
      dctx.lineTo(644, py);
      dctx.lineTo(884, py);
      dctx.stroke();
    });

    // Central Quantum Seal Rings on Deck
    dctx.strokeStyle = '#38bdf8';
    dctx.lineWidth = 6;
    dctx.beginPath();
    dctx.arc(512, 512, 110, 0, Math.PI * 2);
    dctx.stroke();
    dctx.strokeStyle = '#f59e0b';
    dctx.beginPath();
    dctx.arc(512, 512, 82, 0, Math.PI * 2);
    dctx.stroke();

    const deckTex = new THREE.CanvasTexture(deckCanvas);
    deckTex.colorSpace = THREE.SRGBColorSpace;
    deckTex.needsUpdate = true;

    const hullPbr = createExtreme3DPBRTextures('WOOTZ_STEEL', 0x1e293b, 4, 4);
    const floorMat = new THREE.MeshStandardMaterial({
      map: deckTex,
      bumpMap: hullPbr.bumpMap,
      bumpScale: 0.09,
      roughness: 0.3,
      metalness: 0.75,
    });
    const floorPlane = new THREE.Mesh(new THREE.PlaneGeometry(86, 52), floorMat);
    floorPlane.rotation.x = -Math.PI / 2;
    floorPlane.receiveShadow = true;
    scene.add(floorPlane);

    // =========================================================================
    // 3. VAULTED SPACE CHAMBER BULKHEADS, ARCHED RIBS & CENTRAL QUANTUM CORE
    // =========================================================================
    const hullMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      map: hullPbr.map,
      bumpMap: hullPbr.bumpMap,
      bumpScale: 0.1,
      roughness: 0.35,
      metalness: 0.82,
    });
    const darkBulkheadMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      bumpMap: hullPbr.bumpMap,
      bumpScale: 0.08,
      roughness: 0.45,
      metalness: 0.75,
    });
    const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const amberGlowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Vaulted Arched Titanium Ribs spanning the Space Chamber
    [-20, -10, 0, 10, 20].forEach((zPos, idx) => {
      const archGroup = new THREE.Group();
      archGroup.position.set(0, 0, zPos);

      // Left & Right Curved Slanted Bulkhead Pillars
      const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 12, 1.8), hullMetalMat);
      leftPillar.position.set(-42.5, 5.5, 0);
      leftPillar.rotation.z = -0.14;
      archGroup.add(leftPillar);

      const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 12, 1.8), hullMetalMat);
      rightPillar.position.set(42.5, 5.5, 0);
      rightPillar.rotation.z = 0.14;
      archGroup.add(rightPillar);

      // Overhead Vaulted Cross-Beam
      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(84, 1.2, 1.6), hullMetalMat);
      topBeam.position.set(0, 11.4, 0);
      archGroup.add(topBeam);

      // Neon Accent Light Strip along Rib
      const lightStrip = new THREE.Mesh(
        new THREE.BoxGeometry(78, 0.16, 0.3),
        idx % 2 === 0 ? cyanGlowMat : amberGlowMat
      );
      lightStrip.position.set(0, 10.75, 0);
      archGroup.add(lightStrip);

      scene.add(archGroup);
    });

    // Forward Space Viewport Window Frame (North Wall) looking out at Planet & Stars
    const northLowerWall = new THREE.Mesh(new THREE.BoxGeometry(86, 2.4, 1.6), darkBulkheadMat);
    northLowerWall.position.set(0, 1.2, -25);
    scene.add(northLowerWall);

    const northUpperWall = new THREE.Mesh(new THREE.BoxGeometry(86, 2.2, 1.6), darkBulkheadMat);
    northUpperWall.position.set(0, 10.5, -25);
    scene.add(northUpperWall);

    const viewportGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(84, 7.2),
      new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.12,
        roughness: 0.05,
        metalness: 0.1,
      })
    );
    viewportGlass.position.set(0, 6.0, -24.8);
    scene.add(viewportGlass);

    // =========================================================================
    // HUGE 3D MONUMENTAL DISCLAIMER SCREEN IN THE LOBBY CHAMBER
    // =========================================================================
    const disclaimerScreenGroup = new THREE.Group();
    disclaimerScreenGroup.position.set(0, 6.1, -22.2);

    // Heavy Titanium & Gold Bezel Frame around the Huge Screen
    const screenBacking = new THREE.Mesh(
      new THREE.BoxGeometry(38.8, 8.2, 0.45),
      darkBulkheadMat
    );
    screenBacking.position.z = -0.26;
    disclaimerScreenGroup.add(screenBacking);

    const topGoldBezel = new THREE.Mesh(
      new THREE.BoxGeometry(39.2, 0.32, 0.62),
      amberGlowMat
    );
    topGoldBezel.position.y = 4.1;
    disclaimerScreenGroup.add(topGoldBezel);

    const bottomGoldBezel = new THREE.Mesh(
      new THREE.BoxGeometry(39.2, 0.32, 0.62),
      amberGlowMat
    );
    bottomGoldBezel.position.y = -4.1;
    disclaimerScreenGroup.add(bottomGoldBezel);

    [-19.4, 19.4].forEach((sx) => {
      const sideBezel = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 8.5, 0.62),
        cyanGlowMat
      );
      sideBezel.position.x = sx;
      disclaimerScreenGroup.add(sideBezel);
    });

    // High-Resolution Canvas Texture for the Huge Lobby Disclaimer Screen
    const discCanvas = document.createElement('canvas');
    discCanvas.width = 2048;
    discCanvas.height = 440;
    const dScreenCtx = discCanvas.getContext('2d')!;

    // Deep illuminated cyber-obsidian screen background
    const bgGrad = dScreenCtx.createLinearGradient(0, 0, 0, 440);
    bgGrad.addColorStop(0, '#071124');
    bgGrad.addColorStop(0.5, '#0b1933');
    bgGrad.addColorStop(1, '#071124');
    dScreenCtx.fillStyle = bgGrad;
    dScreenCtx.fillRect(0, 0, 2048, 440);

    // Glowing inner border
    dScreenCtx.strokeStyle = '#fbbf24';
    dScreenCtx.lineWidth = 10;
    dScreenCtx.strokeRect(18, 18, 2012, 404);

    // Bold Header Line
    dScreenCtx.textAlign = 'center';
    dScreenCtx.fillStyle = '#fbbf24';
    dScreenCtx.font = '900 54px "Plus Jakarta Sans", sans-serif';
    dScreenCtx.fillText(
      'DISCLAIMER: THIS GAME IS NOT AN ACT OF CRITISIZING ANY RELIGION',
      1024,
      185
    );

    dScreenCtx.fillStyle = '#ffffff';
    dScreenCtx.font = '900 50px "Plus Jakarta Sans", sans-serif';
    dScreenCtx.fillText(
      'BUT IS RATHER A WAY FOR PLAYERS TO UNDERSTAND THE LIVES OF MEDIEVAL INDIANS',
      1024,
      295
    );

    const discScreenTex = new THREE.CanvasTexture(discCanvas);
    discScreenTex.colorSpace = THREE.SRGBColorSpace;
    discScreenTex.needsUpdate = true;

    const discScreenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(38.0, 7.8),
      new THREE.MeshBasicMaterial({
        map: discScreenTex,
      })
    );
    discScreenMesh.position.z = 0.02;
    disclaimerScreenGroup.add(discScreenMesh);
    scene.add(disclaimerScreenGroup);

    // South, West & East Sealed Space Chamber Bulkheads with Glowing Conduit Strips
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(86, 4.5, 1.6), darkBulkheadMat);
    southWall.position.set(0, 2.25, 25);
    scene.add(southWall);

    const westWall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 8.5, 50), darkBulkheadMat);
    westWall.position.set(-43, 4.25, 0);
    scene.add(westWall);

    const westGlowBar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 48), cyanGlowMat);
    westGlowBar.position.set(-42.1, 4.2, 0);
    scene.add(westGlowBar);

    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 8.5, 50), darkBulkheadMat);
    eastWall.position.set(43, 4.25, 0);
    scene.add(eastWall);

    const eastGlowBar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 48), amberGlowMat);
    eastGlowBar.position.set(42.1, 4.2, 0);
    scene.add(eastGlowBar);

    // Central Orbital Quantum Chrono-Core Pedestal & Rotating Gyroscope Rings
    const chronoCoreGroup = new THREE.Group();
    chronoCoreGroup.position.set(0, 0, -4.5);
    const corePedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 3.1, 0.65, 24),
      hullMetalMat
    );
    corePedestal.position.y = 0.32;
    chronoCoreGroup.add(corePedestal);

    const coreColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 11.2, 16),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
      })
    );
    coreColumn.position.y = 5.6;
    chronoCoreGroup.add(coreColumn);

    const gyroRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.12, 12, 36),
      cyanGlowMat
    );
    gyroRing1.position.y = 4.2;
    chronoCoreGroup.add(gyroRing1);

    const gyroRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.65, 0.1, 12, 36),
      amberGlowMat
    );
    gyroRing2.position.y = 4.2;
    chronoCoreGroup.add(gyroRing2);
    scene.add(chronoCoreGroup);

    // =========================================================================
    // MONUMENTAL 3D PROMO BILLBOARD IN THE MIDDLE OF THE LOBBY
    // "TIRED OF THE UNREALISTIC GAME? TEMPLE DEFENDERS WILL BE MORE REALISTIC SOON"
    // =========================================================================
    const promoBillboardGroup = new THREE.Group();
    // Positioned right in the middle of the lobby above the central floor (x: 0, z: -4.5)
    promoBillboardGroup.position.set(0, 5.8, -4.5);

    const promoTexLoader = new THREE.TextureLoader();
    const promoTex = promoTexLoader.load('/temple_defenders_banner.jpg');
    promoTex.colorSpace = THREE.SRGBColorSpace;

    // Heavy Titanium & Dark Bulkhead Frame
    const promoFrame = new THREE.Mesh(
      new THREE.BoxGeometry(11.4, 7.8, 0.4),
      darkBulkheadMat
    );
    promoBillboardGroup.add(promoFrame);

    // Glowing Golden Cyber Bezel
    const promoBezel = new THREE.Mesh(
      new THREE.BoxGeometry(11.6, 8.0, 0.25),
      amberGlowMat
    );
    promoBezel.position.z = -0.05;
    promoBillboardGroup.add(promoBezel);

    // Front-Facing High-Res Promo Image
    const promoMeshFront = new THREE.Mesh(
      new THREE.PlaneGeometry(11.0, 7.4),
      new THREE.MeshStandardMaterial({
        map: promoTex,
        roughness: 0.2,
        metalness: 0.1,
        emissive: new THREE.Color(0xffffff),
        emissiveMap: promoTex,
        emissiveIntensity: 0.35,
      })
    );
    promoMeshFront.position.z = 0.22;
    promoBillboardGroup.add(promoMeshFront);

    // Back-Facing High-Res Promo Image (visible from both ends of the central corridor)
    const promoMeshBack = new THREE.Mesh(
      new THREE.PlaneGeometry(11.0, 7.4),
      new THREE.MeshStandardMaterial({
        map: promoTex,
        roughness: 0.2,
        metalness: 0.1,
        emissive: new THREE.Color(0xffffff),
        emissiveMap: promoTex,
        emissiveIntensity: 0.35,
      })
    );
    promoMeshBack.position.z = -0.22;
    promoMeshBack.rotation.y = Math.PI;
    promoBillboardGroup.add(promoMeshBack);

    // Titanium Support Pylons anchoring the billboard to the floor
    [-5.2, 5.2].forEach((px) => {
      const pylon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 5.8, 12),
        hullMetalMat
      );
      pylon.position.set(px, -2.9, 0);
      promoBillboardGroup.add(pylon);
    });

    scene.add(promoBillboardGroup);

    // =========================================================================
    // 4. 8 FUTURISTIC CYLINDRICAL TIME MACHINE STASIS PODS (L1–L4 & R1–R4)
    // =========================================================================
    const pod3DMap: Record<
      string,
      { group: THREE.Group; ring: THREE.Mesh; glass: THREE.Mesh }
    > = {};
    const podMeshes: { podId: string; mesh: THREE.Object3D }[] = [];

    podsRef.current.forEach((pod) => {
      const pGroup = new THREE.Group();
      const cx = (pod.x + pod.width / 2 - 460) * 0.1;
      const cz = (pod.y + pod.height / 2 - 280) * 0.1;
      pGroup.position.set(cx, 0, cz);

      const accentColor = pod.side === 'right' ? 0xf59e0b : 0x38bdf8;
      const accentMat = new THREE.MeshBasicMaterial({ color: accentColor });

      // Octagonal Heavy Stasis Platform Base
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(5.2, 5.8, 0.42, 8),
        hullMetalMat
      );
      base.position.y = 0.21;
      base.receiveShadow = true;
      pGroup.add(base);

      // Glowing Floor Docking Pad Ring
      const floorRing = new THREE.Mesh(
        new THREE.RingGeometry(4.1, 4.6, 32),
        accentMat
      );
      floorRing.rotation.x = -Math.PI / 2;
      floorRing.position.y = 0.44;
      pGroup.add(floorRing);

      // Upper Stasis Emitter Crown
      const crown = new THREE.Mesh(
        new THREE.CylinderGeometry(5.4, 4.8, 0.55, 8),
        hullMetalMat
      );
      crown.position.y = 4.45;
      pGroup.add(crown);

      // 4 Vertical Quantum Plasma Pylons around the Time Machine Chamber
      [
        [-3.8, -3.2],
        [3.8, -3.2],
        [-3.8, 3.2],
        [3.8, 3.2],
      ].forEach(([px, pz]) => {
        const pylon = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 4.1, 8),
          hullMetalMat
        );
        pylon.position.set(px, 2.3, pz);
        pGroup.add(pylon);

        const emitterStrip = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, 3.8, 8),
          accentMat
        );
        emitterStrip.position.set(px * 0.92, 2.3, pz * 0.92);
        pGroup.add(emitterStrip);
      });

      // Cylindrical Energy Containment Field Glass
      const glass = new THREE.Mesh(
        new THREE.CylinderGeometry(4.4, 4.4, 3.9, 24),
        new THREE.MeshPhysicalMaterial({
          color: accentColor,
          transparent: true,
          opacity: 0.18,
          roughness: 0.08,
          transmission: 0.55,
        })
      );
      glass.position.y = 2.35;
      pGroup.add(glass);

      // Levitating Quantum Resonance Torus Ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(3.7, 0.15, 12, 36),
        accentMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.8;
      pGroup.add(ring);

      scene.add(pGroup);
      pod3DMap[pod.id] = { group: pGroup, ring, glass };
      podMeshes.push({ podId: pod.id, mesh: glass });
    });

    const playerRig = createHumanRig({
      gender,
      role: 'PLAYER',
      timeline: 'MEDIEVAL',
      armored: false,
      powerfulSword: false,
      mounted: false,
    });
    scene.add(playerRig);

    // 3D Friendly Guardian Spirit (ONLY added to local scene — visible only to this player!)
    const friendlySpirit = createFriendlySpirit3D(true);
    friendlySpirit.position.set(
      (playerRef.current.x - 460) * 0.1 + 1.8,
      0,
      (playerRef.current.y - 280) * 0.1 - 1.5
    );
    scene.add(friendlySpirit);

    const travelerRigs: Record<string, THREE.Group> = {};
    travelersRef.current.forEach((t) => {
      const hex = parseInt(t.color.replace('#', '0x'), 16);
      const rig = createHumanRig({
        gender: t.gender,
        role: 'ALLY',
        timeline: 'MEDIEVAL',
        primaryColor: hex,
        armored: false,
        playerName: t.name,
      });
      scene.add(rig);
      travelerRigs[t.id] = rig;
    });

    // Dynamic 3D Rigs for Real Connected Multiplayer Players (up to 80 players in lobby)
    const remotePlayerRigs = new Map<string, THREE.Group>();

    // Connect to Real-Time Multiplayer WebSocket Server (/ws) + HTTP fallback
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;
    let isUnmounted = false;

    const handleServerPlayersList = (
      serverPlayers: {
        id: string;
        name: string;
        gender: Gender;
        x: number;
        y: number;
        facing: number;
        walkCycle: number;
        podId: string | null;
        color: string;
      }[]
    ) => {
      const nextMap = new Map<
        string,
        {
          id: string;
          name: string;
          gender: Gender;
          x: number;
          y: number;
          facing: number;
          walkCycle: number;
          podId: string | null;
          color: string;
        }
      >();

      serverPlayers.forEach((sp) => {
        if (sp.id !== clientIdRef.current) {
          nextMap.set(sp.id, sp);
        }
      });

      remotePlayersRef.current = nextMap;
      setRealPlayersCount(Math.min(80, Math.max(1, serverPlayers.length)));
    };

    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        if (isUnmounted || !ws) return;
        ws.send(
          JSON.stringify({
            type: 'player:join',
            id: clientIdRef.current,
            name: `Player-${clientIdRef.current.slice(-4).toUpperCase()}`,
            gender,
            x: playerRef.current.x,
            y: playerRef.current.y,
            facing: playerRef.current.facing,
            walkCycle: playerRef.current.walkCycle,
            podId: null,
          })
        );
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'lobby:state' && Array.isArray(data.players)) {
            setLobbyFullError(null);
            handleServerPlayersList(data.players);
          } else if (data.type === 'lobby:full') {
            setLobbyFullError(data.message || 'Lobby is at 80/80 player capacity.');
          }
        } catch {
          // Ignore invalid JSON
        }
      };
    } catch {
      // Fallback handled by periodic HTTP sync below
    }

    const syncInterval = window.setInterval(() => {
      const p = playerRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'player:update',
            id: clientIdRef.current,
            name: `Player-${clientIdRef.current.slice(-4).toUpperCase()}`,
            gender,
            x: p.x,
            y: p.y,
            facing: p.facing,
            walkCycle: p.walkCycle,
            podId: null,
          })
        );
      } else {
        fetch('/api/lobby/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: clientIdRef.current,
            name: `Player-${clientIdRef.current.slice(-4).toUpperCase()}`,
            gender,
            x: p.x,
            y: p.y,
            facing: p.facing,
            walkCycle: p.walkCycle,
            podId: null,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data && Array.isArray(data.players)) {
              handleServerPlayersList(data.players);
            }
          })
          .catch(() => {});
      }
    }, 150);

    threeCtxRef.current = { camera, floorPlane, podMeshes };

    let animationFrameId: number;
    let lastTime = performance.now();

    const update = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      gyroRing1.rotation.x = now * 0.0012;
      gyroRing1.rotation.y = now * 0.0018;
      gyroRing2.rotation.y = -now * 0.0022;
      gyroRing2.rotation.z = now * 0.0015;

      const p = playerRef.current;
      const keys = keysRef.current;

      // TRUE 3RD-PERSON CAMERA-RELATIVE MOVEMENT:
      // W / Up: Move Forward along p.facing
      // S / Down: Move Backward along p.facing
      // A / Left: Turn Left (rotates player & 3rd-person camera left)
      // D / Right: Turn Right (rotates player & 3rd-person camera right)
      // Q / E: Strafe Left / Right perpendicular to p.facing
      const turnSpeed = 2.4;
      if (keys['a'] || keys['arrowleft']) {
        p.facing -= turnSpeed * dt;
      }
      if (keys['d'] || keys['arrowright']) {
        p.facing += turnSpeed * dt;
      }

      let moveForward = 0;
      let moveStrafe = 0;
      if (keys['w'] || keys['arrowup']) moveForward += 1;
      if (keys['s'] || keys['arrowdown']) moveForward -= 1;
      if (keys['q']) moveStrafe -= 1;
      if (keys['e']) moveStrafe += 1;

      // In-game Virtual Joystick support (Mobile Controls)
      if (joystickRef.current && joystickRef.current.active) {
        const joy = joystickRef.current;
        moveForward += joy.y;
        p.facing += joy.x * turnSpeed * dt * 1.35;
      }

      const speed = 125;
      if (moveForward !== 0 || moveStrafe !== 0) {
        const fwdX = Math.cos(p.facing);
        const fwdY = Math.sin(p.facing);
        const rightX = -Math.sin(p.facing);
        const rightY = Math.cos(p.facing);

        const vx = fwdX * moveForward + rightX * moveStrafe;
        const vy = fwdY * moveForward + rightY * moveStrafe;
        const len = Math.hypot(vx, vy) || 1;

        p.x += (vx / len) * speed * dt;
        p.y += (vy / len) * speed * dt;
        p.walkCycle += dt * 2.2;
      } else if (p.targetX !== null && p.targetY !== null) {
        const tdx = p.targetX - p.x;
        const tdy = p.targetY - p.y;
        const dist = Math.hypot(tdx, tdy);
        if (dist > 5) {
          p.x += (tdx / dist) * speed * dt;
          p.y += (tdy / dist) * speed * dt;
          // Smoothly rotate facing toward target
          const targetAngle = Math.atan2(tdy, tdx);
          const diff = Math.atan2(
            Math.sin(targetAngle - p.facing),
            Math.cos(targetAngle - p.facing)
          );
          p.facing += diff * Math.min(1, dt * 8);
          p.walkCycle += dt * 2.2;
        } else {
          p.targetX = null;
          p.targetY = null;
        }
      }

      p.x = Math.max(55, Math.min(825, p.x));
      p.y = Math.max(70, Math.min(510, p.y));

      // Solid collision with the Central Quantum Chrono-Core Pedestal (at x2d=460, y2d=235)
      const coreDx = p.x - 460;
      const coreDy = p.y - 235;
      const coreDist = Math.hypot(coreDx, coreDy);
      if (coreDist < 36) {
        const pushAngle = Math.atan2(coreDy, coreDx);
        p.x = 460 + Math.cos(pushAngle) * 36;
        p.y = 235 + Math.sin(pushAngle) * 36;
      }

      let playerPod: TimePod | null = null;
      for (const pod of podsRef.current) {
        if (
          p.x >= pod.x &&
          p.x <= pod.x + pod.width &&
          p.y >= pod.y &&
          p.y <= pod.y + pod.height
        ) {
          playerPod = pod;
          break;
        }
      }

      // Bots should spawn in a lobby ONLY when there is only 1 real player!
      const isOnlyOneRealPlayer = remotePlayersRef.current.size === 0;

      if (isOnlyOneRealPlayer) {
        if (playerPod && autoCompanionJoin) {
          const assignedToPlayerPod = travelersRef.current.filter(
            (t) => t.podId === playerPod!.id
          );
          if (assignedToPlayerPod.length === 0) {
            travelersRef.current.slice(0, 2).forEach((t, idx) => {
              t.podId = playerPod!.id;
              t.targetX = playerPod!.x + 35 + idx * 45;
              t.targetY = playerPod!.y + 32;
            });
          }
        }

        travelersRef.current.forEach((t) => {
          const tdx = t.targetX - t.x;
          const tdy = t.targetY - t.y;
          const dist = Math.hypot(tdx, tdy);
          if (dist > 3) {
            t.x += (tdx / dist) * 165 * dt;
            t.y += (tdy / dist) * 165 * dt;
            t.facing = Math.atan2(tdy, tdx);
            t.walkCycle += dt * 2.8;
          }
          const rig = travelerRigs[t.id];
          if (rig) {
            rig.visible = true;
            updateHumanRig3D(rig, {
              x: t.x,
              z: t.y,
              facing: t.facing,
              walkCycle: t.walkCycle,
              attackAnim: 0,
              armored: false,
              powerfulSword: false,
              mounted: false,
              stealth: false,
              activeTool: 'sword',
            });
          }
        });
      } else {
        // More than 1 real player: Bots despawn completely from lobby and pods!
        travelersRef.current.forEach((t) => {
          t.podId = null;
          const rig = travelerRigs[t.id];
          if (rig) {
            rig.visible = false;
          }
        });
      }

      // Update 3D Rigs for Real Connected Multiplayer Players (up to 80 in Lobby)
      const activeRemoteIds = new Set<string>();
      for (const [remId, remPlayer] of remotePlayersRef.current.entries()) {
        activeRemoteIds.add(remId);
        let rRig = remotePlayerRigs.get(remId);
        if (!rRig) {
          const hex = parseInt((remPlayer.color || '#38bdf8').replace('#', '0x'), 16);
          rRig = createHumanRig({
            gender: remPlayer.gender,
            role: 'ALLY',
            timeline: 'MEDIEVAL',
            primaryColor: hex,
            armored: false,
            playerName: remPlayer.name,
          });
          scene.add(rRig);
          remotePlayerRigs.set(remId, rRig);
        }
        updateHumanRig3D(rRig, {
          x: remPlayer.x,
          z: remPlayer.y,
          facing: remPlayer.facing,
          walkCycle: remPlayer.walkCycle,
          attackAnim: 0,
          armored: false,
          powerfulSword: false,
          mounted: false,
          stealth: false,
          activeTool: 'sword',
        });
      }

      for (const [oldId, oldRig] of remotePlayerRigs.entries()) {
        if (!activeRemoteIds.has(oldId)) {
          scene.remove(oldRig);
          remotePlayerRigs.delete(oldId);
        }
      }

      updateHumanRig3D(playerRig, {
        x: p.x,
        z: p.y,
        facing: p.facing,
        walkCycle: p.walkCycle,
        attackAnim: 0,
        armored: false,
        powerfulSword: false,
        mounted: false,
        stealth: false,
        activeTool:
          selectedSlotRef.current === 1
            ? 'axe'
            : selectedSlotRef.current === 3
            ? 'hoe'
            : 'sword',
      });

      // Update Local Player's 3D Friendly Spirit Companion (Only visible to you!)
      updateFriendlySpirit3D(friendlySpirit, p.x, p.y, p.facing, now);

      // 3rd-Person Behind-the-Back Chase Camera vs Overview Camera
      const px3d = (p.x - 460) * 0.1;
      const pz3d = (p.y - 280) * 0.1;
      const fwdX3d = Math.cos(p.facing);
      const fwdZ3d = Math.sin(p.facing);

      if (camViewRef.current === 'THIRD_PERSON') {
        const camDist = 5.2;
        const camHeight = 2.9;
        const desiredCam = new THREE.Vector3(
          px3d - fwdX3d * camDist,
          camHeight,
          pz3d - fwdZ3d * camDist
        );
        camera.position.lerp(desiredCam, 0.14);
        camera.lookAt(px3d + fwdX3d * 5.5, 1.75, pz3d + fwdZ3d * 5.5);
      } else {
        camera.position.lerp(new THREE.Vector3(0, 48, 44), 0.08);
        camera.lookAt(0, 0, 2);
      }

      const currentActiveId: string | null = playerPod ? playerPod.id : null;

      podsRef.current.forEach((pod) => {
        const occ: { id: string; name: string; gender: Gender; isPlayer?: boolean }[] = [];
        if (
          p.x >= pod.x &&
          p.x <= pod.x + pod.width &&
          p.y >= pod.y &&
          p.y <= pod.y + pod.height
        ) {
          occ.push({ id: 'player', name: 'You', gender, isPlayer: true });
        }

        // Count Real Multiplayer Players inside this Time Machine Pod
        for (const [, rem] of remotePlayersRef.current.entries()) {
          if (
            rem.x >= pod.x &&
            rem.x <= pod.x + pod.width &&
            rem.y >= pod.y &&
            rem.y <= pod.y + pod.height &&
            occ.length < 10
          ) {
            occ.push({ id: rem.id, name: rem.name, gender: rem.gender });
          }
        }

        // Only count bot travelers in pod occupants if there is only 1 real player in the lobby!
        if (isOnlyOneRealPlayer) {
          travelersRef.current.forEach((t) => {
            if (
              t.x >= pod.x &&
              t.x <= pod.x + pod.width &&
              t.y >= pod.y &&
              t.y <= pod.y + pod.height &&
              occ.length < 10
            ) {
              occ.push({ id: t.id, name: t.name, gender: t.gender });
            }
          });
        }

        pod.occupants = occ;

        const pod3d = pod3DMap[pod.id];
        if (occ.length >= 2 && occ.length <= 10) {
          if (pod3d) {
            pod3d.ring.position.y = 0.6 + Math.sin(now * 0.008) * 1.2;
            (pod3d.glass.material as THREE.MeshPhysicalMaterial).opacity = 0.32;
          }
          if (pod.countdown === null) {
            pod.countdown = 10.0;
          } else {
            pod.countdown = Math.max(0, pod.countdown - dt);
            if (
              pod.countdown <= 0 &&
              occ.some((o) => o.isPlayer) &&
              !teleportTriggeredRef.current
            ) {
              teleportTriggeredRef.current = true;
              sound.playTeleport();
              onTeleport(pod.timeline, pod.id, occ.length);
            }
          }
        } else {
          pod.countdown = null;
          if (pod3d) {
            pod3d.ring.position.y = 0.4;
            (pod3d.glass.material as THREE.MeshPhysicalMaterial).opacity = 0.15;
          }
        }
      });

      setActivePodId(currentActiveId);
      setPods(podsRef.current.map((pod) => ({ ...pod, occupants: [...pod.occupants] })));

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => {
      isUnmounted = true;
      window.clearInterval(syncInterval);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'player:leave' }));
        ws.close();
      }
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [gender, autoCompanionJoin, onTeleport]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMouseXRef.current;
    lastMouseXRef.current = e.clientX;
    playerRef.current.facing += deltaX * 0.007;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleViewportClick = () => {
    // Clicking does not make the player move — use W/A/S/D to walk into any Time Machine Pod!
  };

  const activePod = pods.find((p) => p.id === activePodId);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col">
      {/* Top Bar Contract */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800/80 bg-[#0f1623]">
        <div className="flex items-center gap-3">
          <button
            onClick={onChangeGender}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm active:scale-95"
            title="Go back to Avatar Select"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
          <span className="font-display text-lg font-bold tracking-wider text-amber-400">
            Chrono Guardians
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-300">
          <span className="text-emerald-400 font-mono-num font-bold">
            Lobby: {realPlayersCount} / 80 Real Players {realPlayersCount === 1 ? '(Bots Active)' : '(Real Players Only)'}
          </span>
          <span>·</span>
          <span>Avatar: {gender === 'male' ? 'Male Guardian' : 'Female Guardian'}</span>
          <span>·</span>
          <span>Pod Capacity: Min 2 / Max 10</span>
          <span>·</span>
          <span>Timelines Cleared: {completedTimelines.length}/2</span>
        </nav>
        <div className="flex items-center gap-2.5">
          {onToggleDeviceMode && (
            <button
              onClick={onToggleDeviceMode}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                deviceMode === 'mobile'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {deviceMode === 'mobile' ? (
                <>
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mode: Mobile (Joystick)</span>
                </>
              ) : (
                <>
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Mode: Computer (WASD)</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setCopiedInvite(true);
              setTimeout(() => setCopiedInvite(false), 2500);
            }}
            className="px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 rounded-md transition-colors whitespace-nowrap"
          >
            {copiedInvite ? 'Copied Lobby Link!' : 'Invite Real Players (Max 80)'}
          </button>
          <button
            onClick={onChangeGender}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap"
          >
            Switch Avatar ({gender === 'male' ? 'Male' : 'Female'}) [Backspace]
          </button>
        </div>
      </header>
      {lobbyFullError && (
        <div className="bg-rose-950/90 border-b border-rose-500/50 px-6 py-2 text-xs text-rose-200 text-center font-medium">
          {lobbyFullError}
        </div>
      )}

      {/* HUGE LOBBY DISCLAIMER SCREEN */}
      <div className="bg-gradient-to-r from-slate-950 via-amber-950/60 to-slate-950 border-b-2 border-amber-400/80 px-6 py-4 shadow-xl">
        <div className="max-w-[1400px] mx-auto rounded-xl bg-slate-950/95 border-2 border-amber-400 px-6 py-4 text-center shadow-2xl">
          <p className="font-display text-base sm:text-xl md:text-2xl font-extrabold tracking-wide text-amber-300 leading-snug">
            DISCLAIMER: THIS GAME IS NOT AN ACT OF CRITISIZING ANY RELIGION BUT IS RATHER A WAY FOR PLAYERS TO UNDERSTAND THE LIVES OF MEDIEVAL INDIANS
          </p>
        </div>
      </div>

      {/* FEATURED BANNER IN THE MIDDLE OF THE LOBBY */}
      <div className="bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 border-b border-amber-500/40 px-6 py-3 flex justify-center">
        <div className="max-w-[680px] w-full rounded-2xl overflow-hidden border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.35)] bg-slate-950 flex flex-col items-center">
          <img
            src="/temple_defenders_banner.jpg"
            alt="Tired of the unrealistic game? Temple Defenders will be more realistic soon"
            className="w-full h-auto object-contain block max-h-[260px] sm:max-h-[320px]"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Friendly Spirit Companion Message Banner (Only Visible to Respective Player) */}
      <div className="bg-sky-950/75 border-b border-sky-500/40 px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-1.5">
          <div className="flex items-start gap-2.5 text-xs text-sky-100 leading-relaxed">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 uppercase tracking-wider mr-2">
                Friendly Spirit (Only Visible To You):
              </span>
              <span className="text-white font-medium">
                &ldquo;Welcome warrior, Hindu temples were raided and looted in the ancient
                times. And you, are the chosen one to protect them. Go back in time to protect
                the Hindu temples from raiders. I will help you in the gameplay.&rdquo;
              </span>
            </div>
          </div>
          <div className="pl-6 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
            <span className="text-amber-300 font-semibold">
              → Step on the <strong className="text-white">Right Time Machines (R1–R4)</strong>:{' '}
              You go to the <strong className="text-amber-400">Medieval India Timeline</strong>{' '}
              (Defend against Medieval Dynasty Raiders &amp; ride Oxen).
            </span>
            <span className="text-sky-300 font-semibold">
              ← Step on the <strong className="text-white">Left Time Machines (L1–L4)</strong>:{' '}
              You go to the <strong className="text-sky-400">British Rule Timeline</strong>{' '}
              (Defend against Colonial British Soldiers &amp; ride Horses).
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleViewportClick}
            className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#070b14] shadow-xl"
          >
            <div ref={mountContainerRef} className="w-full" />

            {/* Compact Corner Badges (Never block the 3D center screen!) */}
            <div className="pointer-events-none absolute inset-x-3 top-2.5 flex justify-between gap-2 text-[11px] font-semibold">
              <div className="px-2.5 py-1 rounded bg-slate-950/80 border border-sky-400/50 text-sky-300">
                ← Left Time Machines (L1–L4): <strong className="text-white">British Rule Timeline</strong>
              </div>
              <div className="px-2.5 py-1 rounded bg-slate-950/80 border border-amber-400/50 text-amber-300">
                Right Time Machines (R1–R4): <strong className="text-white">Medieval India Timeline</strong> →
              </div>
            </div>

            {/* 10 Inventory Slots on the Bottom Middle Area of the Game Screen (1st 3: Axe, Sword, Hoe) */}
            <div className="absolute inset-x-0 bottom-2.5 flex justify-center px-3 pointer-events-auto">
              <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/95 border-2 border-slate-700/90 shadow-2xl flex items-center gap-1.5">
                {[
                  { slot: 1, name: 'Axe', sub: '1 Click=1 Log', icon: '🪓', filled: true },
                  { slot: 2, name: 'Sword', sub: '20 DMG', icon: '⚔️', filled: true },
                  { slot: 3, name: 'Hoe', sub: '1 Sq/Click', icon: '⛏️', filled: true },
                  { slot: 4, name: 'Empty', sub: '', icon: '', filled: false },
                  { slot: 5, name: 'Empty', sub: '', icon: '', filled: false },
                  { slot: 6, name: 'Empty', sub: '', icon: '', filled: false },
                  { slot: 7, name: 'Empty', sub: '', icon: '', filled: false },
                  { slot: 8, name: 'Empty', sub: '', icon: '', filled: false },
                  { slot: 9, name: 'Empty', sub: '', icon: '', filled: false },
                  { slot: 10, name: 'Empty', sub: '', icon: '', filled: false },
                ].map((item) => (
                  <button
                    key={item.slot}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectedSlotRef.current = item.slot;
                      setSelectedSlot(item.slot);
                    }}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg border flex flex-col items-center justify-center relative transition-all cursor-pointer select-none ${
                      selectedSlot === item.slot
                        ? 'bg-amber-500/25 border-2 border-amber-400 text-amber-200 shadow-lg scale-105'
                        : item.filled
                        ? 'bg-slate-900/95 border-slate-600 hover:border-slate-400 text-slate-200'
                        : 'bg-slate-900/50 border-slate-800/80 text-slate-600'
                    }`}
                  >
                    <span className="absolute top-0.5 left-1 text-[9px] font-mono-num font-bold text-slate-400">
                      {item.slot === 10 ? '0' : item.slot}
                    </span>
                    {item.filled ? (
                      <>
                        <span className="text-sm leading-none mt-1">{item.icon}</span>
                        <span className="text-[10px] font-bold text-white leading-tight mt-0.5">
                          {item.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-[9px] text-slate-600 font-mono-num">Slot {item.slot}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Virtual Joystick & Action Overlay */}
            {deviceMode === 'mobile' && (
              <>
                {/* On-Screen Virtual Joystick (Bottom Left) */}
                <div
                  className="absolute bottom-5 left-4 z-20 pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <VirtualJoystick
                    size={126}
                    knobSize={48}
                    label="MOVE / STEER"
                    onChange={(data) => {
                      joystickRef.current = data;
                    }}
                  />
                </div>

                {/* Mobile Quick Action Buttons (Bottom Right) */}
                <div
                  className="absolute bottom-5 right-4 z-20 pointer-events-auto flex flex-col items-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      // Find nearest pod or step into R1 / L1
                      const nearest =
                        pods.find(
                          (p) =>
                            Math.hypot(
                              p.x - playerRef.current.x,
                              p.y - playerRef.current.y
                            ) < 220
                        ) || pods[4];
                      enterPodWithSquad(nearest.id, 3);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xl flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
                  >
                    <span>🚀 Enter Nearest Pod</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onChangeGender}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900/95 border border-slate-700 text-white text-xs font-bold shadow-lg active:scale-95 transition-transform cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Go Back</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              {deviceMode === 'mobile' ? (
                <span>
                  <strong className="text-amber-300">📱 Mobile Joystick Controls:</strong>{' '}
                  Use the <strong className="text-white">On-Screen Virtual Joystick</strong> (bottom-left) to run forward/backward &amp; steer left/right ·{' '}
                  Tap <strong className="text-white">🚀 Enter Nearest Pod</strong> or touch any pod on screen ·{' '}
                  Hold device <strong className="text-amber-400">horizontally</strong> for optimal widescreen combat.
                </span>
              ) : (
                <span>
                  <strong className="text-amber-300">💻 3rd-Person Controls:</strong>{' '}
                  <strong className="text-white">W / S</strong> Walk Forward/Back ·{' '}
                  <strong className="text-white">A / D</strong> (or Mouse Drag) Turn Left/Right ·{' '}
                  <strong className="text-white">Q / E</strong> Strafe ·{' '}
                  <strong className="text-white">Click any Pod</strong> to enter.
                </span>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={autoCompanionJoin}
                onChange={(e) => setAutoCompanionJoin(e.target.checked)}
                className="rounded border-slate-600 text-amber-500 focus:ring-amber-500"
              />
              <span>Auto-pair with Co-op Squad (2–10 players)</span>
            </label>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-white">
                Time Machine Telemetry
              </h2>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>

            {activePod ? (
              <div className="flex flex-col gap-3 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>
                    Active Machine: <strong className="text-white">{activePod.label}</strong>
                  </span>
                  <span className="font-mono-num text-emerald-400">
                    {activePod.occupants.length} / 10 Players
                  </span>
                </div>

                <div className="text-xs text-slate-300">
                  Destination:{' '}
                  <strong
                    className={
                      activePod.timeline === 'MEDIEVAL' ? 'text-amber-400' : 'text-sky-400'
                    }
                  >
                    {activePod.timeline === 'MEDIEVAL'
                      ? 'Medieval Indian Village (Sultanate Raid Era)'
                      : 'Colonial Indian Village (British Rule Era)'}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
                  <span className="text-xs text-slate-400">
                    Adjust Pod Players (Min 2, Max 10):
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => adjustPodOccupants(activePod.id, -1)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono-num"
                    >
                      -1
                    </button>
                    <span className="px-2 text-xs font-mono-num font-semibold text-white">
                      {activePod.occupants.length}
                    </span>
                    <button
                      onClick={() => adjustPodOccupants(activePod.id, 1)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono-num"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {activePod.countdown !== null ? (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/40 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                      <span>Temporal Displacement In:</span>
                      <span className="font-mono-num text-base text-amber-400">
                        {activePod.countdown.toFixed(1)}s
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (!teleportTriggeredRef.current) {
                          teleportTriggeredRef.current = true;
                          sound.playTeleport();
                          onTeleport(
                            activePod.timeline,
                            activePod.id,
                            activePod.occupants.length
                          );
                        }
                      }}
                      className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-md transition-colors whitespace-nowrap"
                    >
                      Teleport Now (Skip Remaining Countdown)
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
                    <span>Minimum 2 players required to initiate 10s countdown.</span>
                    <button
                      onClick={() => adjustPodOccupants(activePod.id, 1)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium whitespace-nowrap ml-2"
                    >
                      Add Co-op Player
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                You are in 3rd-person view inside the sealed futuristic lobby. Walk forward (
                <strong className="text-slate-200">W</strong>) and turn (
                <strong className="text-slate-200">A / D</strong>) into any of the{' '}
                <strong className="text-slate-200">4 Right Time Machines</strong> or{' '}
                <strong className="text-slate-200">4 Left Time Machines</strong>.
              </p>
            )}
          </div>

          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-amber-400">
                Right Time Machines (R1–R4): Medieval India
              </h3>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Spawn in third-person with an{' '}
              <strong className="text-white">Iron Sword, Hoe, and Axe</strong> during the era
              of medieval temple raids. Borrow the forest map from the Old Man, defeat 10
              Camp Guards, ride <strong className="text-amber-300">Oxen</strong>, rally 10
              Buff Villagers, defeat the 50-soldier raid on Day 3–4, vanquish the Brute King
              on Day 5–6, and rebuild the{' '}
              <strong className="text-white">Anantha Padmanabha Swamy Temple</strong> on Day 7.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {['R1', 'R2', 'R3', 'R4'].map((pid) => (
                <button
                  key={pid}
                  onClick={() => enterPodWithSquad(pid, 3)}
                  className="py-2 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                >
                  Enter Pod {pid}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-sky-400">
                Left Time Machines (L1–L4): British Rule
              </h3>
              <ArrowLeft className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Teleport to a village during the period of{' '}
              <strong className="text-white">British Rule</strong>. Complete the full 7-day
              storyline with identical village NPCs and quests, facing{' '}
              <strong className="text-sky-300">
                Colonial British Soldiers & Commander
              </strong>{' '}
              and riding <strong className="text-sky-300">Horses</strong> instead of Oxen.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {['L1', 'L2', 'L3', 'L4'].map((pid) => (
                <button
                  key={pid}
                  onClick={() => enterPodWithSquad(pid, 3)}
                  className="py-2 px-3 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-200 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                >
                  Enter Pod {pid}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
