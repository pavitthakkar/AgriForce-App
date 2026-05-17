export default function CanvasPipe({ pipe, onClick }) {
  if (!pipe.points || pipe.points.length < 2) return null;

  const pointsStr = pipe.points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer"
    >
      {/* Outer glow */}
      <polyline
        points={pointsStr}
        fill="none"
        stroke="hsl(200, 60%, 70%)"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.3}
      />
      {/* Main pipe */}
      <polyline
        points={pointsStr}
        fill="none"
        stroke="hsl(200, 70%, 50%)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Flow dots */}
      {pipe.points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill="white"
          stroke="hsl(200, 70%, 50%)"
          strokeWidth={1.5}
        />
      ))}
    </g>
  );
}