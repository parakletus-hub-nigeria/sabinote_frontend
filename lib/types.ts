// ── Shared domain types aligned with the SabiNote backend schema ──

export interface User {
  userId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string | null
  state: string
  role: 'teacher' | 'admin'
  isVerified: boolean
  createdAt: string
}

export interface Wallet {
  walletId: string
  userId?: string
  balance: string
  createdAt?: string
  updatedAt?: string
}

export interface UserSettings {
  settingId?: string
  userId?: string
  defaultState: string | null
  alwaysConfirmState: boolean
  noteDifficultyLevel: 'basic' | 'standard' | 'advanced'
  defaultSubject: string | null
  defaultClassLevel: string | null
  emailNotifications: boolean
  createdAt?: string
  updatedAt?: string
}

// ── Lesson Plan (structured JSON returned by AI) ──

export interface LessonPlanMetadata {
  subject: string
  classLevel: string
  topic: string
  subTopics: string[]
  term: number
  week: number
  duration: number | string
  state: string
  session?: string
}

export interface LessonPlanObjectives {
  cognitive: string[]
  affective: string[]
  psychomotor: string[]
}

export interface NERDCPresentationStep {
  step: number
  title: string
  teacherActivity: string
  studentActivity: string
  content?: string
  duration?: string
}

export interface LessonPlanMisconception {
  description: string
  reason: string
  correction: string
}

export interface LessonPlanDifferentiation {
  support: string
  extension: string
}

export interface LessonPlan {
  metadata: LessonPlanMetadata
  referenceBooks: string[]
  instructionalMaterials: string[]
  entryBehaviour: string
  previousKnowledge: string
  objectives: LessonPlanObjectives
  presentation: NERDCPresentationStep[]
  commonMisconceptions?: LessonPlanMisconception[]
  differentiation?: LessonPlanDifferentiation
  evaluation: string[]
  summary: string
  assignment: string
}

// ── Lesson Note (structured JSON returned by AI) ──

export interface LessonNoteSubjectContent {
  subTopic: string
  explanation: string
  workedExamples: { problem: string; solution: string }[]
  keyPoints: string[]
}

export interface LessonNote {
  header: LessonPlanMetadata
  referenceBooks: string[]
  instructionalMaterials: string[]
  entryBehaviour: string
  previousKnowledge: string
  objectives: LessonPlanObjectives
  presentation: NERDCPresentationStep[]
  subjectContent: LessonNoteSubjectContent[]
  boardSummary: string[]
  evaluation: { question: string; expectedAnswer: string }[]
  summary: string
  assignment: string[]
}

// ── Notes ──

export interface Note {
  noteId: string
  name: string
  subjectName: string
  topic: string
  classLevel: string
  term: number
  week: number
  phase: 'plan_only' | 'complete'
  status: 'draft' | 'finalised'
  isExported: boolean
  createdAt: string
}

export interface NoteDetail extends Note {
  state: string
  session?: string
  lessonPlanContent: LessonPlan | null
  lessonNoteContent: LessonNote | null
  exportCount: number
  updatedAt: string
}

// ── Wallet ──

export interface Transaction {
  transactionId: string
  walletId?: string
  userId?: string
  type: 'credit' | 'debit'
  amountAdded: string
  amountDeducted: string
  balanceBefore: string
  balanceAfter: string
  purpose: string
  status: 'success' | 'pending' | 'failed'
  description?: string
  paystackReference?: string | null
  createdAt: string
}

// ── Notifications ──

export interface Notification {
  notificationId: string
  userId?: string
  type: 'wallet_topup' | 'generation_complete' | 'generation_failed' | 'system'
  title: string
  body: string
  isRead: boolean
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface CurriculumWeek {
  id: string
  week: number
  topic: string
  source: 'release' | 'state' | 'general'
  releaseId?: string
  unitId?: string
}

export interface CurriculumWeekDetail {
  id: string
  source: 'release' | 'state' | 'general'
  releaseId?: string
  unitId?: string
  state: string
  subject: string
  classLevel: string
  term: number
  week: number
  topic: string
  subTopics: string[]
  objectives: string[]
  competencies?: string[]
  teachingActivities?: string
  teachingAids?: string
  evaluation?: string
  referenceText?: string
}

export interface CurriculumRelease {
  releaseId: string
  sourceId: string
  releaseTag: string
  title: string
  stage: 'early_years' | 'primary' | 'junior_secondary' | 'senior_secondary'
  version: string
  status: 'draft' | 'published' | 'superseded' | 'archived'
  checksum?: string | null
  publishedAt?: string | null
  metadata?: Record<string, unknown> | null
  source?: {
    sourceId: string
    code: string
    name: string
    authority: string
    jurisdiction: string
  }
  _count?: {
    units: number
  }
  createdAt: string
  updatedAt: string
}

export interface CurriculumUnit {
  unitId: string
  releaseId: string
  stage: 'early_years' | 'primary' | 'junior_secondary' | 'senior_secondary'
  classLevel: string
  subject: string
  term: number
  week: number
  topic: string
  subTopics: string[]
  learningObjectives: string[]
  competencies: string[]
  teachingActivities?: string | null
  teachingAids?: string | null
  evaluationGuide?: string | null
  referenceMaterials: string[]
  metadata?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

// ── Resources ──

export interface Resource {
  resourceId: string
  resourceName: string
  resourceType: 'textbook' | 'scheme_supplement' | 'past_question' | 'other'
  subject?: string | null
  classLevel?: string | null
  state?: string | null
  fileUrl: string
  mimeType?: string
  isPublic: boolean
}

// ── Misc ──

export interface Pagination {
  page: number
  limit: number
  total: number
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T
}
