import type { ReactNode } from 'react';

export type IconName =
  | 'drop' | 'pulse' | 'pill' | 'clipboard' | 'home' | 'user' | 'message' | 'send'
  | 'check' | 'plus' | 'chevronRight' | 'bell' | 'phone' | 'bulb'
  | 'warningTri' | 'warningCircle' | 'switch';

export function Icon({
  name, size = 24, color = 'currentColor', strokeWidth = 1.9,
}: {
  name: IconName; size?: number; color?: string; strokeWidth?: number;
}) {
  const s = {
    fill: 'none', stroke: color, strokeWidth,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  const svg = (children: ReactNode, vb = '0 0 24 24', w = size, h = size) => (
    <svg width={w} height={h} viewBox={vb} fill="none">{children}</svg>
  );
  switch (name) {
    case 'drop':
      return svg(<><path d="M12 3c0 4-3 5-3 8a3 3 0 0 0 6 0c0-3-3-4-3-8z" fill={color} /><path d="M8 16a4 4 0 0 0 8 0" stroke={color} strokeWidth={1.6} strokeLinecap="round" fill="none" /></>);
    case 'pulse':
      return svg(<path d="M3 12h4l2-6 3 12 2-6h7" {...s} />);
    case 'pill':
      return svg(<><path d="M10.5 13.5 7 17a3.5 3.5 0 0 1-5-5l3.5-3.5" {...s} /><path d="M13.5 10.5 17 7a3.5 3.5 0 0 0-5-5L8.5 5.5" {...s} /><path d="M9 15l6-6" {...s} /></>);
    case 'clipboard':
      return svg(<><rect x={6} y={4} width={12} height={17} rx={2.5} {...s} /><path d="M9.5 4h5v3h-5z" {...s} /><path d="M9 11.5h6M9 15h4" {...s} /></>);
    case 'home':
      return svg(<><path d="M3 10.5 12 3l9 7.5" {...s} /><path d="M5 9.5V20h14V9.5" {...s} /></>);
    case 'user':
      return svg(<><circle cx={12} cy={8} r={3.5} {...s} /><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" {...s} /></>);
    case 'message':
      return svg(<path d="M5 6h14v9H10l-4 3.5V15H5z" {...s} />);
    case 'send':
      return svg(<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" {...s} />);
    case 'check':
      return svg(<path d="M5 12.5l4.5 4.5L19 6.5" {...s} />);
    case 'plus':
      return svg(<path d="M12 5v14M5 12h14" {...s} />);
    case 'chevronRight':
      return svg(<path d="M9 5l7 7-7 7" {...s} />);
    case 'bell':
      return svg(<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" {...s} /><path d="M10.5 21a1.8 1.8 0 0 0 3 0" {...s} /></>);
    case 'phone':
      return svg(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l1 4v2a2 2 0 0 1-2 2A16 16 0 0 1 3 7a2 2 0 0 1 2-3z" {...s} />);
    case 'bulb':
      return svg(<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c.6.6 1 1.3 1 2h6c0-.7.4-1.4 1-2a6 6 0 0 0-4-10z" {...s} />);
    case 'warningTri':
      return svg(<><path d="M12 8v5" {...s} /><circle cx={12} cy={16.5} r={0.3} {...s} /><path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" {...s} /></>);
    case 'warningCircle':
      return svg(<><path d="M12 8v5" {...s} /><circle cx={12} cy={16.5} r={0.4} {...s} /></>);
    case 'switch':
      return svg(<><path d="M7 16V4M7 4 3.5 7.5M7 4l3.5 3.5" {...s} /><path d="M17 8v12m0 0 3.5-3.5M17 20l-3.5-3.5" {...s} /></>);
    default:
      return null;
  }
}
