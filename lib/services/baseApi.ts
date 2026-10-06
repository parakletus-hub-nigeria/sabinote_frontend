import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { setCredentials, clearCredentials } from '../slices/authSlice'
import type { RootState } from '../store'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    // Prevent infinite loop — if the refresh itself 401s, log out
    const url = typeof args === 'string' ? args : args.url
    if (url?.includes('/auth/refresh')) {
      api.dispatch(clearCredentials())
      return result
    }

    const { refreshToken } = (api.getState() as RootState).auth
    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          headers: { Authorization: `Bearer ${refreshToken}` },
          body: { refreshToken },
        },
        api,
        extraOptions
      )

      if (refreshResult.data) {
        const { accessToken, refreshToken: newRefresh } = (
          refreshResult.data as { data: { accessToken: string; refreshToken: string } }
        ).data
        api.dispatch(setCredentials({ accessToken, refreshToken: newRefresh }))
        // Retry original request with the new token
        result = await rawBaseQuery(args, api, extraOptions)
      } else {
        api.dispatch(clearCredentials())
      }
    } else {
      api.dispatch(clearCredentials())
    }
  }

  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Notes', 'Note', 'Wallet', 'Transactions', 'Notifications', 'Resources', 'AdminUsers', 'Curriculum'],
  endpoints: () => ({}),
})
