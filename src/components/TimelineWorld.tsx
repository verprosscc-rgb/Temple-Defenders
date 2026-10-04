import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  ActiveTool,
  BuffVillagerAlly,
  EnemyEntity,
  FarmPlot,
  Gender,
  Inventory,
  TimelineType,
  TreeNode,
} from '../types/game';
import {
  createExtreme3DPBRTextures,
  createFriendlySpirit3D,
  createHumanRig,
  createMount3D,
  createTempleAndVillage3D,
  FOREST_PATH_WAYPOINTS_2D,
  resolveBuildingCollisions2D,
  updateFriendlySpirit3D,
  updateHumanRig3D,
} from '../utils/threeModels';
import { sound } from '../utils/sound';
import {
  Sword,
  EyeOff,
  Utensils,
  Sparkles,
  AlertTriangle,
  Shield,
  Camera,
  Moon,
} from 'lucide-react';

interface TimelineWorldProps {
  gender: Gender;
  timeline: TimelineType;
  podId: string;
  squadSize: number;
  onCompleteTimeline: (timeline: TimelineType) => void;
  onReturnToLobby: () => void;
}

const TEMPLE_POS = { x: 165, y: 275 };
const HOUSE_POS = { x: 375, y: 95 };
const HOUSE_DOOR_OUTSIDE_POS = { x: 378, y: 152 };
const BED_POS = { x: 352, y: 82 };
const OLD_MAN_POS = { x: 475, y: 105 };
const SHELTER_SITE_POS = { x: 152, y: 380 };
const FARMER_POS = { x: 340, y: 415 };
const COOK_POS = { x: 520, y: 215 };
const ANIMAL_OWNER_POS = { x: 520, y: 330 };
const BLACKSMITH_POS = { x: 520, y: 445 };
const FOREST_CAMP_POS = { x: 4350, y: -1150 };

export const TimelineWorld: React.FC<TimelineWorldProps> = ({
  gender,
  timeline,
  podId,
  squadSize,
  onCompleteTimeline,
  onReturnToLobby,
}) => {
  const mountContainerRef = useRef<HTMLDivElement | null>(null);

  const mountName = timeline === 'MEDIEVAL' ? 'Ox' : 'Horse';
  const mountPlural = timeline === 'MEDIEVAL' ? 'Oxen' : 'Horses';
  const enemyFactionName =
    timeline === 'MEDIEVAL' ? 'Medieval Dynasty Raiders' : 'Colonial British Regiment';
  const bossTitle =
    timeline === 'MEDIEVAL'
      ? 'Sultanate Brute King (Giant Ox)'
      : 'Colonial Brute Commander (Giant Warhorse)';

  // Core 7-Day State
  const [day, setDay] = useState<number>(1);
  const [isNight, setIsNight] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'FOLLOW' | 'OVERVIEW'>('FOLLOW');
  const [statusBanner, setStatusBanner] = useState<string>(
    `Day 1: Follow your Friendly Spirit out of your house to the Old Man Next Door [E] to borrow the Ancient Forest Map!`
  );
  const [spiritBanner, setSpiritBanner] = useState<string>(
    `Friendly Spirit: "Welcome to this timeline, Chosen Warrior! Follow me out of your house to the Old Man Next Door and press [E] to borrow his Map — the enemy camp is so deep in the forest that only his map conjures glowing arrows to guide you!"`
  );
  const [nearbyPrompt, setNearbyPrompt] = useState<string | null>(null);
  const [combatToast, setCombatToast] = useState<string | null>(null);

  // Player Combat & Tool UI state
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [playerMaxHp, setPlayerMaxHp] = useState<number>(100);
  const [playerDamage, setPlayerDamage] = useState<number>(20);
  const [activeTool, setActiveTool] = useState<ActiveTool>('sword');
  const [selectedSlot, setSelectedSlot] = useState<number>(2);
  const selectedSlotRef = useRef<number>(2);
  const [stealth, setStealth] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isBlocking, setIsBlocking] = useState<boolean>(false);
  const [axeHitCount, setAxeHitCount] = useState<number>(0);
  const axeHitCountRef = useRef<number>(0);

  // Inventory & Village Progress State
  const [inventory, setInventory] = useState<Inventory>({
    ironSword: true,
    hoe: true,
    axe: true,
    hasMap: false,
    fullIronArmour: false,
    powerfulSword: false,
    wallMaterials: 0,
    personalMount: false,
    logs: 0,
    tilledPlots: 0,
    riceBags: 0,
    hayStacks: 0,
    curryRiceBowls: 0,
    mountsPool: 0,
    armourSetsPool: 0,
    stolenArtifacts: false,
  });

  const [campGuardsDefeated, setCampGuardsDefeated] = useState<number>(0);
  const [shelterBuilt, setShelterBuilt] = useState<boolean>(false);
  const [shelterBuilding, setShelterBuilding] = useState<boolean>(false);
  const [shelterProgress, setShelterProgress] = useState<number>(0);
  const [isSleepingBlackScreen, setIsSleepingBlackScreen] = useState<boolean>(false);
  const [farmerRewardClaimed, setFarmerRewardClaimed] = useState<boolean>(false);
  const [cookTraded, setCookTraded] = useState<boolean>(false);
  const [animalOwnerTraded, setAnimalOwnerTraded] = useState<boolean>(false);
  const [blacksmithTraded, setBlacksmithTraded] = useState<boolean>(false);
  const [buffVillagersArmed, setBuffVillagersArmed] = useState<number>(0);
  const [raidSoldiersDefeated, setRaidSoldiersDefeated] = useState<number>(0);
  const [templeHp, setTempleHp] = useState<number>(2000);
  const [bossHp, setBossHp] = useState<number | null>(null);
  const [bossLineStatus, setBossLineStatus] = useState<{
    state: 'COOLDOWN' | 'TELEGRAPH' | 'FIRING';
    timer: number;
  } | null>(null);
  const [bossDefeated, setBossDefeated] = useState<boolean>(false);
  const [templeRebuilt, setTempleRebuilt] = useState<boolean>(false);
  const [templeRebuilding, setTempleRebuilding] = useState<boolean>(false);
  const [templeProgress, setTempleProgress] = useState<number>(0);
  const [teleportCountdown, setTeleportCountdown] = useState<number | null>(null);

  // Player spawns INSIDE the open-interior Village House (378, 98) right beside the 3D Bed (352, 82)!
  const playerRef = useRef({
    x: 378,
    y: 98,
    facing: Math.PI / 2, // Facing South toward the open veranda doorway
    walkCycle: 0,
    attackAnim: 0,
    hp: 100,
    maxHp: 100,
    damage: 20,
    stealth: false,
    mounted: false,
    activeTool: 'sword' as ActiveTool,
    isBlocking: false,
    attackCooldown: 0,
    targetX: null as number | null,
    targetY: null as number | null,
    onArriveCallback: null as (() => void) | null,
  });

  const cameraModeRef = useRef<'FOLLOW' | 'OVERVIEW'>('FOLLOW');
  cameraModeRef.current = cameraMode;
  const cameraYawRef = useRef<number>(0);

  const isNightRef = useRef<boolean>(false);
  isNightRef.current = isNight;

  const dayRef = useRef<number>(1);
  const inventoryRef = useRef<Inventory>(inventory);

  // Helper that synchronously updates both inventoryRef and React state so stale renders NEVER overwrite items!
  const updateInventory = (updater: (prev: Inventory) => Inventory) => {
    const next = updater(inventoryRef.current);
    inventoryRef.current = next;
    setInventory(next);
  };

  // Strict One-Time Reward Latches (A player can ONLY gain each reward ONCE!)
  const mapBorrowedRef = useRef<boolean>(false);
  const day1GuardsRewardClaimedRef = useRef<boolean>(false);
  const shelterBuiltRef = useRef<boolean>(false);
  const shelterBuildingRef = useRef<boolean>(false);
  const shelterProgressRef = useRef<number>(0);
  const isSleepingRef = useRef<boolean>(false);
  const farmerRewardClaimedRef = useRef<boolean>(false);
  const cookTradedRef = useRef<boolean>(false);
  const animalOwnerTradedRef = useRef<boolean>(false);
  const blacksmithTradedRef = useRef<boolean>(false);
  const buffVillagersArmedRef = useRef<number>(0);
  const raidSoldiersDefeatedRef = useRef<number>(0);
  const bossDefeatedRef = useRef<boolean>(false);
  const hasVisitedForestDay1Ref = useRef<boolean>(false);

  const templeHpRef = useRef<number>(2000);
  const templeRebuiltRef = useRef<boolean>(false);
  const templeRebuildingRef = useRef<boolean>(false);
  const templeProgressRef = useRef<number>(0);

  const enemiesRef = useRef<EnemyEntity[]>([]);
  const raidSpawnQueueRef = useRef<number>(0);
  const raidSpawnTimerRef = useRef<number>(0);

  const villagersRef = useRef<BuffVillagerAlly[]>(
    Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Buff Villager #${i + 1}`,
      x: 255 + (i % 2) * 36,
      y: 195 + Math.floor(i / 2) * 42,
      armed: false,
      hp: 300,
      maxHp: 300,
      attackCooldown: 0,
      attackAnim: 0,
      walkCycle: i * 0.4,
      facing: 0,
    }))
  );

  const treesRef = useRef<TreeNode[]>([
    { id: 1, x: 615, y: 125, logsRemaining: 10, regrowTimer: 0, shakeTimer: 0, scale: 1 },
    { id: 2, x: 675, y: 135, logsRemaining: 10, regrowTimer: 0, shakeTimer: 0, scale: 1.08 },
    { id: 3, x: 635, y: 195, logsRemaining: 10, regrowTimer: 0, shakeTimer: 0, scale: 0.95 },
    { id: 4, x: 660, y: 365, logsRemaining: 10, regrowTimer: 0, shakeTimer: 0, scale: 1.05 },
    { id: 5, x: 635, y: 445, logsRemaining: 10, regrowTimer: 0, shakeTimer: 0, scale: 1 },
    { id: 6, x: 695, y: 475, logsRemaining: 10, regrowTimer: 0, shakeTimer: 0, scale: 1.1 },
    { id: 7, x: 755, y: 465, logsRemaining: 10, regrowTimer: 0, shakeTimer: 0, scale: 0.96 },
    { id: 8, x: 835, y: 455, logsRemaining: 10, regrowTimer: 0, shakeTimer: 0, scale: 1.04 },
  ]);

  const farmPlotsRef = useRef<FarmPlot[]>(
    Array.from({ length: 16 }, (_, idx) => {
      const row = Math.floor(idx / 4);
      const col = idx % 4;
      return {
        id: idx + 1,
        row,
        col,
        x: 335 + col * 38,
        y: 450 + row * 32,
        tilled: false,
        moisture: 0.8,
      };
    })
  );

  const keysRef = useRef<Record<string, boolean>>({});
  const threeHitRef = useRef<{
    camera: THREE.PerspectiveCamera;
    groundPlane: THREE.Mesh;
    farmSoilMeshes: { plotId: number; mesh: THREE.Mesh }[];
    treeHitMeshes: { treeId: number; group: THREE.Object3D }[];
  } | null>(null);

  const showToast = (msg: string) => {
    setCombatToast(msg);
  };

  const campGuardsDefeatedRef = useRef<number>(0);
  const waypointsRef = useRef<{ x: number; y: number }[]>([]);

  // Spawn Day 1's 10 Weak Guards in the Deep Eastern Forest Stronghold at (4350, -1150) (100 HP each, 10 damage per hit)
  const spawnDay1WeakGuards = () => {
    const guards: EnemyEntity[] = Array.from({ length: 10 }, (_, idx) => {
      const row = Math.floor(idx / 2);
      const col = idx % 2;
      const gx = 4265 + col * 135 + (idx % 3) * 12;
      const gy = -1265 + row * 58;
      return {
        id: `weak-guard-${idx + 1}`,
        type: 'WEAK_GUARD',
        name:
          timeline === 'MEDIEVAL'
            ? `Camp Guard #${idx + 1}`
            : `Colonial Camp Sentry #${idx + 1}`,
        x: gx,
        y: gy,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        damage: 10,
        speed: 72,
        attackCooldown: 0,
        attackAnim: 0,
        walkCycle: idx * 0.6,
        facing: Math.PI,
        patrolOriginX: gx,
        patrolOriginY: gy,
        patrolAngle: idx * 0.7,
        alerted: false,
        hitFlash: 0,
      };
    });
    enemiesRef.current = guards;
  };

  useEffect(() => {
    spawnDay1WeakGuards();
  }, [timeline]);

  const walkToAndExecute = (destX: number, destY: number, callback: () => void) => {
    const p = playerRef.current;
    if (Math.hypot(destX - p.x, destY - p.y) <= 68) {
      callback();
      return;
    }

    const pts: { x: number; y: number }[] = [];
    const insideHouseNow = p.x > 332 && p.x < 418 && p.y > 58 && p.y < 131;
    const destInsideHouse = destX > 332 && destX < 418 && destY > 58 && destY < 131;

    if (insideHouseNow && !destInsideHouse) {
      pts.push({ ...HOUSE_DOOR_OUTSIDE_POS });
    }

    // If going from Village into the Deep Forest Stronghold, follow the forest trail waypoints!
    if (p.x < 1050 && destX > 1500) {
      FOREST_PATH_WAYPOINTS_2D.forEach((wp) => pts.push({ ...wp }));
    } else if (p.x > 1500 && destX < 1050) {
      // Returning from the Deep Forest back to the Village!
      [...FOREST_PATH_WAYPOINTS_2D].reverse().forEach((wp) => pts.push({ ...wp }));
    }

    if (destInsideHouse && !insideHouseNow) {
      pts.push({ ...HOUSE_DOOR_OUTSIDE_POS });
    }

    pts.push({ x: destX, y: destY });
    waypointsRef.current = pts.slice(1);
    p.targetX = pts[0].x;
    p.targetY = pts[0].y;
    p.onArriveCallback = callback;
  };

  // Eat 1 Bowl of Curry-Rice (+20 Health)
  const handleEatCurryRice = () => {
    if (inventoryRef.current.curryRiceBowls <= 0) {
      showToast('No Curry-Rice Bowls remaining!');
      return;
    }
    if (playerRef.current.hp >= playerRef.current.maxHp) {
      showToast('Health is already full!');
      return;
    }
    const newHp = Math.min(playerRef.current.maxHp, playerRef.current.hp + 20);
    playerRef.current.hp = newHp;
    setPlayerHp(newHp);
    updateInventory((prev) => ({
      ...prev,
      curryRiceBowls: Math.max(0, prev.curryRiceBowls - 1),
    }));
    sound.playHeal();
    showToast('Ate Bowl of Curry-Rice (+20 HP)');
  };

  const handleToggleStealth = () => {
    const next = !playerRef.current.stealth;
    playerRef.current.stealth = next;
    if (next && playerRef.current.mounted) {
      playerRef.current.mounted = false;
      setMounted(false);
    }
    setStealth(next);
    showToast(next ? 'Stealth Crouch Active (Reduced Detection)' : 'Stealth Off');
  };

  const handleToggleMount = () => {
    if (!inventoryRef.current.personalMount) {
      showToast(`Defeat the 10 Camp Guards on Day 1 to earn your ${mountName}!`);
      return;
    }
    const next = !playerRef.current.mounted;
    playerRef.current.mounted = next;
    if (next && playerRef.current.stealth) {
      playerRef.current.stealth = false;
      setStealth(false);
    }
    setMounted(next);
    sound.playGather();
    showToast(next ? `Mounted ${mountName} (+85% Speed)` : `Dismounted ${mountName}`);
  };

  const handleSelectTool = (tool: ActiveTool) => {
    playerRef.current.activeTool = tool;
    setActiveTool(tool);
    const toolSlot = tool === 'axe' ? 1 : tool === 'sword' ? 2 : 3;
    selectedSlotRef.current = toolSlot;
    setSelectedSlot(toolSlot);
  };

  // Allow the player to freely select ANY of the 10 inventory slots (1-10) at their desire!
  const handleSelectInventorySlot = (slot: number, triggerUse: boolean = false) => {
    selectedSlotRef.current = slot;
    setSelectedSlot(slot);
    const inv = inventoryRef.current;

    if (slot === 1) {
      playerRef.current.activeTool = 'axe';
      setActiveTool('axe');
      showToast('Selected Slot 1: Iron Axe (1 Click = 1 Log · Max 10 Logs per Tree)');
    } else if (slot === 2) {
      playerRef.current.activeTool = 'sword';
      setActiveTool('sword');
      showToast(
        `Selected Slot 2: ${inv.powerfulSword ? 'Powerful Sword (50 DMG)' : 'Iron Sword (20 DMG)'}`
      );
    } else if (slot === 3) {
      playerRef.current.activeTool = 'hoe';
      setActiveTool('hoe');
      showToast(`Selected Slot 3: Iron Hoe (${inv.tilledPlots}/16 Farmland Squares Tilled)`);
    } else if (slot === 4) {
      showToast(
        inv.hasMap
          ? 'Selected Slot 4: Ancient Forest Map (Forest Guide Arrows Active!)'
          : 'Selected Slot 4: Empty (Borrow the Map from the Old Man Next Door [E])'
      );
    } else if (slot === 5) {
      if (inv.curryRiceBowls > 0 && (triggerUse || playerRef.current.hp < playerRef.current.maxHp)) {
        handleEatCurryRice();
      } else {
        showToast(
          inv.curryRiceBowls > 0
            ? `Selected Slot 5: Curry-Rice Bowls (x${inv.curryRiceBowls}) — Press [F] or click again to eat (+20 HP)`
            : 'Selected Slot 5: Empty (Trade 10 Rice Bags with the Chef/Cook for 50 Curry-Rice Bowls)'
        );
      }
    } else if (slot === 6) {
      showToast(
        inv.logs > 0
          ? `Selected Slot 6: Timber Logs (${inv.logs}/50 for Blacksmith)`
          : 'Selected Slot 6: Empty (Chop trees with Axe [1] — 1 click = 1 Log)'
      );
    } else if (slot === 7) {
      showToast(
        inv.riceBags > 0
          ? `Selected Slot 7: Rice Bags (x${inv.riceBags}) — Trade with Chef/Cook [E] for 50 Curry-Rice!`
          : 'Selected Slot 7: Empty'
      );
    } else if (slot === 8) {
      showToast(
        inv.hayStacks > 0
          ? `Selected Slot 8: Hay Stacks (x${inv.hayStacks}) — Trade with Animal Owner [E] for 10 ${mountPlural}!`
          : 'Selected Slot 8: Empty'
      );
    } else if (slot === 9) {
      showToast(
        inv.fullIronArmour
          ? 'Selected Slot 9: Full Iron Armour Equipped (500 Max HP)'
          : 'Selected Slot 9: Empty'
      );
    } else if (slot === 10) {
      if (inv.stolenArtifacts) {
        showToast(
          'Selected Slot 10: Recovered Sacred Temple Artifacts — Rebuild the Temple [E]!'
        );
      } else if (inv.personalMount) {
        if (triggerUse) {
          handleToggleMount();
        } else {
          showToast(`Selected Slot 10: ${mountName} — Press [M] or click to Ride/Dismount!`);
        }
      } else {
        showToast('Selected Slot 10: Empty');
      }
    }
  };

  // Primary Action in 3D:
  // - Sword ('sword'): Deals damage to enemies in range
  // - Hoe ('hoe'): Tills ONLY ONE single square of farmland per click (not the full acre!)
  // - Axe ('axe'): Clicking 5 times on a tree/log gives +1 Log
  const performPrimaryAction = (clickedPlotId?: number, clickedTreeId?: number) => {
    const p = playerRef.current;
    if (p.attackCooldown > 0) return;
    p.attackCooldown = 0.18;
    p.attackAnim = 1.0;

    sound.playSlash();

    // 1. HOE EQUIPPED: Till strictly ONE single square of farmland per click!
    if (p.activeTool === 'hoe') {
      let targetPlot: FarmPlot | undefined;
      if (clickedPlotId !== undefined) {
        const candidate = farmPlotsRef.current.find((pl) => pl.id === clickedPlotId);
        if (candidate && !candidate.tilled && Math.hypot(candidate.x - p.x, candidate.y - p.y) <= 135) {
          targetPlot = candidate;
        }
      }
      if (!targetPlot) {
        // Find the single closest untilled farmland square within hoe reach
        let bestDist = 95;
        for (const plot of farmPlotsRef.current) {
          if (!plot.tilled) {
            const d = Math.hypot(plot.x - p.x, plot.y - p.y);
            if (d <= bestDist) {
              bestDist = d;
              targetPlot = plot;
            }
          }
        }
      }

      if (targetPlot) {
        targetPlot.tilled = true;
        const totalTilled = farmPlotsRef.current.filter((pl) => pl.tilled).length;
        updateInventory((prev) => ({ ...prev, tilledPlots: totalTilled }));
        sound.playGather();
        if (totalTilled >= 16 && !farmerRewardClaimedRef.current) {
          showToast(
            'All 16/16 Farmland Squares Tilled! Follow the Friendly Spirit to the Farmer [E] to claim your reward!'
          );
          setSpiritBanner(
            'Friendly Spirit: "All 16 squares of farmland are tilled! Follow me to the Farmer [E] right now to claim your 10 Bags of Rice & 10 Stacks of Hay!"'
          );
        } else {
          showToast(
            `Tilled 1 Farmland Square #${targetPlot.id} (${totalTilled}/16 Squares Tilled)`
          );
        }
      } else {
        const totalTilled = farmPlotsRef.current.filter((pl) => pl.tilled).length;
        if (totalTilled >= 16) {
          showToast('All 16/16 Farmland Squares are already tilled! Talk to the Farmer [E]!');
        } else {
          showToast('Stand on the Southern Farmland and click an untilled square with your Hoe!');
        }
      }
      return;
    }

    // 2. AXE EQUIPPED: 1 click on a tree with an axe gives 1 log! A tree can give a maximum of 10 logs!
    if (p.activeTool === 'axe') {
      if (blacksmithTradedRef.current) {
        showToast('You have already completed the Blacksmith trade!');
        return;
      }
      if (inventoryRef.current.logs >= 50) {
        showToast('You already have 50/50 Logs! Follow the Friendly Spirit to the Blacksmith [E]!');
        return;
      }
      let targetTree: TreeNode | undefined;
      if (clickedTreeId !== undefined) {
        const candidate = treesRef.current.find((t) => t.id === clickedTreeId);
        if (candidate && Math.hypot(candidate.x - p.x, candidate.y - p.y) <= 145) {
          if (candidate.logsRemaining <= 0) {
            showToast(
              `Tree #${candidate.id} has already given its maximum of 10 logs! Move to another tree.`
            );
            return;
          }
          targetTree = candidate;
        }
      }
      if (!targetTree) {
        let bestDist = 115;
        for (const tree of treesRef.current) {
          if (tree.logsRemaining > 0) {
            const d = Math.hypot(tree.x - p.x, tree.y - p.y);
            if (d <= bestDist) {
              bestDist = d;
              targetTree = tree;
            }
          }
        }
      }

      if (targetTree) {
        targetTree.shakeTimer = 0.35;
        targetTree.logsRemaining = Math.max(0, targetTree.logsRemaining - 1);
        const harvestedFromTree = 10 - targetTree.logsRemaining;
        const nextLogs = Math.min(50, inventoryRef.current.logs + 1);
        axeHitCountRef.current = harvestedFromTree;
        setAxeHitCount(harvestedFromTree);
        updateInventory((prev) => ({ ...prev, logs: Math.min(50, prev.logs + 1) }));
        sound.playGather();

        if (nextLogs >= 50) {
          showToast('50/50 Logs Collected! Follow the Friendly Spirit to the Blacksmith [E]!');
          setSpiritBanner(
            'Friendly Spirit: "You have collected all 50 Logs! Follow me to the Blacksmith [E] to trade your 50 Logs for 10 Full Iron Armour & Sword Sets!"'
          );
        } else if (targetTree.logsRemaining === 0) {
          showToast(
            `+1 Log! Tree #${targetTree.id} reached its maximum of 10/10 logs (Total: ${nextLogs}/50 Logs). Move to the next tree!`
          );
        } else {
          showToast(
            `+1 Log from Tree #${targetTree.id} (${harvestedFromTree}/10 logs from this tree · Total: ${nextLogs}/50 Logs)`
          );
        }
      } else {
        showToast('Walk near a Forest Tree with logs remaining and click once with your Axe for +1 Log!');
      }
      return;
    }

    // 3. SWORD EQUIPPED: Clicking with a Sword deals damage to enemies in range!
    const hitRadius = p.damage >= 50 ? 96 : 78;
    let hits = 0;
    enemiesRef.current.forEach((enemy) => {
      const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (dist <= hitRadius) {
        const dmg = p.damage; // 20 on Day 1, 50 on Day 3+ with Powerful Sword
        enemy.hp = Math.max(0, enemy.hp - dmg);
        enemy.hitFlash = 0.16;
        enemy.alerted = true;

        const kbAngle = Math.atan2(enemy.y - p.y, enemy.x - p.x);
        const kbForce = enemy.type === 'FINAL_BOSS' ? 45 : 135;
        enemy.vx += Math.cos(kbAngle) * kbForce;
        enemy.vy += Math.sin(kbAngle) * kbForce;
        hits++;
      }
    });

    if (hits > 0) {
      sound.playHit();
      showToast(`Sword Strike! Hit ${hits} ${hits === 1 ? 'Enemy' : 'Enemies'} for -${p.damage} HP!`);
      if (p.stealth) {
        p.stealth = false;
        setStealth(false);
      }
    }
  };

  // Core Storyline / NPC Interactions (Strictly Once-Per-Reward!)
  const executeBorrowMap = () => {
    if (mapBorrowedRef.current || inventoryRef.current.hasMap) {
      showToast('You have already borrowed the Map from the Old Man!');
      return;
    }
    mapBorrowedRef.current = true;
    updateInventory((prev) => ({ ...prev, hasMap: true }));
    sound.playGather();
    showToast(
      'Borrowed Map! Friendly Spirit revealed the Forest Arrows and vanished until Day 2 Morning!'
    );
    setStatusBanner(
      `Day 1: The Friendly Spirit showed you the glowing arrows and disappeared! Follow the arrows deep into the forest, defeat the 10 enemy guards to collect shelter materials, then return to the village to sleep [E]!`
    );
    setSpiritBanner(
      `Friendly Spirit (Before Vanishing): "Behold the glowing golden arrows leading through the forest to the enemy camp! Defeat the 10 guards, collect their materials, and return to the village house to sleep — I will wake you on Day 2 morning!"`
    );
  };

  const startDay4ArmyAttack = () => {
    dayRef.current = 4;
    setDay(4);
    setIsNight(false);
    isNightRef.current = false;
    playerRef.current.hp = 500;
    playerRef.current.maxHp = 500;
    playerRef.current.damage = 50;
    playerRef.current.activeTool = 'sword';
    setActiveTool('sword');
    setPlayerHp(500);
    setPlayerMaxHp(500);
    setPlayerDamage(50);

    enemiesRef.current = [];
    setRaidSoldiersDefeated(0);
    raidSoldiersDefeatedRef.current = 0;
    raidSpawnQueueRef.current = 50;
    raidSpawnTimerRef.current = 0;

    sound.playTeleport();
    showToast(`Day 4 Morning: An Army of 50 Enemy Soldiers (500 HP, 20 DMG) Attacks!`);
    setStatusBanner(
      `Day 4: AN ARMY OF 50 ${enemyFactionName.toUpperCase()} SOLDIERS ATTACKS! Fight them with your Powerful Sword [2] & 10 Armed Villagers, then sleep [E] in your bed!`
    );
    setSpiritBanner(
      `Friendly Spirit: "Wake up, Warrior! It is Day 4 morning and an army of 50 enemy soldiers is attacking the village! Fight and defeat all 50 soldiers — you can sleep in your bed [E] once they are defeated!"`
    );
  };

  const startDay5FinalBoss = () => {
    dayRef.current = 5;
    setDay(5);
    setIsNight(false);
    isNightRef.current = false;
    playerRef.current.hp = 500;
    playerRef.current.maxHp = 500;
    playerRef.current.damage = 50;
    playerRef.current.activeTool = 'sword';
    setActiveTool('sword');
    setPlayerHp(500);

    const boss: EnemyEntity = {
      id: 'final-boss',
      type: 'FINAL_BOSS',
      name: bossTitle,
      x: 790,
      y: 275,
      vx: 0,
      vy: 0,
      hp: 5000,
      maxHp: 5000,
      damage: 25,
      speed: 54,
      attackCooldown: 0,
      attackAnim: 0,
      walkCycle: 0,
      facing: Math.PI,
      patrolOriginX: 790,
      patrolOriginY: 275,
      patrolAngle: 0,
      alerted: true,
      hitFlash: 0,
      lineAttackState: 'TELEGRAPH',
      lineAttackTimer: 7.0,
      lineAngle: Math.atan2(playerRef.current.y - 275, playerRef.current.x - 790),
      lineOriginX: 790,
      lineOriginY: 275,
    };

    enemiesRef.current = [boss];
    setBossHp(5000);
    sound.playBossLaserBlast();
    showToast(`Day 5 Morning: Final Boss ${bossTitle} (5000 HP) Arrives!`);
    setStatusBanner(
      `Day 5: THE FINAL BOSS ARRIVES! Defeat ${bossTitle} (5000 HP, 100 DMG Red Line Attack) to recover all Stolen Temple Artifacts, then sleep [E] to wake up on Day 6!`
    );
    setSpiritBanner(
      `Friendly Spirit: "Follow me!"`
    );
  };

  // Sleep in the 3D Bed inside the Player's House (Strictly gated by each Day's required objectives!)
  const executeSleepInHouse = () => {
    if (isSleepingRef.current) return;
    const currentDay = dayRef.current;

    // Day 1 Sleep Check: Must have borrowed the map and either defeated the 10 guards or returned to the village from the forest
    if (currentDay === 1) {
      if (!inventoryRef.current.hasMap) {
        showToast('Borrow the Map from the Old Man Next Door [E] first!');
        return;
      }
      if (campGuardsDefeatedRef.current < 10 && !hasVisitedForestDay1Ref.current) {
        showToast(
          `Follow the glowing forest arrows to fight the 10 Day 1 Enemy Guards first (${campGuardsDefeatedRef.current}/10)!`
        );
        return;
      }
      // Ensure Day 1 enemy soldier materials & gear are granted ONCE only when completing Day 1
      if (!day1GuardsRewardClaimedRef.current) {
        day1GuardsRewardClaimedRef.current = true;
        campGuardsDefeatedRef.current = 10;
        setCampGuardsDefeated(10);
        enemiesRef.current = [];
        updateInventory((inv) => ({
          ...inv,
          fullIronArmour: true,
          powerfulSword: true,
          wallMaterials: 100,
          personalMount: true,
        }));
        playerRef.current.mounted = true;
        setMounted(true);
      }
    } else if (currentDay === 2) {
      // Day 2 Sleep Check: Player can sleep ONLY after completing ALL the Villagers' Quests!
      const allVillagerQuestsDone =
        farmerRewardClaimedRef.current &&
        cookTradedRef.current &&
        animalOwnerTradedRef.current &&
        blacksmithTradedRef.current &&
        buffVillagersArmedRef.current >= 10;
      if (!allVillagerQuestsDone) {
        showToast(
          "You can sleep on Day 2 ONLY after completing all the Villagers' Quests (Farmer, Cook, Animal Owner, Blacksmith & Arming 10 Villagers)!"
        );
        return;
      }
    } else if (currentDay === 3) {
      // Day 3 Sleep Check: Player can sleep ONLY after completing the Villager Shelter!
      if (!shelterBuiltRef.current) {
        showToast(
          'You can sleep on Day 3 ONLY after completing the Shelter for all the villagers [E]!'
        );
        return;
      }
    } else if (currentDay === 4) {
      // Day 4 Sleep Check: Player can sleep ONLY after fighting & defeating all 50 enemy soldiers!
      if (raidSoldiersDefeatedRef.current < 50) {
        showToast(
          `You can sleep on Day 4 ONLY after defeating the army of 50 enemy soldiers (${raidSoldiersDefeatedRef.current}/50)!`
        );
        return;
      }
    } else if (currentDay === 5) {
      // Day 5 Sleep Check: Player can sleep ONLY after defeating the Final Boss and recovering the stolen artifacts!
      if (!bossDefeatedRef.current) {
        showToast(
          `You can sleep on Day 5 ONLY after defeating the ${bossTitle} and recovering the stolen artifacts!`
        );
        return;
      }
    } else if (currentDay >= 6) {
      showToast('It is Day 6! Walk to the Anantha Padmanabha Swamy Temple and press [E] to rebuild it!');
      return;
    }

    // Screen goes black for 2 seconds and then wakes the player up!
    isSleepingRef.current = true;
    setIsSleepingBlackScreen(true);
    sound.playHeal();
    const nextDay = Math.min(6, currentDay + 1);

    window.setTimeout(() => {
      isSleepingRef.current = false;
      setIsSleepingBlackScreen(false);

      dayRef.current = nextDay;
      setDay(nextDay);
      setIsNight(false);
      isNightRef.current = false;
      playerRef.current.hp = 500;
      playerRef.current.maxHp = 500;
      playerRef.current.damage = 50;
      setPlayerHp(500);
      setPlayerMaxHp(500);
      setPlayerDamage(50);

      // Restore armed Buff Villagers' HP when waking up in the morning
      villagersRef.current.forEach((v) => {
        if (v.armed) {
          v.hp = v.maxHp;
        }
      });

      if (nextDay === 2) {
        showToast('Friendly Spirit: "Follow me!" (Enemy forces arrive Day 5 — complete Villagers’ Quests today!)');
        setStatusBanner('Day 2 Morning: Follow the Friendly Spirit!');
        setSpiritBanner('Friendly Spirit: "Follow me!"');
      } else if (nextDay === 3) {
        showToast('Friendly Spirit: "Follow me!"');
        setStatusBanner('Day 3 Morning: Follow the Friendly Spirit!');
        setSpiritBanner('Friendly Spirit: "Follow me!"');
      } else if (nextDay === 4) {
        startDay4ArmyAttack();
      } else if (nextDay === 5) {
        startDay5FinalBoss();
      } else if (nextDay === 6) {
        showToast('Friendly Spirit: "Follow me!"');
        setStatusBanner('Day 6 Morning: Follow the Friendly Spirit!');
        setSpiritBanner('Friendly Spirit: "Follow me!"');
      }
    }, 2000);
  };

  const executeBuildReinforcedShelter = () => {
    if (shelterBuiltRef.current) {
      showToast('You have already built the Villager Shelter!');
      return;
    }
    if (shelterBuildingRef.current) {
      showToast(
        `Building the Villager Shelter... ${Math.floor(shelterProgressRef.current)}% complete!`
      );
      return;
    }
    if (dayRef.current < 3) {
      showToast(
        "Complete Day 1 & Day 2's Villager Quests first — you build the Villager Shelter on Day 3!"
      );
      return;
    }
    if (inventoryRef.current.wallMaterials <= 0) {
      showToast('Need collected materials from the Day 1 enemy soldiers!');
      return;
    }
    // Start the slow Villager Shelter building process (~10 seconds total)
    shelterBuildingRef.current = true;
    setShelterBuilding(true);
    sound.playGather();
    showToast('Started building the Villager Shelter... Constructing slowly (0%)!');
    setStatusBanner(
      `Day 3: Slowly constructing the Reinforced Villager Shelter for all the villagers...`
    );
    setSpiritBanner(`Friendly Spirit: "Follow me!"`);
  };

  const executeTillOneAcreAndClaimFarmer = () => {
    if (farmerRewardClaimedRef.current) {
      showToast('You have already claimed the Farmer reward! A player can only gain a reward once.');
      return;
    }
    const tilledCount = farmPlotsRef.current.filter((pl) => pl.tilled).length;
    if (tilledCount < 16) {
      handleSelectTool('hoe');
      showToast(
        `Equip Iron Hoe [3] and click each farmland square to till 1 square at a time (${tilledCount}/16 tilled)!`
      );
      return;
    }
    farmerRewardClaimedRef.current = true;
    setFarmerRewardClaimed(true);
    updateInventory((prev) => ({
      ...prev,
      tilledPlots: 16,
      riceBags: 10,
      hayStacks: 10,
    }));
    sound.playGather();
    showToast('Farmer Quest Complete (Once Only): +10 Rice Bags & +10 Hay Stacks! Follow the Spirit to the Chef!');
    setStatusBanner(
      'Day 2 (Quest 2 of 5): Farmer Quest Complete! Now follow your Friendly Spirit to the Chef/Cook [E] to trade your 10 Rice Bags for 50 Bowls of Curry-Rice!'
    );
    setSpiritBanner(
      'Friendly Spirit: "Farmer Quest Complete! You received 10 Bags of Rice & 10 Stacks of Hay! Now follow me to the next quest — trade your 10 Rice Bags with the Chef/Cook [E] for 50 Bowls of Curry-Rice!"'
    );
  };

  const executeTradeWithCook = () => {
    if (cookTradedRef.current) {
      showToast('You have already traded with the Chef! A player can only gain a reward once.');
      return;
    }
    if (inventoryRef.current.riceBags < 10) {
      showToast('Need 10 Bags of Rice from the Farmer first!');
      return;
    }
    cookTradedRef.current = true;
    setCookTraded(true);
    // Immediately grant 50 Bowls of Curry-Rice and make the Rice Bags in the inventory disappear (riceBags: 0)!
    updateInventory((prev) => ({
      ...prev,
      riceBags: 0,
      curryRiceBowls: 50,
    }));
    sound.playHeal();
    showToast('Traded with Chef: Received 50 Bowls of Curry-Rice & Rice Bags removed from inventory!');
    setStatusBanner(
      `Day 2 (Quest 3 of 5): Chef Trade Complete (+50 Curry-Rice Bowls)! Now follow your Friendly Spirit to the Animal Owner [E] to trade 10 Hay Stacks for 10 ${mountPlural}!`
    );
    setSpiritBanner(`Friendly Spirit: "Follow me!"`);
  };

  const executeTradeWithAnimalOwner = () => {
    if (animalOwnerTradedRef.current) {
      showToast('You have already traded with the Animal Owner! A player can only gain a reward once.');
      return;
    }
    if (inventoryRef.current.hayStacks < 10) {
      showToast('Need 10 Stacks of Hay from the Farmer first!');
      return;
    }
    animalOwnerTradedRef.current = true;
    setAnimalOwnerTraded(true);
    updateInventory((prev) => ({
      ...prev,
      hayStacks: 0,
      mountsPool: 10,
    }));
    sound.playGather();
    showToast(`Animal Owner Quest Complete: +10 ${mountPlural} Acquired & Hay Stacks traded!`);
    setStatusBanner(
      `Day 2 (Quest 4 of 5): Animal Owner Trade Complete (+10 ${mountPlural})! Now follow your Friendly Spirit to chop 50 Logs [Axe] and trade with the Blacksmith [E]!`
    );
    setSpiritBanner(`Friendly Spirit: "Follow me!"`);
  };

  const executeChopLogsAndTradeBlacksmith = () => {
    if (blacksmithTradedRef.current) {
      showToast('You have already traded with the Blacksmith! A player can only gain a reward once.');
      return;
    }
    if (inventoryRef.current.logs < 50) {
      handleSelectTool('axe');
      showToast(
        `Need 50 Logs for the Blacksmith (${inventoryRef.current.logs}/50)! Click once with your Iron Axe [1] on a tree for +1 Log (max 10 logs per tree).`
      );
      return;
    }
    blacksmithTradedRef.current = true;
    setBlacksmithTraded(true);
    updateInventory((prev) => ({
      ...prev,
      logs: 0,
      armourSetsPool: 10,
    }));
    sound.playParry();
    showToast('Blacksmith Quest Complete: 50 Logs → +10 Full Iron Armour & Sword Sets!');
    setStatusBanner(
      `Day 2 (Quest 5 of 5): Blacksmith Quest Complete (+10 Armour & Sword Sets)! Now follow your Friendly Spirit to the Village Square [E] to equip all 10 Buff Villagers!`
    );
    setSpiritBanner(
      `Friendly Spirit: "Blacksmith Quest Complete! You forged 10 Full Iron Armour & Sword Sets! Now follow me to the final Day 2 quest — equip all 10 Buff Villagers in the Village Square [E]!"`
    );
  };

  const executeArmBuffVillagers = () => {
    if (buffVillagersArmedRef.current >= 10) {
      showToast('You have already armed all 10 Buff Villagers! A player can only gain a reward once.');
      return;
    }
    if (inventoryRef.current.mountsPool < 10 || inventoryRef.current.armourSetsPool < 10) {
      showToast(`Complete Farmer, Cook, Animal Owner & Blacksmith quests first to arm the 10 Villagers!`);
      return;
    }
    handleSelectTool('sword');
    villagersRef.current.forEach((v) => {
      v.armed = true;
    });
    buffVillagersArmedRef.current = 10;
    setBuffVillagersArmed(10);
    isNightRef.current = true;
    setIsNight(true);
    updateInventory((prev) => ({
      ...prev,
      mountsPool: 0,
      armourSetsPool: 0,
    }));
    sound.playTeleport();
    showToast(
      `All Day 2 Villagers' Quests Complete! Night has fallen — follow the Spirit to your House Bed [E] to sleep!`
    );
    setStatusBanner(
      `Day 2 Night: All Villagers' Quests are complete and all 10 Buff Villagers are armed! Follow the Friendly Spirit to your House Bed [E] to sleep until Day 3!`
    );
    setSpiritBanner(
      `Friendly Spirit: "You completed all the Villagers' Quests on Day 2! Night has fallen — follow me back to your house bed [E] to sleep and wake up on Day 3 morning!"`
    );
  };

  const handleStartDay3Raid = () => {
    startDay4ArmyAttack();
  };

  const handleStartDay5Boss = () => {
    startDay5FinalBoss();
  };

  const executeRebuildTempleDay7 = () => {
    if (!inventoryRef.current.stolenArtifacts) return;
    if (templeRebuiltRef.current) {
      showToast('The Anantha Padmanabha Swamy Temple is already rebuilt!');
      return;
    }
    if (templeRebuildingRef.current) {
      showToast(
        `Reconstructing Anantha Padmanabha Swamy Temple... ${Math.floor(templeProgressRef.current)}% complete!`
      );
      return;
    }
    dayRef.current = 6;
    setDay(6);
    templeRebuildingRef.current = true;
    setTempleRebuilding(true);
    sound.playGather();
    showToast('Started reconstructing Anantha Padmanabha Swamy Temple... Constructing slowly (0%)!');
    setStatusBanner('Day 6: Slowly reconstructing the Anantha Padmanabha Swamy Temple...');
    setSpiritBanner('Friendly Spirit: "Follow me!"');
  };

  const handleContextualInteract = () => {
    const p = playerRef.current;
    // 1. Check 3D Bed inside Player's House (Night Only via [E]!)
    if (
      Math.hypot(p.x - BED_POS.x, p.y - BED_POS.y) < 78 ||
      Math.hypot(p.x - HOUSE_POS.x, p.y - HOUSE_POS.y) < 68
    ) {
      executeSleepInHouse();
      return;
    }
    if (Math.hypot(p.x - OLD_MAN_POS.x, p.y - OLD_MAN_POS.y) < 75 && !mapBorrowedRef.current) {
      executeBorrowMap();
      return;
    }
    if (
      Math.hypot(p.x - SHELTER_SITE_POS.x, p.y - SHELTER_SITE_POS.y) < 85 &&
      !shelterBuiltRef.current
    ) {
      executeBuildReinforcedShelter();
      return;
    }
    if (Math.hypot(p.x - FARMER_POS.x, p.y - FARMER_POS.y) < 95 && !farmerRewardClaimedRef.current) {
      executeTillOneAcreAndClaimFarmer();
      return;
    }
    if (Math.hypot(p.x - COOK_POS.x, p.y - COOK_POS.y) < 80 && !cookTradedRef.current) {
      executeTradeWithCook();
      return;
    }
    if (
      Math.hypot(p.x - ANIMAL_OWNER_POS.x, p.y - ANIMAL_OWNER_POS.y) < 80 &&
      !animalOwnerTradedRef.current
    ) {
      executeTradeWithAnimalOwner();
      return;
    }
    if (Math.hypot(p.x - BLACKSMITH_POS.x, p.y - BLACKSMITH_POS.y) < 80 && !blacksmithTradedRef.current) {
      executeChopLogsAndTradeBlacksmith();
      return;
    }
    if (Math.hypot(p.x - 275, p.y - 275) < 95 && buffVillagersArmedRef.current < 10) {
      executeArmBuffVillagers();
      return;
    }
    if (
      Math.hypot(p.x - TEMPLE_POS.x, p.y - TEMPLE_POS.y) < 120 &&
      inventoryRef.current.stolenArtifacts &&
      !templeRebuiltRef.current
    ) {
      executeRebuildTempleDay7();
      return;
    }
    performPrimaryAction();
  };

  const handleContextualInteractRef = useRef(handleContextualInteract);
  handleContextualInteractRef.current = handleContextualInteract;
  const performPrimaryActionRef = useRef(performPrimaryAction);
  performPrimaryActionRef.current = performPrimaryAction;
  const handleSelectInventorySlotRef = useRef(handleSelectInventorySlot);
  handleSelectInventorySlotRef.current = handleSelectInventorySlot;

  useEffect(() => {
    if (teleportCountdown === null) return;
    if (teleportCountdown <= 0) {
      onCompleteTimeline(timeline);
      return;
    }
    const timer = setTimeout(() => {
      setTeleportCountdown((prev) => (prev !== null ? Math.max(0, prev - 0.2) : null));
    }, 200);
    return () => clearTimeout(timer);
  }, [teleportCountdown, onCompleteTimeline, timeline]);

  // Keyboard Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (
        ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)
      ) {
        waypointsRef.current = [];
        playerRef.current.targetX = null;
        playerRef.current.targetY = null;
        playerRef.current.onArriveCallback = null;
      }

      if (k === ' ') {
        e.preventDefault();
        performPrimaryActionRef.current();
      } else if (k === 'e') {
        handleContextualInteractRef.current();
      } else if (k === 'c' || k === 'shift') {
        handleToggleStealth();
      } else if (k === 'm') {
        handleToggleMount();
      } else if (k === 'f') {
        handleEatCurryRice();
      } else if (k === 'v') {
        setCameraMode((prev) => (prev === 'FOLLOW' ? 'OVERVIEW' : 'FOLLOW'));
      } else if (k === 'q') {
        cameraYawRef.current -= 0.25;
      } else if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(k)) {
        const slotNum = k === '0' ? 10 : parseInt(k, 10);
        handleSelectInventorySlotRef.current(slotNum, slotNum === 5 || slotNum === 10);
      } else if (k === 'r') {
        playerRef.current.isBlocking = true;
        setIsBlocking(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = false;
      if (k === 'r') {
        playerRef.current.isBlocking = false;
        setIsBlocking(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // FULL 3D THREE.JS WORLD ENGINE & GAME LOOP
  useEffect(() => {
    const container = mountContainerRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const daySkyColor = timeline === 'MEDIEVAL' ? 0x1e293b : 0x1e2433;
    const nightSkyColor = 0x050811;
    scene.background = new THREE.Color(daySkyColor);
    scene.fog = new THREE.FogExp2(daySkyColor, 0.00085);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2400);
    camera.position.set(0, 32, 36);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    renderer.domElement.className = 'w-full h-full block cursor-crosshair';

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Realistic Sunlight, Sky Hemisphere & Shadows
    const hemiLight = new THREE.HemisphereLight(0xfef3c7, 0x1e293b, 1.15);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.1);
    sunLight.position.set(35, 58, 32);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.left = -85;
    sunLight.shadow.camera.right = 85;
    sunLight.shadow.camera.top = 65;
    sunLight.shadow.camera.bottom = -65;
    scene.add(sunLight);

    // Realistic High-Detail PBR Terrain Ground Plane (1100 x 750 = 100x Bigger Area)
    const terrainCanvas = document.createElement('canvas');
    terrainCanvas.width = 1024;
    terrainCanvas.height = 1024;
    const tctx = terrainCanvas.getContext('2d')!;
    tctx.fillStyle = timeline === 'MEDIEVAL' ? '#243b24' : '#26362c';
    tctx.fillRect(0, 0, 1024, 1024);

    // Organic moss patches, soil variation, pebbles & wild grass blades
    for (let i = 0; i < 2400; i++) {
      const gx = (i * 137) % 1024;
      const gy = (i * 251) % 1024;
      const r = 6 + (i % 24);
      tctx.fillStyle =
        i % 4 === 0
          ? 'rgba(22, 101, 52, 0.16)'
          : i % 4 === 1
          ? 'rgba(63, 46, 33, 0.14)'
          : i % 4 === 2
          ? 'rgba(163, 230, 53, 0.06)'
          : 'rgba(15, 23, 42, 0.12)';
      tctx.beginPath();
      tctx.arc(gx, gy, r, 0, Math.PI * 2);
      tctx.fill();
    }
    const terrainTex = new THREE.CanvasTexture(terrainCanvas);
    terrainTex.wrapS = THREE.RepeatWrapping;
    terrainTex.wrapT = THREE.RepeatWrapping;
    terrainTex.repeat.set(55, 38);
    terrainTex.colorSpace = THREE.SRGBColorSpace;

    const terrainPbr = createExtreme3DPBRTextures('FOREST_FLOOR', 0x243b24, 38, 26);
    const groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1100, 750),
      new THREE.MeshStandardMaterial({
        map: terrainTex,
        bumpMap: terrainPbr.bumpMap,
        bumpScale: 0.14,
        roughness: 0.86,
      })
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    // 100x Bigger 3D Deep Eastern Jungle Floor with Extreme 3D Bump Relief
    const deepJunglePbr = createExtreme3DPBRTextures('FOREST_FLOOR', 0x112416, 28, 28);
    const forestFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(490, 750),
      new THREE.MeshStandardMaterial({
        color: 0x112416,
        map: deepJunglePbr.map,
        bumpMap: deepJunglePbr.bumpMap,
        bumpScale: 0.18,
        roughness: 0.92,
      })
    );
    forestFloor.rotation.x = -Math.PI / 2;
    forestFloor.position.set(295, 0.02, 0);
    forestFloor.receiveShadow = true;
    scene.add(forestFloor);

    // Extreme 3D Cobblestone Village Roads (ends at the Eastern River Bridge so the Deep Forest requires the Old Man's Map Arrows!)
    const roadPbr = createExtreme3DPBRTextures('COBBLESTONE_ROAD', 0x5c4938, 18, 2);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x6b5643,
      map: roadPbr.map,
      bumpMap: roadPbr.bumpMap,
      bumpScale: 0.16,
      roughness: 0.86,
    });
    const mainRoad = new THREE.Mesh(new THREE.PlaneGeometry(165, 4.8), roadMat);
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.set(-24, 0.03, -0.5);
    mainRoad.receiveShadow = true;
    scene.add(mainRoad);

    const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 750), roadMat);
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.position.set(-7.5, 0.03, 0);
    crossRoad.receiveShadow = true;
    scene.add(crossRoad);

    // Build 3D Anantha Padmanabha Swamy Temple, Reinforced Shelter, Village Houses & 3D Forest Map Guide Arrows
    const { envGroup, shelterGroup, gopuramTiers, forestArrowsGroup } = createTempleAndVillage3D();
    scene.add(envGroup);

    // 16 3D Farmland Squares (16 individual squares = 1 Acre; clicking with Hoe tills 1 square at a time!)
    const farmPlotMeshes: {
      soil: THREE.Mesh;
      shoots: THREE.Mesh;
    }[] = [];
    const farmSoilMeshes: { plotId: number; mesh: THREE.Mesh }[] = [];
    const soilPbr = createExtreme3DPBRTextures('TILLED_SOIL', 0x3b1d08, 1, 1);
    const untiledMat = new THREE.MeshStandardMaterial({
      color: 0x4d7c0f,
      bumpMap: terrainPbr.bumpMap,
      bumpScale: 0.1,
      roughness: 0.85,
    });
    const tilledMat = new THREE.MeshStandardMaterial({
      color: 0x3b1d08,
      map: soilPbr.map,
      bumpMap: soilPbr.bumpMap,
      bumpScale: 0.2,
      roughness: 0.9,
    });
    const shootMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.6 });

    farmPlotsRef.current.forEach((plot) => {
      const soil = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.2, 2.8), untiledMat);
      soil.position.set((plot.x - 460) * 0.1, 0.1, (plot.y - 280) * 0.1);
      soil.receiveShadow = true;
      scene.add(soil);
      farmSoilMeshes.push({ plotId: plot.id, mesh: soil });

      const shoots = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.9, 6), shootMat);
      shoots.position.set((plot.x - 460) * 0.1, 0.55, (plot.y - 280) * 0.1);
      shoots.visible = false;
      scene.add(shoots);

      farmPlotMeshes.push({ soil, shoots });
    });

    // 8 3D Choppable Village-Edge Forest Trees (5 Axe clicks = +1 Log)
    const treeGroups: { group: THREE.Group; canopy: THREE.Group }[] = [];
    const treeHitMeshes: { treeId: number; group: THREE.Object3D }[] = [];
    const barkPbr = createExtreme3DPBRTextures('TREE_BARK', 0x5c2d0c, 2, 3);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5c2d0c,
      map: barkPbr.map,
      bumpMap: barkPbr.bumpMap,
      bumpScale: 0.18,
      roughness: 0.88,
    });
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      bumpMap: terrainPbr.bumpMap,
      bumpScale: 0.08,
      roughness: 0.72,
    });

    treesRef.current.forEach((t) => {
      const tg = new THREE.Group();
      tg.position.set((t.x - 460) * 0.1, 0, (t.y - 280) * 0.1);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 3.2, 8), trunkMat);
      trunk.position.y = 1.6;
      trunk.castShadow = true;
      tg.add(trunk);

      const canopy = new THREE.Group();
      const c1 = new THREE.Mesh(new THREE.SphereGeometry(2.1, 12, 12), leafMat);
      c1.position.set(0, 3.8, 0);
      c1.castShadow = true;
      const c2 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 10, 10), leafMat);
      c2.position.set(0.9, 4.4, 0.5);
      const c3 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 10, 10), leafMat);
      c3.position.set(-0.9, 4.3, -0.5);
      canopy.add(c1, c2, c3);
      tg.add(canopy);

      scene.add(tg);
      treeGroups.push({ group: tg, canopy });
      treeHitMeshes.push({ treeId: t.id, group: tg });
    });

    // 5 3D Village NPCs
    const npcConfigs = [
      { pos: OLD_MAN_POS, color: 0x7e22ce, gender: 'male' as Gender, tool: 'sword' as ActiveTool },
      { pos: FARMER_POS, color: 0x15803d, gender: 'male' as Gender, tool: 'hoe' as ActiveTool },
      { pos: COOK_POS, color: 0xea580c, gender: 'female' as Gender, tool: 'sword' as ActiveTool },
      { pos: ANIMAL_OWNER_POS, color: 0x0284c7, gender: 'male' as Gender, tool: 'sword' as ActiveTool },
      { pos: BLACKSMITH_POS, color: 0x475569, gender: 'male' as Gender, tool: 'axe' as ActiveTool },
    ];
    npcConfigs.forEach((npc) => {
      const rig = createHumanRig({
        gender: npc.gender,
        role: 'NPC',
        timeline,
        primaryColor: npc.color,
      });
      updateHumanRig3D(rig, {
        x: npc.pos.x,
        z: npc.pos.y,
        facing: Math.PI,
        walkCycle: 0,
        attackAnim: 0,
        armored: false,
        powerfulSword: false,
        mounted: false,
        stealth: false,
        activeTool: npc.tool,
      });
      scene.add(rig);
    });

    // 3 Sculpted 3D Horses / Oxen standing in the Animal Owner's Corral (555..585, 315..355)
    const corralMounts: THREE.Group[] = [];
    [
      { x2d: 558, y2d: 312, yaw: -0.6 },
      { x2d: 575, y2d: 335, yaw: -1.2 },
      { x2d: 556, y2d: 356, yaw: -0.35 },
    ].forEach((cm) => {
      const m3d = createMount3D(timeline, false);
      m3d.position.set((cm.x2d - 460) * 0.1, 0, (cm.y2d - 280) * 0.1);
      m3d.rotation.y = cm.yaw;
      scene.add(m3d);
      corralMounts.push(m3d);
    });

    // 10 3D Buff Villager Allies
    const villagerRigs = villagersRef.current.map((v) => {
      const rig = createHumanRig({
        gender: v.id % 2 === 0 ? 'male' : 'female',
        role: 'ALLY',
        timeline,
        primaryColor: 0x15803d,
        armored: v.armed,
        mounted: v.armed,
      });
      scene.add(rig);
      return rig;
    });

    // 3D Player Avatar Rig
    const playerRig = createHumanRig({
      gender,
      role: 'PLAYER',
      timeline,
      armored: inventoryRef.current.fullIronArmour,
      powerfulSword: inventoryRef.current.powerfulSword,
      mounted: playerRef.current.mounted,
    });
    scene.add(playerRig);

    // 3D Friendly Guardian Spirit (Appears immediately when joining any timeline to guide the player!)
    const friendlySpirit = createFriendlySpirit3D();
    scene.add(friendlySpirit);

    // 3D Glowing Spirit Guide Beam on the ground (connects player -> Spirit -> target objective)
    const spiritBeamGeo = new THREE.PlaneGeometry(0.45, 1);
    spiritBeamGeo.translate(0, 0.5, 0);
    spiritBeamGeo.rotateX(-Math.PI / 2);
    const spiritBeamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const spiritBeamMesh = new THREE.Mesh(spiritBeamGeo, spiritBeamMat);
    spiritBeamMesh.position.y = 0.12;
    scene.add(spiritBeamMesh);

    // Dynamic Map of 3D Enemy Rigs (`enemy.id -> THREE.Group`)
    const enemyRigsMap = new Map<string, THREE.Group>();

    // 3D Boss Straight-Line Red Telegraph Corridor Mesh (7s before triggering, 100 damage)
    const bossLineGeo = new THREE.PlaneGeometry(6.2, 82);
    bossLineGeo.translate(0, 41, 0);
    bossLineGeo.rotateX(-Math.PI / 2);
    const bossLineMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const bossLineMesh = new THREE.Mesh(bossLineGeo, bossLineMat);
    bossLineMesh.position.y = 0.08;
    bossLineMesh.visible = false;
    scene.add(bossLineMesh);

    threeHitRef.current = { camera, groundPlane, farmSoilMeshes, treeHitMeshes };

    let animationFrameId: number;
    let lastTime = performance.now();

    const update = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const p = playerRef.current;
      const keys = keysRef.current;

      if (p.attackCooldown > 0) p.attackCooldown = Math.max(0, p.attackCooldown - dt);
      if (p.attackAnim > 0) p.attackAnim = Math.max(0, p.attackAnim - dt * 4.5);

      // 1. True 3rd-Person Player Movement (W/S Forward/Back, A/D Turn Left/Right, Q/E Strafe)
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

      const prevPlayerX = p.x;
      const prevPlayerY = p.y;
      const baseSpeed = p.mounted ? 340 : p.stealth ? 85 : 125;
      if (moveForward !== 0 || moveStrafe !== 0) {
        const fwdX = Math.cos(p.facing);
        const fwdY = Math.sin(p.facing);
        const rightX = -Math.sin(p.facing);
        const rightY = Math.cos(p.facing);

        const vx = fwdX * moveForward + rightX * moveStrafe;
        const vy = fwdY * moveForward + rightY * moveStrafe;
        const len = Math.hypot(vx, vy) || 1;

        p.x += (vx / len) * baseSpeed * dt;
        p.y += (vy / len) * baseSpeed * dt;
        p.walkCycle += dt * (p.mounted ? 4.2 : 2.2);
      } else if (p.targetX !== null && p.targetY !== null) {
        const tdx = p.targetX - p.x;
        const tdy = p.targetY - p.y;
        const dist = Math.hypot(tdx, tdy);
        const autoSpeed = p.mounted ? (dist > 400 ? 480 : baseSpeed) : baseSpeed;
        if (dist > 14) {
          p.x += (tdx / dist) * autoSpeed * dt;
          p.y += (tdy / dist) * autoSpeed * dt;
          const targetAngle = Math.atan2(tdy, tdx);
          const diff = Math.atan2(
            Math.sin(targetAngle - p.facing),
            Math.cos(targetAngle - p.facing)
          );
          p.facing += diff * Math.min(1, dt * 8);
          p.walkCycle += dt * (p.mounted ? 4.5 : 2.4);
        } else if (waypointsRef.current.length > 0) {
          const nextWp = waypointsRef.current.shift()!;
          p.targetX = nextWp.x;
          p.targetY = nextWp.y;
        } else {
          p.targetX = null;
          p.targetY = null;
          if (p.onArriveCallback) {
            const cb = p.onArriveCallback;
            p.onArriveCallback = null;
            cb();
          }
        }
      }

      // Solid 3D Building, Wall, Temple, House & River Collisions (Player cannot pass through buildings like a ghost!)
      const resolvedPos = resolveBuildingCollisions2D(
        prevPlayerX,
        prevPlayerY,
        p.x,
        p.y,
        11,
        shelterBuiltRef.current
      );
      p.x = resolvedPos.x;
      p.y = resolvedPos.y;

      // 100x Bigger Map Boundaries (10x Width x 10x Depth = 1100 x 750 in 3D world units)
      p.x = Math.max(-4950, Math.min(5850, p.x));
      p.y = Math.max(-3400, Math.min(3950, p.y));

      // Track if player ventured into the forest on Day 1, and allow sleeping as soon as they come back to the village on Day 1!
      if (dayRef.current === 1 && inventoryRef.current.hasMap) {
        if (p.x > 1050) {
          hasVisitedForestDay1Ref.current = true;
        } else if (hasVisitedForestDay1Ref.current && p.x < 900 && !isNightRef.current) {
          setIsNight(true);
          isNightRef.current = true;
        }
      }

      // Proximity [E] Interaction Check
      let promptText: string | null = null;
      if (Math.hypot(p.x - OLD_MAN_POS.x, p.y - OLD_MAN_POS.y) < 78 && !inventoryRef.current.hasMap) {
        promptText = 'Press [E] to Borrow Forest Map from Old Man (Reveals Forest Guide Arrows!)';
      } else if (
        Math.hypot(p.x - BED_POS.x, p.y - BED_POS.y) < 78 ||
        Math.hypot(p.x - HOUSE_POS.x, p.y - HOUSE_POS.y) < 62
      ) {
        promptText = isNightRef.current
          ? `Press [E] to Sleep in Bed until Day ${Math.min(6, dayRef.current + 1)} Morning`
          : 'Bed (Complete Today’s Quest First to Sleep at Night [E])';
      } else if (
        Math.hypot(p.x - SHELTER_SITE_POS.x, p.y - SHELTER_SITE_POS.y) < 85 &&
        !shelterBuiltRef.current &&
        inventoryRef.current.wallMaterials > 0
      ) {
        promptText = 'Press [E] to Build Villager Shelter (Day 3 Quest)';
      } else if (Math.hypot(p.x - FARMER_POS.x, p.y - FARMER_POS.y) < 95 && !farmerRewardClaimedRef.current) {
        promptText = 'Press [E] to Claim Farmer Reward (Requires 16/16 Tilled Squares)';
      } else if (
        Math.hypot(p.x - COOK_POS.x, p.y - COOK_POS.y) < 80 &&
        !cookTradedRef.current &&
        inventoryRef.current.riceBags >= 10
      ) {
        promptText = 'Press [E] to Trade 10 Rice for 50 Bowls of Curry-Rice';
      } else if (
        Math.hypot(p.x - ANIMAL_OWNER_POS.x, p.y - ANIMAL_OWNER_POS.y) < 80 &&
        !animalOwnerTradedRef.current &&
        inventoryRef.current.hayStacks >= 10
      ) {
        promptText = `Press [E] to Trade 10 Hay for 10 ${mountPlural}`;
      } else if (Math.hypot(p.x - BLACKSMITH_POS.x, p.y - BLACKSMITH_POS.y) < 80 && !blacksmithTradedRef.current) {
        promptText = 'Press [E] to Trade 50 Logs for Iron Armour & Swords';
      } else if (
        Math.hypot(p.x - 275, p.y - 275) < 95 &&
        buffVillagersArmedRef.current < 10 &&
        inventoryRef.current.mountsPool >= 10 &&
        inventoryRef.current.armourSetsPool >= 10
      ) {
        promptText = 'Press [E] to Equip All 10 Buff Villagers';
      } else if (
        Math.hypot(p.x - TEMPLE_POS.x, p.y - TEMPLE_POS.y) < 120 &&
        inventoryRef.current.stolenArtifacts &&
        !templeRebuiltRef.current
      ) {
        promptText = 'Press [E] to Rebuild Anantha Padmanabha Swamy Temple (Day 6)';
      }
      setNearbyPrompt(promptText);

      // Reveal & Pulse 3D Forest Map Guide Arrows ONLY on Day 1 after borrowing the Map from the Old Man!
      forestArrowsGroup.visible = inventoryRef.current.hasMap && dayRef.current === 1;
      if (forestArrowsGroup.visible) {
        forestArrowsGroup.children.forEach((arrowObj, idx) => {
          arrowObj.position.y = 0.58 + Math.sin(now * 0.005 + idx * 0.6) * 0.14;
        });
      }

      // Sync 3D Farm Plots & 3D Trees
      farmPlotsRef.current.forEach((plot, idx) => {
        const meshPair = farmPlotMeshes[idx];
        if (meshPair) {
          meshPair.soil.material = plot.tilled ? tilledMat : untiledMat;
          meshPair.shoots.visible = plot.tilled;
        }
      });

      treesRef.current.forEach((tree, idx) => {
        if (tree.shakeTimer > 0) tree.shakeTimer = Math.max(0, tree.shakeTimer - dt);
        // Each tree can give a strict maximum of 10 logs (no regrowth once all 10 logs are harvested)
        const t3d = treeGroups[idx];
        if (t3d) {
          t3d.canopy.visible = tree.logsRemaining > 0;
          t3d.group.rotation.z =
            tree.shakeTimer > 0 ? Math.sin(tree.shakeTimer * 45) * 0.14 : 0;
        }
      });

      // Slow construction progression for the 3D Villager Shelter (~10 seconds from 0% to 100%)
      if (shelterBuildingRef.current && !shelterBuiltRef.current) {
        const prevFloor = Math.floor(shelterProgressRef.current);
        shelterProgressRef.current = Math.min(100, shelterProgressRef.current + dt * 10);
        const nextFloor = Math.floor(shelterProgressRef.current);
        if (nextFloor !== prevFloor) {
          setShelterProgress(nextFloor);
          const remainingMats = Math.max(0, 100 - nextFloor);
          updateInventory((prev) => ({ ...prev, wallMaterials: remainingMats }));
          if (nextFloor % 20 === 0 && nextFloor < 100) {
            sound.playGather();
            showToast(`Building Villager Shelter... ${nextFloor}% Complete`);
          }
        }
        if (shelterProgressRef.current >= 100) {
          shelterProgressRef.current = 100;
          shelterBuildingRef.current = false;
          shelterBuiltRef.current = true;
          setShelterProgress(100);
          setShelterBuilding(false);
          setShelterBuilt(true);
          isNightRef.current = true;
          setIsNight(true);
          updateInventory((prev) => ({ ...prev, wallMaterials: 0 }));
          sound.playTeleport();
          showToast(
            'Villager Shelter Completed (100%)! Night has fallen on Day 3 — follow the Spirit to your Bed [E] to sleep!'
          );
          setStatusBanner(
            `Day 3 Night: The Reinforced Shelter for all the villagers is complete! Follow the Friendly Spirit back to your Village House Bed [E] to sleep until Day 4!`
          );
          setSpiritBanner(`Friendly Spirit: "Follow me!"`);
        }
      }

      // Sync 3D Temple Restoration & Gradual 3D Reinforced Shelter Construction
      const shelterActive = shelterBuiltRef.current || shelterProgressRef.current > 0;
      shelterGroup.visible = shelterActive;
      if (shelterActive) {
        const buildRatio = shelterBuiltRef.current
          ? 1
          : Math.max(0.05, shelterProgressRef.current / 100);
        shelterGroup.scale.set(1, buildRatio, 1);
        shelterGroup.position.y = (1 - buildRatio) * -1.4;
      }
      // Slow reconstruction progression for the 3D Anantha Padmanabha Swamy Temple (~10 seconds from 0% to 100%)
      if (templeRebuildingRef.current && !templeRebuiltRef.current) {
        const prevFloor = Math.floor(templeProgressRef.current);
        templeProgressRef.current = Math.min(100, templeProgressRef.current + dt * 10);
        const nextFloor = Math.floor(templeProgressRef.current);
        if (nextFloor !== prevFloor) {
          setTempleProgress(nextFloor);
          if (nextFloor % 20 === 0 && nextFloor < 100) {
            sound.playGather();
            showToast(`Reconstructing Anantha Padmanabha Swamy Temple... ${nextFloor}% Complete`);
          }
        }
        if (templeProgressRef.current >= 100) {
          templeProgressRef.current = 100;
          templeRebuildingRef.current = false;
          templeRebuiltRef.current = true;
          setTempleProgress(100);
          setTempleRebuilding(false);
          setTempleRebuilt(true);
          setTempleHp(2000);
          templeHpRef.current = 2000;
          sound.playTeleport();
          showToast(
            'Day 6 Victory: Anantha Padmanabha Swamy Temple Rebuilt (100%) with all Recovered Artifacts!'
          );
          setTeleportCountdown(5.0);
        }
      }

      if (templeRebuiltRef.current || templeProgressRef.current > 0) {
        const ratio = templeRebuiltRef.current ? 1 : templeProgressRef.current / 100;
        const gildedCount = Math.ceil(ratio * gopuramTiers.length);
        gopuramTiers.forEach((tier, idx) => {
          if (idx < gildedCount) {
            (tier.material as THREE.MeshStandardMaterial).color.setHex(0xfbbf24);
            (tier.material as THREE.MeshStandardMaterial).metalness = 0.75;
          }
        });
      }

      //Sync Day/Night Sky Lighting
      const targetSky = isNightRef.current ? nightSkyColor : daySkyColor;
      (scene.background as THREE.Color).setHex(targetSky);
      (scene.fog as THREE.FogExp2).color.setHex(targetSky);
      sunLight.intensity = isNightRef.current ? 0.35 : 2.1;

      // 2. Day 4 Army Spawner (50 3D Enemy Soldiers with 500 HP and 20 Damage)
      if (dayRef.current === 4 && raidSpawnQueueRef.current > 0) {
        raidSpawnTimerRef.current -= dt;
        if (raidSpawnTimerRef.current <= 0 && enemiesRef.current.length < 12) {
          raidSpawnTimerRef.current = 0.55;
          const batch = Math.min(3, raidSpawnQueueRef.current);
          for (let i = 0; i < batch; i++) {
            const soldierNum = 50 - raidSpawnQueueRef.current + 1;
            raidSpawnQueueRef.current--;
            enemiesRef.current.push({
              id: `raid-soldier-${soldierNum}`,
              type: 'RAID_SOLDIER',
              name:
                timeline === 'MEDIEVAL'
                  ? `Raid Soldier #${soldierNum}`
                  : `British Redcoat #${soldierNum}`,
              x: 865 + (i % 2) * 15,
              y: 130 + ((soldierNum * 47) % 320),
              vx: 0,
              vy: 0,
              hp: 500,
              maxHp: 500,
              damage: 20,
              speed: 78,
              attackCooldown: 0,
              attackAnim: 0,
              walkCycle: soldierNum * 0.5,
              facing: Math.PI,
              patrolOriginX: 865,
              patrolOriginY: 275,
              patrolAngle: 0,
              alerted: true,
              hitFlash: 0,
            });
          }
        }
      }

      // 3. Update 10 3D Armed Buff Villagers (Deal 20 DMG & Can Take Damage!)
      villagersRef.current.forEach((ally, idx) => {
        const vRig = villagerRigs[idx];
        if (ally.hp <= 0) {
          if (vRig) vRig.visible = false;
          return;
        }
        if (vRig) vRig.visible = true;

        if (ally.attackCooldown > 0) ally.attackCooldown = Math.max(0, ally.attackCooldown - dt);
        if (ally.attackAnim > 0) ally.attackAnim = Math.max(0, ally.attackAnim - dt * 4);

        if (ally.armed && enemiesRef.current.length > 0) {
          let nearest: EnemyEntity | null = null;
          let minDist = Infinity;
          for (const e of enemiesRef.current) {
            const d = Math.hypot(e.x - ally.x, e.y - ally.y);
            if (d < minDist) {
              minDist = d;
              nearest = e;
            }
          }
          if (nearest) {
            const dxE = nearest.x - ally.x;
            const dyE = nearest.y - ally.y;
            ally.facing = Math.atan2(dyE, dxE);
            if (minDist > 44) {
              ally.x += (dxE / minDist) * 150 * dt;
              ally.y += (dyE / minDist) * 150 * dt;
              ally.walkCycle += dt * 3.8;
            } else if (ally.attackCooldown <= 0) {
              ally.attackCooldown = 0.62;
              ally.attackAnim = 1.0;
              const allyDmg = 20;
              nearest.hp = Math.max(0, nearest.hp - allyDmg);
            }
          }
        } else {
          const homeX = 255 + (idx % 2) * 38;
          const homeY = 185 + Math.floor(idx / 2) * 44;
          const dHome = Math.hypot(homeX - ally.x, homeY - ally.y);
          if (dHome > 4) {
            ally.x += ((homeX - ally.x) / dHome) * 85 * dt;
            ally.y += ((homeY - ally.y) / dHome) * 85 * dt;
            ally.walkCycle += dt * 2.2;
          }
        }

        if (vRig) {
          updateHumanRig3D(vRig, {
            x: ally.x,
            z: ally.y,
            facing: ally.facing,
            walkCycle: ally.walkCycle,
            attackAnim: ally.attackAnim,
            armored: ally.armed,
            powerfulSword: false,
            mounted: ally.armed,
            stealth: false,
            activeTool: 'sword',
            hpRatio: ally.hp / ally.maxHp,
          });
        }
      });

      // 4. Update 3D Human Enemies & Final Boss 100-Damage Straight-Line Attack
      const survivingEnemies: EnemyEntity[] = [];
      const activeIds = new Set<string>();
      let newlyDefeatedDay1 = 0;
      let newlyDefeatedRaid = 0;
      let bossJustDied = false;
      bossLineMesh.visible = false;

      enemiesRef.current.forEach((enemy) => {
        if (enemy.attackCooldown > 0) enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
        if (enemy.attackAnim > 0) enemy.attackAnim = Math.max(0, enemy.attackAnim - dt * 4);

        if (Math.abs(enemy.vx) > 0.5 || Math.abs(enemy.vy) > 0.5) {
          enemy.x += enemy.vx * dt;
          enemy.y += enemy.vy * dt;
          enemy.vx *= Math.pow(0.04, dt);
          enemy.vy *= Math.pow(0.04, dt);
        }

        if (enemy.hp <= 0) {
          if (enemy.type === 'WEAK_GUARD') newlyDefeatedDay1++;
          if (enemy.type === 'RAID_SOLDIER') newlyDefeatedRaid++;
          if (enemy.type === 'FINAL_BOSS') bossJustDied = true;
          const oldRig = enemyRigsMap.get(enemy.id);
          if (oldRig) {
            scene.remove(oldRig);
            enemyRigsMap.delete(enemy.id);
          }
          return;
        }

        activeIds.add(enemy.id);
        let eRig = enemyRigsMap.get(enemy.id);
        if (!eRig) {
          eRig = createHumanRig({
            gender: 'male',
            role: enemy.type,
            timeline,
            armored: enemy.type !== 'WEAK_GUARD',
          });
          scene.add(eRig);
          enemyRigsMap.set(enemy.id, eRig);
        }

        // FINAL BOSS 100-Damage Straight-Line Attack (7s Red Telegraph + 7s Cooldown)
        if (enemy.type === 'FINAL_BOSS') {
          setBossHp(Math.ceil(enemy.hp));
          if (enemy.lineAttackState === 'TELEGRAPH') {
            enemy.lineAttackTimer = (enemy.lineAttackTimer || 7) - dt;
            setBossLineStatus({
              state: 'TELEGRAPH',
              timer: Math.max(0, enemy.lineAttackTimer),
            });

            // Show 3D Red Straight-Line Telegraph on Ground
            bossLineMesh.visible = true;
            bossLineMesh.position.set((enemy.x - 460) * 0.1, 0.08, (enemy.y - 280) * 0.1);
            bossLineMesh.rotation.y = Math.PI / 2 - (enemy.lineAngle || 0);
            bossLineMat.color.setHex(0xef4444);
            bossLineMat.opacity = 0.45 + Math.sin(now * 0.015) * 0.2;

            if (enemy.lineAttackTimer <= 0) {
              enemy.lineAttackState = 'FIRING';
              enemy.lineAttackTimer = 0.55;
              sound.playBossLaserBlast();

              const angle = enemy.lineAngle || 0;
              const cosA = Math.cos(angle);
              const sinA = Math.sin(angle);
              const relX = p.x - enemy.x;
              const relY = p.y - enemy.y;
              const proj = relX * cosA + relY * sinA;
              const perpDist = Math.abs(-relX * sinA + relY * cosA);

              // Boss straight-line beam also damages any armed Buff Villagers in its path!
              villagersRef.current.forEach((ally) => {
                if (ally.armed && ally.hp > 0) {
                  const vRelX = ally.x - enemy.x;
                  const vRelY = ally.y - enemy.y;
                  const vProj = vRelX * cosA + vRelY * sinA;
                  const vPerp = Math.abs(-vRelX * sinA + vRelY * cosA);
                  if (vProj >= -20 && vProj <= 820 && vPerp <= 34) {
                    ally.hp = Math.max(0, ally.hp - 100);
                  }
                }
              });

              if (proj >= -20 && proj <= 820 && perpDist <= 34) {
                const dmgTaken = p.isBlocking ? 40 : 100;
                p.hp = Math.max(0, p.hp - dmgTaken);
                if (p.hp <= 0) {
                  p.x = 378;
                  p.y = 98;
                  p.hp = p.maxHp;
                  setPlayerHp(p.maxHp);
                  showToast(`Knocked out by Boss Straight-Line Attack! Respawned at Village House.`);
                } else {
                  setPlayerHp(p.hp);
                  showToast(`Struck by Boss Straight-Line Attack (-${dmgTaken} HP)!`);
                }
              } else {
                showToast('Dodged Boss 100-DMG Straight-Line Attack!');
              }
            }
          } else if (enemy.lineAttackState === 'FIRING') {
            enemy.lineAttackTimer = (enemy.lineAttackTimer || 0.5) - dt;
            setBossLineStatus({
              state: 'FIRING',
              timer: Math.max(0, enemy.lineAttackTimer),
            });
            bossLineMesh.visible = true;
            bossLineMat.color.setHex(0xfef08a);
            bossLineMat.opacity = 0.9;
            if (enemy.lineAttackTimer <= 0) {
              enemy.lineAttackState = 'COOLDOWN';
              enemy.lineAttackTimer = 7.0;
            }
          } else {
            enemy.lineAttackTimer = (enemy.lineAttackTimer || 7) - dt;
            setBossLineStatus({
              state: 'COOLDOWN',
              timer: Math.max(0, enemy.lineAttackTimer),
            });
            if (enemy.lineAttackTimer <= 0) {
              enemy.lineAttackState = 'TELEGRAPH';
              enemy.lineAttackTimer = 7.0;
              enemy.lineAngle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
            }
          }
        }

        // Patrol & Vision Cone Detection
        const distToPlayer = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        if (!enemy.alerted && enemy.type === 'WEAK_GUARD') {
          enemy.patrolAngle += dt * 0.85;
          enemy.facing = Math.PI + Math.sin(enemy.patrolAngle) * 0.55;

          const coneRange = p.stealth ? 75 : 175;
          const angleToPlayer = Math.atan2(p.y - enemy.y, p.x - enemy.x);
          const angleDiff = Math.atan2(
            Math.sin(angleToPlayer - enemy.facing),
            Math.cos(angleToPlayer - enemy.facing)
          );
          if (distToPlayer <= coneRange && Math.abs(angleDiff) <= 0.52) {
            enemy.alerted = true;
          } else if (distToPlayer <= (p.stealth ? 38 : 85)) {
            enemy.alerted = true;
          }
        }

        if (enemy.alerted) {
          // Enemies target whichever is closer: the Player or any living Armed Buff Villager!
          let nearestAlly: BuffVillagerAlly | null = null;
          let minAllyDist = Infinity;
          for (const ally of villagersRef.current) {
            if (ally.armed && ally.hp > 0) {
              const dA = Math.hypot(ally.x - enemy.x, ally.y - enemy.y);
              if (dA < minAllyDist) {
                minAllyDist = dA;
                nearestAlly = ally;
              }
            }
          }

          const targetIsAlly = nearestAlly !== null && minAllyDist < distToPlayer;
          const targetX = targetIsAlly
            ? nearestAlly!.x
            : enemy.type === 'RAID_SOLDIER' && distToPlayer > 220
            ? TEMPLE_POS.x + 85
            : p.x;
          const targetY = targetIsAlly
            ? nearestAlly!.y
            : enemy.type === 'RAID_SOLDIER' && distToPlayer > 220
            ? TEMPLE_POS.y
            : p.y;

          const edx = targetX - enemy.x;
          const edy = targetY - enemy.y;
          const edist = Math.hypot(edx, edy);
          enemy.facing = Math.atan2(edy, edx);

          const canMove =
            enemy.type !== 'FINAL_BOSS' || enemy.lineAttackState !== 'FIRING';

          if (edist > 36 && canMove) {
            enemy.x += (edx / edist) * enemy.speed * dt;
            enemy.y += (edy / edist) * enemy.speed * dt;
            enemy.walkCycle += dt * 3.0;
          }

          // Enemy melee attack deals damage to either the targeted Buff Villager or the Player!
          if (targetIsAlly && nearestAlly && minAllyDist <= 46 && enemy.attackCooldown <= 0) {
            enemy.attackCooldown = 1.15;
            enemy.attackAnim = 1.0;
            sound.playHit();
            nearestAlly.hp = Math.max(0, nearestAlly.hp - enemy.damage);
          } else if (distToPlayer <= 46 && enemy.attackCooldown <= 0) {
            enemy.attackCooldown = 1.15;
            enemy.attackAnim = 1.0;
            const rawDmg = enemy.damage;
            const dmgDealt = p.isBlocking ? Math.ceil(rawDmg * 0.35) : rawDmg;
            if (p.isBlocking) {
              sound.playParry();
            } else {
              sound.playHit();
            }
            p.hp = Math.max(0, p.hp - dmgDealt);
            if (p.hp <= 0) {
              p.x = 378;
              p.y = 98;
              p.hp = p.maxHp;
              setPlayerHp(p.maxHp);
              showToast(`You took -${dmgDealt} DMG and were knocked out! Respawned at Village House.`);
            } else {
              setPlayerHp(p.hp);
            }
          }
        }

        updateHumanRig3D(eRig, {
          x: enemy.x,
          z: enemy.y,
          facing: enemy.facing,
          walkCycle: enemy.walkCycle,
          attackAnim: enemy.attackAnim,
          armored: enemy.type !== 'WEAK_GUARD',
          powerfulSword: false,
          mounted: enemy.type === 'FINAL_BOSS',
          stealth: p.stealth,
          activeTool: 'sword',
          hpRatio: enemy.hp / enemy.maxHp,
          alerted: enemy.alerted,
        });

        survivingEnemies.push(enemy);
      });

      // Clean up any stale enemy rigs
      for (const [id, rig] of enemyRigsMap.entries()) {
        if (!activeIds.has(id)) {
          scene.remove(rig);
          enemyRigsMap.delete(id);
        }
      }

      enemiesRef.current = survivingEnemies;

      // Day 1 Weak Guard Defeat Progression -> Collect materials & return to village to sleep (Once Only!)
      if (newlyDefeatedDay1 > 0) {
        setCampGuardsDefeated((prev) => {
          const next = Math.min(10, prev + newlyDefeatedDay1);
          campGuardsDefeatedRef.current = next;
          if (next === 10 && !day1GuardsRewardClaimedRef.current) {
            day1GuardsRewardClaimedRef.current = true;
            setIsNight(true);
            isNightRef.current = true;
            updateInventory((inv) => ({
              ...inv,
              fullIronArmour: true,
              powerfulSword: true,
              wallMaterials: 100,
              personalMount: true,
            }));
            playerRef.current.maxHp = 500;
            playerRef.current.hp = 500;
            playerRef.current.damage = 50;
            playerRef.current.mounted = true;
            setPlayerMaxHp(500);
            setPlayerHp(500);
            setPlayerDamage(50);
            setMounted(true);
            sound.playTeleport();
            showToast(
              `10 Day 1 Enemy Guards Defeated! Collected Shelter Materials, Full Iron Armour, Powerful Sword & ${mountName}! Return to the Village House to Sleep [E]!`
            );
            setStatusBanner(
              `Day 1 Night: You defeated the 10 Guards and collected Shelter Materials, Full Iron Armour (500 HP), Powerful Sword (50 DMG) & your ${mountName}! Ride back to the Village House and press [E] by your Bed to Sleep until Day 2 Morning!`
            );
          }
          return next;
        });
      }

      // Day 4 Army of 50 Enemy Soldiers Defeat Progression -> Sleep to wake on Day 5!
      if (newlyDefeatedRaid > 0) {
        setRaidSoldiersDefeated((prev) => {
          const next = Math.min(50, prev + newlyDefeatedRaid);
          raidSoldiersDefeatedRef.current = next;
          if (next === 50 && prev < 50) {
            setIsNight(true);
            isNightRef.current = true;
            sound.playTeleport();
            showToast('All 50 Enemy Soldiers Defeated on Day 4! Return to your Bed [E] to sleep until Day 5!');
            setStatusBanner(
              `Day 4 Night: You defeated the entire army of 50 enemy soldiers! Return to your Village House Bed [E] to sleep until Day 5 (when the Final Boss arrives)!`
            );
            setSpiritBanner(
              `Friendly Spirit: "All 50 enemy soldiers have fallen! Follow me back to your Village House and press [E] by your Bed to sleep — tomorrow on Day 5, the Final Boss arrives!"`
            );
          }
          return next;
        });
      }

      // Day 5 Final Boss Defeat Progression -> Gives all Stolen Artifacts (Once Only!) & unlocks Sleep to wake on Day 6!
      if (bossJustDied && !bossDefeatedRef.current) {
        bossDefeatedRef.current = true;
        setBossHp(0);
        setBossLineStatus(null);
        setBossDefeated(true);
        setIsNight(true);
        isNightRef.current = true;
        updateInventory((prev) => ({ ...prev, stolenArtifacts: true }));
        sound.playTeleport();
        showToast('Day 5 Boss Defeated & All Stolen Temple Artifacts Recovered! Sleep in your Bed [E] for Day 6!');
        setStatusBanner(
          `Day 5 Night: You defeated the ${bossTitle} and recovered all the Stolen Temple Artifacts! Return to your Village House Bed [E] and sleep to wake up on Day 6!`
        );
        setSpiritBanner(
          `Friendly Spirit: "You vanquished the ${bossTitle} and recovered all the stolen artifacts! Follow me back to your house bed [E] to sleep and wake up on Day 6 morning to rebuild the Temple!"`
        );
      }

      // Gentle idle animation for the 3D Corral Horses / Oxen beside the Animal Owner
      corralMounts.forEach((cm, idx) => {
        const mData = cm.userData;
        if (mData?.tailPivot) {
          mData.tailPivot.rotation.z = Math.sin(now * 0.003 + idx * 1.4) * 0.2;
        }
        if (mData?.headNeckGroup) {
          mData.headNeckGroup.rotation.x = Math.sin(now * 0.002 + idx) * 0.05;
        }
      });

      // Update 3D Player Rig (including 3D overhead HP bar ratio!)
      updateHumanRig3D(playerRig, {
        x: p.x,
        z: p.y,
        facing: p.facing,
        walkCycle: p.walkCycle,
        attackAnim: p.attackAnim,
        armored: inventoryRef.current.fullIronArmour,
        powerfulSword: inventoryRef.current.powerfulSword,
        mounted: p.mounted,
        stealth: p.stealth,
        activeTool: p.activeTool,
        isBlocking: p.isBlocking,
        hpRatio: p.hp / p.maxHp,
      });

      // 5. Update 3D Friendly Guardian Spirit:
      // - Day 1 BEFORE taking map: Spirit is VISIBLE and guides player to Old Man to take map.
      // - Day 1 AFTER taking map: Spirit shows the arrows and DISAPPEARS for the rest of Day 1!
      // - Day 2 Morning onwards: Spirit WAKES the player up and is VISIBLE again to guide through Days 2–6!
      const spiritShouldBeVisible =
        dayRef.current === 1 ? !inventoryRef.current.hasMap : true;
      friendlySpirit.visible = spiritShouldBeVisible;
      spiritBeamMesh.visible = spiritShouldBeVisible;

      if (spiritShouldBeVisible) {
        let spiritGuideTarget = { x: OLD_MAN_POS.x, y: OLD_MAN_POS.y };
        const playerInsideHouse = p.x > 332 && p.x < 418 && p.y > 58 && p.y < 131;

        if (dayRef.current === 1 && !inventoryRef.current.hasMap) {
          // Day 1: Guide player out of house door first, then straight to Old Man Next Door to take the Map
          spiritGuideTarget = playerInsideHouse
            ? HOUSE_DOOR_OUTSIDE_POS
            : { x: OLD_MAN_POS.x - 18, y: OLD_MAN_POS.y + 18 };
        } else if (isNightRef.current) {
          // Whenever night falls after completing the day's objective, guide player back to the House Bed to sleep!
          if (!playerInsideHouse && Math.hypot(p.x - HOUSE_DOOR_OUTSIDE_POS.x, p.y - HOUSE_DOOR_OUTSIDE_POS.y) > 48) {
            spiritGuideTarget = HOUSE_DOOR_OUTSIDE_POS;
          } else {
            spiritGuideTarget = BED_POS;
          }
        } else if (dayRef.current === 2) {
          // Day 2: After the player finishes 1 quest, the Friendly Spirit guides them to the next quest and so on!
          if (!farmerRewardClaimedRef.current) {
            const nextUntilledPlot = farmPlotsRef.current.find((pl) => !pl.tilled);
            spiritGuideTarget = nextUntilledPlot
              ? { x: nextUntilledPlot.x, y: nextUntilledPlot.y }
              : FARMER_POS;
          } else if (!cookTradedRef.current) {
            spiritGuideTarget = COOK_POS;
          } else if (!animalOwnerTradedRef.current) {
            spiritGuideTarget = ANIMAL_OWNER_POS;
          } else if (!blacksmithTradedRef.current) {
            if (inventoryRef.current.logs < 50) {
              const nextTree =
                treesRef.current.find((t) => t.logsRemaining > 0) ?? treesRef.current[0];
              spiritGuideTarget = nextTree
                ? { x: nextTree.x, y: nextTree.y }
                : BLACKSMITH_POS;
            } else {
              spiritGuideTarget = BLACKSMITH_POS;
            }
          } else {
            spiritGuideTarget = { x: 275, y: 275 };
          }
        } else if (dayRef.current === 3) {
          // Day 3: Guide player to build the Villager Shelter!
          spiritGuideTarget = SHELTER_SITE_POS;
        } else if (dayRef.current === 4 || dayRef.current === 5) {
          // Day 4 (50 Soldiers) & Day 5 (Final Boss): Guide toward nearest active enemy
          const firstEnemy = enemiesRef.current[0];
          spiritGuideTarget = firstEnemy
            ? { x: firstEnemy.x, y: firstEnemy.y }
            : BED_POS;
        } else {
          // Day 6: Guide player to rebuild the Anantha Padmanabha Swamy Temple!
          spiritGuideTarget = TEMPLE_POS;
        }

        const gdx = spiritGuideTarget.x - p.x;
        const gdy = spiritGuideTarget.y - p.y;
        const gdist = Math.hypot(gdx, gdy) || 1;
        const spiritStep = Math.min(44, Math.max(22, gdist * 0.55));
        const spiritX2d = p.x + (gdx / gdist) * spiritStep;
        const spiritY2d = p.y + (gdy / gdist) * spiritStep;
        updateFriendlySpirit3D(friendlySpirit, spiritX2d, spiritY2d, now * 0.001);

        // Orient & scale the glowing ground guide beam from the player toward the Friendly Spirit's target
        spiritBeamMesh.position.set((p.x - 460) * 0.1, 0.12, (p.y - 280) * 0.1);
        spiritBeamMesh.rotation.y = Math.PI / 2 - Math.atan2(gdy, gdx);
        const beamLen3d = Math.min(8.5, Math.max(1.8, gdist * 0.1));
        spiritBeamMesh.scale.set(1, 1, beamLen3d);
        spiritBeamMat.opacity = 0.45 + Math.sin(now * 0.008) * 0.22;
      }

      // Smooth 3D Camera Choreography (True 3rd-Person Behind-the-Back Chase Cam vs Tactical Overview)
      const px3d = (p.x - 460) * 0.1;
      const pz3d = (p.y - 280) * 0.1;
      const fwdX3d = Math.cos(p.facing);
      const fwdZ3d = Math.sin(p.facing);

      if (cameraModeRef.current === 'FOLLOW') {
        const camDist = p.mounted ? 7.2 : 5.6;
        const camHeight = p.mounted ? 3.8 : 3.0;
        const desiredCamPos = new THREE.Vector3(
          px3d - fwdX3d * camDist,
          camHeight,
          pz3d - fwdZ3d * camDist
        );
        camera.position.lerp(desiredCamPos, 0.14);
        camera.lookAt(px3d + fwdX3d * 6.0, p.mounted ? 2.1 : 1.7, pz3d + fwdZ3d * 6.0);
      } else {
        const overviewPos = new THREE.Vector3(px3d, 165, pz3d + 135);
        camera.position.lerp(overviewPos, 0.08);
        camera.lookAt(px3d, 0, pz3d);
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [gender, timeline]);

  // 3D Viewport Click Handler:
  // - Clicking NEVER makes the player move!
  // - Clicking with a Sword deals damage to enemies.
  // - Clicking with an Axe 5 times on a log/tree gives +1 Log.
  // - Clicking with a Hoe on the farmland tills ONLY 1 single square of land (never the full acre!).
  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = mountContainerRef.current;
    const hitCtx = threeHitRef.current;
    if (!container || !hitCtx) {
      performPrimaryAction();
      return;
    }

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, hitCtx.camera);

    let clickedPlotId: number | undefined;
    let clickedTreeId: number | undefined;

    // Check if the player clicked a specific Farmland Square
    const soilMeshes = hitCtx.farmSoilMeshes.map((f) => f.mesh);
    const soilHits = raycaster.intersectObjects(soilMeshes, false);
    if (soilHits.length > 0) {
      const matched = hitCtx.farmSoilMeshes.find((f) => f.mesh === soilHits[0].object);
      if (matched) clickedPlotId = matched.plotId;
    }

    // Check if the player clicked a specific Forest Tree / Log
    const treeObjs = hitCtx.treeHitMeshes.map((t) => t.group);
    const treeHits = raycaster.intersectObjects(treeObjs, true);
    if (treeHits.length > 0) {
      const hitObj = treeHits[0].object;
      const matchedTree = hitCtx.treeHitMeshes.find(
        (t) => t.group === hitObj || t.group === hitObj.parent || t.group === hitObj.parent?.parent
      );
      if (matchedTree) clickedTreeId = matchedTree.treeId;
    }

    const hits = raycaster.intersectObject(hitCtx.groundPlane);
    if (hits.length > 0) {
      const pt = hits[0].point;
      const cx = pt.x * 10 + 460;
      const cy = pt.z * 10 + 280;
      const p = playerRef.current;
      p.facing = Math.atan2(cy - p.y, cx - p.x);
    }

    performPrimaryAction(clickedPlotId, clickedTreeId);
  };

  return (
    <div
      onClick={handleViewportClick}
      className="relative w-screen h-screen overflow-hidden bg-[#090d16] text-slate-100 select-none"
    >
      <div ref={mountContainerRef} className="w-full h-full" />

      {/* Contextual Proximity Interaction Prompt */}
      {nearbyPrompt && !templeRebuilt && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleContextualInteract();
          }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-slate-950/92 border border-amber-500/70 flex items-center gap-3 shadow-lg cursor-pointer z-10"
        >
          <span className="text-xs font-semibold text-amber-300">{nearbyPrompt}</span>
          <button className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition-colors whitespace-nowrap">
            Interact [E]
          </button>
        </div>
      )}

      {/* 10 INVENTORY SLOTS ON THE BOTTOM MIDDLE AREA OF THE GAME SCREEN (1st 3: Axe, Sword, Hoe) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-2.5 flex justify-center px-2 z-10"
      >
        <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/95 border-2 border-slate-700/90 shadow-2xl flex items-center gap-1.5">
          {[
            {
              slot: 1,
              keyLabel: '1',
              name: 'Axe',
              sub: '1 Click=1 Log',
              icon: '🪓',
              active: selectedSlot === 1,
              filled: true,
              onClick: () => handleSelectInventorySlot(1),
            },
            {
              slot: 2,
              keyLabel: '2',
              name: inventory.powerfulSword ? 'Pwr Sword' : 'Sword',
              sub: `${playerDamage} DMG`,
              icon: '⚔️',
              active: selectedSlot === 2,
              filled: true,
              onClick: () => handleSelectInventorySlot(2),
            },
            {
              slot: 3,
              keyLabel: '3',
              name: 'Hoe',
              sub: `${inventory.tilledPlots}/16 Sq`,
              icon: '⛏️',
              active: selectedSlot === 3,
              filled: true,
              onClick: () => handleSelectInventorySlot(3),
            },
            {
              slot: 4,
              keyLabel: '4',
              name: inventory.hasMap ? 'Forest Map' : 'Empty',
              sub: inventory.hasMap ? 'Arrows ON' : '',
              icon: inventory.hasMap ? '🗺️' : '',
              active: selectedSlot === 4,
              filled: inventory.hasMap,
              onClick: () => handleSelectInventorySlot(4),
            },
            {
              slot: 5,
              keyLabel: '5',
              name: inventory.curryRiceBowls > 0 ? 'Curry-Rice' : 'Empty',
              sub: inventory.curryRiceBowls > 0 ? `x${inventory.curryRiceBowls}` : '',
              icon: inventory.curryRiceBowls > 0 ? '🍛' : '',
              active: selectedSlot === 5,
              filled: inventory.curryRiceBowls > 0,
              onClick: () => handleSelectInventorySlot(5, true),
            },
            {
              slot: 6,
              keyLabel: '6',
              name: inventory.logs > 0 ? 'Logs' : 'Empty',
              sub: inventory.logs > 0 ? `${inventory.logs}/50` : '',
              icon: inventory.logs > 0 ? '🪵' : '',
              active: selectedSlot === 6,
              filled: inventory.logs > 0,
              onClick: () => handleSelectInventorySlot(6),
            },
            {
              slot: 7,
              keyLabel: '7',
              name: inventory.riceBags > 0 ? 'Rice Bags' : 'Empty',
              sub: inventory.riceBags > 0 ? `x${inventory.riceBags}` : '',
              icon: inventory.riceBags > 0 ? '🌾' : '',
              active: selectedSlot === 7,
              filled: inventory.riceBags > 0,
              onClick: () => handleSelectInventorySlot(7),
            },
            {
              slot: 8,
              keyLabel: '8',
              name: inventory.hayStacks > 0 ? 'Hay Stacks' : 'Empty',
              sub: inventory.hayStacks > 0 ? `x${inventory.hayStacks}` : '',
              icon: inventory.hayStacks > 0 ? '🌿' : '',
              active: selectedSlot === 8,
              filled: inventory.hayStacks > 0,
              onClick: () => handleSelectInventorySlot(8),
            },
            {
              slot: 9,
              keyLabel: '9',
              name: inventory.fullIronArmour ? 'Iron Armour' : 'Empty',
              sub: inventory.fullIronArmour ? '500 HP' : '',
              icon: inventory.fullIronArmour ? '🛡️' : '',
              active: selectedSlot === 9,
              filled: inventory.fullIronArmour,
              onClick: () => handleSelectInventorySlot(9),
            },
            {
              slot: 10,
              keyLabel: '0',
              name: inventory.stolenArtifacts
                ? 'Artifacts'
                : inventory.personalMount
                ? mountName
                : 'Empty',
              sub: inventory.stolenArtifacts
                ? 'Sacred'
                : inventory.personalMount
                ? mounted
                  ? 'Mounted'
                  : 'Mount [M]'
                : '',
              icon: inventory.stolenArtifacts
                ? '🏺'
                : inventory.personalMount
                ? '🐂'
                : '',
              active: selectedSlot === 10,
              filled: inventory.stolenArtifacts || inventory.personalMount,
              onClick: () => handleSelectInventorySlot(10, true),
            },
          ].map((item) => (
            <button
              key={item.slot}
              type="button"
              onClick={item.onClick}
              className={`w-12 h-13 sm:w-14 sm:h-14 rounded-lg border flex flex-col items-center justify-center relative transition-all cursor-pointer select-none ${
                item.active
                  ? 'bg-amber-500/25 border-2 border-amber-400 text-amber-200 shadow-lg scale-105'
                  : item.filled
                  ? 'bg-slate-900/95 border-slate-600 hover:border-slate-400 text-slate-200'
                  : 'bg-slate-900/50 border-slate-800/80 text-slate-600'
              }`}
            >
              <span className="absolute top-0.5 left-1 text-[9px] font-mono-num font-bold text-slate-400">
                {item.keyLabel}
              </span>
              {item.filled ? (
                <>
                  <span className="text-sm leading-none mt-1">{item.icon}</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-white leading-tight mt-0.5 truncate max-w-full px-0.5">
                    {item.name}
                  </span>
                  {item.sub && (
                    <span className="text-[8px] font-mono-num text-amber-300 leading-none">
                      {item.sub}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[9px] text-slate-600 font-mono-num">
                  Slot {item.slot}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Slow Villager Shelter Construction Progress Overlay */}
      {shelterBuilding && !shelterBuilt && (
        <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl bg-slate-950/92 border border-amber-500/70 flex flex-col items-center gap-2 shadow-xl z-20 min-w-[280px]">
          <div className="text-xs font-bold text-amber-300 font-mono-num">
            Building Villager Shelter... {shelterProgress}%
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-amber-400 transition-all duration-150"
              style={{ width: `${shelterProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Slow Anantha Padmanabha Swamy Temple Reconstruction Progress Overlay */}
      {templeRebuilding && !templeRebuilt && (
        <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl bg-slate-950/92 border border-amber-500/70 flex flex-col items-center gap-2 shadow-xl z-20 min-w-[320px]">
          <div className="text-xs font-bold text-amber-300 font-mono-num">
            Reconstructing Anantha Padmanabha Swamy Temple... {templeProgress}%
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-amber-400 transition-all duration-150"
              style={{ width: `${templeProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Boss Straight-Line Warning HUD Overlay on Day 5 */}
      {bossLineStatus && bossHp !== null && bossHp > 0 && (
        <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-slate-950/90 border border-rose-500/60 flex items-center gap-4 shadow-lg">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-rose-400">
              {bossTitle} — HP: <span className="font-mono-num">{bossHp} / 5000</span>
            </div>
            <div className="text-slate-300 font-mono-num">
              {bossLineStatus.state === 'TELEGRAPH'
                ? `RED LINE LOCKED! 100 DMG Strike in ${bossLineStatus.timer.toFixed(1)}s — Evade the red beam!`
                : bossLineStatus.state === 'FIRING'
                ? `FIRING 100 DAMAGE STRAIGHT-LINE ATTACK!`
                : `Line Attack Cooldown: ${bossLineStatus.timer.toFixed(1)}s / 7.0s`}
            </div>
          </div>
        </div>
      )}

      {/* Day 6/7 Victory & Auto-Teleport Overlay */}
      {templeRebuilt && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-6 z-30"
        >
          <div className="max-w-md w-full p-6 rounded-xl bg-slate-900 border border-amber-500/50 text-center flex flex-col gap-4 shadow-2xl">
            <h2 className="font-display text-2xl font-bold text-amber-400">
              Anantha Padmanabha Swamy Temple Restored!
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              You rebuilt the sacred temple with the recovered artifacts and safeguarded
              the village across the{' '}
              <strong className="text-white">
                {timeline === 'MEDIEVAL' ? 'Medieval India' : 'British Rule'}
              </strong>{' '}
              timeline.
            </p>
            <div className="py-2 px-4 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono-num text-sm font-bold">
              Teleporting to Futuristic Lobby in{' '}
              {teleportCountdown !== null ? teleportCountdown.toFixed(1) : '0.0'}s...
            </div>
            <button
              onClick={() => onCompleteTimeline(timeline)}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              Teleport to Lobby Now
            </button>
          </div>
        </div>
      )}

      {/* 2-Second Full-Screen Black Sleep Transition Overlay */}
      {isSleepingBlackScreen && (
        <div className="fixed inset-0 z-[95] bg-black flex flex-col items-center justify-center gap-3 select-none">
          <p className="font-display text-2xl font-bold text-amber-400 animate-pulse">
            Sleeping...
          </p>
          <p className="text-xs font-mono-num text-slate-400">
            Waking up on Day {Math.min(6, day + 1)} Morning
          </p>
        </div>
      )}
    </div>
  );
};
