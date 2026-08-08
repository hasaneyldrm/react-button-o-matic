import { useMemo } from 'react'

interface Piece {
  left: number
  upX: number
  upY: number
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
  count = 90,
}: {
  colors: string[]
  count?: number
}) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, () => {
        const drift = (Math.random() - 0.5) * 380
        return {
          left: 30 + Math.random() * 40,
          upX: drift * 0.4,
          upY: -(50 + Math.random() * 150),
          tx: drift,
          ty: 200 + Math.random() * 320,
          rotate: (Math.random() - 0.5) * 1100,
          size: 5 + Math.random() * 6,
          delay: Math.random() * 0.3,
          duration: 1.5 + Math.random() * 1.1,
          color: colors[Math.floor(Math.random() * colors.length)],
          round: Math.random() < 0.3,
        }
      }),
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
            ['--bom-upx' as string]: `${p.upX}px`,
            ['--bom-upy' as string]: `${p.upY}px`,
            ['--bom-tx' as string]: `${p.tx}px`,
            ['--bom-ty' as string]: `${p.ty}px`,
            ['--bom-rz' as string]: `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  )
}
