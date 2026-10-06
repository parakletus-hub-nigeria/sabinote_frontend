import { baseApi } from './baseApi'
import type {
  CurriculumWeek,
  CurriculumWeekDetail,
  CurriculumRelease,
  CurriculumUnit,
} from '../types'

export interface CurriculumWeekSeedInput {
  state?: string
  subject: string
  classLevel: string
  term: number
  week: number
  topic: string
  year?: string
  subTopics?: string[]
  objectives?: string[]
  teachingActivities?: string
  teachingAids?: string
  evaluation?: string
  referenceText?: string
}

export interface CreateCurriculumReleaseInput {
  releaseTag: string
  title: string
  stage: 'early_years' | 'primary' | 'junior_secondary' | 'senior_secondary'
  version: string
  sourceCode?: string
  sourceId?: string
  status?: 'draft' | 'published' | 'superseded' | 'archived'
  checksum?: string
  metadata?: Record<string, unknown>
}

export interface CurriculumUnitSeedInput {
  classLevel: string
  subject: string
  term: number
  week: number
  topic: string
  subTopics?: string[]
  learningObjectives?: string[]
  competencies?: string[]
  teachingActivities?: string
  teachingAids?: string
  evaluationGuide?: string
  referenceMaterials?: string[]
  metadata?: Record<string, unknown>
}

export const curriculumApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ─── Dual-Read & Browse ──────────────────────────────────────────────────
    getCurriculumStates: build.query<{ success: boolean; data: { states: string[] } }, void>({
      query: () => '/curriculum/states',
    }),

    getCurriculumSubjects: build.query<
      { success: boolean; data: { subjects: string[] } },
      { state: string; classLevel: string }
    >({
      query: (params) => ({ url: '/curriculum/subjects', params }),
    }),

    getCurriculumWeeks: build.query<
      { success: boolean; data: { weeks: CurriculumWeek[] } },
      { state: string; subject: string; classLevel: string; term: number }
    >({
      query: (params) => ({ url: '/curriculum/weeks', params }),
    }),

    getCurriculumWeek: build.query<
      { success: boolean; data: CurriculumWeekDetail },
      { state: string; subject: string; classLevel: string; term: number; week: number }
    >({
      query: (params) => ({ url: '/curriculum/week', params }),
    }),

    // ─── v2 Curriculum Releases ─────────────────────────────────────────────
    getCurriculumReleases: build.query<
      { success: boolean; data: { releases: CurriculumRelease[] } },
      { stage?: string; status?: string } | void
    >({
      query: (params) => ({ url: '/curriculum/releases', params: params || {} }),
      providesTags: ['Curriculum'],
    }),

    createCurriculumRelease: build.mutation<
      { success: boolean; data: CurriculumRelease },
      CreateCurriculumReleaseInput
    >({
      query: (body) => ({ url: '/curriculum/releases', method: 'POST', body }),
      invalidatesTags: ['Curriculum'],
    }),

    getCurriculumReleaseUnits: build.query<
      { success: boolean; data: { units: CurriculumUnit[] } },
      { releaseId: string; classLevel?: string; subject?: string; term?: number; week?: number }
    >({
      query: ({ releaseId, ...params }) => ({
        url: `/curriculum/releases/${releaseId}/units`,
        params,
      }),
      providesTags: ['Curriculum'],
    }),

    seedCurriculumReleaseUnits: build.mutation<
      { success: boolean; data: { upserted: number; failed: number; total: number } },
      { releaseId: string; units: CurriculumUnitSeedInput[] }
    >({
      query: ({ releaseId, units }) => ({
        url: `/curriculum/releases/${releaseId}/units`,
        method: 'POST',
        body: { units },
      }),
      invalidatesTags: ['Curriculum'],
    }),

    // ─── Legacy Seeding ──────────────────────────────────────────────────────
    seedStateCurriculum: build.mutation<
      { success: boolean; data: { upserted: number; total: number } },
      { weeks: CurriculumWeekSeedInput[] }
    >({
      query: (body) => ({ url: '/curriculum/seed', method: 'POST', body }),
      invalidatesTags: ['Curriculum'],
    }),

    seedGeneralCurriculum: build.mutation<
      { success: boolean; data: { upserted: number; total: number } },
      { weeks: CurriculumWeekSeedInput[] }
    >({
      query: (body) => ({ url: '/curriculum/general/seed', method: 'POST', body }),
      invalidatesTags: ['Curriculum'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetCurriculumStatesQuery,
  useGetCurriculumSubjectsQuery,
  useGetCurriculumWeeksQuery,
  useGetCurriculumWeekQuery,
  useGetCurriculumReleasesQuery,
  useCreateCurriculumReleaseMutation,
  useGetCurriculumReleaseUnitsQuery,
  useSeedCurriculumReleaseUnitsMutation,
  useSeedStateCurriculumMutation,
  useSeedGeneralCurriculumMutation,
} = curriculumApi
