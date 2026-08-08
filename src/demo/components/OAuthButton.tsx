import type { ReactNode } from 'react'

export interface OAuthButtonProps {
  icon: ReactNode
  label: string
  wide?: boolean
  onClick?: () => void
}

export function OAuthButton({ icon, label, wide = false, onClick }: OAuthButtonProps) {
  return (
    <button
      type="button"
      className={`oauth-button${wide ? ' oauth-button--wide' : ''}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
