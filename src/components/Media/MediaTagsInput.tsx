'use client'

import CreatableSelect from 'react-select/creatable'

interface MediaTagsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  options?: string[]
  errorText?: string
}

export default function MediaTagsInput({
  value,
  onChange,
  options = [],
  errorText = '',
}: MediaTagsInputProps) {
  const selectOptions = options.map((o) => ({ value: o, label: o }))
  const selectValue   = value.map((v) => ({ value: v, label: v }))

  const handleChange = (newValue: readonly { value: string; label: string }[]) => {
    const cleaned = (newValue ?? [])
      .map((t) => String(t.value).trim())
      .filter(Boolean)

    // deduplicate case-insensitive
    const seen = new Set<string>()
    const uniq: string[] = []
    for (const t of cleaned) {
      const key = t.toLowerCase()
      if (!seen.has(key)) { seen.add(key); uniq.push(t) }
    }
    onChange(uniq)
  }

  return (
    <div>
      <label className="form-label fw-semibold">
        Tags <span className="text-danger">*</span>
      </label>
      <CreatableSelect
        isMulti
        options={selectOptions}
        value={selectValue}
        onChange={handleChange as any}
        placeholder="Type and press Enter..."
        classNamePrefix="select2-selection"
        formatCreateLabel={(input) => `Add "${input}"`}
        styles={{
          control: (base) => ({
            ...base,
            borderRadius: 8,
            borderColor: errorText ? '#f06548' : base.borderColor,
            boxShadow: errorText ? '0 0 0 1px #f06548' : base.boxShadow,
          }),
          multiValue: (base) => ({
            ...base,
            borderRadius: 6,
            background: '#e9ecef',
          }),
        }}
      />
      <small className={errorText ? 'text-danger' : 'text-muted'} style={{ fontSize: 11 }}>
        {errorText || 'Type a tag and press Enter'}
      </small>
    </div>
  )
}
