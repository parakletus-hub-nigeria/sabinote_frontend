import { baseApi } from './baseApi'
import type { Pagination } from '../types'

export interface AdminStats {
  totalUsers: number
  totalNotes: number
  notesThisMonth: number
  totalTopups: number
  totalParatsCredited: number
  totalRevenueNGN: number | string
}

export interface AdminUser {
  userId: string
  firstName: string
  lastName: string
  email: string
  state: string
  role: 'teacher' | 'admin'
  isVerified: boolean
  createdAt: string
  wallet: { balance: string } | null
}

export interface CurriculumWeekInput {
  state: string
  subject: string
  classLevel: string
  term: number
  week: number
  topic: string
  subTopics: string[]
  objectives: string[]
  teachingActivities?: string
  teachingAids?: string
  evaluation?: string
  referenceText?: string
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAdminStats: build.query<{ success: boolean; data: AdminStats }, void>({
      query: () => '/admin/stats',
    }),

    getAdminUsers: build.query<
      { success: boolean; data: { users: AdminUser[]; pagination: Pagination } },
      { page?: number; limit?: number }
    >({
      query: (params) => ({ url: '/admin/users', params }),
      providesTags: ['AdminUsers'],
    }),

    creditWallet: build.mutation<
      { success: boolean; data: { newBalance: number } },
      { userId: string; amount: number; reason: string }
    >({
      query: (body) => ({ url: '/admin/credit', method: 'POST', body }),
      invalidatesTags: ['AdminUsers'],
    }),

    adminUploadResource: build.mutation<{ success: boolean; data: { resourceId: string } }, FormData>({
      query: (formData) => ({
        url: '/admin/resources/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Resources'],
    }),

    seedCurriculum: build.mutation<
      { success: boolean; data: { upserted: number; total: number } },
      { weeks: CurriculumWeekInput[] }
    >({
      query: (body) => ({ url: '/admin/curriculum/seed', method: 'POST', body }),
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetAdminStatsQuery,
  useGetAdminUsersQuery,
  useCreditWalletMutation,
  useAdminUploadResourceMutation,
  useSeedCurriculumMutation,
} = adminApi
