import { useState } from 'react'
import { EyeIcon } from '../icons'

export interface TextFieldProps {
  id: string
  label: string
  type?: string
  autoComplete?: string
}

export function TextField({ id, label, type = 'text', autoComplete }: TextFieldProps) {
  return (
    <>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input id={id} type={type} className="field" autoComplete={autoComplete} />
    </>
  )
}

export function PasswordField({
  id,
  label,
  autoComplete = 'current-password',
}: {
  id: string
  label: string
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="field-wrap">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="field"
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="eye-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <EyeIcon off={visible} />
        </button>
      </div>
    </>
  )
}
