'use client'

import { useState, useRef, useCallback, useId } from 'react'
import {
  useGetResourcesQuery,
  useUploadResourceMutation,
  useDeleteResourceMutation,
} from '@/lib/services/resourcesApi'
import type { Resource } from '@/lib/types'
import { IconUpload, IconFolder, IconBack } from '@/components/icons'
import Link from 'next/link'
import { NIGERIAN_STATES, CLASS_LEVELS } from '@/lib/constants'

const RESOURCE_TYPE_LABELS: Record<Resource['resourceType'], string> = {
  textbook: 'Textbook',
  scheme_supplement: 'Scheme Supplement',
  past_question: 'Past Question',
  other: 'Other',
}

const RESOURCE_TYPE_COLORS: Record<Resource['resourceType'], string> = {
  textbook: 'bg-blue-50 text-blue-700',
  scheme_supplement: 'bg-purple-50 text-purple-700',
  past_question: 'bg-amber-50 text-amber-700',
  other: 'bg-gray-100 text-gray-600',
}

const CLASSES = CLASS_LEVELS
const MAX_BYTES = 10 * 1024 * 1024

function apiError(err: unknown, fallback: string) {
  const e = err as { status?: number | string; data?: { message?: string | string[] } }
  const msg = Array.isArray(e?.data?.message) ? e.data?.message[0] : e?.data?.message
  if (msg) return msg
  if (e?.status === 'FETCH_ERROR') return 'Network error — check your connection and try again.'
  if (e?.status === 413) return 'File is too large for the server.'
  return fallback
}

function ResourceCard({
  resource,
  isOwn,
  onDelete,
  deleting,
}: {
  resource: Resource
  isOwn: boolean
  onDelete: (id: string) => void | Promise<void>
  deleting: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-lg bg-(--color-primary)/10 flex items-center justify-center shrink-0 mt-0.5">
        <IconFolder className="w-5 h-5 text-(--color-primary)" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
          {resource.resourceName}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${RESOURCE_TYPE_COLORS[resource.resourceType]}`}>
            {RESOURCE_TYPE_LABELS[resource.resourceType]}
          </span>
          {resource.subject && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {resource.subject}
            </span>
          )}
          {resource.classLevel && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {resource.classLevel}
            </span>
          )}
          {resource.isPublic && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
              Public
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={resource.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-(--color-primary) font-medium hover:underline"
        >
          View
        </a>
        {isOwn && (
          confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDelete(resource.resourceId)}
                disabled={deleting}
                className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {deleting ? '…' : 'Yes'}
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          )
        )}
      </div>
    </div>
  )
}

function UploadForm({ onSuccess }: { onSuccess: () => void }) {
  const fileId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [resourceName, setResourceName] = useState('')
  const [resourceType, setResourceType] = useState<Resource['resourceType']>('textbook')
  const [subject, setSubject] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [state, setState] = useState('')
  const [error, setError] = useState('')

  const [uploadResource, { isLoading }] = useUploadResourceMutation()

  const handleFile = useCallback((f: File) => {
    if (!/\.pdf$/i.test(f.name)) {
      setError('Only PDF files are supported.')
      return
    }
    if (f.size > MAX_BYTES) {
      setError('File must be under 10 MB.')
      return
    }
    setFile(f)
    if (!resourceName) setResourceName(f.name.replace(/\.[^.]+$/, ''))
    setError('')
  }, [resourceName])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Please select a file.'); return }
    if (!resourceName.trim()) { setError('Resource name is required.'); return }

    const fd = new FormData()
    fd.append('file', file)
    fd.append('resourceName', resourceName.trim())
    fd.append('resourceType', resourceType)
    if (subject.trim()) fd.append('subject', subject.trim())
    if (classLevel) fd.append('classLevel', classLevel)
    if (state) fd.append('state', state)

    try {
      await uploadResource(fd).unwrap()
      setFile(null)
      setResourceName('')
      setResourceType('textbook')
      setSubject('')
      setClassLevel('')
      setState('')
      setError('')
      onSuccess()
    } catch (err) {
      setError(apiError(err, 'Upload failed. Please try again.'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-(--color-primary) bg-(--color-primary)/5'
            : file
            ? 'border-green-400 bg-green-50'
            : 'border-gray-200 hover:border-(--color-primary)/40 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          id={fileId}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />
        <IconUpload className="mx-auto w-8 h-8 text-gray-400 mb-2" />
        {file ? (
          <>
            <p className="font-semibold text-sm text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </>
        ) : (
          <>
            <p className="font-medium text-sm text-gray-700">Drop a file here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">PDF only — max 10 MB</p>
          </>
        )}
      </div>

      {/* Resource name */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Resource Name *</label>
        <input
          type="text"
          value={resourceName}
          onChange={(e) => setResourceName(e.target.value)}
          placeholder="e.g. New General Mathematics JSS 1"
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/10 transition"
        />
      </div>

      {/* Resource type */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Resource Type *</label>
        <select
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value as Resource['resourceType'])}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/10 transition"
        >
          <option value="textbook">Textbook</option>
          <option value="scheme_supplement">Scheme Supplement</option>
          <option value="past_question">Past Question</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Optional fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject (optional)</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Mathematics"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/10 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Class Level (optional)</label>
          <select
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/10 transition"
          >
            <option value="">Any</option>
            {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">State (optional)</label>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/10 transition"
        >
          <option value="">Any state</option>
          {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && (
        <p className="text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={isLoading || !file}
        className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'var(--color-primary)' }}
      >
        {isLoading ? 'Uploading…' : 'Upload Resource'}
      </button>
    </form>
  )
}

export default function ResourcesPage() {
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [typeFilter, setTypeFilter] = useState<Resource['resourceType'] | 'all'>('all')

  const { data, isLoading, isError, refetch } = useGetResourcesQuery()
  const [deleteResource] = useDeleteResourceMutation()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const resources = data?.data ?? []

  const filtered = typeFilter === 'all'
    ? resources
    : resources.filter((r) => r.resourceType === typeFilter)

  const myResources = filtered.filter((r) => !r.isPublic)
  const publicResources = filtered.filter((r) => r.isPublic)

  async function handleDelete(resourceId: string) {
    setDeletingId(resourceId)
    setDeleteError('')
    try {
      await deleteResource(resourceId).unwrap()
    } catch (err) {
      setDeleteError(apiError(err, "Couldn't delete that resource. Please try again."))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-full" style={{ background: '#FAFAFA' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 lg:pt-0">
        <div className="flex items-center gap-3 mb-1 lg:hidden">
          <Link href="/settings" className="w-8 h-8 flex items-center justify-center">
            <IconBack className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 font-display">Resources</h1>
        </div>
        <h1 className="hidden lg:block text-2xl font-bold text-gray-900 font-display mb-1">Resources</h1>
        <p className="text-sm text-gray-500 lg:ml-0 ml-11">Your teaching materials and textbooks</p>
      </div>

      <div className="px-5 pb-8 space-y-5">
        {/* Upload toggle */}
        <button
          onClick={() => setShowUploadForm((v) => !v)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all"
          style={{ background: 'var(--color-primary)' }}
        >
          <IconUpload className="w-4 h-4" />
          {showUploadForm ? 'Cancel Upload' : 'Upload New Resource'}
        </button>

        {/* Upload form */}
        {showUploadForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Upload Resource</h2>
            <UploadForm onSuccess={() => setShowUploadForm(false)} />
          </div>
        )}

        {/* Type filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-0.5">
          {(['all', 'textbook', 'scheme_supplement', 'past_question', 'other'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                typeFilter === t
                  ? 'bg-(--color-primary) text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-(--color-primary)/40'
              }`}
            >
              {t === 'all' ? 'All' : RESOURCE_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {deleteError && (
          <p role="alert" className="text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">{deleteError}</p>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : isError ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="font-semibold text-gray-800">Couldn&apos;t load resources</p>
            <button onClick={() => refetch()} className="mt-2 text-sm font-semibold text-(--color-primary)">
              Try again
            </button>
          </div>
        ) : resources.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-(--color-primary)/10 flex items-center justify-center mx-auto mb-4">
              <IconFolder className="w-7 h-7 text-(--color-primary)" />
            </div>
            <p className="font-semibold text-gray-800">No resources yet</p>
            <p className="text-sm text-gray-500 mt-1">Upload textbooks and materials to enhance your lesson generation.</p>
          </div>
        ) : (
          <>
            {/* My uploads */}
            {myResources.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">My Uploads</h3>
                <div className="space-y-2">
                  {myResources.map((r) => (
                    <ResourceCard
                      key={r.resourceId}
                      resource={r}
                      isOwn={true}
                      onDelete={handleDelete}
                      deleting={deletingId === r.resourceId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Public resources */}
            {publicResources.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Public Resources</h3>
                <div className="space-y-2">
                  {publicResources.map((r) => (
                    <ResourceCard
                      key={r.resourceId}
                      resource={r}
                      isOwn={false}
                      onDelete={handleDelete}
                      deleting={deletingId === r.resourceId}
                    />
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">No resources match this filter.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
