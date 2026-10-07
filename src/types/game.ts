export type Gender = 'male' | 'female';
export type DeviceMode = 'computer' | 'mobile';
export type GameScreen = 'DEVICE_SELECT' | 'GENDER_SELECT' | 'LOBBY' | 'TIMELINE';
export type TimelineType = 'MEDIEVAL' | 'BRITISH';
export type ActiveTool = 'sword' | 'hoe' | 'axe' | 'curry';

export interface TimePod {
  id: string;
  label: string;
  side: 'left' | 'right';
  timeline: TimelineType;
  x: number;
  y: number;
  width: number;
  height: number;
  occupants: { id: string; name: string; gender: Gender; isPlayer?: boolean }[];
  countdown: number | null; // 10 seconds when >= 2 and <= 10 occupants
}

export interface LobbyTraveler {
  id: string;
  name: string;
  gender: Gender;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  podId: string | null;
  color: string;
  walkCycle: number;
  facing: number;
}

export interface Inventory {
  ironSword: boolean;
  hoe: boolean;
  axe: boolean;
  hasMap: boolean;
  fullIronArmour: boolean;
  powerfulSword: boolean;
  wallMaterials: number;
  personalMount: boolean;
  logs: number;
  tilledPlots: number; // 16 plots = 1 Acre
  riceBags: number;
  hayStacks: number;
  curryRiceBowls: number;
  mountsPool: number; // Oxen in Medieval, Horses in British
  armourSetsPool: number; // Sets of Iron Armour + Iron Sword for Buff Villagers
  stolenArtifacts: boolean;
}

export interface EnemyEntity {
  id: string;
  type: 'WEAK_GUARD' | 'RAID_SOLDIER' | 'FINAL_BOSS';
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  attackCooldown: number;
  attackAnim: number;
  walkCycle: number;
  facing: number; // radians
  patrolOriginX: number;
  patrolOriginY: number;
  patrolAngle: number;
  alerted: boolean;
  hitFlash: number;
  // Final Boss 100-damage straight-line attack (7s red telegraph + 7s cooldown)
  lineAttackState?: 'COOLDOWN' | 'TELEGRAPH' | 'FIRING';
  lineAttackTimer?: number;
  lineAngle?: number;
  lineOriginX?: number;
  lineOriginY?: number;
}

export interface BuffVillagerAlly {
  id: number;
  name: string;
  x: number;
  y: number;
  armed: boolean; // Has full iron armour, iron sword, and ox/horse
  hp: number;
  maxHp: number;
  attackCooldown: number;
  attackAnim: number;
  walkCycle: number;
  facing: number;
}

export interface TreeNode {
  id: number;
  x: number;
  y: number;
  logsRemaining: number;
  regrowTimer: number;
  shakeTimer: number;
  scale: number;
}

export interface FarmPlot {
  id: number;
  row: number;
  col: number;
  x: number;
  y: number;
  tilled: boolean;
  moisture: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface SlashEffect {
  id: string;
  x: number;
  y: number;
  angle: number;
  radius: number;
  color: string;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
}
