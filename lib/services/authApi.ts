import { baseApi } from './baseApi'
import { updateUser } from '../slices/authSlice'
import type { User, Wallet, UserSettings } from '../types'

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

    logout: build.mutation<
      { success: boolean; message: string },
      { refreshToken?: string } | void
    >({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        body: body || undefined,
      }),
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

export const { useRegisterMutation, useLoginMutation, useLogoutMutation, useGetMeQuery } = authApi
