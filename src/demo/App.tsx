import { AuthPanel } from './components/AuthPanel'
import { PitchPanel } from './components/PitchPanel'
import './demo.css'

const ORIGINAL_TWEET = 'https://x.com/joshmanders/status/2085797355366809950'

export default function App() {
  return (
    <div className="page">
      <AuthPanel brand="Nimbus" />
      <PitchPanel
        eyebrow="The Great Button Experiment"
        headline="Where the Internet's buttons get clicked."
        copy="Blue, black, or orange — one payline decides. Sample size: you."
        ctaLabel="Read the methodology"
        ctaHref={ORIGINAL_TWEET}
      />
    </div>
  )
}
