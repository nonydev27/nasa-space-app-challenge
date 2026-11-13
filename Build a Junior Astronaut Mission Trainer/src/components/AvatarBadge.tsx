import { useId } from 'react';
import type { AvatarConfig } from '../game/types';

/** Flat helmet portrait used for small avatar chips (the 3D model is used elsewhere). */
export function AvatarBadge({ avatar, size = 44 }: { avatar: AvatarConfig; size?: number }) {
  const gid = useId();
  return (
    <svg className="avatar-badge" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id={`${gid}-v`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="22%" stopColor={avatar.visor} stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0b1020" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill={avatar.accent} opacity="0.25" />
      <path d="M10 62c2-12 10-17 22-17s20 5 22 17z" fill={avatar.suit} />
      <rect x="22" y="50" width="20" height="6" rx="2" fill={avatar.accent} />
      <circle cx="32" cy="28" r="19" fill={avatar.suit} stroke="#9aa3ad" strokeWidth="1.5" />
      <ellipse cx="32" cy="29" rx="14" ry="11.5" fill={avatar.skin} />
      <ellipse cx="32" cy="29" rx="14.5" ry="12" fill={`url(#${gid}-v)`} opacity="0.78" />
      <rect x="15" y="44" width="34" height="3.5" rx="1.7" fill={avatar.accent} />
    </svg>
  );
}
