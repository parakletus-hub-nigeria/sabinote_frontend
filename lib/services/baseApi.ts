import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { setCredentials, clearCredentials } from '../slices/authSlice'
import type { RootState } from '../store'

export const AZURE_API_URL =
  'https://sabinote-backend-hmdmbjdzfcddgghf.switzerlandnorth-01.azurewebsites.net/api/v1'

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
    ? AZURE_API_URL
    : process.env.NODE_ENV === 'production'
      ? AZURE_API_URL
      : 'http://localhost:3000/api/v1')

// Lightweight async Mutex to synchronize concurrent 401 token refreshes and prevent reuse race conditions
class Mutex {
  private _locking = Promise.resolve()
  private _locked = false

  isLocked(): boolean {
    return this._locked
  }

  async acquire(): Promise<() => void> {
    this._locked = true
    let unlockNext!: () => void
    const willLock = new Promise<void>((resolve) => {
      unlockNext = resolve
    })
    const willUnlock = this._locking.then(() => () => {
      this._locked = false
      unlockNext()
    })
    this._locking = this._locking.then(() => willLock)
    return willUnlock
  }

  async waitForUnlock(): Promise<void> {
    if (this._locked) {
      await this._locking
    }
  }
}

const mutex = new Mutex()

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
  // If another query is already refreshing tokens, wait for the fresh token first
  await mutex.waitForUnlock()

  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    // Prevent infinite loop — if the refresh itself 401s, log out
    const url = typeof args === 'string' ? args : args.url
    if (url?.includes('/auth/refresh')) {
      api.dispatch(clearCredentials())
      return result
    }

    if (!mutex.isLocked()) {
      const release = await mutex.acquire()
      try {
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
            const dataObj = (
              refreshResult.data as { data?: { accessToken: string; refreshToken: string } }
            )?.data
            if (dataObj?.accessToken && dataObj?.refreshToken) {
              api.dispatch(
                setCredentials({
                  accessToken: dataObj.accessToken,
                  refreshToken: dataObj.refreshToken,
                })
              )
              // Retry original request with newly issued token
              result = await rawBaseQuery(args, api, extraOptions)
            } else {
              api.dispatch(clearCredentials())
            }
          } else {
            api.dispatch(clearCredentials())
          }
        } else {
          api.dispatch(clearCredentials())
        }
      } finally {
        release()
      }
    } else {
      // Mutex was locked by another request; wait for it to complete refresh then retry
      await mutex.waitForUnlock()
      result = await rawBaseQuery(args, api, extraOptions)
    }
  }

  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  keepUnusedDataFor: 300, // 5 minutes cache retention for instant page transitions
  refetchOnMountOrArgChange: false, // Instantly serve cached data without blocking UI with skeletons
  tagTypes: [
    'User',
    'Notes',
    'Note',
    'Wallet',
    'Transactions',
    'Notifications',
    'Resources',
    'AdminUsers',
    'Curriculum',
  ],
  endpoints: () => ({}),
})
