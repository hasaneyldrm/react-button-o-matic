import type { ButtonOMaticVariant, TextOrFn } from './types'

export function resolveText<C>(text: TextOrFn<C>, ctx: C): string {
  return typeof text === 'function' ? text(ctx) : text
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function randomVariant(
  variants: ButtonOMaticVariant[],
  notId?: string,
): ButtonOMaticVariant {
  if (variants.length === 1) return variants[0]
  let v = variants[Math.floor(Math.random() * variants.length)]
  while (v.id === notId) {
    v = variants[Math.floor(Math.random() * variants.length)]
  }
  return v
}
