export type Sex = 'male' | 'female'

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete'

export type GoalType =
  | 'mildLoss'
  | 'moderateLoss'
  | 'aggressiveLoss'
  | 'recomposition'
  | 'leanGain'
  | 'maintenance'

export type Symptom =
  | 'nausea'
  | 'constipation'
  | 'reflux'
  | 'fatigue'
  | 'poorIntake'
  | 'hypoglycemia'

export type DietPattern =
  | 'highProtein'
  | 'mediterranean'
  | 'lowerCarb'
  | 'vegetarian'
  | 'vegan'
  | 'glp1SmallMeals'
  | 'diabetesFriendly'

export interface UserProfile {
  age: number
  sex: Sex
  heightInches: number
  weightLbs: number
  bodyFatPercent: number
  waistInches: number
  activityLevel: ActivityLevel
  goal: GoalType
  onGlp1: boolean
  symptoms: Symptom[]
  conditions: string[]
}

export interface MetabolicPrescription {
  bmr: number
  tdee: number
  targetCalories: number
  proteinGrams: number
  carbGrams: number
  fatGrams: number
  proteinPerKg: number
  leanMassLbs: number
  leanMassKg: number
  weightKg: number
  adjustedBodyWeightKg: number | null
  bmi: number
  bmiClass: string
  bodyFatClass: string
  obesityClass: string
  dietPattern: DietPattern
  stepGoal: number
  sleepHours: { min: number; max: number }
  hydrationMl: number
  exerciseMinPerWeek: number
  resistanceDaysPerWeek: number
  alerts: Alert[]
}

export interface Alert {
  level: 'high' | 'medium' | 'info'
  message: string
}

export interface MacroDistribution {
  proteinPercent: number
  carbPercent: number
  fatPercent: number
}
