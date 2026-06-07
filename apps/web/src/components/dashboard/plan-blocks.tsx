import { Dumbbell, Footprints, Moon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { MetabolicPrescription } from '@/lib/types'

interface PlanBlocksProps {
  rx: MetabolicPrescription
  onGlp1?: boolean
}

export function PlanBlocks({ rx, onGlp1 }: PlanBlocksProps) {
  const exerciseItems = [
    `${rx.exerciseMinPerWeek}+ min/week aerobic activity`,
    `${rx.resistanceDaysPerWeek}x/week resistance training`,
    'Progressive overload — increase weekly',
    'Zone 2 cardio recommended (conversational pace)',
    'Recovery day between resistance sessions',
  ]

  const neatItems = [
    `${rx.stepGoal.toLocaleString()} steps/day target`,
    '5-min walk after each meal',
    'Reduce consecutive sitting > 45 min',
    'Use stairs when possible',
    'Standing desk if available',
  ]

  const recoveryItems = [
    `Sleep ${rx.sleepHours.min}–${rx.sleepHours.max} hours/night`,
    `${Math.round(rx.hydrationMl / 240)} cups (${rx.hydrationMl} mL) water/day`,
    onGlp1 ? '+250 mL extra hydration (GLP-1)' : 'Adjust for heat and exercise',
    '25–35g fiber/day',
    'Limit alcohol — empty calories, poor sleep',
  ]

  const blocks = [
    { title: 'Exercise', icon: Dumbbell, items: exerciseItems, color: 'text-teal-600' },
    { title: 'NEAT & Steps', icon: Footprints, items: neatItems, color: 'text-amber-600' },
    { title: 'Sleep & Hydration', icon: Moon, items: recoveryItems, color: 'text-indigo-600' },
  ]

  return (
    <div className="grid sm:grid-cols-3 gap-5">
      {blocks.map(({ title, icon: Icon, items, color }) => (
        <Card key={title}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <CardTitle>{title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className={`mt-1 w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')} shrink-0`} />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
