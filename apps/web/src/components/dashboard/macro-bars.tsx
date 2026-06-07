interface MacroBarsProps {
  protein: number
  carbs: number
  fat: number
  calories: number
}

export function MacroBars({ protein, carbs, fat, calories }: MacroBarsProps) {
  const proteinCals = protein * 4
  const carbCals = carbs * 4
  const fatCals = fat * 9

  const bars = [
    {
      label: 'Protein',
      grams: protein,
      cals: proteinCals,
      pct: Math.round((proteinCals / calories) * 100),
      color: 'bg-teal-500',
      track: 'bg-teal-100',
    },
    {
      label: 'Carbs',
      grams: carbs,
      cals: carbCals,
      pct: Math.round((carbCals / calories) * 100),
      color: 'bg-amber-400',
      track: 'bg-amber-100',
    },
    {
      label: 'Fat',
      grams: fat,
      cals: fatCals,
      pct: Math.round((fatCals / calories) * 100),
      color: 'bg-rose-400',
      track: 'bg-rose-100',
    },
  ]

  return (
    <div className="space-y-4">
      {bars.map(({ label, grams, pct, color, track }) => (
        <div key={label} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">{label}</span>
            <span className="text-slate-400 font-medium">{grams}g · {pct}%</span>
          </div>
          <div className={`h-2.5 rounded-full ${track}`}>
            <div
              className={`h-full rounded-full ${color} transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
