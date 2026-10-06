'use client';

import React, { useState } from 'react';
import { PLATFORM_RELEASE_MANIFEST } from '@/lib/config/release.manifest';
import { ReleaseNotesModal } from './ReleaseNotesModal';

interface ReleaseBadgeProps {
  variant?: 'light' | 'dark' | 'sidebar' | 'minimal';
  showModalOnClick?: boolean;
  className?: string;
}

export function ReleaseBadge({
  variant = 'light',
  showModalOnClick = true,
  className = '',
}: ReleaseBadgeProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const current = PLATFORM_RELEASE_MANIFEST.current;

  const handleClick = (e: React.MouseEvent) => {
    if (showModalOnClick) {
      e.preventDefault();
      e.stopPropagation();
      setModalOpen(true);
    }
  };

  // Variant styling
  const variantClasses = {
    // Light mode (default for dashboard/content)
    light:
      'bg-purple-50/80 text-purple-900 border border-purple-200/70 hover:bg-purple-100/70 hover:border-purple-300',
    // Dark mode (for landing page footer, dark sidebars)
    dark:
      'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white',
    // Sidebar compact mode (fits snugly in bottom sidebar)
    sidebar:
      'bg-gray-50 text-gray-700 border border-gray-200/60 hover:bg-purple-50 hover:text-purple-900 hover:border-purple-200',
    // Minimal tag (text-only with pulse dot)
    minimal:
      'bg-transparent text-gray-500 hover:text-gray-900',
  }[variant];

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`group inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all duration-150 ease-out active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 ${variantClasses} ${className}`}
        title={`Click to view release notes for ${current.versionTag}`}
      >
        <span className="relative flex h-2 w-2 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>

        <span className="font-semibold tracking-tight">
          {current.versionTag}
        </span>

        <span className="text-[11px] opacity-60 font-normal hidden sm:inline">
          • {current.curriculumBaseline.tag}
        </span>

        <svg
          className="w-3 h-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {showModalOnClick && (
        <ReleaseNotesModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
