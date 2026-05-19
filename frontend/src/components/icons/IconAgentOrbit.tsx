import React, { SVGProps } from 'react';

const STAR_PATH =
  'M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z';

/** Material-style eighth note (used for the two orbit satellites). */
const MUSIC_NOTE_PATH =
  'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z';

export const IconAgentOrbit = ({
  size = 24,
  className = '',
  ...props
}: SVGProps<SVGSVGElement> & { size?: number | string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden
    {...props}
  >
    <path d={STAR_PATH} fill="currentColor" />
    <path
      d={MUSIC_NOTE_PATH}
      fill="currentColor"
      transform="translate(16, 2) scale(0.35)"
    />
    <path
      d={MUSIC_NOTE_PATH}
      fill="currentColor"
      transform="translate(2, 16) scale(0.35)"
    />
  </svg>
);
