'use client';

import React from 'react';
import { ReleaseBadge } from './ReleaseBadge';
import { PLATFORM_RELEASE_MANIFEST } from '@/lib/config/release.manifest';

interface ReleaseFooterProps {
  theme?: 'dark' | 'light';
  className?: string;
  showDetails?: boolean;
}

export function ReleaseFooter({
  theme = 'light',
  className = '',
  showDetails = false,
}: ReleaseFooterProps) {
  const current = PLATFORM_RELEASE_MANIFEST.current;

  const isDark = theme === 'dark';

  return (
    <footer
      className={`w-full py-4 text-xs ${
        isDark
          ? 'text-white/40 border-white/10'
          : 'text-gray-500 border-gray-200/60'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2">
          <span>© 2026 Parakletus Technologies.</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">All rights reserved.</span>
        </div>

        <div className="flex items-center gap-3">
          {showDetails && (
            <span
              className={`text-[11px] hidden md:inline ${
                isDark ? 'text-white/30' : 'text-gray-400'
              }`}
            >
              Scheme: {current.curriculumBaseline.tag} ({current.curriculumBaseline.totalUnits.toLocaleString()} units)
            </span>
          )}
          <ReleaseBadge variant={isDark ? 'dark' : 'light'} />
        </div>
      </div>
    </footer>
  );
}
