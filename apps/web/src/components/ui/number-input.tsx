import * as React from 'react'
import { Input, type InputProps } from './input'

export interface NumberInputProps
  extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  value: number
  onValueChange: (value: number) => void
}

/**
 * Numeric input for fields backed by a `number` in state.
 *
 * A plain `<input type="number" value={n} onChange={e => set(+e.target.value)} />`
 * has two well-known UX bugs:
 *  - clearing the field snaps back to "0" instead of staying empty
 *  - typing a fresh number afterwards then produces a leading zero (e.g. "019")
 *
 * This component keeps its own text buffer so the field can be empty while
 * the user is typing, and only pushes a parsed number up via `onValueChange`
 * once the typed text is a valid number. An empty/invalid buffer reverts to
 * the last known-good value on blur.
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onValueChange, onChange, onBlur, ...props }, ref) => {
    const [raw, setRaw] = React.useState(String(value))

    React.useEffect(() => {
      setRaw(String(value))
    }, [value])

    return (
      <Input
        ref={ref}
        type="number"
        value={raw}
        onChange={(e) => {
          const next = e.target.value
          setRaw(next)
          onChange?.(e)
          if (next === '' || next === '-') return
          const parsed = Number(next)
          if (!Number.isNaN(parsed)) onValueChange(parsed)
        }}
        onBlur={(e) => {
          if (raw === '' || Number.isNaN(Number(raw))) {
            setRaw(String(value))
          }
          onBlur?.(e)
        }}
        {...props}
      />
    )
  }
)
NumberInput.displayName = 'NumberInput'
