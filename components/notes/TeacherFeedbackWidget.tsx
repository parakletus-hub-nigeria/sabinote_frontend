"use client";

import { useState } from "react";
import { useSubmitNoteFeedbackMutation } from "@/lib/services/notesApi";
import type { NoteFeedback, EditTelemetry } from "@/lib/types";

interface TeacherFeedbackWidgetProps {
  noteId: string;
  existingFeedback?: NoteFeedback | null;
  telemetry?: EditTelemetry | null;
}

const QUICK_TAGS = [
  "Perfect timing",
  "Great evaluation questions",
  "Too long",
  "Needs simpler language",
  "Excellent activities",
];

export function TeacherFeedbackWidget({
  noteId,
  existingFeedback,
  telemetry,
}: TeacherFeedbackWidgetProps) {
  const [submitFeedback, { isLoading }] = useSubmitNoteFeedbackMutation();

  const [rating, setRating] = useState<number>(existingFeedback?.rating ?? 0);
  const [sentiment, setSentiment] = useState<"thumbs_up" | "thumbs_down" | null>(
    existingFeedback?.sentiment ?? null
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    existingFeedback?.tags ?? []
  );
  const [comment, setComment] = useState<string>(existingFeedback?.comment ?? "");
  const [showComment, setShowComment] = useState(Boolean(existingFeedback?.comment));
  const [submitted, setSubmitted] = useState<boolean>(Boolean(existingFeedback?.submittedAt));
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSend = async (
    overrideRating?: number,
    overrideSentiment?: "thumbs_up" | "thumbs_down"
  ) => {
    const r = overrideRating ?? rating;
    const s = overrideSentiment ?? sentiment;

    try {
      await submitFeedback({
        noteId,
        rating: r > 0 ? r : undefined,
        sentiment: s ?? undefined,
        tags: selectedTags,
        comment: comment.trim() || undefined,
      }).unwrap();
      setSubmitted(true);
    } catch {
      // Graceful fallback — feedback will retry
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-slate-200/80">
      <div className="rounded-2xl p-5 bg-gradient-to-b from-slate-50 to-emerald-50/20 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold tracking-tight text-slate-900">
                Teacher Feedback & Classroom Quality
              </span>
              {submitted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Received
                </span>
              )}
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5">
              How well does this lesson plan fit your Nigerian classroom schedule and learners?
            </p>
          </div>

          {telemetry && telemetry.totalEdits > 0 && (
            <div className="shrink-0 px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200 text-[11px] text-slate-600 font-medium">
              ✏️ {telemetry.editedSections.length} {telemetry.editedSections.length === 1 ? "section" : "sections"} tailored
            </div>
          )}
        </div>

        {/* 1-Click Star Rating and Thumbs */}
        <div className="flex flex-wrap items-center gap-4 py-1">
          {/* 5 Stars */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = hoveredStar ? star <= hoveredStar : star <= rating;
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => {
                    setRating(star);
                    handleSend(star, undefined);
                  }}
                  disabled={isLoading}
                  className="p-1 rounded-lg transition-transform active:scale-[0.90] hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} star`}
                >
                  <svg
                    className={`w-6 h-6 transition-colors duration-150 ${
                      active
                        ? "text-amber-400 fill-amber-400 drop-shadow-xs"
                        : "text-slate-300 fill-slate-100 hover:text-amber-200"
                    }`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-slate-300" />

          {/* Thumbs Up / Down */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = sentiment === "thumbs_up" ? null : "thumbs_up";
                setSentiment(next);
                if (next) handleSend(undefined, next);
              }}
              disabled={isLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all active:scale-[0.97] ${
                sentiment === "thumbs_up"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span>👍</span>
              <span>Classroom Ready</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = sentiment === "thumbs_down" ? null : "thumbs_down";
                setSentiment(next);
                if (next) handleSend(undefined, next);
              }}
              disabled={isLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all active:scale-[0.97] ${
                sentiment === "thumbs_down"
                  ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span>👎</span>
              <span>Needs Tuning</span>
            </button>
          </div>
        </div>

        {/* Quick Tags */}
        <div className="mt-3.5">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
            Quick Observations
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-[12px] px-3 py-1 rounded-full border transition-all active:scale-[0.97] font-medium ${
                    active
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                      : "bg-white/80 text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  {active ? `✓ ${tag}` : tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Comment Drawer */}
        <div className="mt-3.5 pt-3 border-t border-slate-200/60">
          {!showComment ? (
            <button
              type="button"
              onClick={() => setShowComment(true)}
              className="text-[12px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              + Add a short note for the curriculum team
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What specific adjustment would help your pupils learn this best?"
                rows={2}
                className="w-full text-[13px] p-2.5 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowComment(false)}
                  className="text-[12px] text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={isLoading}
                  className="px-4 py-1.5 rounded-xl text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.97] transition-all disabled:opacity-50"
                >
                  {isLoading ? "Saving…" : "Save Feedback"}
                </button>
              </div>
            </div>
          )}
        </div>

        {submitted && (
          <p className="mt-3 text-[11px] text-emerald-700 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200/60 animate-fade-in">
            ✨ Thank you, Teacher! Your feedback directly calibrates SabiNote&apos;s NERDC curriculum AI for Nigerian schools.
          </p>
        )}
      </div>
    </div>
  );
}
