import { baseApi } from './baseApi'
import { updateUser } from '../slices/authSlice'
import type { User, Wallet, UserSettings, AuthSession } from '../types'

export interface AuthResponse {
  user: User
  wallet?: Wallet
  accessToken: string
  refreshToken: string
}

export type MeResponse = User & {
  wallet: Wallet
  settings: UserSettings
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<
      { success: boolean; data: AuthResponse },
      {
        firstName: string
        lastName: string
        email: string
        password: string
        phoneNumber?: string
        state: string
      }
    >({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),

    login: build.mutation<
      { success: boolean; data: AuthResponse },
      { email: string; password: string }
    >({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),

    // Pass the device's refresh token so only THIS session is revoked.
    // Without it the backend signs the user out of every device.
    logout: build.mutation<{ success: boolean; message: string }, { refreshToken?: string } | void>({
      query: (body) => ({ url: '/auth/logout', method: 'POST', body: body ?? {} }),
    }),

    changePassword: build.mutation<
      { success: boolean; data: { accessToken: string; refreshToken: string } },
      { currentPassword?: string; newPassword: string }
    >({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
      invalidatesTags: ['Sessions'],
    }),

    getSessions: build.query<
      { success: boolean; data: AuthSession[] },
      { refreshToken?: string }
    >({
      query: (body) => ({ url: '/auth/sessions', method: 'POST', body }),
      providesTags: ['Sessions'],
    }),

    revokeSession: build.mutation<{ success: boolean; message: string }, string>({
      query: (sessionId) => ({ url: `/auth/sessions/${sessionId}`, method: 'DELETE' }),
      invalidatesTags: ['Sessions'],
    }),

    logoutOthers: build.mutation<{ success: boolean; message: string }, { refreshToken: string }>({
      query: (body) => ({ url: '/auth/logout-others', method: 'POST', body }),
      invalidatesTags: ['Sessions'],
    }),

    getMe: build.query<{ success: boolean; data: MeResponse }, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(updateUser(data.data))
        } catch {}
      },
    }),
  }),
  overrideExisting: false,
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useChangePasswordMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useLogoutOthersMutation,
} = authApi
