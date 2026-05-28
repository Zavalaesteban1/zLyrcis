import React, { SVGProps } from 'react';

/** Headphones icon — learning, stats, and progress. */
export const IconAgentHeadphone = ({
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
    className={`icon-agent-headphone ${className}`.trim()}
    aria-hidden
    {...props}
  >
    <path
      d="M4 13v4a3 3 0 003 3h2v-9H7a3 3 0 00-3 3z"
      fill="currentColor"
    />
    <path
      d="M20 13v4a3 3 0 01-3 3h-2v-9h2a3 3 0 013 3z"
      fill="currentColor"
    />
    <path
      d="M4 13v-1.5a8 8 0 0116 0V13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      className="icon-agent-headphone-spark"
      d="M12 1.25 12.55 3.15 14.45 3.7 12.55 4.25 12 6.15 11.45 4.25 9.55 3.7 11.45 3.15 12 1.25Z"
      fill="currentColor"
    />
  </svg>
);
