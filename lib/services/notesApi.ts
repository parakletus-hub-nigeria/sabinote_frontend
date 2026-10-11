import { baseApi } from './baseApi'
import type { Note, NoteDetail, LessonPlan, LessonNote, Pagination } from '../types'

export const notesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotes: build.query<
      { success: boolean; data: { notes: Note[]; pagination: Pagination } },
      { page?: number; limit?: number; subject?: string; classLevel?: string }
    >({
      query: (params) => ({ url: '/notes', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.notes.map(({ noteId }) => ({
                type: 'Note' as const,
                id: noteId,
              })),
              { type: 'Notes' as const },
            ]
          : [{ type: 'Notes' as const }],
    }),

    searchNotes: build.query<
      { success: boolean; data: { notes: Note[] } },
      { q: string; subject?: string; classLevel?: string }
    >({
      query: (params) => ({ url: '/notes/search', params }),
      providesTags: [{ type: 'Notes' as const }],
    }),

    getNote: build.query<{ success: boolean; data: NoteDetail }, string>({
      query: (noteId) => `/notes/${noteId}`,
      providesTags: (_result, _err, noteId) => [{ type: 'Note' as const, id: noteId }],
    }),

    updateNote: build.mutation<
      { success: boolean; data: { savedAt: string } },
      { noteId: string; lessonPlanContent?: LessonPlan; lessonNoteContent?: LessonNote }
    >({
      query: ({ noteId, ...body }) => ({
        url: `/notes/${noteId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _err, { noteId }) => [{ type: 'Note' as const, id: noteId }],
    }),

    deleteNote: build.mutation<{ success: boolean; message: string }, string>({
      query: (noteId) => ({ url: `/notes/${noteId}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Notes' as const }],
    }),

    submitNoteFeedback: build.mutation<
      { success: boolean; data: { noteId: string; feedback: any } },
      {
        noteId: string
        rating?: number
        sentiment?: 'thumbs_up' | 'thumbs_down'
        tags?: string[]
        comment?: string
      }
    >({
      query: ({ noteId, ...body }) => ({
        url: `/notes/${noteId}/feedback`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, { noteId }) => [{ type: 'Note' as const, id: noteId }],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetNotesQuery,
  useSearchNotesQuery,
  useGetNoteQuery,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useSubmitNoteFeedbackMutation,
} = notesApi
