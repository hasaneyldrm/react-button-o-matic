export interface MarqueeProps {
  text: string
  palette: string[]
  dotCount?: number
}

export function Marquee({ text, palette, dotCount = 9 }: MarqueeProps) {
  return (
    <div className="bom-marquee" aria-hidden="true">
      <div className="bom-marqueeDots">
        {Array.from({ length: dotCount }, (_, i) => (
          <span
            key={i}
            className="bom-marqueeDot"
            style={{
              background: palette[i % palette.length],
              animationDelay: `${i * 0.09}s`,
            }}
          />
        ))}
      </div>
      <span className="bom-marqueeText">{text}</span>
    </div>
  )
}
