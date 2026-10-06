'use client';

import React, { useEffect, useState } from 'react';
import { PLATFORM_RELEASE_MANIFEST, type HistoricReleaseItem } from '@/lib/config/release.manifest';

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReleaseNotesModal({ isOpen, onClose }: ReleaseNotesModalProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'guide' | 'history'>('current');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoricReleaseItem | null>(null);

  const manifest = PLATFORM_RELEASE_MANIFEST;
  const current = manifest.current;

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="release-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content (Center-origin, scale 0.95 -> 1.0) */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-200 ease-out origin-center animate-in fade-in zoom-in-95"
        style={{
          boxShadow: '0 25px 50px -12px rgba(100, 27, 196, 0.25)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 border-b border-gray-100 flex items-center justify-between"
          style={{ background: 'linear-gradient(180deg, #FAF8FF 0%, #FFFFFF 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #641BC4 0%, #4B109B 100%)' }}
            >
              SN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="release-modal-title" className="text-lg font-bold text-gray-900 tracking-tight">
                  What&apos;s New in SabiNote
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    background: 'var(--color-primary-dim, #F5F3FF)',
                    color: '#641BC4',
                    border: '1px solid #EDE9FE',
                  }}
                >
                  {current.versionTag}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live &amp; Verified
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                Official 2025 National Scheme of Work • Updated {current.releaseDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150 active:scale-[0.97]"
            aria-label="Close dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-gray-100 flex gap-4 text-sm font-medium">
          <button
            onClick={() => {
              setActiveTab('current');
              setSelectedHistoryItem(null);
            }}
            className={`pb-2.5 transition-colors relative active:scale-[0.97] ${
              activeTab === 'current' ? 'text-[#641BC4] font-semibold' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            What&apos;s New
            {activeTab === 'current' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: '#641BC4' }}
              />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('guide');
              setSelectedHistoryItem(null);
            }}
            className={`pb-2.5 transition-colors relative active:scale-[0.97] ${
              activeTab === 'guide' ? 'text-[#641BC4] font-semibold' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Teacher Guide &amp; Best Practices
            {activeTab === 'guide' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: '#641BC4' }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 transition-colors relative active:scale-[0.97] ${
              activeTab === 'history' ? 'text-[#641BC4] font-semibold' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Release History ({manifest.history.length})
            {activeTab === 'history' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: '#641BC4' }}
              />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-700">
          {activeTab === 'current' && (
            <>
              {/* Baseline Curriculum Metric Card */}
              <div
                className="rounded-xl p-4.5 border"
                style={{
                  background: 'linear-gradient(135deg, #FDFCFF 0%, #F6F1FD 100%)',
                  borderColor: '#EADEFC',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#641BC4]">
                      2025 National Scheme of Work
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-0.5">
                      {current.curriculumBaseline.tag} Curriculum Integration
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Verified Nigerian syllabus directly aligned with {current.curriculumBaseline.authorities.join(' & ')} guidelines.
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-baseline sm:items-end gap-1 shrink-0 bg-white/80 backdrop-blur-sm px-3.5 py-2 rounded-lg border border-purple-100">
                    <span className="text-xl font-extrabold text-[#641BC4]">
                      {current.curriculumBaseline.totalUnits.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">Verified Units</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-purple-100/60">
                  <div className="bg-white/90 p-2.5 rounded-lg border border-purple-50">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Early Years</p>
                    <p className="text-xs font-bold text-gray-800 mt-0.5">753 Units</p>
                    <p className="text-[10px] text-gray-400">Pre-Nursery &amp; Nursery</p>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-lg border border-purple-50">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Primary</p>
                    <p className="text-xs font-bold text-gray-800 mt-0.5">2,103 Units</p>
                    <p className="text-[10px] text-gray-400">Primary 1 – 6</p>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-lg border border-purple-50">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Junior Sec.</p>
                    <p className="text-xs font-bold text-gray-800 mt-0.5">1,107 Units</p>
                    <p className="text-[10px] text-gray-400">JSS 1 – 3</p>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-lg border border-purple-50">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Senior Sec.</p>
                    <p className="text-xs font-bold text-gray-800 mt-0.5">2,219 Units</p>
                    <p className="text-[10px] text-gray-400">SSS 1 – 3 (26 Subj)</p>
                  </div>
                </div>
              </div>

              {/* Educational Highlights */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                  Key Improvements for Your Classroom
                </h4>
                <ul className="space-y-2.5">
                  {current.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2.5 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: '#EDE9FE', color: '#641BC4' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span className="text-xs leading-relaxed text-gray-700 font-medium">
                        {highlight}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Classroom Value Proposition */}
              <div
                className="rounded-xl p-4 border flex items-center gap-3.5"
                style={{ background: '#FAF5FF', borderColor: '#E9D5FF' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ background: '#641BC4' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-purple-950">Save 4+ Hours Weekly on Lesson Planning</h5>
                  <p className="text-[11px] text-purple-900/80 mt-0.5 leading-relaxed">
                    You no longer need to photocopy schemes of work or manually draft step presentations. Every note generated matches what school inspectors expect to see during classroom observation.
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-5">
              <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100">
                <h4 className="text-xs font-bold text-[#641BC4] uppercase tracking-wider mb-1">
                  Educator Playbook: Getting the Best Notes
                </h4>
                <p className="text-xs text-gray-600">
                  Follow these 5 recommended steps to generate classroom-ready, inspector-compliant lesson notes every week.
                </p>
              </div>

              <div className="space-y-3">
                {current.teacherGuide?.map((guide, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-gray-100 bg-white hover:border-purple-200 transition-colors flex gap-3.5 items-start"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white mt-0.5"
                      style={{ background: '#641BC4' }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-gray-900">{guide.step}</h5>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {guide.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inspection Readiness Callout */}
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/60 text-xs text-emerald-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Inspection Readiness Guarantee
                </span>
                <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                  All generated lesson notes strictly adhere to the Federal Ministry of Education and NAPPS five-step presentation format: Introduction, Content Development, Pupil Activity, Summary/Evaluation, and Assignment.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {manifest.history.map((item) => (
                <div
                  key={item.version}
                  className="p-4 rounded-xl border border-gray-100 bg-white hover:border-purple-200 hover:shadow-sm transition-all duration-150"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-bold"
                        style={{
                          background: item.version === current.version ? 'var(--color-primary-dim, #F5F3FF)' : '#F3F4F6',
                          color: item.version === current.version ? '#641BC4' : '#374151',
                        }}
                      >
                        {item.versionTag}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{item.title}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{item.date}</span>
                  </div>

                  <ul className="space-y-1.5 mt-3 pl-1">
                    {item.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-[#641BC4] font-bold mt-0.5">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                  {item.changes?.curriculum && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                      <span className="font-semibold text-gray-700">Scope:</span>{' '}
                      {item.changes.curriculum.join(' • ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>Powered by Parakletus Technologies</span>
            <span>•</span>
            <span className="font-mono text-gray-400">{current.versionTag}</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg font-semibold text-white text-xs transition-all duration-150 active:scale-[0.97]"
            style={{ background: '#641BC4' }}
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
