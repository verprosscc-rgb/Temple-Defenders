import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface JoystickData {
  x: number; // -1 (left) to +1 (right)
  y: number; // -1 (down/backward) to +1 (up/forward)
  active: boolean;
  angle: number; // radians
  distance: number; // 0 to 1
}

interface VirtualJoystickProps {
  onChange: (data: JoystickData) => void;
  size?: number;
  knobSize?: number;
  className?: string;
  label?: string;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onChange,
  size = 136,
  knobSize = 52,
  className = '',
  label = 'MOVE',
}) => {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const maxRadius = (size - knobSize) / 2;
  const deadzone = 6;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (pointerIdRef.current !== null) return;

    pointerIdRef.current = e.pointerId;
    baseRef.current?.setPointerCapture(e.pointerId);
    setIsActive(true);
    updatePosition(e.clientX, e.clientY);
  };

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      const base = baseRef.current;
      if (!base) return;

      const rect = base.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance < deadzone) {
        setKnobPos({ x: 0, y: 0 });
        onChange({ x: 0, y: 0, active: true, angle: 0, distance: 0 });
        return;
      }

      const clampedDist = Math.min(distance, maxRadius);
      const angle = Math.atan2(deltaY, deltaX);
      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;

      setKnobPos({ x: kx, y: ky });

      // Normalized outputs:
      // x: -1 to 1 (left to right)
      // y: -1 to 1 (down to up, inverted deltaY so forward is positive)
      const normX = Math.max(-1, Math.min(1, kx / maxRadius));
      const normY = Math.max(-1, Math.min(1, -ky / maxRadius));
      const normDist = clampedDist / maxRadius;

      onChange({
        x: normX,
        y: normY,
        active: true,
        angle,
        distance: normDist,
      });
    },
    [maxRadius, deadzone, onChange]
  );

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    updatePosition(e.clientX, e.clientY);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    pointerIdRef.current = null;
    setIsActive(false);
    setKnobPos({ x: 0, y: 0 });
    onChange({ x: 0, y: 0, active: false, angle: 0, distance: 0 });
  };

  useEffect(() => {
    return () => {
      onChange({ x: 0, y: 0, active: false, angle: 0, distance: 0 });
    };
  }, [onChange]);

  return (
    <div
      className={`relative select-none touch-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Glow & Rim */}
      <div
        ref={baseRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className={`w-full h-full rounded-full flex items-center justify-center relative cursor-pointer border-2 transition-colors duration-200 ${
          isActive
            ? 'bg-slate-950/85 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.45)]'
            : 'bg-slate-950/70 border-slate-700/80 shadow-xl'
        } backdrop-blur-md`}
        style={{ touchAction: 'none' }}
      >
        {/* Crosshair Guide Lines */}
        <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-[1px] bg-slate-700/40 pointer-events-none" />
        <div className="absolute inset-y-3 left-1/2 -translate-x-1/2 w-[1px] bg-slate-700/40 pointer-events-none" />

        {/* Directional Glyphs */}
        <span className="absolute top-2 text-[10px] font-bold text-amber-400/70 pointer-events-none">
          ▲
        </span>
        <span className="absolute bottom-2 text-[10px] font-bold text-amber-400/70 pointer-events-none">
          ▼
        </span>
        <span className="absolute left-2.5 text-[10px] font-bold text-amber-400/70 pointer-events-none">
          ◀
        </span>
        <span className="absolute right-2.5 text-[10px] font-bold text-amber-400/70 pointer-events-none">
          ▶
        </span>

        {/* Inner concentric ring */}
        <div className="w-16 h-16 rounded-full border border-amber-500/25 pointer-events-none" />

        {/* Draggable Knob */}
        <div
          className={`absolute rounded-full flex items-center justify-center pointer-events-none transition-shadow duration-150 ${
            isActive
              ? 'bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 border-2 border-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.8)] scale-105'
              : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-500/80 shadow-md'
          }`}
          style={{
            width: knobSize,
            height: knobSize,
            transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
          }}
        >
          {/* Knob Center Accent */}
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              isActive ? 'bg-amber-100 shadow-xs' : 'bg-slate-400/60'
            }`}
          />
        </div>
      </div>

      {/* Joystick Label Badge */}
      {label && (
        <div className="absolute -bottom-5 inset-x-0 text-center pointer-events-none">
          <span className="px-2 py-0.5 rounded bg-slate-950/85 border border-slate-700 text-[10px] font-bold tracking-wider text-amber-300 uppercase">
            {label}
          </span>
        </div>
      )}
    </div>
  );
};
