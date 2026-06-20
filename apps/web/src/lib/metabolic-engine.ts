import type {
  UserProfile,
  MetabolicPrescription,
  Alert,
  DietPattern,
  ActivityLevel,
} from './types'

// ─── Constants ───────────────────────────────────────────────────────────────

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.35,
  moderate: 1.5,
  heavy: 1.7,
  athlete: 1.9,
}

const LBS_TO_KG = 0.453592
const INCHES_TO_CM = 2.54

// ─── BMR (Harris-Benedict revised) ───────────────────────────────────────────

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'male' | 'female'
): number {
  if (sex === 'male') {
    return Math.round(88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age)
  }
  return Math.round(447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age)
}

// ─── Adjusted Body Weight (for obesity, BMI > 30) ────────────────────────────

export function getAdjustedBodyWeight(
  actualKg: number,
  idealKg: number
): number {
  return Math.round((idealKg + 0.4 * (actualKg - idealKg)) * 10) / 10
}

export function getIdealBodyWeight(heightCm: number, sex: 'male' | 'female'): number {
  const heightInches = heightCm / INCHES_TO_CM
  if (sex === 'male') return (50 + 2.3 * (heightInches - 60)) * 1
  return (45.5 + 2.3 * (heightInches - 60)) * 1
}

// ─── Main prescription engine ─────────────────────────────────────────────────

export function calculatePrescription(profile: UserProfile): MetabolicPrescription {
  const weightKg = profile.weightLbs * LBS_TO_KG
  const heightCm = profile.heightInches * INCHES_TO_CM
  const leanMassLbs = profile.weightLbs * (1 - profile.bodyFatPercent / 100)
  const leanMassKg = leanMassLbs * LBS_TO_KG

  const bmi = (profile.weightLbs / (profile.heightInches * profile.heightInches)) * 703
  const bmiClass = getBmiClass(bmi)
  const bodyFatClass = getBodyFatClass(profile.bodyFatPercent, profile.sex)
  const obesityClass = getObesityClass(bmi)

  const idealKg = getIdealBodyWeight(heightCm, profile.sex)
  const adjustedBodyWeightKg =
    bmi >= 30 ? getAdjustedBodyWeight(weightKg, idealKg) : null

  const bmr = calculateBMR(weightKg, heightCm, profile.age, profile.sex)
  const tdee = Math.round(bmr * ACTIVITY_FACTORS[profile.activityLevel])

  // Calorie targets
  const targetCalories = getTargetCalories(tdee, profile.goal)

  // Protein prescription hierarchy
  const { proteinGrams, proteinPerKg } = calculateProtein(profile, weightKg, idealKg, bmi)

  // Macro distribution
  const proteinCals = proteinGrams * 4
  const remainingCals = Math.max(targetCalories - proteinCals, 0)
  const { carbPercent, fatPercent } = getMacroSplit(profile)
  const carbGrams = Math.round((remainingCals * carbPercent) / 4)
  const fatGrams = Math.round((remainingCals * fatPercent) / 9)

  // Lifestyle targets
  const stepGoal = getStepGoal(profile)
  const hydrationMl = getHydrationMl(weightKg, profile)
  const sleepHours = { min: 7, max: 9 }
  const { exerciseMinPerWeek, resistanceDaysPerWeek } = getExerciseTargets(profile.goal)

  // Diet pattern
  const dietPattern = getDietPattern(profile)

  // Alerts
  const alerts = generateAlerts(profile, {
    targetCalories,
    proteinGrams,
    bmi,
    leanMassKg,
  })

  return {
    bmr,
    tdee,
    targetCalories,
    proteinGrams,
    carbGrams,
    fatGrams,
    proteinPerKg,
    leanMassLbs: Math.round(leanMassLbs * 10) / 10,
    leanMassKg: Math.round(leanMassKg * 10) / 10,
    weightKg: Math.round(weightKg * 10) / 10,
    adjustedBodyWeightKg,
    bmi: Math.round(bmi * 10) / 10,
    bmiClass,
    bodyFatClass,
    obesityClass,
    dietPattern,
    stepGoal,
    sleepHours,
    hydrationMl,
    exerciseMinPerWeek,
    resistanceDaysPerWeek,
    alerts,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTargetCalories(tdee: number, goal: UserProfile['goal']): number {
  switch (goal) {
    case 'mildLoss':
      return tdee - 300
    case 'moderateLoss':
      return tdee - 500
    case 'aggressiveLoss':
      return tdee - 700
    case 'recomposition':
      return tdee - 200
    case 'leanGain':
      return tdee + 200
    case 'maintenance':
    default:
      return tdee
  }
}

function hasFocus(profile: UserProfile, f: string): boolean {
  return profile.conditionFocus?.includes(f as any) ?? false
}

function hasCondition(profile: UserProfile, keyword: string): boolean {
  return profile.conditions.some((c) => c.toLowerCase().includes(keyword.toLowerCase()))
}

function isDialysis(profile: UserProfile): boolean {
  return hasCondition(profile, 'dialysis')
}

function isCKD(profile: UserProfile): boolean {
  return hasFocus(profile, 'ckd') || hasCondition(profile, 'kidney')
}

function calculateProtein(
  profile: UserProfile,
  weightKg: number,
  idealKg: number,
  bmi: number,
): { proteinGrams: number; proteinPerKg: number } {
  // Priority 1: Dialysis — 1.0 g × IBW/day
  if (isDialysis(profile)) {
    const grams = Math.round(idealKg * 1.0)
    return { proteinGrams: grams, proteinPerKg: Math.round((grams / weightKg) * 10) / 10 }
  }

  // Priority 2: Non-dialysis CKD — 0.8 g/kg/day
  if (isCKD(profile)) {
    const refKg = bmi >= 35 ? idealKg : weightKg
    const grams = Math.round(refKg * 0.8)
    return { proteinGrams: grams, proteinPerKg: Math.round((grams / weightKg) * 10) / 10 }
  }

  // Priority 3: BMI ≥ 35 without CKD — 1.5 g × IBW/day
  if (bmi >= 35) {
    const grams = Math.round(idealKg * 1.5)
    return { proteinGrams: grams, proteinPerKg: Math.round((grams / weightKg) * 10) / 10 }
  }

  // Priority 4: Standard goal-based
  const refKg = bmi >= 30 ? getAdjustedBodyWeight(weightKg, idealKg) : weightKg
  let perKg: number

  if (profile.onGlp1) {
    perKg = 2.0
  } else if (profile.age >= 60) {
    perKg = profile.goal === 'maintenance' ? 1.2 : 1.4
  } else {
    switch (profile.goal) {
      case 'leanGain':
        perKg = 2.1
        break
      case 'recomposition':
        perKg = 1.9
        break
      case 'moderateLoss':
      case 'mildLoss':
      case 'aggressiveLoss':
        perKg = 1.4
        break
      case 'maintenance':
      default:
        perKg = 1.0
        break
    }
  }

  const grams = Math.round(refKg * perKg)
  return { proteinGrams: grams, proteinPerKg: perKg }
}

function getMacroSplit(profile: UserProfile): { carbPercent: number; fatPercent: number } {
  if (profile.onGlp1 || profile.goal === 'aggressiveLoss') {
    return { carbPercent: 0.35, fatPercent: 0.65 }
  }
  if (profile.goal === 'leanGain') {
    return { carbPercent: 0.55, fatPercent: 0.45 }
  }
  if (profile.goal === 'recomposition') {
    return { carbPercent: 0.4, fatPercent: 0.6 }
  }
  return { carbPercent: 0.45, fatPercent: 0.55 }
}

function getStepGoal(profile: UserProfile): number {
  switch (profile.activityLevel) {
    case 'sedentary':
      return 6000
    case 'light':
      return 8000
    case 'moderate':
      return 10000
    case 'heavy':
    case 'athlete':
      return 12000
    default:
      return 8000
  }
}

function getHydrationMl(weightKg: number, profile: UserProfile): number {
  let base = weightKg * 33
  if (profile.onGlp1) base += 250
  if (profile.activityLevel === 'heavy' || profile.activityLevel === 'athlete') base += 500
  return Math.round(base / 50) * 50
}

function getExerciseTargets(goal: UserProfile['goal']): {
  exerciseMinPerWeek: number
  resistanceDaysPerWeek: number
} {
  switch (goal) {
    case 'leanGain':
      return { exerciseMinPerWeek: 180, resistanceDaysPerWeek: 5 }
    case 'recomposition':
      return { exerciseMinPerWeek: 250, resistanceDaysPerWeek: 4 }
    case 'moderateLoss':
    case 'aggressiveLoss':
      return { exerciseMinPerWeek: 250, resistanceDaysPerWeek: 3 }
    case 'mildLoss':
      return { exerciseMinPerWeek: 200, resistanceDaysPerWeek: 2 }
    default:
      return { exerciseMinPerWeek: 150, resistanceDaysPerWeek: 2 }
  }
}

function getDietPattern(profile: UserProfile): DietPattern {
  if (profile.onGlp1) return 'glp1SmallMeals'
  if (hasFocus(profile, 'diabetes') || hasCondition(profile, 'diabet') || hasCondition(profile, 'prediabet'))
    return 'diabetesFriendly'
  if (isCKD(profile)) return 'lowerCarb'
  if (profile.goal === 'recomposition' || profile.goal === 'leanGain') return 'highProtein'
  if (profile.goal === 'aggressiveLoss') return 'lowerCarb'
  return 'mediterranean'
}

function getBmiClass(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal weight'
  if (bmi < 30) return 'Overweight'
  if (bmi < 35) return 'Obesity class I'
  if (bmi < 40) return 'Obesity class II'
  return 'Obesity class III'
}

function getBodyFatClass(bf: number, sex: 'male' | 'female'): string {
  if (sex === 'female') {
    if (bf < 14) return 'Essential fat'
    if (bf < 21) return 'Athletic'
    if (bf < 25) return 'Fitness'
    if (bf < 32) return 'Average'
    return 'Obese'
  }
  if (bf < 6) return 'Essential fat'
  if (bf < 14) return 'Athletic'
  if (bf < 18) return 'Fitness'
  if (bf < 25) return 'Average'
  return 'Obese'
}

function getObesityClass(bmi: number): string {
  if (bmi < 25) return 'None'
  if (bmi < 30) return 'Overweight'
  if (bmi < 35) return 'Class I obesity'
  if (bmi < 40) return 'Class II obesity'
  return 'Class III obesity'
}

function generateAlerts(
  profile: UserProfile,
  calc: { targetCalories: number; proteinGrams: number; bmi: number; leanMassKg: number }
): Alert[] {
  const alerts: Alert[] = []

  // CKD alerts
  if (isDialysis(profile)) {
    alerts.push({
      level: 'high',
      message: 'Dialysis patient — protein set to 1.0 g/kg IBW. Clinician oversight required',
    })
  } else if (isCKD(profile)) {
    alerts.push({
      level: 'high',
      message: 'CKD — protein restricted to 0.8 g/kg. Avoid high-protein diets without clinician approval',
    })
  }

  // Heart failure alerts
  if (hasFocus(profile, 'heartFailure') || hasCondition(profile, 'heart failure')) {
    alerts.push({
      level: 'medium',
      message: 'Heart failure — monitor daily weight, sodium intake, and fluid balance',
    })
  }

  // Heart rhythm alerts
  if (hasFocus(profile, 'heartRhythm') || hasCondition(profile, 'irregular') || hasCondition(profile, 'arrhythmia') || hasCondition(profile, 'atrial')) {
    alerts.push({
      level: 'medium',
      message: 'Heart rhythm condition — monitor heart rate during exercise and report palpitations',
    })
  }

  // Diabetes alerts
  if (hasFocus(profile, 'diabetes') || hasCondition(profile, 'diabet') || hasCondition(profile, 'prediabet')) {
    alerts.push({
      level: 'info',
      message: 'Diabetes focus — monitor glucose, prioritize low-glycemic foods, track A1C',
    })
  }

  // GLP-1 alerts
  if (profile.onGlp1) {
    if (profile.symptoms.includes('nausea') || profile.symptoms.includes('poorIntake')) {
      alerts.push({
        level: 'high',
        message: 'GLP-1: Poor intake reported — monitor protein and hydration closely',
      })
    }
    if (profile.symptoms.includes('constipation')) {
      alerts.push({
        level: 'medium',
        message: 'GLP-1: Constipation — increase fiber (25–35 g/day) and hydration',
      })
    }
    if (profile.symptoms.includes('hypoglycemia')) {
      alerts.push({
        level: 'high',
        message: 'GLP-1: Hypoglycemia risk — clinician review recommended',
      })
    }
    if (calc.targetCalories < 1200) {
      alerts.push({
        level: 'high',
        message: 'GLP-1: Target calories below 1200 kcal — clinician supervision required',
      })
    }
  }

  if (profile.goal === 'aggressiveLoss') {
    alerts.push({
      level: 'medium',
      message: 'Aggressive deficit selected — clinician supervision strongly recommended',
    })
  }

  if (calc.bmi >= 40) {
    alerts.push({
      level: 'medium',
      message: 'BMI ≥ 40 — Class III obesity. Clinical metabolic workup recommended',
    })
  }

  if (profile.symptoms.includes('fatigue') && profile.goal === 'aggressiveLoss') {
    alerts.push({
      level: 'medium',
      message: 'Fatigue + aggressive deficit — check for micronutrient gaps and sleep quality',
    })
  }

  return alerts
}
