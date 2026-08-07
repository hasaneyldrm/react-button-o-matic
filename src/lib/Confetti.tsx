import { useMemo } from 'react'

interface Piece {
  left: number
  tx: number
  ty: number
  rotate: number
  size: number
  delay: number
  duration: number
  color: string
  round: boolean
}

export function ConfettiBurst({
  colors,
  count = 70,
}: {
  colors: string[]
  count?: number
}) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, () => ({
        left: 20 + Math.random() * 60,
        tx: (Math.random() - 0.5) * 340,
        ty: 160 + Math.random() * 260,
        rotate: (Math.random() - 0.5) * 900,
        size: 5 + Math.random() * 6,
        delay: Math.random() * 0.25,
        duration: 1.1 + Math.random() * 0.9,
        color: colors[Math.floor(Math.random() * colors.length)],
        round: Math.random() < 0.3,
      })),
    [colors, count],
  )

  return (
    <div className="bom-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="bom-confettiPiece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.round ? 1 : 0.55),
            borderRadius: p.round ? '50%' : 1,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ['--bom-tx' as string]: `${p.tx}px`,
            ['--bom-ty' as string]: `${p.ty}px`,
            ['--bom-rz' as string]: `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  )
}
