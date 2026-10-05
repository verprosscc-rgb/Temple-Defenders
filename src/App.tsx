import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameScreen, Gender, TimelineType, DeviceMode } from './types/game';
import { LobbyRoom } from './components/LobbyRoom';
import { TimelineWorld } from './components/TimelineWorld';
import { createHumanRig, updateHumanRig3D } from './utils/threeModels';
import { sound } from './utils/sound';
import { Monitor, Smartphone, ArrowLeft, Maximize, RotateCcw } from 'lucide-react';

const AvatarPreview3D: React.FC<{
  gender: Gender;
  armored: boolean;
  mounted: boolean;
  closeUp: boolean;
}> = ({ gender, armored, mounted, closeUp }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = 260;
    const height = 250;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    if (closeUp && !mounted) {
      camera.position.set(0, gender === 'female' ? 1.76 : 1.82, 2.15);
      camera.lookAt(0, gender === 'female' ? 1.64 : 1.68, 0);
    } else if (mounted) {
      camera.position.set(0, 2.3, 5.2);
      camera.lookAt(0, 1.45, 0);
    } else {
      camera.position.set(0, 1.45, 3.65);
      camera.lookAt(0, 1.18, 0);
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    renderer.domElement.className = 'mx-auto block';

    const ambient = new THREE.AmbientLight(0xfff7ed, 0.95);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.45);
    keyLight.position.set(3, 6, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(
      gender === 'male' ? 0xf59e0b : 0xf43f5e,
      8,
      12
    );
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    // 3D Stone & Brass Pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.4, 0.22, 28),
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.7,
        roughness: 0.3,
      })
    );
    pedestal.position.y = -0.11;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    const rig = createHumanRig({
      gender,
      role: 'PLAYER',
      timeline: 'MEDIEVAL',
      armored,
      powerfulSword: armored,
      mounted,
    });
    // Hide the in-game "YOU" floating tag inside the start-screen anatomy showcase card
    if (rig.userData?.youTagSprite) {
      rig.userData.youTagSprite.visible = false;
    }
    scene.add(rig);

    let animId: number;
    const animate = (now: number) => {
      // facing = Math.PI / 2 makes root.rotation.y = 0 so the sculpted human face & torso look directly at the camera
      updateHumanRig3D(rig, {
        x: 460,
        z: 280,
        facing: Math.PI / 2 + Math.sin(now * 0.0011) * 0.28,
        walkCycle: armored || mounted ? now * 0.0007 : 0,
        attackAnim: 0,
        armored,
        powerfulSword: armored,
        mounted,
        stealth: false,
        activeTool: armored ? 'sword' : 'none',
        isAPose: false,
      });
      if (rig.userData?.youTagSprite) {
        rig.userData.youTagSprite.visible = false;
      }
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [gender, armored, mounted, closeUp]);

  return <div ref={containerRef} className="mx-auto" />;
};

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('DEVICE_SELECT');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('computer');
  const [gender, setGender] = useState<Gender>('male');
  const [activeTimeline, setActiveTimeline] = useState<TimelineType>('MEDIEVAL');
  const [activePodId, setActivePodId] = useState<string>('R1');
  const [squadSize, setSquadSize] = useState<number>(4);
  const [completedTimelines, setCompletedTimelines] = useState<TimelineType[]>([]);
  const [previewArmored, setPreviewArmored] = useState<boolean>(false);
  const [previewMounted, setPreviewMounted] = useState<boolean>(false);
  const [previewCloseUp, setPreviewCloseUp] = useState<boolean>(false);
  const [showLeavePopup, setShowLeavePopup] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const triggerLandscapeAdjustment = async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // Ignore fullscreen rejection if browser blocks
    }
    try {
      if (window.screen.orientation && 'lock' in window.screen.orientation) {
        await (window.screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch {
      // Ignore orientation lock rejection
    }
  };

  const handleSelectDevice = (mode: DeviceMode) => {
    setDeviceMode(mode);
    sound.playGather();
    if (mode === 'mobile') {
      triggerLandscapeAdjustment();
    }
    setScreen('GENDER_SELECT');
  };

  // Allow leaving the game via Escape key confirmation popup, or Backspace from Lobby
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (screen === 'LOBBY' || screen === 'TIMELINE')) {
        e.preventDefault();
        sound.playGather();
        setShowLeavePopup((prev) => !prev);
        return;
      }
      if (screen !== 'LOBBY') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        sound.playGather();
        setScreen('GENDER_SELECT');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen]);

  const handleSelectGender = (selected: Gender) => {
    setGender(selected);
    sound.playGather();
    setScreen('LOBBY');
  };

  const handleTeleportToTimeline = (
    timeline: TimelineType,
    podId: string,
    occupantCount: number
  ) => {
    setActiveTimeline(timeline);
    setActivePodId(podId);
    setSquadSize(occupantCount);
    setScreen('TIMELINE');
  };

  const handleCompleteTimeline = (timeline: TimelineType) => {
    setCompletedTimelines((prev) =>
      prev.includes(timeline) ? prev : [...prev, timeline]
    );
    setScreen('LOBBY');
  };

  const leaveGamePopup = showLeavePopup ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border-2 border-amber-500/70 shadow-2xl p-6 flex flex-col items-center text-center gap-5">
        <p className="font-display text-xl font-bold text-white">
          Do you want to leave the game?
        </p>
        <div className="flex items-center justify-center gap-4 w-full">
          <button
            onClick={() => {
              sound.playGather();
              setShowLeavePopup(false);
              setScreen('GENDER_SELECT');
            }}
            className="flex-1 py-2.5 px-5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Yes
          </button>
          <button
            onClick={() => {
              sound.playGather();
              setShowLeavePopup(false);
            }}
            className="flex-1 py-2.5 px-5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-bold text-sm transition-colors cursor-pointer"
          >
            No
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // 1. DEVICE SELECTION SCREEN ("Are you playing on" with "Computer" or "Mobile")
  if (screen === 'DEVICE_SELECT') {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col justify-between selection:bg-amber-500/30">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#0f1623]">
          <span className="font-display text-lg font-bold tracking-wider text-amber-400">
            Chrono Guardians
          </span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Temporal Gate System
          </span>
        </header>

        {/* Center Main Stage */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto w-full">
          <div className="text-center flex flex-col items-center gap-3.5 mb-10 max-w-xl">
            <span className="px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wider uppercase">
              Control System Setup
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Are you playing on
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md">
              Choose your platform to calibrate screen layout and unlock tailored game controls.
            </p>
          </div>

          {/* 2 Clickable Buttons: "Computer" or "Mobile" */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 w-full max-w-2xl">
            {/* Computer Button */}
            <button
              type="button"
              onClick={() => handleSelectDevice('computer')}
              className="group p-8 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950 border-2 border-slate-800 hover:border-sky-400 hover:shadow-[0_0_35px_rgba(56,189,248,0.25)] flex flex-col items-center text-center gap-5 transition-all duration-200 cursor-pointer active:scale-98"
            >
              <div className="w-20 h-20 rounded-2xl bg-sky-500/15 border-2 border-sky-400/40 flex items-center justify-center text-sky-400 group-hover:scale-110 group-hover:bg-sky-500/25 transition-transform shadow-inner">
                <Monitor className="w-10 h-10" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-display text-2xl font-bold text-white group-hover:text-sky-300 transition-colors">
                  Computer
                </span>
                <span className="text-xs text-slate-400 leading-relaxed max-w-xs">
                  Standard WASD movement controls · Mouse aim &amp; attack · Fullscreen keyboard combat
                </span>
              </div>
              <span className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-md transition-colors mt-1">
                Computer
              </span>
            </button>

            {/* Mobile Button */}
            <button
              type="button"
              onClick={() => handleSelectDevice('mobile')}
              className="group p-8 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950 border-2 border-slate-800 hover:border-amber-400 hover:shadow-[0_0_35px_rgba(245,158,11,0.25)] flex flex-col items-center text-center gap-5 transition-all duration-200 cursor-pointer active:scale-98"
            >
              <div className="w-20 h-20 rounded-2xl bg-amber-500/15 border-2 border-amber-400/40 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/25 transition-transform shadow-inner">
                <Smartphone className="w-10 h-10" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-display text-2xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  Mobile
                </span>
                <span className="text-xs text-slate-400 leading-relaxed max-w-xs">
                  Horizontal landscape adjustment · In-game virtual joystick &amp; touch action controls
                </span>
              </div>
              <span className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-colors mt-1">
                Mobile
              </span>
            </button>
          </div>
        </main>

        <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-800/80">
          Chrono Guardians · Anantha Padmanabha Swamy Temple Defense
        </footer>
      </div>
    );
  }

  // 2. LOBBY SCREEN
  if (screen === 'LOBBY') {
    return (
      <>
        {deviceMode === 'mobile' && isPortrait && (
          <div className="bg-amber-950/90 border-b border-amber-500/70 px-4 py-2 flex items-center justify-between text-xs text-amber-200 gap-2 z-30">
            <span>📱 Please hold your mobile device horizontally for optimal battle view.</span>
            <button
              onClick={triggerLandscapeAdjustment}
              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold whitespace-nowrap cursor-pointer"
            >
              Rotate / Fullscreen
            </button>
          </div>
        )}
        <LobbyRoom
          gender={gender}
          completedTimelines={completedTimelines}
          onTeleport={handleTeleportToTimeline}
          onChangeGender={() => setScreen('GENDER_SELECT')}
          deviceMode={deviceMode}
          onToggleDeviceMode={() =>
            setDeviceMode((prev) => (prev === 'computer' ? 'mobile' : 'computer'))
          }
        />
        {leaveGamePopup}
      </>
    );
  }

  // 3. TIMELINE SCREEN
  if (screen === 'TIMELINE') {
    return (
      <>
        {deviceMode === 'mobile' && isPortrait && (
          <div className="fixed top-0 inset-x-0 bg-amber-950/90 border-b border-amber-500/70 px-4 py-2 flex items-center justify-between text-xs text-amber-200 gap-2 z-50">
            <span>📱 Please hold your mobile device horizontally for optimal battle view.</span>
            <button
              onClick={triggerLandscapeAdjustment}
              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold whitespace-nowrap cursor-pointer"
            >
              Rotate / Fullscreen
            </button>
          </div>
        )}
        <TimelineWorld
          gender={gender}
          timeline={activeTimeline}
          podId={activePodId}
          squadSize={squadSize}
          onCompleteTimeline={handleCompleteTimeline}
          onReturnToLobby={() => setScreen('LOBBY')}
          deviceMode={deviceMode}
          onToggleDeviceMode={() =>
            setDeviceMode((prev) => (prev === 'computer' ? 'mobile' : 'computer'))
          }
        />
        {leaveGamePopup}
      </>
    );
  }

  // 4. GENDER SELECTION SCREEN (Choose Avatar)
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col">
      {/* Mobile Horizontal Screen Orientation Banner */}
      {deviceMode === 'mobile' && isPortrait && (
        <div className="bg-amber-950/90 border-b border-amber-500/70 px-4 py-2 flex items-center justify-between text-xs text-amber-200 gap-2 z-30">
          <span>📱 Please hold your mobile device horizontally for optimal battle view.</span>
          <button
            onClick={triggerLandscapeAdjustment}
            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold whitespace-nowrap cursor-pointer"
          >
            Rotate / Fullscreen
          </button>
        </div>
      )}

      {/* Top Bar Contract */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#0f1623]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playGather();
              setScreen('DEVICE_SELECT');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
          <span className="font-display text-lg font-bold tracking-wider text-amber-400">
            Chrono Guardians
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          <span>01. Select Avatar</span>
          <span>02. Futuristic Lobby (8 Time Machines)</span>
          <span>03. 7-Day Temple Defense</span>
          <span>04. Medieval &amp; British Rule Timelines</span>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setDeviceMode((prev) => (prev === 'computer' ? 'mobile' : 'computer'))
            }
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              deviceMode === 'mobile'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            {deviceMode === 'mobile' ? (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mode: Mobile Joystick</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span>Mode: Computer WASD</span>
              </>
            )}
          </button>
          <button
            onClick={() => setPreviewCloseUp((prev) => !prev)}
            className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            {previewCloseUp ? 'Zoom: Face Close-Up' : 'Zoom: Full Body'}
          </button>
          <button
            onClick={() => setPreviewArmored((prev) => !prev)}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            {previewArmored ? 'Preview: Full Iron Armour' : 'Preview: Starter Gear'}
          </button>
          <button
            onClick={() => setPreviewMounted((prev) => !prev)}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            {previewMounted ? 'Mount: On Ox' : 'Mount: On Foot'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1160px] w-full mx-auto px-6 py-8 flex flex-col justify-center gap-8">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2.5">
          <p className="text-xs font-medium text-amber-400 tracking-wide">
            Historical Action RPG · Anantha Padmanabha Swamy Temple Defense
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white">
            Choose Your Temporal Guardian Avatar
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Click <strong className="text-white">Male</strong> or{' '}
            <strong className="text-white">Female</strong> to set your human character
            avatar and spawn inside the futuristic containment lobby with 4
            Time Machines on either side.
          </p>
        </div>

        {/* Two Clickable Gender Cards & Prominent "Male" / "Female" Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full mx-auto">
          {/* Male Avatar Selection */}
          <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/60 transition-colors flex flex-col items-center text-center gap-4">
            <AvatarPreview3D
              gender="male"
              armored={previewArmored}
              mounted={previewMounted}
              closeUp={previewCloseUp}
            />
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-xl font-bold text-white">
                Male Guardian Avatar
              </h2>
              <p className="text-xs text-slate-400">
                Spawns with Iron Sword (20 DMG), Iron Hoe & Iron Axe · Upgrades to Full
                Iron Armour (500 HP) & Powerful Sword (50 DMG)
              </p>
            </div>
            <button
              onClick={() => handleSelectGender('male')}
              className="w-full py-3 px-6 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              Male
            </button>
          </div>

          {/* Female Avatar Selection */}
          <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-pink-500/60 transition-colors flex flex-col items-center text-center gap-4">
            <AvatarPreview3D
              gender="female"
              armored={previewArmored}
              mounted={previewMounted}
              closeUp={previewCloseUp}
            />
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-xl font-bold text-white">
                Female Guardian Avatar
              </h2>
              <p className="text-xs text-slate-400">
                Spawns with Iron Sword (20 DMG), Iron Hoe & Iron Axe · Upgrades to Full
                Iron Armour (500 HP) & Powerful Sword (50 DMG)
              </p>
            </div>
            <button
              onClick={() => handleSelectGender('female')}
              className="w-full py-3 px-6 rounded-lg bg-pink-500 hover:bg-pink-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              Female
            </button>
          </div>
        </div>

        {/* 3-Column Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-display text-sm font-bold text-amber-400">
              01. Futuristic Lobby & Pods
            </h3>
            <p className="text-slate-400 leading-relaxed">
              4 Right Time Machines teleport to{' '}
              <strong className="text-slate-200">Medieval India</strong> (Ox mounts,
              Sultanate raiders). 4 Left Time Machines teleport to{' '}
              <strong className="text-slate-200">British Rule</strong> (Horse mounts,
              Colonial soldiers). Each pod holds 2–10 players and teleports after a
              10-second countdown.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-display text-sm font-bold text-sky-400">
              02. Days 1–2: Forest Camp & NPCs
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Borrow the map from the Old Man, defeat 10 Weak Forest Guards (100 HP, 10
              DMG) with stealth & swordplay, earn Full Iron Armour, a Powerful Sword,
              Wall Materials & a Mount, sleep, then trade with the Farmer, Cook,
              Blacksmith, and Animal Owner to arm 10 Buff Villagers.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-display text-sm font-bold text-rose-400">
              03. Days 3–7: 50-Raid, Boss & Temple
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Survive the 50-soldier raid (500 HP, 20 DMG) on Days 3–4 using Curry-Rice
              (+20 HP). On Days 5–6, defeat the 5000 HP Boss and dodge his 100-DMG
              straight-line red telegraph (7s warning, 7s cooldown). Rebuild the Anantha
              Padmanabha Swamy Temple on Day 7!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
