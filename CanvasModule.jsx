export default function CanvasModule({ module, onDragStart, onClick }) {
  const { type, x, y, width: w, height: h, data } = module;

  if (type === "plant") {
    const r = Math.min(w, h) / 2;
    const cx = x + w / 2;
    const cy = y + h / 2;
    return (
      <g onMouseDown={onDragStart} onClick={(e) => { e.stopPropagation(); onClick(); }} className="cursor-move">
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={r} fill="hsl(140, 55%, 88%)" stroke="hsl(140, 50%, 50%)" strokeWidth={1.5} />
        {/* Simple plant leaf shape */}
        <ellipse cx={cx} cy={cy - r * 0.15} rx={r * 0.45} ry={r * 0.55} fill="hsl(140, 55%, 48%)" opacity={0.85} />
        <line x1={cx} y1={cy + r * 0.3} x2={cx} y2={cy - r * 0.1} stroke="hsl(140, 45%, 35%)" strokeWidth={1} />
        {/* Name label below */}
        <text x={cx} y={y + h + 11} textAnchor="middle" fontSize={Math.max(7, Math.min(10, w * 0.22))} fontWeight={500} fill="hsl(140, 40%, 28%)" fontFamily="var(--font-body)">
          {data?.name}
        </text>
      </g>
    );
  }

  if (type === "lighting") {
    // Rendered as a thin horizontal bar across the top of the cell
    const barH = Math.max(8, h);
    return (
      <g onMouseDown={onDragStart} onClick={(e) => { e.stopPropagation(); onClick(); }} className="cursor-move">
        {/* Main bar */}
        <rect x={x} y={y} width={w} height={barH} rx={3} fill="hsl(48, 95%, 75%)" stroke="hsl(45, 80%, 50%)" strokeWidth={1.5} />
        {/* Inner glow strip */}
        <rect x={x + 2} y={y + 1} width={w - 4} height={barH - 3} rx={2} fill="hsl(55, 100%, 92%)" opacity={0.8} />
        {/* Label */}
        <text x={x + w / 2} y={y - 4} textAnchor="middle" fontSize={Math.max(6, Math.min(9, w * 0.16))} fontWeight={500} fill="hsl(45, 60%, 30%)" fontFamily="var(--font-body)">
          {data?.lightingType}
        </text>
      </g>
    );
  }

  return null;
}