'use client'

interface StatChipProps {
  label: string
  value: string | number | null | undefined
}

export default function StatChip({ label, value }: StatChipProps) {
  if (value === null || value === undefined || value === '') return null
  return (
    <span
      className="badge border d-inline-flex align-items-center gap-1 px-2 py-1"
      style={{ borderRadius: 8, background: 'transparent', borderColor: '#dee2e6' }}
    >
      <span className="text-muted fw-normal" style={{ fontSize: 11 }}>{label}</span>
      <span className="fw-bold text-body" style={{ fontSize: 11 }}>{value}</span>
    </span>
  )
}
