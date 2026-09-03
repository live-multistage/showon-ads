import clsx from "clsx";

interface LogoProps {
  size?: number;
  color?: string;
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
}

export function Logo({
  size = 32,
  color = '#ff2e9e',
  showWordmark = true,
  className,
  wordmarkClassName,
}: LogoProps) {
  const iconWidth = 240;
  const totalWidth = showWordmark ? 290 : iconWidth;

  return (
    <>
      <svg
        width={showWordmark ? undefined : size}
        height={size}
        viewBox={`0 0 ${totalWidth} 220`}
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="showon.io"
        fill="none"
      >
        {/* Broadcast Frame */}

        <path
          d="M40 40 L40 180 L98 146"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M40 40 L98 74"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Left Dot */}

        <circle cx={110} cy={110} r={7} fill={color} />

        {/* Wave */}

        <rect x={128} y={92} width={14} height={36} rx={7} fill={color} />
        <rect x={152} y={70} width={14} height={80} rx={7} fill={color} />
        <rect x={176} y={48} width={14} height={124} rx={7} fill={color} />
        <rect x={200} y={76} width={14} height={68} rx={7} fill={color} />

        {/* Right Dot */}

        <circle cx={232} cy={110} r={7} fill={color} />
      </svg>

      {showWordmark && (
        <span className={wordmarkClassName}>
          show
          <span style={{ color }}>on</span>
          .io
        </span>
      )}
    </>
  );
}