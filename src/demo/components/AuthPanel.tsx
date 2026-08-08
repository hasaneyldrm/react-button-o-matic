import { ButtonOMatic } from '../../lib'
import { AppleIcon, GitHubIcon, GoogleIcon, LockIcon } from '../icons'
import { Brand } from './Brand'
import { CheckboxField } from './CheckboxField'
import { OAuthButton } from './OAuthButton'
import { PasswordField, TextField } from './TextField'

export function AuthPanel({ brand }: { brand: string }) {
  return (
    <main className="pane pane--form">
      <Brand name={brand} />

      <div className="form-column">
        <h1 className="title">Sign in to {brand}</h1>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="oauth-row">
            <OAuthButton icon={<GoogleIcon />} label="Google" />
            <OAuthButton icon={<AppleIcon />} label="Apple" />
            <OAuthButton icon={<GitHubIcon />} label="GitHub" />
          </div>

          <OAuthButton icon={<LockIcon />} label="Continue with SSO" wide />

          <div className="divider" role="separator">
            <span>OR</span>
          </div>

          <TextField id="email" label="Email" type="email" autoComplete="email" />
          <PasswordField id="password" label="Password" />

          <CheckboxField
            label="Save email and login method on this device"
            defaultChecked
          />

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
  )
}
