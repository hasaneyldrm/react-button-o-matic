import { useState } from 'react'
import { ButtonOMatic } from '../lib'
import { DotGlobe } from './DotGlobe'
import {
  AppleIcon,
  ArrowUpRightIcon,
  ChevronDownIcon,
  CloudLogo,
  EyeIcon,
  GitHubIcon,
  GlobeIcon,
  GoogleIcon,
  LockIcon,
} from './icons'
import './demo.css'

const ORIGINAL_TWEET = 'https://x.com/joshmanders/status/2085797355366809950'

export default function App() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="page">
      <main className="pane pane--form">
        <div className="brand">
          <CloudLogo />
          <span className="brand-name">Nimbus</span>
        </div>

        <div className="form-column">
          <h1 className="title">Sign in to Nimbus</h1>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="oauth-row">
              <button type="button" className="oauth-button">
                <GoogleIcon />
                <span>Google</span>
              </button>
              <button type="button" className="oauth-button">
                <AppleIcon />
                <span>Apple</span>
              </button>
              <button type="button" className="oauth-button">
                <GitHubIcon />
                <span>GitHub</span>
              </button>
            </div>

            <button type="button" className="oauth-button oauth-button--wide">
              <LockIcon />
              <span>Continue with SSO</span>
            </button>

            <div className="divider" role="separator">
              <span>OR</span>
            </div>

            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" className="field" autoComplete="email" />

            <label className="field-label" htmlFor="password">
              Password
            </label>
            <div className="field-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="field"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>

            <label className="checkbox-row">
              <input type="checkbox" defaultChecked />
              <span>Save email and login method on this device</span>
            </label>

            <ButtonOMatic
              buttonType="submit"
              onReveal={(winner) => console.log('[button-o-matic] winner:', winner.id)}
              onButtonClick={(count) => console.log('[button-o-matic] clicks:', count)}
            />
          </form>

          <div className="footer-links">
            <p>
              Don&apos;t have an account? <a href="#signup">Sign up</a>
            </p>
            <p>
              Forgot your <a href="#email">email</a> or <a href="#password">password</a>?
            </p>
          </div>
        </div>
      </main>

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
          <p className="eyebrow">The Great Button Experiment</p>
          <h2>Where the Internet&apos;s buttons get clicked.</h2>
          <p className="pitch-copy">
            Blue, black, or orange — one payline decides. Sample size: you.
          </p>
          <a
            className="methodology"
            href={ORIGINAL_TWEET}
            target="_blank"
            rel="noreferrer"
          >
            <ArrowUpRightIcon />
            <span>Read the methodology</span>
          </a>
        </div>

        <div className="carousel-dots" aria-hidden="true">
          <span className="carousel-dot carousel-dot--active" />
          <span className="carousel-dot" />
        </div>
      </aside>
    </div>
  )
}
