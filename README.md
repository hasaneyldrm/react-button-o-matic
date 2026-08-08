# react-button-o-matic

> **BUTTON-O-MATIC 3000** — a slot-machine sign-in button for React. Pull the lever, let the reels decide which button variant ships. For science.

Why A/B test your sign-in button color when a slot machine can decide per visitor? Pull the lever, the reels spin, all three land on the same variant — **JACKPOT** — confetti flies, and the machine morphs into a real, clickable sign-in button in the winning color. Every click is "recorded", n=you.

Inspired by [this tweet by @joshmanders](https://x.com/joshmanders/status/2085797355366809950) ("What if, and hear me out, Cloudflare... You make it fun?"), itself a reply to a Cloudflare engineer musing about measuring which sign-in button gets clicked the most. Not affiliated with Cloudflare in any way.

**Live demo:** https://hasaneyldrm.github.io/react-button-o-matic/

## Install

```bash
npm install react-button-o-matic
```

## Usage

```tsx
import { ButtonOMatic } from 'react-button-o-matic'
import 'react-button-o-matic/style.css'

function LoginForm() {
  return (
    <form onSubmit={handleSubmit}>
      {/* email, password, ... */}
      <ButtonOMatic
        buttonType="submit"
        persistKey="my-app-button-experiment"
        onReveal={(winner) => track('button_variant', winner.id)}
        onButtonClick={(count, winner) => track('sign_in_click', { count, winner: winner.id })}
      />
    </form>
  )
}
```

The component is fully self-contained: state machine (`idle → rolling → jackpot → revealed`), lever, reels, LCD, confetti and the revealed button are all included. No dependencies beyond React.

## Everything is dynamic

All copy, colors, timing and behavior are props:

```tsx
<ButtonOMatic
  variants={[
    { id: 'purple', background: '#7c3aed' },
    { id: 'teal', background: '#0d9488' },
    { id: 'pink', background: '#db2777', label: 'Let me in' },
  ]}
  buttonLabel="Log in"
  marqueeText="NO MORE MEETINGS"
  machineName="LOGIN-TRON 9000"
  idleText="PULL TO REVEAL YOUR LOGIN BUTTON"
  rollingText="CONSULTING THE ALGORITHM…"
  jackpotText={({ winner }) => `WINNER — ${winner.id.toUpperCase()}`}
  winnerText={({ winner }) => `the reels chose ${winner.id}.`}
  clicksText={({ count }) => `${count} clicks and counting.`}
  resetText="spin again"
  reels={3}
  spinDuration={1600}
  reelStagger={550}
  jackpotDuration={1600}
  winnerId="teal" // rig the outcome
/>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variants` | `ButtonOMaticVariant[]` | blue / black / orange | Button variants loaded in the reels. `{ id, background, color?, label? }` |
| `buttonLabel` | `string` | `"Sign in"` | Label on reel buttons and the revealed button |
| `marqueeText` | `string` | `"FOR SCIENCE"` | Text on the black marquee |
| `machineName` | `string` | `"BUTTON-O-MATIC 3000"` | Model name on the machine body |
| `reels` | `number` | `3` | Number of reels |
| `idleText` | `string` | `"PULL TO REVEAL YOUR SIGN-IN BUTTON"` | LCD copy while idle |
| `rollingText` | `string` | `"ROLLING…"` | LCD copy while spinning |
| `jackpotText` | `string \| ({ winner }) => string` | `` `JACKPOT — ${id} SHIPS` `` | LCD copy on jackpot |
| `winnerText` | `string \| ({ winner }) => string` | `` `winner: ${id}. your click counts.` `` | Caption under the revealed button |
| `clicksText` | `string \| ({ count, winner }) => string` | `` `n=${count} clicks recorded — for science.` `` | Caption once clicked |
| `resetText` | `string \| null` | `"reset experiment"` | Reset link label; `null` hides it |
| `leverLabel` | `string` | `"Pull the lever"` | Accessible label for the lever |
| `winnerId` | `string` | — | Rig the outcome to a variant id |
| `pickWinner` | `(variants) => string` | uniform random | Custom winner picker |
| `spinDuration` | `number` | `1600` | ms before the first reel lands |
| `reelStagger` | `number` | `550` | ms between reels landing |
| `jackpotDuration` | `number` | `1600` | ms the celebration holds before the morph |
| `confetti` | `boolean` | `true` | Confetti on jackpot |
| `confettiColors` | `string[]` | variant colors + festive extras | Confetti palette |
| `persistKey` | `string` | — | Persist outcome + clicks in `localStorage` |
| `buttonType` | `"button" \| "submit"` | `"button"` | `type` of the revealed button |
| `disabled` | `boolean` | `false` | Disable the whole machine |
| `onPull` | `() => void` | — | Lever pulled |
| `onReveal` | `(winner) => void` | — | Reels settled on a winner |
| `onButtonClick` | `(count, winner) => void` | — | Revealed button clicked |
| `onReset` | `() => void` | — | Experiment reset |
| `renderRevealed` | `({ winner, count, click, reset }) => ReactNode` | — | Full control over the revealed state |
| `className` / `style` | — | — | Passed to the root element |

### Theming

The look is driven by CSS custom properties on the root `.bom` class — override any of them from your own stylesheet or the `style` prop: `--bom-machine-bg`, `--bom-marquee-bg`, `--bom-lcd-color`, `--bom-reel-h`, `--bom-knob`, `--bom-glow`, `--bom-radius`, `--bom-mono`, and friends (see `src/lib/button-o-matic.css`).

### Accessibility

The lever is a real `<button>` (keyboard operable, focus ring, `aria-label`), LCD updates announce via `aria-live`, and `prefers-reduced-motion` collapses the whole show into a quick, blur-free reveal.

## Demo

The repo ships a full demo page recreating the login screen from the original video:

```bash
npm install
npm run dev
```

## License

[MIT](./LICENSE)
