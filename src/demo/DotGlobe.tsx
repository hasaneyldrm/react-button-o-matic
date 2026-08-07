import { useMemo } from 'react'

/* Deterministic PRNG so the globe renders identically on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Dot {
  x: number
  y: number
  size: number
  opacity: number
}

export function DotGlobe({ size = 680 }: { size?: number }) {
  const dots = useMemo<Dot[]>(() => {
    const rnd = mulberry32(1337)
    const result: Dot[] = []
    const radius = size / 2
    const step = size / 46
    for (let y = step / 2; y < size; y += step) {
      for (let x = step / 2; x < size; x += step) {
        const dx = x - radius
        const dy = y - radius
        const dist = Math.sqrt(dx * dx + dy * dy) / radius
        if (dist > 1) continue
        // Thin the grid toward the edge and drop dots at random for texture.
        const keep = rnd() > 0.32 + dist * 0.38
        if (!keep) continue
        result.push({
          x: x + (rnd() - 0.5) * step * 0.5,
          y: y + (rnd() - 0.5) * step * 0.5,
          size: step * (0.22 + rnd() * 0.22),
          opacity: 0.2 + rnd() * 0.65,
        })
      }
    }
    return result
  }, [size])

  return (
    <svg
      className="dot-globe"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      {dots.map((d, i) => (
        <rect
          key={i}
          x={d.x}
          y={d.y}
          width={d.size}
          height={d.size}
          fill="#ffffff"
          opacity={d.opacity}
        />
      ))}
    </svg>
  )
}
