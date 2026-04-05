import type { PieceId } from "../constants"

// Each mark mirrors the piece's favicon shape — same visual language
export function PieceMark({ id, size = 20 }: { id: PieceId; size?: number }) {
  const s = size
  const mid = s / 2
  const accent = "#a855f7"

  if (id === "hiven") return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="5" fill={accent} opacity="0.9"/>
    </svg>
  )

  if (id === "kaipuu") return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="9" y="9" width="14" height="14" rx="3" fill={accent} opacity="0.85"/>
    </svg>
  )

  if (id === "vare") return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 10 Q16 22 24 10" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.85"/>
    </svg>
  )

  if (id === "polku") return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="5" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.85"/>
      <line x1="16" y1="8" x2="16" y2="11" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.85"/>
    </svg>
  )

  // viive — dormant, just a faint dot
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="3" fill={accent} opacity="0.3"/>
    </svg>
  )
}
