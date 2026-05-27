import React, { SVGProps } from 'react';

/** Claude-style wide sidebar panel toggle icon */
export const IconPanelSidebar = ({
  width = 28,
  height = 20,
  className = '',
  ...props
}: SVGProps<SVGSVGElement> & { width?: number; height?: number }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 28 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden
    {...props}
  >
    <rect
      x="1"
      y="1"
      width="26"
      height="18"
      rx="4"
      stroke="currentColor"
      strokeWidth="1.75"
    />
    <path
      d="M9 1V19"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);
