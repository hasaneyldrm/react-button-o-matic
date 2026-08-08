export function CheckboxField({
  label,
  defaultChecked = false,
}: {
  label: string
  defaultChecked?: boolean
}) {
  return (
    <label className="checkbox-row">
      <input type="checkbox" defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  )
}
