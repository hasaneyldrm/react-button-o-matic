import { CloudLogo } from '../icons'

export function Brand({ name }: { name: string }) {
  return (
    <div className="brand">
      <CloudLogo />
      <span className="brand-name">{name}</span>
    </div>
  )
}
