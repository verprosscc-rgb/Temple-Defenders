import {
  ActiveTool,
  BuffVillagerAlly,
  EnemyEntity,
  FarmPlot,
  FloatingText,
  Gender,
  Particle,
  SlashEffect,
  TimelineType,
  TreeNode,
} from '../types/game';

export function drawMount(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  timeline: TimelineType,
  isGiantBoss: boolean = false,
  facing: number = 0,
  walkCycle: number = 0
) {
  ctx.save();
  ctx.translate(x, y);
  const scale = isGiantBoss ? 1.78 : 1.05;
  ctx.scale(scale, scale);

  const flip = Math.cos(facing) < -0.1 ? -1 : 1;
  ctx.scale(flip, 1);

  const stride = Math.sin(walkCycle * 8) * 5;
  const oppStride = Math.sin(walkCycle * 8 + Math.PI) * 5;

  if (timeline === 'MEDIEVAL') {
    // Realistic Indian Zebu War Ox (Humped Bull with Dewlap, Leather Harness & Brass-Tipped Horns)
    const coatGrad = ctx.createLinearGradient(0, -10, 0, 22);
    if (isGiantBoss) {
      coatGrad.addColorStop(0, '#27272a');
      coatGrad.addColorStop(1, '#09090b');
    } else {
      coatGrad.addColorStop(0, '#9a5b32');
      coatGrad.addColorStop(0.6, '#78350f');
      coatGrad.addColorStop(1, '#451a03');
    }

    // Back legs (animated with walkCycle)
    ctx.strokeStyle = isGiantBoss ? '#09090b' : '#3b1502';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-13, 14);
    ctx.lineTo(-15 + oppStride, 28);
    ctx.moveTo(9, 14);
    ctx.lineTo(9 + stride, 28);
    ctx.stroke();

    // Muscular Body Barrel
    ctx.fillStyle = coatGrad;
    ctx.strokeStyle = isGiantBoss ? '#dc2626' : '#290f02';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 9, 23, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Zebu Thoracic Hump
    ctx.beginPath();
    ctx.ellipse(8, -3, 9, 7.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ornate Saddle Cloth / Jute Blanket
    ctx.fillStyle = isGiantBoss ? '#7f1d1d' : '#b45309';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-11, -1, 17, 13, 2);
    ctx.fill();
    ctx.stroke();

    // Throat Dewlap fold
    ctx.fillStyle = isGiantBoss ? '#18181b' : '#5c280b';
    ctx.beginPath();
    ctx.moveTo(15, 10);
    ctx.quadraticCurveTo(24, 20, 25, 8);
    ctx.fill();

    // Front legs (animated)
    ctx.strokeStyle = isGiantBoss ? '#18181b' : '#451a03';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-6, 16);
    ctx.lineTo(-6 + stride, 29);
    ctx.moveTo(15, 16);
    ctx.lineTo(15 + oppStride, 29);
    ctx.stroke();

    // Head & Snout
    ctx.fillStyle = coatGrad;
    ctx.strokeStyle = isGiantBoss ? '#ef4444' : '#290f02';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(23, 5, 10.5, 7.5, 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Curved Ivory Horns with Brass Caps
    ctx.strokeStyle = isGiantBoss ? '#fca5a5' : '#fef3c7';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(20, -1);
    ctx.quadraticCurveTo(27, -17, 35, -10);
    ctx.moveTo(16, 0);
    ctx.quadraticCurveTo(19, -15, 27, -12);
    ctx.stroke();

    // Eye & Nostril
    ctx.fillStyle = isGiantBoss ? '#ef4444' : '#0f172a';
    ctx.beginPath();
    ctx.arc(25, 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // BRITISH RULE TIMELINE: Realistic Cavalry Warhorse
    const horseGrad = ctx.createLinearGradient(0, -14, 0, 24);
    if (isGiantBoss) {
      horseGrad.addColorStop(0, '#1e1b4b');
      horseGrad.addColorStop(1, '#09090b');
    } else {
      horseGrad.addColorStop(0, '#a16207');
      horseGrad.addColorStop(0.6, '#713f12');
      horseGrad.addColorStop(1, '#3f2209');
    }

    // Flowing Tail
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-20, 6);
    ctx.quadraticCurveTo(-30, 12 + stride * 0.4, -27, 23);
    ctx.stroke();

    // Far-side legs
    ctx.strokeStyle = '#291505';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-13, 15);
    ctx.lineTo(-15 + oppStride, 30);
    ctx.moveTo(11, 15);
    ctx.lineTo(11 + stride, 30);
    ctx.stroke();

    // Muscular Equine Torso
    ctx.fillStyle = horseGrad;
    ctx.strokeStyle = '#271304';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 9, 22, 11.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Leather Cavalry Saddle & Shabraque
    ctx.fillStyle = isGiantBoss ? '#991b1b' : '#1e3a8a';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-10, 0, 17, 11, 2);
    ctx.fill();
    ctx.stroke();

    // Near-side legs
    ctx.strokeStyle = isGiantBoss ? '#0f172a' : '#451a03';
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(-6, 16);
    ctx.lineTo(-6 + stride, 30);
    ctx.moveTo(16, 16);
    ctx.lineTo(16 + oppStride, 30);
    ctx.stroke();

    // Arched Neck & Equine Head
    ctx.fillStyle = horseGrad;
    ctx.beginPath();
    ctx.moveTo(12, 7);
    ctx.lineTo(22, -10);
    ctx.lineTo(33, -4);
    ctx.lineTo(30, 2);
    ctx.lineTo(22, 1);
    ctx.lineTo(18, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Leather Bridle & Reins
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(22, -9);
    ctx.lineTo(30, -1);
    ctx.lineTo(8, 2);
    ctx.stroke();

    // Ears
    ctx.fillStyle = horseGrad;
    ctx.beginPath();
    ctx.moveTo(20, -9);
    ctx.lineTo(22, -16);
    ctx.lineTo(25, -9);
    ctx.fill();
  }

  ctx.restore();
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  opts: {
    x: number;
    y: number;
    gender: Gender;
    armored: boolean;
    powerfulSword: boolean;
    mounted: boolean;
    timeline: TimelineType;
    stealth: boolean;
    activeTool: ActiveTool;
    facing: number;
    walkCycle?: number;
    attackAnim?: number;
    isBlocking?: boolean;
    label?: string;
    primaryColor?: string;
  }
) {
  const {
    x,
    y,
    gender,
    armored,
    powerfulSword,
    mounted,
    timeline,
    stealth,
    activeTool,
    facing,
    walkCycle = 0,
    attackAnim = 0,
    isBlocking,
    label,
    primaryColor,
  } = opts;

  ctx.save();
  if (stealth) {
    ctx.globalAlpha = 0.48;
  }

  // Directional soft ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(
    x + 4,
    y + (mounted ? 27 : 19),
    mounted ? 25 : 15,
    mounted ? 8 : 5.5,
    0.12,
    0,
    Math.PI * 2
  );
  ctx.fill();

  const bob = Math.abs(Math.sin(walkCycle * 8)) * (mounted ? 2.2 : 1.5);
  const bodyY = (mounted ? y - 11 : y) - bob;

  if (mounted) {
    drawMount(ctx, x, y + 2, timeline, false, facing, walkCycle);
  }

  ctx.save();
  ctx.translate(x, bodyY);

  // Stealth camouflage ring
  if (stealth) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Animated Walking Boots / Feet (when not mounted)
  if (!mounted) {
    const legSwing = Math.sin(walkCycle * 8) * 5;
    ctx.fillStyle = armored ? '#475569' : '#451a03';
    ctx.beginPath();
    ctx.ellipse(-5, 15 + legSwing * 0.5, 4, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(5, 15 - legSwing * 0.5, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Torso / Tunic / Full Iron Armour Cuirass
  const torsoGrad = ctx.createLinearGradient(-12, -6, 12, 16);
  if (armored) {
    torsoGrad.addColorStop(0, '#e2e8f0');
    torsoGrad.addColorStop(0.45, '#94a3b8');
    torsoGrad.addColorStop(1, '#334155');
    ctx.strokeStyle = '#1e293b';
  } else {
    const baseCol = primaryColor || (gender === 'male' ? '#0369a1' : '#be185d');
    torsoGrad.addColorStop(0, baseCol);
    torsoGrad.addColorStop(1, '#0f172a');
    ctx.strokeStyle = '#09090b';
  }
  ctx.fillStyle = torsoGrad;
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  if (gender === 'female') {
    ctx.moveTo(-9.5, -5);
    ctx.lineTo(9.5, -5);
    ctx.lineTo(12, 13.5);
    ctx.lineTo(-12, 13.5);
    ctx.closePath();
  } else {
    ctx.roundRect(-11.5, -5, 23, 18.5, 4.5);
  }
  ctx.fill();
  ctx.stroke();

  // Riveted Iron Pauldrons & Chestplate details when armored
  if (armored) {
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-11, -2, 4.5, 0, Math.PI * 2);
    ctx.arc(11, -2, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Gold sash / belt
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-10, 7, 20, 3);
  } else {
    // Traditional Angavastram / Sash
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(8, 11);
    ctx.stroke();
  }

  // Realistic Shaded Head
  const skinGrad = ctx.createRadialGradient(-2, -16, 1, 0, -14, 10);
  skinGrad.addColorStop(0, '#fde68a');
  skinGrad.addColorStop(0.4, '#e6b17e');
  skinGrad.addColorStop(1, '#b47b48');
  ctx.fillStyle = skinGrad;
  ctx.strokeStyle = '#271304';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, -14, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hair or Steel Nasal Helmet
  if (armored) {
    const helmGrad = ctx.createLinearGradient(-9, -25, 9, -12);
    helmGrad.addColorStop(0, '#f1f5f9');
    helmGrad.addColorStop(0.5, '#64748b');
    helmGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = helmGrad;
    ctx.beginPath();
    ctx.arc(0, -16, 9.8, Math.PI * 0.95, Math.PI * 0.05);
    ctx.fill();
    ctx.stroke();

    // Brass rim & Nasal guard
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-9, -16);
    ctx.lineTo(9, -16);
    ctx.moveTo(0, -16);
    ctx.lineTo(0, -12);
    ctx.stroke();

    // Heroic Plume
    ctx.fillStyle = gender === 'male' ? '#0ea5e9' : '#f43f5e';
    ctx.beginPath();
    ctx.ellipse(0, -27, 4.5, 3, -0.15, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#18181b';
    if (gender === 'female') {
      ctx.beginPath();
      ctx.arc(0, -16, 9.5, Math.PI * 0.88, Math.PI * 2.12);
      ctx.fill();
      // Braided bun & gold hair Ornament
      ctx.beginPath();
      ctx.ellipse(-9.5, -10, 4, 8.5, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, -21, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(0, -15.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, -17, 9.2, Math.PI * 0.95, Math.PI * 2.05);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-8.5, -17);
      ctx.lineTo(8.5, -17);
      ctx.stroke();
    }
  }

  // Directional Eyes
  ctx.fillStyle = '#09090b';
  const eyeOffsetX = Math.cos(facing) * 2.6;
  ctx.beginPath();
  ctx.arc(-3 + eyeOffsetX, -14, 1.3, 0, Math.PI * 2);
  ctx.arc(3 + eyeOffsetX, -14, 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Equipped Weapon / Tool with Swing Animation
  ctx.save();
  const swingAngle = attackAnim > 0 ? Math.sin(attackAnim * Math.PI) * 1.1 : 0;
  ctx.rotate(facing + swingAngle);

  // Hand grip
  ctx.fillStyle = '#d9a066';
  ctx.beginPath();
  ctx.arc(11, 1, 3.2, 0, Math.PI * 2);
  ctx.fill();

  if (activeTool === 'sword') {
    // Pommel & Hilt
    ctx.fillStyle = '#78350f';
    ctx.fillRect(8, -2, 6, 4);
    // Tulwar/Khanda Crossguard
    ctx.fillStyle = powerfulSword ? '#fbbf24' : '#94a3b8';
    ctx.fillRect(13.5, -6.5, 3, 13);
    // Curved/Double-edged Damascus Steel Blade
    const bladeGrad = ctx.createLinearGradient(16, -3, 38, 3);
    if (powerfulSword) {
      bladeGrad.addColorStop(0, '#fef08a');
      bladeGrad.addColorStop(0.5, '#f59e0b');
      bladeGrad.addColorStop(1, '#fffbeb');
    } else {
      bladeGrad.addColorStop(0, '#f8fafc');
      bladeGrad.addColorStop(0.5, '#94a3b8');
      bladeGrad.addColorStop(1, '#e2e8f0');
    }
    ctx.fillStyle = bladeGrad;
    ctx.strokeStyle = powerfulSword ? '#b45309' : '#334155';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(16.5, -3.2);
    ctx.quadraticCurveTo(26, -4.5, powerfulSword ? 39 : 32, -0.5);
    ctx.lineTo(16.5, 3.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (activeTool === 'hoe') {
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(27, 0);
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.fillRect(24, -9, 4.5, 12);
    ctx.strokeRect(24, -9, 4.5, 12);
  } else if (activeTool === 'axe') {
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(26, 0);
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(19, -2);
    ctx.quadraticCurveTo(25, -11, 29, -8);
    ctx.quadraticCurveTo(30, 0, 29, 8);
    ctx.quadraticCurveTo(25, 11, 19, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Dhal (Round Indian Buckler Shield) when Blocking
  if (isBlocking) {
    ctx.save();
    ctx.rotate(facing);
    ctx.fillStyle = '#451a03';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(14, -6, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 4 Brass shield bosses
    ctx.fillStyle = '#fde047';
    [
      [11, -9],
      [17, -9],
      [11, -3],
      [17, -3],
    ].forEach(([bx, by]) => {
      ctx.beginPath();
      ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  ctx.restore();

  if (label) {
    ctx.fillStyle = 'rgba(9, 13, 22, 0.86)';
    ctx.font = '600 10.5px "Plus Jakarta Sans", sans-serif';
    const textW = ctx.measureText(label).width;
    ctx.beginPath();
    ctx.roundRect(x - textW / 2 - 6, bodyY - 41, textW + 12, 16, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, bodyY - 29.5);
  }

  ctx.restore();
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: EnemyEntity,
  timeline: TimelineType,
  playerInStealth: boolean = false
) {
  const {
    x,
    y,
    type,
    hp,
    maxHp,
    facing,
    walkCycle = 0,
    attackAnim = 0,
    alerted,
    hitFlash,
    lineAttackState,
    lineAttackTimer,
    lineAngle,
  } = enemy;

  ctx.save();

  // 1. Realistic Line-of-Sight Vision Cone for unalerted Forest Camp Guards
  if (type === 'WEAK_GUARD' && !alerted) {
    const coneRange = playerInStealth ? 75 : 175;
    const coneSpread = 0.45;
    const coneGrad = ctx.createRadialGradient(x, y, 10, x, y, coneRange);
    coneGrad.addColorStop(
      0,
      playerInStealth ? 'rgba(56, 189, 248, 0.16)' : 'rgba(239, 68, 68, 0.22)'
    );
    coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, coneRange, facing - coneSpread, facing + coneSpread);
    ctx.closePath();
    ctx.fill();
  }

  // 2. Final Boss 100-Damage Straight-Line Attack (Lights up RED 7s before triggering, 7s cooldown)
  if (
    type === 'FINAL_BOSS' &&
    (lineAttackState === 'TELEGRAPH' || lineAttackState === 'FIRING') &&
    lineAngle !== undefined
  ) {
    const lineLen = 820;
    const endX = x + Math.cos(lineAngle) * lineLen;
    const endY = y + Math.sin(lineAngle) * lineLen;

    ctx.save();
    if (lineAttackState === 'TELEGRAPH') {
      const urgency = Math.max(0, Math.min(1, 1 - (lineAttackTimer || 0) / 7));

      // Outer crimson ground scorch warning corridor
      ctx.strokeStyle = `rgba(220, 38, 38, ${0.38 + urgency * 0.48})`;
      ctx.lineWidth = 60;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Inner pulsing core line
      ctx.strokeStyle = `rgba(254, 202, 202, ${0.5 + urgency * 0.5})`;
      ctx.lineWidth = 6 + urgency * 12;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Crisp bounding rails
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([14, 8]);
      const perpX = -Math.sin(lineAngle) * 30;
      const perpY = Math.cos(lineAngle) * 30;
      ctx.beginPath();
      ctx.moveTo(x + perpX, y + perpY);
      ctx.lineTo(endX + perpX, endY + perpY);
      ctx.moveTo(x - perpX, y - perpY);
      ctx.lineTo(endX - perpX, endY - perpY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ground Warning Telemetry Callout
      const midX = x + Math.cos(lineAngle) * 210;
      const midY = y + Math.sin(lineAngle) * 210;
      ctx.fillStyle = 'rgba(69, 10, 10, 0.92)';
      ctx.beginPath();
      ctx.roundRect(midX - 95, midY - 15, 190, 26, 5);
      ctx.fill();
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fef2f2';
      ctx.font = '700 11.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `100 DMG STRIKE IN ${(lineAttackTimer || 0).toFixed(1)}s`,
        midX,
        midY + 2
      );
    } else if (lineAttackState === 'FIRING') {
      // Blinding 100-damage shockwave beam
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
      ctx.lineWidth = 76;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 34;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    ctx.restore();
  }

  const isBoss = type === 'FINAL_BOSS';
  if (isBoss) {
    drawMount(ctx, x, y + 7, timeline, true, facing, walkCycle);
  }

  ctx.save();
  ctx.translate(x, isBoss ? y - 17 : y);

  if (!isBoss) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(3, 18, 14, 5, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const scale = isBoss ? 1.58 : type === 'RAID_SOLDIER' ? 1.14 : 0.98;
  ctx.scale(scale, scale);

  // Armor & Uniform Shading
  if (hitFlash > 0) {
    ctx.fillStyle = '#ffffff';
  } else if (isBoss) {
    const bossGrad = ctx.createLinearGradient(-12, -8, 12, 18);
    bossGrad.addColorStop(0, '#52525b');
    bossGrad.addColorStop(0.5, '#27272a');
    bossGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = bossGrad;
  } else if (timeline === 'BRITISH') {
    // Authentic Scarlet Redcoat Tunic
    ctx.fillStyle = type === 'RAID_SOLDIER' ? '#991b1b' : '#b91c1c';
  } else {
    // Authentic Riveted Charcoal/Bronze Mail & Lamellar
    ctx.fillStyle = type === 'RAID_SOLDIER' ? '#3f3f46' : '#57534e';
  }
  ctx.strokeStyle = isBoss ? '#ef4444' : '#09090b';
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.roundRect(-11, -5, 22, 19, 4);
  ctx.fill();
  ctx.stroke();

  if (timeline === 'BRITISH' && !isBoss) {
    // White Pipeclay Cross-belts & Brass Plate
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-9, -4);
    ctx.lineTo(9, 12);
    ctx.moveTo(9, -4);
    ctx.lineTo(-9, 12);
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 4, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (isBoss) {
    // Heavy Iron Pauldrons & Crimson Cape Trim
    ctx.fillStyle = '#71717a';
    ctx.beginPath();
    ctx.arc(-12, -2, 5, 0, Math.PI * 2);
    ctx.arc(12, -2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Enemy Head
  ctx.fillStyle = timeline === 'BRITISH' ? '#f3d2b3' : '#d6a472';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -14, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Period-Accurate Headgear
  if (isBoss) {
    // Full Iron Spiked/Crowned War Helm
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.arc(0, -16, 9.8, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-8, -18, 16, 3);
  } else if (timeline === 'BRITISH') {
    // Black Shako / Regimental Helmet with Brass Badge
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-8.5, -24, 17, 8.5);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, -20, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Conical Steel Khula-Khud Helmet with Spike
    ctx.fillStyle = '#52525b';
    ctx.beginPath();
    ctx.arc(0, -16, 9, Math.PI, 0);
    ctx.lineTo(0, -27);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Weapon Swing
  ctx.save();
  const swing = attackAnim > 0 ? Math.sin(attackAnim * Math.PI) * 0.9 : 0;
  ctx.rotate(facing + swing);
  ctx.fillStyle = isBoss ? '#fca5a5' : '#e2e8f0';
  ctx.strokeStyle = isBoss ? '#dc2626' : '#334155';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(11, -2);
  ctx.lineTo(isBoss ? 38 : 29, 0);
  ctx.lineTo(11, 2.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // Crisp Health Bar
  const barW = isBoss ? 104 : 44;
  const barH = isBoss ? 8 : 5;
  const barY = isBoss ? y - 66 : y - 35;
  ctx.fillStyle = 'rgba(9, 13, 22, 0.88)';
  ctx.fillRect(x - barW / 2 - 1, barY - 1, barW + 2, barH + 2);
  const ratio = Math.max(0, Math.min(1, hp / maxHp));
  ctx.fillStyle = isBoss ? '#dc2626' : type === 'RAID_SOLDIER' ? '#f97316' : '#ef4444';
  ctx.fillRect(x - barW / 2, barY, barW * ratio, barH);

  if (isBoss || hp < maxHp) {
    ctx.fillStyle = '#f8fafc';
    ctx.font = isBoss
      ? '700 11px "JetBrains Mono", monospace'
      : '600 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(hp)}/${maxHp}`, x, barY - 4);
  }

  ctx.restore();
}

export function drawTempleAndShelter(
  ctx: CanvasRenderingContext2D,
  templeX: number,
  templeY: number,
  templeHp: number,
  rebuilt: boolean,
  shelterBuilt: boolean,
  timeNow: number
) {
  ctx.save();

  // 1. Sacred Temple Pushkarini (Stepped Water Tank with Lotus Leaves north-west of Temple)
  const pondX = templeX - 95;
  const pondY = templeY - 185;
  ctx.fillStyle = '#78716c';
  ctx.fillRect(pondX - 52, pondY - 34, 104, 68);
  ctx.fillStyle = '#a8a29e';
  ctx.fillRect(pondX - 46, pondY - 28, 92, 56);
  const waterGrad = ctx.createLinearGradient(pondX - 40, pondY - 22, pondX + 40, pondY + 22);
  waterGrad.addColorStop(0, '#0369a1');
  waterGrad.addColorStop(0.5, '#0284c7');
  waterGrad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(pondX - 40, pondY - 22, 80, 44);

  // Subtle water ripple & lotus pads
  const ripple = Math.sin(timeNow * 0.003) * 3;
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(pondX - 10, pondY, 16 + ripple, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(pondX + 18, pondY - 6, 5, 0.2, Math.PI * 1.9);
  ctx.arc(pondX - 22, pondY + 8, 4.5, 0.2, Math.PI * 1.9);
  ctx.fill();

  // 2. Reinforced Stone-and-Iron Bastion Wall & Villager Shelter (Built on Day 2)
  if (shelterBuilt) {
    ctx.fillStyle = 'rgba(30, 41, 59, 0.38)';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.roundRect(templeX - 155, templeY - 135, 315, 305, 10);
    ctx.fill();
    ctx.stroke();

    // Battlement crenelations along wall
    ctx.fillStyle = '#94a3b8';
    for (let bx = templeX - 140; bx <= templeX + 140; bx += 28) {
      ctx.fillRect(bx, templeY - 140, 14, 8);
      ctx.fillRect(bx, templeY + 165, 14, 8);
    }
    for (let by = templeY - 120; by <= templeY + 150; by += 28) {
      ctx.fillRect(templeX + 155, by, 8, 14);
    }

    // Reinforced Villager Bunker & Supply Storehouse
    const shGrad = ctx.createLinearGradient(templeX - 145, templeY + 65, templeX - 30, templeY + 145);
    shGrad.addColorStop(0, '#475569');
    shGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = shGrad;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(templeX - 142, templeY + 68, 118, 74, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 9.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('REINFORCED SHELTER', templeX - 83, templeY + 98);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '500 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Villagers & Supplies Safe', templeX - 83, templeY + 114);
  }

  // 3. Anantha Padmanabha Swamy Temple Courtyard (Laterite & Carved Granite Prakaram)
  const courtGrad = ctx.createLinearGradient(templeX - 110, templeY - 95, templeX + 110, templeY + 55);
  if (rebuilt) {
    courtGrad.addColorStop(0, '#fef3c7');
    courtGrad.addColorStop(1, '#fde68a');
  } else {
    courtGrad.addColorStop(0, '#d6d3d1');
    courtGrad.addColorStop(1, '#a8a29e');
  }
  ctx.fillStyle = courtGrad;
  ctx.strokeStyle = rebuilt ? '#b45309' : '#44403c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(templeX - 110, templeY - 95, 220, 152, 6);
  ctx.fill();
  ctx.stroke();

  // Carved Stone Pillars of the Mandapam
  ctx.fillStyle = rebuilt ? '#d97706' : '#57534e';
  [-88, -62, 62, 88].forEach((px) => {
    ctx.fillRect(templeX + px - 4, templeY - 40, 8, 82);
  });

  // 5-Tiered Kerala / Dravidian Gopuram Tower
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const w = 164 - i * 24;
    const h = 21;
    const ty = templeY - 30 - i * 20;
    const tierGrad = ctx.createLinearGradient(templeX - w / 2, ty, templeX + w / 2, ty + h);
    if (rebuilt) {
      tierGrad.addColorStop(0, i % 2 === 0 ? '#f59e0b' : '#fbbf24');
      tierGrad.addColorStop(0.5, '#fde047');
      tierGrad.addColorStop(1, '#b45309');
    } else {
      tierGrad.addColorStop(0, '#78716c');
      tierGrad.addColorStop(0.5, '#a8a29e');
      tierGrad.addColorStop(1, '#57534e');
    }
    ctx.fillStyle = tierGrad;
    ctx.strokeStyle = rebuilt ? '#78350f' : '#292524';
    ctx.lineWidth = 1.8;
    ctx.fillRect(templeX - w / 2, ty, w, h);
    ctx.strokeRect(templeX - w / 2, ty, w, h);
  }

  // Visible scaffolding/cracks prior to Day 7 restoration
  if (!rebuilt) {
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(templeX - 35, templeY - 85);
    ctx.lineTo(templeX - 22, templeY - 62);
    ctx.lineTo(templeX - 28, templeY - 45);
    ctx.stroke();
  }

  // Golden Kalasha Finials atop the Gopuram
  ctx.fillStyle = rebuilt ? '#fde047' : '#a1a1aa';
  [-22, 0, 22].forEach((ox) => {
    ctx.beginPath();
    ctx.arc(templeX + ox, templeY - 118, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(templeX + ox - 3, templeY - 120);
    ctx.lineTo(templeX + ox, templeY - 129);
    ctx.lineTo(templeX + ox + 3, templeY - 120);
    ctx.fill();
  });

  // Sanctum Sanctorum (Garbhagriha) & Reclining Anantha Padmanabha Swamy Silhouette
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(templeX - 28, templeY - 4, 56, 48);

  if (rebuilt) {
    // Radiant Golden Murti & Sacred Lamps inside Sanctum
    const sanctumGlow = ctx.createRadialGradient(templeX, templeY + 20, 2, templeX, templeY + 20, 28);
    sanctumGlow.addColorStop(0, 'rgba(253, 224, 71, 0.95)');
    sanctumGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = sanctumGlow;
    ctx.beginPath();
    ctx.arc(templeX, templeY + 20, 28, 0, Math.PI * 2);
    ctx.fill();

    // Reclining deity golden form
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.ellipse(templeX, templeY + 24, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flickering Deepastambha (Sacred Brass Oil Lamp Pillars) at Entrance
  const flicker = Math.sin(timeNow * 0.015) * 2;
  [-44, 44].forEach((lx) => {
    ctx.fillStyle = '#b45309';
    ctx.fillRect(templeX + lx - 2, templeY + 20, 4, 24);
    const lampGlow = ctx.createRadialGradient(
      templeX + lx,
      templeY + 18,
      1,
      templeX + lx,
      templeY + 18,
      16 + flicker
    );
    lampGlow.addColorStop(0, '#fef08a');
    lampGlow.addColorStop(0.4, 'rgba(245, 158, 11, 0.55)');
    lampGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = lampGlow;
    ctx.beginPath();
    ctx.arc(templeX + lx, templeY + 18, 16 + flicker, 0, Math.PI * 2);
    ctx.fill();
  });

  // Temple Nameplate
  ctx.fillStyle = 'rgba(9, 13, 22, 0.9)';
  ctx.beginPath();
  ctx.roundRect(templeX - 128, templeY - 156, 256, 24, 4);
  ctx.fill();
  ctx.strokeStyle = rebuilt ? '#f59e0b' : '#475569';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = rebuilt ? '#fde047' : '#f8fafc';
  ctx.font = '700 11px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText('ANANTHA PADMANABHA SWAMY TEMPLE', templeX, templeY - 140);

  // Temple Integrity Bar
  const barW = 164;
  ctx.fillStyle = '#090d16';
  ctx.fillRect(templeX - barW / 2, templeY + 62, barW, 7);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(templeX - barW / 2, templeY + 62, barW * Math.max(0, templeHp / 2000), 7);

  ctx.restore();
}

export function drawVillageProps(
  ctx: CanvasRenderingContext2D,
  timeNow: number,
  timeline: TimelineType
) {
  ctx.save();

  // 1. Old Man Next Door's Thatched Mud-Brick Cottage (x: 475, y: 72)
  ctx.fillStyle = '#57534e';
  ctx.fillRect(442, 46, 66, 40);
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.moveTo(436, 48);
  ctx.lineTo(475, 26);
  ctx.lineTo(514, 48);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 2. Cook's Outdoor Kitchen Hearth & Simmering Curry-Rice Cauldrons (near x: 558, y: 215)
  ctx.fillStyle = '#44403c';
  ctx.beginPath();
  ctx.arc(562, 215, 13, 0, Math.PI * 2);
  ctx.fill();
  // Fire glow under cauldron
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(562, 215, 9 + Math.sin(timeNow * 0.02) * 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Golden Curry-Rice pot
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(562, 215, 6.5, 0, Math.PI * 2);
  ctx.fill();

  // 3. Animal Owner's Wooden Corral & Hay Trough (near x: 562, y: 330)
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.strokeRect(545, 306, 46, 44);
  ctx.fillStyle = '#eab308';
  ctx.fillRect(550, 312, 16, 12); // Golden hay bale

  // 4. Blacksmith's Glowing Forge & Iron Anvil (near x: 562, y: 445)
  ctx.fillStyle = '#27272a';
  ctx.fillRect(548, 430, 32, 28);
  const forgePulse = Math.sin(timeNow * 0.018) * 3;
  const forgeGrad = ctx.createRadialGradient(564, 444, 2, 564, 444, 20 + forgePulse);
  forgeGrad.addColorStop(0, '#fef08a');
  forgeGrad.addColorStop(0.4, '#ef4444');
  forgeGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = forgeGrad;
  ctx.beginPath();
  ctx.arc(564, 444, 20 + forgePulse, 0, Math.PI * 2);
  ctx.fill();

  // 5. Forest Campfire at Enemy Camp (x: 790, y: 285)
  const fireGrad = ctx.createRadialGradient(790, 285, 2, 790, 285, 28 + forgePulse);
  fireGrad.addColorStop(0, '#fef08a');
  fireGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.6)');
  fireGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = fireGrad;
  ctx.beginPath();
  ctx.arc(790, 285, 28 + forgePulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawBuffVillagers(
  ctx: CanvasRenderingContext2D,
  villagers: BuffVillagerAlly[],
  timeline: TimelineType
) {
  villagers.forEach((v) => {
    drawCharacter(ctx, {
      x: v.x,
      y: v.y,
      gender: v.id % 2 === 0 ? 'male' : 'female',
      armored: v.armed,
      powerfulSword: false,
      mounted: v.armed,
      timeline,
      stealth: false,
      activeTool: 'sword',
      facing: v.facing,
      walkCycle: v.walkCycle,
      attackAnim: v.attackAnim,
      primaryColor: '#15803d',
      label: v.armed ? `Ally #${v.id}` : `Villager #${v.id}`,
    });
  });
}

export function drawTreesAndFarm(
  ctx: CanvasRenderingContext2D,
  trees: TreeNode[],
  plots: FarmPlot[],
  floatingTexts: FloatingText[],
  slashes: SlashEffect[],
  particles: Particle[],
  timeNow: number
) {
  // 1. Draw 1-Acre Farm Field (4x4 = 16 realistic soil plots)
  ctx.save();
  ctx.strokeStyle = '#5c4033';
  ctx.lineWidth = 3;
  ctx.strokeRect(312, 428, 162, 132);
  ctx.restore();

  plots.forEach((p) => {
    ctx.save();
    ctx.fillStyle = p.tilled ? '#3b1d08' : '#4d7c0f';
    ctx.strokeStyle = p.tilled ? '#5c2d0c' : '#3f6212';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p.x - 18, p.y - 15, 36, 30);
    ctx.strokeRect(p.x - 18, p.y - 15, 36, 30);

    if (p.tilled) {
      // Realistic ploughed earth ridges & emerald rice seedlings
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      [-8, 0, 8].forEach((ry) => {
        ctx.beginPath();
        ctx.moveTo(p.x - 14, p.y + ry);
        ctx.lineTo(p.x + 14, p.y + ry);
        ctx.stroke();
      });

      const sway = Math.sin(timeNow * 0.004 + p.id) * 1.8;
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1.6;
      [-8, 0, 8].forEach((rx) => {
        ctx.beginPath();
        ctx.moveTo(p.x + rx, p.y + 4);
        ctx.lineTo(p.x + rx + sway, p.y - 5);
        ctx.stroke();
      });
    }
    ctx.restore();
  });

  // 2. Draw Multi-Layered Tropical Banyan / Teak Forest Trees
  trees.forEach((t) => {
    ctx.save();
    const shakeX = t.shakeTimer > 0 ? Math.sin(t.shakeTimer * 50) * 3.5 : 0;
    ctx.translate(t.x + shakeX, t.y);

    // Tree ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(6, 12, 22, 9, 0.15, 0, Math.PI * 2);
    ctx.fill();

    if (t.logsRemaining <= 0) {
      // Realistic Cut Tree Stump with growth rings
      ctx.fillStyle = '#5c2d0c';
      ctx.beginPath();
      ctx.ellipse(0, 7, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(0, 5, 8, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Flared Hardwood Trunk
      ctx.fillStyle = '#5c2d0c';
      ctx.beginPath();
      ctx.moveTo(-7, 12);
      ctx.lineTo(-4, -8);
      ctx.lineTo(4, -8);
      ctx.lineTo(7, 12);
      ctx.closePath();
      ctx.fill();

      // 3-Layered Lush Canopy with wind sway
      const wind = Math.sin(timeNow * 0.002 + t.id) * 1.5;
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(wind, -14, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(-6 + wind, -18, 17, 0, Math.PI * 2);
      ctx.arc(7 + wind, -16, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(wind, -22, 13, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  // 3. Draw Physical Particles (Sparks, Soil Clods, Wood Chips, Steam)
  particles.forEach((pt) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // 4. Draw Specular Weapon Slash Arcs
  slashes.forEach((s) => {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.globalAlpha = Math.max(0, s.life);
    ctx.beginPath();
    ctx.arc(0, 0, s.radius, -0.9, 0.9);
    ctx.stroke();
    ctx.restore();
  });

  // 5. Draw Floating Combat & Resource Text
  floatingTexts.forEach((ft) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, ft.life);
    ctx.fillStyle = '#090d16';
    ctx.font = '700 12.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });
}
