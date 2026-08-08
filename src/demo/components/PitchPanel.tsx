import { DotGlobe } from '../DotGlobe'
import { ArrowUpRightIcon, ChevronDownIcon, GlobeIcon } from '../icons'

export interface PitchPanelProps {
  eyebrow: string
  headline: string
  copy: string
  ctaLabel: string
  ctaHref: string
}

export function PitchPanel({
  eyebrow,
  headline,
  copy,
  ctaLabel,
  ctaHref,
}: PitchPanelProps) {
  return (
    <aside className="pane pane--pitch">
      <div className="topbar">
        <button type="button" className="lang-button">
          <GlobeIcon />
          <span>English</span>
          <ChevronDownIcon />
        </button>
        <button type="button" className="signup-button">
          Sign up
        </button>
      </div>

      <DotGlobe />

      <div className="pitch">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{headline}</h2>
        <p className="pitch-copy">{copy}</p>
        <a className="methodology" href={ctaHref} target="_blank" rel="noreferrer">
          <ArrowUpRightIcon />
          <span>{ctaLabel}</span>
        </a>
      </div>

      <div className="carousel-dots" aria-hidden="true">
        <span className="carousel-dot carousel-dot--active" />
        <span className="carousel-dot" />
      </div>
    </aside>
  )
}
