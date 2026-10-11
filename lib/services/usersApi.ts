import { baseApi } from './baseApi'
import type { User, Wallet, UserSettings } from '../types'

type ProfileResponse = User & { wallet: Wallet; settings: UserSettings }

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProfile: build.query<{ success: boolean; data: ProfileResponse }, void>({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),

    updateProfile: build.mutation<
      { success: boolean; data: ProfileResponse },
      { firstName?: string; lastName?: string; phoneNumber?: string; state?: string }
    >({
      query: (body) => ({ url: '/users/profile', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),

    getSettings: build.query<{ success: boolean; data: UserSettings }, void>({
      query: () => '/users/settings',
      providesTags: ['User'],
    }),

    updateSettings: build.mutation<
      { success: boolean; data: UserSettings },
      {
        defaultState?: string
        alwaysConfirmState?: boolean
        noteDifficultyLevel?: 'basic' | 'standard' | 'advanced'
        defaultSubject?: string | null
        defaultClassLevel?: string | null
        emailNotifications?: boolean
        notifyGenerationComplete?: boolean
        notifyWalletTopup?: boolean
      }
    >({
      query: (body) => ({ url: '/users/settings', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),

    deleteAccount: build.mutation<{ success: boolean; message: string }, { password?: string }>({
      query: (body) => ({ url: '/users/account', method: 'DELETE', body }),
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useDeleteAccountMutation,
} = usersApi
