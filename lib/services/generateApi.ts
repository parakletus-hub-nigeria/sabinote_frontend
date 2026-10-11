import { baseApi } from './baseApi'
import type { LessonPlan, LessonNote } from '../types'

export const generateApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    generateLessonPlan: build.mutation<
      {
        success: boolean
        data: {
          noteId: string
          lessonPlan: LessonPlan
          walletBalance: number
          parratsCost: number
        }
      },
      {
        durationMinutes: number
        resourceId?: string
        curriculumUnitId?: string
        curriculumWeekId?: string
        generalCurriculumId?: string
        learningAids?: string[]
        pedagogicalEmphasis?: string
      }
    >({
      query: (body) => ({ url: '/generate/lesson-plan', method: 'POST', body }),
      invalidatesTags: ['Notes', 'Wallet', 'Transactions'],
    }),

    generateLessonNote: build.mutation<
      {
        success: boolean
        data: {
          noteId: string
          lessonNote: LessonNote
          walletBalance: number
          parratsCost: number
        }
      },
      { noteId: string; editedLessonPlan?: LessonPlan }
    >({
      query: (body) => ({ url: '/generate/lesson-note', method: 'POST', body }),
      invalidatesTags: (_result, _err, { noteId }) => [
        { type: 'Note' as const, id: noteId },
        { type: 'Notes' as const },
        'Wallet',
        'Transactions',
      ],
    }),

    regenerate: build.mutation<
      {
        success: boolean
        data: {
          noteId: string
          content: LessonPlan | LessonNote
          walletBalance: number
          parratsCost: number
        }
      },
      { noteId: string; phase: 'plan' | 'note'; additionalInstructions?: string }
    >({
      query: (body) => ({ url: '/generate/regenerate', method: 'POST', body }),
      invalidatesTags: (_result, _err, { noteId }) => [
        { type: 'Note' as const, id: noteId },
        'Wallet',
        'Transactions',
      ],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGenerateLessonPlanMutation,
  useGenerateLessonNoteMutation,
  useRegenerateMutation,
} = generateApi
