"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import Link from "next/link";
import { IconBack, IconDots, IconBolt, IconDownload } from "@/components/icons";
import { useGetNoteQuery, useUpdateNoteMutation } from "@/lib/services/notesApi";
import { useRegenerateMutation } from "@/lib/services/generateApi";
import { useGetWalletQuery } from "@/lib/services/walletApi";
import { baseApi } from "@/lib/services/baseApi";
import type { LessonPlan, LessonNote, LessonPlanObjectives } from "@/lib/types";

// ─── Plain-text hygiene ───────────────────────────────────────────────────────
// Earlier versions stored contentEditable HTML; normalise everything to plain
// text once on load so editors, display, and PDF export all agree.

const toPlain = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

const cleanList = (a?: string[]) => (a ?? []).map(toPlain);

const cleanObjectives = (o?: LessonPlanObjectives): LessonPlanObjectives => ({
  cognitive: cleanList(o?.cognitive),
  affective: cleanList(o?.affective),
  psychomotor: cleanList(o?.psychomotor),
});

function cleanPlan(p: LessonPlan): LessonPlan {
  return {
    ...p,
    previousKnowledge: toPlain(p.previousKnowledge ?? ""),
    entryBehaviour: toPlain(p.entryBehaviour ?? ""),
    summary: toPlain(p.summary ?? ""),
    assignment: toPlain(p.assignment ?? ""),
    instructionalMaterials: cleanList(p.instructionalMaterials),
    referenceBooks: cleanList(p.referenceBooks),
    evaluation: cleanList(p.evaluation),
    objectives: cleanObjectives(p.objectives),
    presentation: (p.presentation ?? []).map(s => ({
      ...s,
      teacherActivity: toPlain(s.teacherActivity ?? ""),
      studentActivity: toPlain(s.studentActivity ?? ""),
      content: s.content ? toPlain(s.content) : s.content,
      duration: s.duration ? toPlain(s.duration) : s.duration,
    })),
    commonMisconceptions: (p.commonMisconceptions ?? []).map(mc => ({
      description: toPlain(mc.description ?? ""),
      reason: toPlain(mc.reason ?? ""),
      correction: toPlain(mc.correction ?? ""),
    })),
    differentiation: p.differentiation
      ? {
          support: toPlain(p.differentiation.support ?? ""),
          extension: toPlain(p.differentiation.extension ?? ""),
        }
      : undefined,
  };
}

function cleanNote(n: LessonNote): LessonNote {
  return {
    ...n,
    previousKnowledge: toPlain(n.previousKnowledge ?? ""),
    entryBehaviour: toPlain(n.entryBehaviour ?? ""),
    summary: toPlain(n.summary ?? ""),
    assignment: cleanList(n.assignment),
    instructionalMaterials: cleanList(n.instructionalMaterials),
    referenceBooks: cleanList(n.referenceBooks),
    boardSummary: cleanList(n.boardSummary),
    objectives: cleanObjectives(n.objectives),
    presentation: (n.presentation ?? []).map(s => ({
      ...s,
      content: s.content ? toPlain(s.content) : s.content,
      duration: s.duration ? toPlain(s.duration) : s.duration,
    })),
    subjectContent: (n.subjectContent ?? []).map(b => ({
      ...b,
      subTopic: toPlain(b.subTopic ?? ""),
      explanation: toPlain(b.explanation ?? ""),
      keyPoints: cleanList(b.keyPoints),
      workedExamples: (b.workedExamples ?? []).map(w => ({
        problem: toPlain(w.problem ?? ""),
        solution: toPlain(w.solution ?? ""),
      })),
    })),
    evaluation: (n.evaluation ?? []).map(q => ({
      question: toPlain(q.question ?? ""),
      expectedAnswer: toPlain(q.expectedAnswer ?? ""),
    })),
  };
}

// ─── Section registry ─────────────────────────────────────────────────────────

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const PLAN_SECTIONS = [
  "Behavioural Objectives", "Previous Knowledge", "Entry Behaviour",
  "Instructional Materials", "Reference Books", "Lesson Presentation",
  "Common Misconceptions", "Differentiation",
  "Evaluation Questions", "Lesson Summary", "Assignment",
];

const NOTE_SECTIONS = [
  "Objectives", "Previous Knowledge", "Entry Behaviour",
  "Instructional Materials", "Reference Books", "Lesson Presentation",
  "Subject Content", "Board Summary", "Evaluation Questions",
  "Lesson Summary", "Assignment",
];

type EditKey =
  | "objectives" | "previousKnowledge" | "entryBehaviour"
  | "instructionalMaterials" | "referenceBooks" | "presentation"
  | "evaluation" | "summary" | "assignment"
  | "subjectContent" | "boardSummary";

// ─── Streaming progress labels ────────────────────────────────────────────────
// The note JSON streams in key order; we detect the furthest-along top-level key
// present in the accumulated raw text and show a friendly label. Cheap + robust
// (substring checks only — no partial-JSON parsing).

const PHASE_MARKERS: [marker: string, label: string][] = [
  ['"assignment"', "Finishing up…"],
  ['"summary"', "Writing the lesson summary…"],
  ['"evaluation"', "Creating evaluation questions…"],
  ['"boardSummary"', "Preparing the board summary…"],
  ['"differentiation"', "Adding differentiation…"],
  ['"commonMisconceptions"', "Noting common misconceptions…"],
  ['"subjectContent"', "Writing content & worked examples…"],
  ['"presentation"', "Building the lesson presentation…"],
  ['"objectives"', "Setting the objectives…"],
  ['"entryBehaviour"', "Establishing entry behaviour…"],
  ['"referenceBooks"', "Gathering reference materials…"],
];

function phaseForRaw(raw: string): string {
  for (const [marker, label] of PHASE_MARKERS) {
    if (raw.includes(marker)) return label;
  }
  return "Writing your lesson note…";
}

// ─── Small shared pieces ──────────────────────────────────────────────────────

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.2 3.3a1.8 1.8 0 0 1 2.5 2.5L7 15.5l-3.5 1 1-3.5L14.2 3.3z" />
  </svg>
);

function SaveDot({ status }: { status: "idle" | "saving" | "saved" }) {
  return (
    <div className="flex items-center gap-1.5">
      {status === "saving" && (
        <>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--color-warning)" }} />
          <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Saving…</span>
        </>
      )}
      {status === "saved" && (
        <>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-success)" }} />
          <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Saved</span>
        </>
      )}
      {status === "idle" && (
        <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Auto-save on</span>
      )}
    </div>
  );
}

// ─── Read-only display blocks ─────────────────────────────────────────────────

const EMPTY_HINT = "Tap to add…";

function ProseBlock({ v }: { v: string }) {
  if (!v) return <p className="text-[14px] italic" style={{ color: "var(--color-text-muted)" }}>{EMPTY_HINT}</p>;
  return (
    <p className="text-[15px] leading-[1.75] whitespace-pre-wrap" style={{ color: "oklch(18% 0.01 290)" }}>
      {v}
    </p>
  );
}

function ListBlock({ items, numbered = false }: { items: string[]; numbered?: boolean }) {
  if (!items.length) return <p className="text-[14px] italic" style={{ color: "var(--color-text-muted)" }}>{EMPTY_HINT}</p>;
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <span
            className="text-[11px] font-mono mt-[3px] shrink-0 select-none w-4 text-right"
            style={{ color: "var(--color-text-muted)" }}
          >
            {numbered ? `${i + 1}.` : "·"}
          </span>
          <p className="flex-1 text-[15px] leading-relaxed whitespace-pre-wrap" style={{ color: "oklch(18% 0.01 290)" }}>
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

function getStageBadge(classLevel?: string) {
  const norm = (classLevel || "").toLowerCase();
  if (/nursery|creche|kindergarten|kg\b|early|reception/i.test(norm)) {
    return { label: "ECCDE / Early Years", color: "bg-amber-50 text-amber-800 border-amber-200" };
  }
  if (/primary|basic\s*[1-6]\b|pry/i.test(norm)) {
    return { label: "Primary Education (9-Year BEC)", color: "bg-blue-50 text-blue-800 border-blue-200" };
  }
  if (/jss|basic\s*[7-9]\b|junior/i.test(norm)) {
    return { label: "Junior Secondary (BECE)", color: "bg-purple-50 text-purple-800 border-purple-200" };
  }
  return { label: "Senior Secondary (SSCE / WAEC)", color: "bg-indigo-50 text-indigo-800 border-indigo-200" };
}

function ObjectivesBlock({ obj }: { obj: LessonPlanObjectives }) {
  const groups: {
    label: string;
    sub: string;
    badgeClass: string;
    items: string[];
  }[] = [
    {
      label: "Cognitive Domain",
      sub: "Knowledge & Understanding (Bloom's Taxonomy)",
      badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
      items: obj?.cognitive ?? [],
    },
    {
      label: "Affective Domain",
      sub: "Values, Attitudes & Collaboration",
      badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
      items: obj?.affective ?? [],
    },
    {
      label: "Psychomotor Domain",
      sub: "Physical Manipulation & Practical Demonstrations",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      items: obj?.psychomotor ?? [],
    },
  ];
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.label} className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${g.badgeClass}`}>
              {g.label}
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              {g.sub}
            </span>
          </div>
          <ListBlock items={g.items} numbered />
        </div>
      ))}
    </div>
  );
}

function StepsBlock({
  steps,
  mode,
}: {
  steps: LessonPlan["presentation"];
  mode: "plan" | "note";
}) {
  if (!steps.length) return <p className="text-[14px] italic" style={{ color: "var(--color-text-muted)" }}>{EMPTY_HINT}</p>;
  return (
    <div className="space-y-4">
      {steps.map((step, i) => (
        <div
          key={i}
          className="rounded-2xl p-4.5 bg-white border border-gray-200/80 shadow-2xs"
        >
          {/* Step header pill */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "oklch(40% 0.22 290)" }}
              >
                {step.step}
              </span>
              <span className="text-[14px] font-bold text-gray-900">
                {step.title}
              </span>
            </div>
            {step.duration && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200/60 font-semibold shrink-0">
                {step.duration}
              </span>
            )}
          </div>

          {mode === "plan" ? (
            <div className="space-y-3">
              {step.teacherActivity && (
                <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100/70">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-900 mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block" />
                    Teacher&apos;s Activity (Facilitation)
                  </p>
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-gray-800">
                    {step.teacherActivity}
                  </p>
                </div>
              )}
              {step.studentActivity && (
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/70">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                    Pupils&apos; Activity (Active Engagement)
                  </p>
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-gray-800">
                    {step.studentActivity}
                  </p>
                </div>
              )}
            </div>
          ) : (
            step.content && (
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-gray-800">
                {step.content}
              </p>
            )
          )}
        </div>
      ))}
    </div>
  );
}

function BoardSummaryBlock({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-[14px] italic" style={{ color: "var(--color-text-muted)" }}>{EMPTY_HINT}</p>;
  return (
    <div className="rounded-2xl p-5 bg-slate-900 text-slate-100 shadow-md border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
            Chalkboard / Whiteboard Layout
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Teacher Copy Space</span>
      </div>
      <ul className="space-y-2.5 pl-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-slate-200">
            <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
            <span className="whitespace-pre-wrap">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MisconceptionsBlock({ items }: { items?: LessonPlan["commonMisconceptions"] }) {
  if (!items || !items.length) return null;
  return (
    <div className="space-y-3">
      {items.map((mc, i) => (
        <div
          key={i}
          className="rounded-2xl p-4 bg-amber-50/60 border border-amber-200/80"
        >
          <div className="flex items-start gap-2 mb-1.5">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">
              !
            </span>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-amber-950">
                Misconception {i + 1}: {mc.description}
              </p>
              <p className="text-[12px] text-amber-800/90 mt-0.5 leading-relaxed">
                <strong className="font-semibold text-amber-900">Why learners think this:</strong> {mc.reason}
              </p>
              <div className="mt-2.5 pt-2 border-t border-amber-200/60 text-[12px] text-emerald-900 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/70">
                <span className="font-semibold text-emerald-950 block mb-0.5">Teacher Correction & Guidance:</span>
                <p className="leading-relaxed">{mc.correction}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DifferentiationBlock({ diff }: { diff?: LessonPlan["differentiation"] }) {
  if (!diff) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
            Support for Struggling Learners (Scaffolding)
          </span>
        </div>
        <p className="text-[13px] text-blue-950 leading-relaxed whitespace-pre-wrap">
          {diff.support}
        </p>
      </div>
      <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
            Extension for Advanced Learners
          </span>
        </div>
        <p className="text-[13px] text-purple-950 leading-relaxed whitespace-pre-wrap">
          {diff.extension}
        </p>
      </div>
    </div>
  );
}

function SubjectContentBlock({ blocks }: { blocks: LessonNote["subjectContent"] }) {
  if (!blocks.length) return <p className="text-[14px] italic" style={{ color: "var(--color-text-muted)" }}>{EMPTY_HINT}</p>;
  return (
    <div className="space-y-8">
      {blocks.map((b, i) => (
        <div key={i}>
          <p className="text-[13px] font-bold mb-2.5" style={{ color: "var(--color-primary)" }}>
            {i + 1}. {b.subTopic}
          </p>
          <p className="text-[15px] leading-[1.75] whitespace-pre-wrap mb-4" style={{ color: "oklch(18% 0.01 290)" }}>
            {b.explanation}
          </p>
          {b.workedExamples.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                Worked Examples
              </p>
              <div className="space-y-2">
                {b.workedExamples.map((ex, k) => (
                  <div
                    key={k}
                    className="rounded-xl px-4 py-3"
                    style={{ background: "oklch(96% 0.02 240)", border: "1px solid oklch(90% 0.04 240)" }}
                  >
                    <p className="text-[13px] font-semibold mb-1.5" style={{ color: "oklch(30% 0.08 240)" }}>
                      {ex.problem}
                    </p>
                    <p className="text-[13px] font-mono leading-relaxed whitespace-pre-wrap" style={{ color: "oklch(35% 0.06 240)" }}>
                      {ex.solution}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {b.keyPoints.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                Key Points
              </p>
              <div className="space-y-1.5">
                {b.keyPoints.map((line, k) => (
                  <div key={k} className="flex items-start gap-2.5">
                    <span className="text-[10px] font-bold mt-1 shrink-0" style={{ color: "var(--color-primary)" }}>→</span>
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: "oklch(18% 0.01 290)" }}>
                      {line}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function QABlock({ items }: { items: LessonNote["evaluation"] }) {
  if (!items.length) return <p className="text-[14px] italic" style={{ color: "var(--color-text-muted)" }}>{EMPTY_HINT}</p>;
  return (
    <div className="space-y-5">
      {items.map((qa, i) => (
        <div key={i}>
          <div className="flex items-start gap-2.5 mb-1.5">
            <span className="text-[11px] font-bold shrink-0 mt-[3px]" style={{ color: "var(--color-primary)" }}>
              Q{i + 1}
            </span>
            <p className="flex-1 text-[15px] leading-relaxed font-medium whitespace-pre-wrap" style={{ color: "oklch(14% 0.01 290)" }}>
              {qa.question}
            </p>
          </div>
          <p className="pl-7 text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: "oklch(38% 0.01 290)" }}>
            {qa.expectedAnswer}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Tappable section wrapper ─────────────────────────────────────────────────

function Section({
  label,
  children,
  noBorder,
  onEdit,
}: {
  label: string;
  children: React.ReactNode;
  noBorder?: boolean;
  onEdit: () => void;
}) {
  return (
    <section
      id={slug(label)}
      onClick={() => {
        // Don't hijack a text-selection gesture (copying content)
        if (window.getSelection()?.toString()) return;
        onEdit();
      }}
      className="section-tap group py-6 -mx-3 px-3 rounded-2xl"
      style={{
        scrollMarginTop: 136,
        borderTop: noBorder ? "none" : "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "oklch(55% 0.12 290)" }}>
          {label}
        </h2>
        <button
          aria-label={`Edit ${label}`}
          onClick={e => { e.stopPropagation(); onEdit(); }}
          className="flex items-center gap-1 text-[11px] font-medium opacity-35 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity -my-2 py-2 px-1"
          style={{ color: "var(--color-primary)" }}
        >
          <PencilIcon className="w-3 h-3" />
          Edit
        </button>
      </div>
      {children}
    </section>
  );
}

// ─── Editor primitives (native inputs — no contentEditable) ───────────────────

function AutoTextarea({
  value,
  onChange,
  placeholder,
  small = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  small?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={`w-full resize-none outline-none bg-transparent leading-relaxed ${small ? "text-[13px]" : "text-[15px]"}`}
      style={{ color: "oklch(15% 0.01 290)" }}
    />
  );
}

function FieldShell({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>
          {label}
        </p>
      )}
      <div className="rounded-xl px-3.5 py-2.5 bg-white" style={{ border: "1px solid var(--color-border)" }}>
        {children}
      </div>
    </div>
  );
}

function ProseEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <FieldShell>
      <AutoTextarea value={value} onChange={onChange} placeholder={placeholder} />
    </FieldShell>
  );
}

function ListEditor({
  items,
  onChange,
  numbered = false,
  addLabel = "Add item",
}: {
  items: string[];
  onChange: (items: string[]) => void;
  numbered?: boolean;
  addLabel?: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span
            className="text-[11px] font-mono mt-3 shrink-0 select-none w-4 text-right"
            style={{ color: "var(--color-text-muted)" }}
          >
            {numbered ? `${i + 1}.` : "·"}
          </span>
          <div className="flex-1 rounded-xl px-3.5 py-2.5 bg-white" style={{ border: "1px solid var(--color-border)" }}>
            <AutoTextarea
              value={item}
              onChange={v => onChange(items.map((x, j) => (j === i ? v : x)))}
            />
          </div>
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="w-9 h-9 mt-1 rounded-lg flex items-center justify-center text-lg leading-none shrink-0 transition-colors text-gray-300 hover:text-red-400"
            aria-label="Remove item"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ""])}
        className="text-[13px] font-semibold flex items-center gap-1.5 ml-6 mt-1"
        style={{ color: "var(--color-primary)" }}
      >
        <span className="text-base leading-none">+</span> {addLabel}
      </button>
    </div>
  );
}

function ObjectivesEditor({
  value,
  onChange,
}: {
  value: LessonPlanObjectives;
  onChange: (v: LessonPlanObjectives) => void;
}) {
  const groups = [
    { key: "cognitive" as const, label: "Cognitive" },
    { key: "affective" as const, label: "Affective" },
    { key: "psychomotor" as const, label: "Psychomotor" },
  ];
  return (
    <div className="space-y-6">
      {groups.map(g => (
        <div key={g.key}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "oklch(55% 0.12 290)" }}>
            {g.label}
          </p>
          <ListEditor
            items={value?.[g.key] ?? []}
            onChange={items => onChange({ ...value, [g.key]: items })}
            numbered
            addLabel="Add objective"
          />
        </div>
      ))}
    </div>
  );
}

function StepsEditor({
  steps,
  mode,
  onChange,
}: {
  steps: LessonPlan["presentation"];
  mode: "plan" | "note";
  onChange: (steps: LessonPlan["presentation"]) => void;
}) {
  const set = (i: number, patch: Partial<LessonPlan["presentation"][0]>) =>
    onChange(steps.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <div className="space-y-7">
      {steps.map((step, i) => (
        <div key={i}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: "oklch(40% 0.22 290 / 0.1)", color: "var(--color-primary)" }}
              >
                {step.step}
              </span>
              <span className="text-[13px] font-semibold truncate" style={{ color: "var(--color-primary)" }}>
                {step.title}
              </span>
            </div>
            <input
              value={step.duration ?? ""}
              onChange={e => set(i, { duration: e.target.value })}
              aria-label={`Duration for step ${step.step}`}
              placeholder="5 mins"
              className="w-20 shrink-0 text-[12px] font-mono text-right rounded-lg px-2 py-1.5 outline-none bg-white"
              style={{ border: "1px solid var(--color-border)", color: "oklch(30% 0.01 290)" }}
            />
          </div>
          {mode === "plan" ? (
            <div className="space-y-3">
              <FieldShell label="Teacher activity">
                <AutoTextarea
                  value={step.teacherActivity ?? ""}
                  onChange={v => set(i, { teacherActivity: v })}
                  placeholder="What the teacher does…"
                />
              </FieldShell>
              <FieldShell label="Student activity">
                <AutoTextarea
                  value={step.studentActivity ?? ""}
                  onChange={v => set(i, { studentActivity: v })}
                  placeholder="What students do…"
                />
              </FieldShell>
            </div>
          ) : (
            <FieldShell label="Content">
              <AutoTextarea
                value={step.content ?? ""}
                onChange={v => set(i, { content: v })}
                placeholder="Teacher narrative for this step…"
              />
            </FieldShell>
          )}
        </div>
      ))}
    </div>
  );
}

function SubjectContentEditor({
  blocks,
  onChange,
}: {
  blocks: LessonNote["subjectContent"];
  onChange: (blocks: LessonNote["subjectContent"]) => void;
}) {
  const set = (i: number, patch: Partial<LessonNote["subjectContent"][0]>) =>
    onChange(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));

  return (
    <div className="space-y-8">
      {blocks.map((b, i) => (
        <div key={i}>
          <p className="text-[13px] font-bold mb-3" style={{ color: "var(--color-primary)" }}>
            {i + 1}. {b.subTopic}
          </p>
          <div className="space-y-4">
            <FieldShell label="Explanation">
              <AutoTextarea
                value={b.explanation}
                onChange={v => set(i, { explanation: v })}
                placeholder="Explain this sub-topic…"
              />
            </FieldShell>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                Worked Examples
              </p>
              <div className="space-y-3">
                {b.workedExamples.map((ex, k) => (
                  <div
                    key={k}
                    className="rounded-xl p-3 space-y-2 relative"
                    style={{ background: "oklch(96% 0.02 240)", border: "1px solid oklch(90% 0.04 240)" }}
                  >
                    <button
                      onClick={() => set(i, { workedExamples: b.workedExamples.filter((_, m) => m !== k) })}
                      className="absolute top-0 right-0 w-9 h-9 flex items-center justify-center text-base leading-none text-gray-300 hover:text-red-400 transition-colors"
                      aria-label="Remove example"
                    >
                      ×
                    </button>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(45% 0.06 240)" }}>
                        Problem
                      </p>
                      <AutoTextarea
                        small
                        value={ex.problem}
                        onChange={v =>
                          set(i, { workedExamples: b.workedExamples.map((x, m) => (m === k ? { ...x, problem: v } : x)) })
                        }
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(45% 0.06 240)" }}>
                        Solution
                      </p>
                      <AutoTextarea
                        small
                        value={ex.solution}
                        onChange={v =>
                          set(i, { workedExamples: b.workedExamples.map((x, m) => (m === k ? { ...x, solution: v } : x)) })
                        }
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => set(i, { workedExamples: [...b.workedExamples, { problem: "", solution: "" }] })}
                  className="text-[13px] font-semibold flex items-center gap-1.5"
                  style={{ color: "var(--color-primary)" }}
                >
                  <span className="text-base leading-none">+</span> Add example
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                Key Points
              </p>
              <ListEditor
                items={b.keyPoints}
                onChange={items => set(i, { keyPoints: items })}
                addLabel="Add key point"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function QAEditor({
  items,
  onChange,
}: {
  items: LessonNote["evaluation"];
  onChange: (items: LessonNote["evaluation"]) => void;
}) {
  return (
    <div className="space-y-5">
      {items.map((qa, i) => (
        <div key={i} className="relative">
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="absolute -top-2 right-0 w-9 h-9 flex items-center justify-center text-base leading-none text-gray-300 hover:text-red-400 transition-colors"
            aria-label="Remove question"
          >
            ×
          </button>
          <p className="text-[11px] font-bold mb-2" style={{ color: "var(--color-primary)" }}>
            Question {i + 1}
          </p>
          <div className="space-y-2.5">
            <FieldShell label="Question">
              <AutoTextarea
                value={qa.question}
                onChange={v => onChange(items.map((x, j) => (j === i ? { ...x, question: v } : x)))}
              />
            </FieldShell>
            <FieldShell label="Expected answer">
              <AutoTextarea
                value={qa.expectedAnswer}
                onChange={v => onChange(items.map((x, j) => (j === i ? { ...x, expectedAnswer: v } : x)))}
              />
            </FieldShell>
          </div>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { question: "", expectedAnswer: "" }])}
        className="text-[13px] font-semibold flex items-center gap-1.5"
        style={{ color: "var(--color-primary)" }}
      >
        <span className="text-base leading-none">+</span> Add question
      </button>
    </div>
  );
}

// ─── Focused editor sheet ─────────────────────────────────────────────────────
// Edits apply to state (and the debounced auto-save) on every keystroke, so
// closing is always safe. "Done" is the only control; there is nothing to lose.

function EditorSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Move focus into the dialog on open, return it on close
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    sheetRef.current?.focus();
    return () => prev?.focus?.();
  }, []);

  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !sheetRef.current) return;
    const focusables = sheetRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center"
      style={{ background: "rgba(10, 5, 18, 0.4)" }}
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${title}`}
        onKeyDown={trapTab}
        className="w-full flex flex-col rounded-t-3xl lg:rounded-3xl overflow-hidden animate-fade-up outline-none"
        style={{
          background: "oklch(98.5% 0.002 290)",
          maxWidth: 560,
          margin: "0 auto",
          maxHeight: "92dvh",
          height: "auto",
          minHeight: "40dvh",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="shrink-0 px-5 pt-3 pb-3 bg-white flex items-center gap-3"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="flex-1 min-w-0">
            <div className="w-9 h-1 rounded-full mb-2 lg:hidden" style={{ background: "var(--color-border)" }} />
            <p className="text-[15px] font-bold truncate" style={{ color: "oklch(12% 0.01 290)" }}>
              {title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 h-9 px-5 rounded-xl text-[13px] font-semibold text-white transition"
            style={{ background: "var(--color-primary)" }}
          >
            Done
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-5">
          {children}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SkeletonDoc() {
  return (
    <div className="px-5 pt-6 pb-10 space-y-6 animate-fade-up">
      <div className="space-y-2">
        <div className="animate-shimmer h-7 w-3/4 rounded-lg" />
        <div className="animate-shimmer h-4 w-1/2 rounded-lg" />
      </div>
      <div className="space-y-2 pt-4">
        <div className="animate-shimmer h-2.5 w-16 rounded" />
        <div className="animate-shimmer h-4 w-full rounded-lg" />
        <div className="animate-shimmer h-4 w-5/6 rounded-lg" />
        <div className="animate-shimmer h-4 w-4/5 rounded-lg" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="animate-shimmer h-2.5 w-20 rounded" />
        <div className="animate-shimmer h-4 w-full rounded-lg" />
        <div className="animate-shimmer h-4 w-3/4 rounded-lg" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="animate-shimmer h-2.5 w-24 rounded" />
        {[90, 100, 80, 95, 70].map((w, i) => (
          <div key={i} className="animate-shimmer h-4 rounded-lg" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

function GeneratingSkeleton({ label }: { label?: string }) {
  return (
    <div className="pt-4 pb-10 animate-fade-up">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--color-primary)" }} />
        <p className="text-[13px] font-semibold" style={{ color: "var(--color-primary)" }}>
          {label || "Writing your lesson note…"}
        </p>
      </div>
      <div className="space-y-3">
        {[100, 85, 92, 78, 95, 65, 88, 100, 72, 84, 60, 95].map((w, i) => (
          <div
            key={i}
            className="animate-shimmer h-3.5 rounded"
            style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Export sheet ─────────────────────────────────────────────────────────────

function ExportSheet({
  onClose,
  onExport,
}: {
  onClose: () => void;
  onExport: (fmt: "pdf" | "docx") => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center"
      style={{ background: "rgba(0,0,0,0.3)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Export material"
        className="w-full rounded-t-3xl lg:rounded-3xl overflow-hidden animate-fade-up"
        style={{ background: "white", maxWidth: 430, margin: "0 auto" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="w-10 h-1 rounded-full mx-auto mb-4 lg:hidden" style={{ background: "var(--color-border)" }} />
          <p className="text-[15px] font-bold" style={{ color: "oklch(12% 0.01 290)" }}>
            Export Material
          </p>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Download a copy of this lesson note
          </p>
        </div>

        {([
          { label: "PDF Document", sub: "Formatted for printing and sharing", fmt: "pdf" as const },
          { label: "Word Document", sub: "Editable DOCX format", fmt: "docx" as const },
        ] as const).map((opt, i) => (
          <button
            key={opt.fmt}
            onClick={() => onExport(opt.fmt)}
            className="w-full flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50 text-left"
            style={{ borderTop: i > 0 ? "1px solid var(--color-border)" : undefined }}
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "var(--color-primary-dim)" }}
            >
              <IconDownload className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold" style={{ color: "oklch(12% 0.01 290)" }}>
                {opt.label}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {opt.sub}
              </p>
            </div>
          </button>
        ))}

        <div className="px-5 py-4">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-[14px] font-semibold transition-colors"
            style={{ background: "var(--color-surface)", color: "var(--color-text-muted)" }}
          >
            Cancel
          </button>
        </div>
        <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
      </div>
    </div>
  );
}

// ─── Regenerate panel ─────────────────────────────────────────────────────────

function RegeneratePanel({
  phase,
  onClose,
  onConfirm,
  isLoading,
}: {
  phase: "plan" | "note";
  onClose: () => void;
  onConfirm: (instructions: string) => void;
  isLoading: boolean;
}) {
  const [instructions, setInstructions] = useState("");

  return (
    <div
      className="px-4 py-4 shrink-0 animate-fade-up"
      style={{ borderBottom: "1px solid var(--color-border)", background: "oklch(98.5% 0.002 290)" }}
    >
      <div className="lg:max-w-[880px] lg:mx-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold" style={{ color: "oklch(12% 0.01 290)" }}>
            Regenerate {phase === "plan" ? "lesson plan" : "lesson note"}
            <span className="ml-1.5 font-normal" style={{ color: "var(--color-text-muted)" }}>· ₽5</span>
          </p>
          <button onClick={onClose} className="text-[18px] leading-none" style={{ color: "var(--color-text-muted)" }}>
            ×
          </button>
        </div>
        <textarea
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          placeholder='Optional: "Make it simpler", "Add more worked examples"…'
          className="w-full text-[14px] px-3 py-2.5 rounded-xl outline-none resize-none leading-relaxed"
          style={{ border: "1px solid var(--color-border)", background: "white", color: "oklch(12% 0.01 290)" }}
          rows={2}
        />
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={() => onConfirm(instructions)}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60 transition"
            style={{ background: "var(--color-primary)" }}
          >
            {isLoading ? "Regenerating…" : "Regenerate — ₽5"}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main canvas page ─────────────────────────────────────────────────────────

export default function CanvasPage() {
  const { id } = useParams<{ id: string }>();

  const { data: noteData, isLoading } = useGetNoteQuery(id, { skip: !id });
  const { data: walletData } = useGetWalletQuery();
  const [updateNote] = useUpdateNoteMutation();
  const [regenerate, { isLoading: regenerating }] = useRegenerateMutation();
  const dispatch = useDispatch();

  // Note generation is streamed (SSE) rather than a blocking mutation, so its
  // loading + progress state is managed locally.
  const [generatingNote, setGeneratingNote] = useState(false);
  const [streamPhase, setStreamPhase] = useState("");
  const [genError, setGenError] = useState(false);

  const note = noteData?.data;

  const [phase, setPhase] = useState<"plan" | "note">("plan");
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [lessonNote, setLessonNote] = useState<LessonNote | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showMenu, setShowMenu] = useState(false);
  const [showRegen, setShowRegen] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [editing, setEditing] = useState<{ label: string; key: EditKey } | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (note && !initialized.current) {
      if (note.lessonPlanContent) setPlan(cleanPlan(note.lessonPlanContent));
      if (note.lessonNoteContent) {
        setLessonNote(cleanNote(note.lessonNoteContent));
        if (note.phase === "complete") setPhase("note");
      }
      initialized.current = true;
    }
  }, [note]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = () => setShowMenu(false);
    setTimeout(() => document.addEventListener("click", handler), 0);
    return () => document.removeEventListener("click", handler);
  }, [showMenu]);

  // Track which section is in view for the outline rail / chips
  useEffect(() => {
    const labels = phase === "plan" ? PLAN_SECTIONS : NOTE_SECTIONS;
    const els = labels
      .map(l => document.getElementById(slug(l)))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -75% 0px" },
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
    // Re-observe only when sections appear/disappear — not on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, !!plan, !!lessonNote, generatingNote]);

  // Reading progress hairline — updates the DOM directly so scrolling never re-renders
  useEffect(() => {
    const onScroll = (e: Event) => {
      const t = e.target;
      if (!(t instanceof HTMLElement) || !progressRef.current) return;
      if (!t.contains(progressRef.current)) return;
      const max = t.scrollHeight - t.clientHeight;
      progressRef.current.style.width = max > 40 ? `${(t.scrollTop / max) * 100}%` : "0%";
    };
    document.addEventListener("scroll", onScroll, true);
    return () => document.removeEventListener("scroll", onScroll, true);
  }, []);

  // Keep the active section chip in view on mobile
  useEffect(() => {
    if (!activeSection) return;
    document
      .getElementById(`chip-${activeSection}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeSection]);

  const scheduleSave = useCallback(
    (field: "lessonPlanContent" | "lessonNoteContent", value: LessonPlan | LessonNote) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveStatus("saving");
      saveTimer.current = setTimeout(async () => {
        try {
          await updateNote({ noteId: id, [field]: value }).unwrap();
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
          setSaveStatus("idle");
        }
      }, 1200);
    },
    [id, updateNote],
  );

  function handlePlanChange(updated: LessonPlan) {
    setPlan(updated);
    scheduleSave("lessonPlanContent", updated);
  }

  function handleNoteChange(updated: LessonNote) {
    setLessonNote(updated);
    scheduleSave("lessonNoteContent", updated);
  }

  async function handleGenerateNote() {
    if (!plan || generatingNote) return;

    // Jump to the note tab so the live progress skeleton is visible immediately.
    setGenError(false);
    setGeneratingNote(true);
    setStreamPhase("Starting…");
    setPhase("note");

    let raw = "";
    let receivedNote: LessonNote | null = null;

    try {
      const token = localStorage.getItem("sabi_access");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/generate/lesson-note/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ noteId: id, editedLessonPlan: plan }),
        },
      );

      // Pre-check failures (balance, ownership…) come back as a normal JSON error.
      if (!res.ok || !res.body) throw new Error("Generation could not start");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamErr = false;

      // Parse the SSE frames as they arrive.
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? ""; // keep the trailing partial frame buffered

        for (const frame of frames) {
          let event = "message";
          let data = "";
          for (const line of frame.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (!data) continue; // keepalive comment / empty

          if (event === "token") {
            raw += JSON.parse(data).t ?? "";
            setStreamPhase(phaseForRaw(raw));
          } else if (event === "done") {
            receivedNote = JSON.parse(data).lessonNote as LessonNote;
          } else if (event === "error") {
            streamErr = true;
          }
        }
      }

      if (streamErr || !receivedNote) throw new Error("Generation failed");

      setLessonNote(cleanNote(receivedNote));
      // Refresh balance, transactions, and the notes list (the stream did the
      // server-side write directly, bypassing RTK Query's auto-invalidation).
      dispatch(
        baseApi.util.invalidateTags(["Wallet", "Transactions", "Notes"]),
      );
    } catch {
      setGenError(true);
    } finally {
      setGeneratingNote(false);
      setStreamPhase("");
    }
  }

  async function handleRegenerate(instructions: string) {
    try {
      const res = await regenerate({
        noteId: id,
        phase,
        additionalInstructions: instructions || undefined,
      }).unwrap();
      if (phase === "plan") setPlan(cleanPlan(res.data.content as LessonPlan));
      else setLessonNote(cleanNote(res.data.content as LessonNote));
      setShowRegen(false);
    } catch {/* noop */}
  }

  async function handleExport(format: "pdf" | "docx") {
    setShowExport(false);
    try {
      const token = localStorage.getItem("sabi_access");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/export/${id}/${format}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note?.topic ?? "lesson"}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {/* noop */}
  }

  if (isLoading || !note) return <SkeletonDoc />;

  const balance = Number(walletData?.data?.balance ?? 0);
  const canGenerateNote = balance >= 12;
  const hasNote = !!lessonNote;
  const metaHeader = plan?.metadata ?? (lessonNote?.header ?? null);

  const openEditor = (label: string, key: EditKey) => setEditing({ label, key });

  return (
    <div className="flex flex-col min-h-full bg-white lg:bg-transparent">
      {/* ── Sticky header ── */}
      <header
        className="flex items-center gap-2 px-4 h-12 shrink-0 sticky top-0 z-20 bg-white"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        {/* Reading progress hairline */}
        <div
          ref={progressRef}
          className="absolute bottom-0 left-0 h-0.5 pointer-events-none"
          style={{ background: "var(--color-primary)", width: 0, opacity: 0.85, transition: "width 80ms linear" }}
        />

        <Link
          href="/notes"
          aria-label="Back to library"
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors hover:bg-gray-100"
          style={{ color: "var(--color-text-muted)" }}
        >
          <IconBack />
        </Link>

        <div className="flex-1 min-w-0 flex items-center justify-center">
          <SaveDot status={saveStatus} />
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {phase === "plan" && !hasNote && !generatingNote && (
            canGenerateNote ? (
              <button
                onClick={handleGenerateNote}
                disabled={!plan}
                className="h-9 px-4 rounded-xl text-[13px] font-semibold text-white flex items-center gap-1.5 disabled:opacity-40 transition"
                style={{ background: "var(--color-primary)" }}
              >
                <IconBolt className="w-4 h-4" />
                Generate Note · ₽12
              </button>
            ) : (
              <Link
                href="/wallet"
                className="h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center transition-colors"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-primary)" }}
              >
                Top up to generate · ₽12
              </Link>
            )
          )}
          {generatingNote && (
            <div
              className="h-9 px-4 rounded-xl text-[13px] font-semibold text-white flex items-center gap-2 opacity-80"
              style={{ background: "var(--color-primary)" }}
            >
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" opacity="0.2" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
              Writing note…
            </div>
          )}
          {hasNote && !generatingNote && (
            <button
              onClick={() => setShowExport(true)}
              className="h-9 px-4 rounded-xl text-[13px] font-semibold text-white flex items-center gap-1.5 transition"
              style={{ background: "var(--color-primary)" }}
            >
              <IconDownload className="w-4 h-4" />
              Export
            </button>
          )}
        </div>

        {/* Menu */}
        <div className="relative shrink-0">
          <button
            onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
            aria-label="More options"
            aria-expanded={showMenu}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{ color: "var(--color-text-muted)" }}
          >
            <IconDots />
          </button>

          {showMenu && (
            <div
              className="absolute top-full right-0 mt-1.5 w-56 rounded-2xl overflow-hidden shadow-xl animate-scale-in"
              style={{ background: "white", border: "1px solid var(--color-border)", zIndex: 50 }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => { setShowRegen(true); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
              >
                <IconBolt className="w-4 h-4 shrink-0" style={{ color: "var(--color-primary)" }} />
                <div>
                  <p className="text-[14px] font-medium" style={{ color: "oklch(12% 0.01 290)" }}>
                    Regenerate {phase === "plan" ? "plan" : "note"}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Costs ₽5</p>
                </div>
              </button>
              {hasNote && (
                <button
                  onClick={() => { setShowExport(true); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
                  style={{ borderTop: "1px solid var(--color-border)" }}
                >
                  <IconDownload className="w-4 h-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />
                  <p className="text-[14px] font-medium" style={{ color: "oklch(12% 0.01 290)" }}>
                    Export material
                  </p>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Phase tab strip + section chips ── */}
      <div
        className="shrink-0 sticky z-10 bg-white"
        style={{ top: 48, borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center px-5 lg:max-w-[880px] lg:mx-auto lg:px-8">
          {(["plan", "note"] as const).map(p => (
            <button
              key={p}
              onClick={() => { if (p === "note" && !hasNote) return; setEditing(null); setPhase(p); }}
              disabled={p === "note" && !hasNote}
              className="relative py-3 mr-6 text-[13px] font-semibold transition-colors disabled:opacity-30"
              style={{ color: phase === p ? "var(--color-primary)" : "var(--color-text-muted)" }}
            >
              {p === "plan" ? "Lesson Plan" : "Lesson Note"}
              {phase === p && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ background: "var(--color-primary)" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Section chips — mobile jump navigation */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto scrollbar-hidden px-5 pb-2.5">
          {(phase === "plan" ? PLAN_SECTIONS : NOTE_SECTIONS).map(label => (
            <button
              key={label}
              id={`chip-${slug(label)}`}
              onClick={() =>
                document.getElementById(slug(label))?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="shrink-0 text-[11px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
              style={activeSection === slug(label)
                ? {
                    background: "var(--color-primary-dim)",
                    color: "var(--color-primary)",
                    fontWeight: 600,
                    border: "1px solid transparent",
                  }
                : {
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)",
                    fontWeight: 500,
                  }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Regenerate panel ── */}
      {showRegen && (
        <RegeneratePanel
          phase={phase}
          onClose={() => setShowRegen(false)}
          onConfirm={handleRegenerate}
          isLoading={regenerating}
        />
      )}

      {/* ── Document workspace ── */}
      <div className="flex-1">
        <div className="lg:flex lg:items-start lg:justify-center lg:gap-10 lg:px-8">
        <div className="canvas-sheet w-full min-w-0">
        {/* Document header */}
        <div className="px-5 pt-7 pb-1">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              2025 NERDC Scheme Verified
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border shadow-2xs ${getStageBadge(note.classLevel).color}`}>
              {getStageBadge(note.classLevel).label}
            </span>
          </div>

          <h1
            className="text-[26px] font-bold leading-tight font-display mb-3"
            style={{ color: "oklch(10% 0.01 290)" }}
          >
            {note.topic}
          </h1>

          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "var(--color-primary-dim)", color: "var(--color-primary)" }}
            >
              {note.subjectName}
            </span>
            <span className="text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>
              {note.classLevel}
            </span>
            <span style={{ color: "var(--color-border)" }}>·</span>
            <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              Term {note.term}, Week {note.week}
            </span>
            {note.state && (
              <>
                <span style={{ color: "var(--color-border)" }}>·</span>
                <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                  {note.state} State
                </span>
              </>
            )}
            {metaHeader?.duration && (
              <>
                <span style={{ color: "var(--color-border)" }}>·</span>
                <span className="text-[12px] font-mono" style={{ color: "var(--color-text-muted)" }}>
                  {metaHeader.duration} min period
                </span>
              </>
            )}
            {note.session && (
              <>
                <span style={{ color: "var(--color-border)" }}>·</span>
                <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                  {note.session} Session
                </span>
              </>
            )}
          </div>
        </div>

        {/* Canvas content */}
        <div key={phase} className="px-5 pb-4 animate-fade-up">
          {phase === "plan" && plan && (
            <div>
              <Section label="Behavioural Objectives" noBorder onEdit={() => openEditor("Behavioural Objectives", "objectives")}>
                <ObjectivesBlock obj={plan.objectives} />
              </Section>
              <Section label="Previous Knowledge" onEdit={() => openEditor("Previous Knowledge", "previousKnowledge")}>
                <ProseBlock v={plan.previousKnowledge} />
              </Section>
              <Section label="Entry Behaviour" onEdit={() => openEditor("Entry Behaviour", "entryBehaviour")}>
                <ProseBlock v={plan.entryBehaviour} />
              </Section>
              <Section label="Instructional Materials" onEdit={() => openEditor("Instructional Materials", "instructionalMaterials")}>
                <ListBlock items={plan.instructionalMaterials} />
              </Section>
              <Section label="Reference Books" onEdit={() => openEditor("Reference Books", "referenceBooks")}>
                <ListBlock items={plan.referenceBooks} />
              </Section>
              <Section label="Lesson Presentation" onEdit={() => openEditor("Lesson Presentation", "presentation")}>
                <StepsBlock steps={plan.presentation} mode="plan" />
              </Section>
              {plan.commonMisconceptions && plan.commonMisconceptions.length > 0 && (
                <Section label="Common Misconceptions" onEdit={() => {}}>
                  <MisconceptionsBlock items={plan.commonMisconceptions} />
                </Section>
              )}
              {plan.differentiation && (
                <Section label="Differentiation" onEdit={() => {}}>
                  <DifferentiationBlock diff={plan.differentiation} />
                </Section>
              )}
              <Section label="Evaluation Questions" onEdit={() => openEditor("Evaluation Questions", "evaluation")}>
                <ListBlock items={plan.evaluation} numbered />
              </Section>
              <Section label="Lesson Summary" onEdit={() => openEditor("Lesson Summary", "summary")}>
                <ProseBlock v={plan.summary} />
              </Section>
              <Section label="Assignment" onEdit={() => openEditor("Assignment", "assignment")}>
                <ProseBlock v={plan.assignment} />
              </Section>
            </div>
          )}
          {phase === "plan" && !plan && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[14px]" style={{ color: "var(--color-text-muted)" }}>
                No plan content yet.
              </p>
            </div>
          )}

          {phase === "note" && generatingNote && <GeneratingSkeleton label={streamPhase} />}
          {phase === "note" && !generatingNote && lessonNote && (
            <div>
              <Section label="Objectives" noBorder onEdit={() => openEditor("Objectives", "objectives")}>
                <ObjectivesBlock obj={lessonNote.objectives} />
              </Section>
              <Section label="Previous Knowledge" onEdit={() => openEditor("Previous Knowledge", "previousKnowledge")}>
                <ProseBlock v={lessonNote.previousKnowledge} />
              </Section>
              <Section label="Entry Behaviour" onEdit={() => openEditor("Entry Behaviour", "entryBehaviour")}>
                <ProseBlock v={lessonNote.entryBehaviour} />
              </Section>
              <Section label="Instructional Materials" onEdit={() => openEditor("Instructional Materials", "instructionalMaterials")}>
                <ListBlock items={lessonNote.instructionalMaterials} />
              </Section>
              <Section label="Reference Books" onEdit={() => openEditor("Reference Books", "referenceBooks")}>
                <ListBlock items={lessonNote.referenceBooks} />
              </Section>
              <Section label="Lesson Presentation" onEdit={() => openEditor("Lesson Presentation", "presentation")}>
                <StepsBlock steps={lessonNote.presentation} mode="note" />
              </Section>
              <Section label="Subject Content" onEdit={() => openEditor("Subject Content", "subjectContent")}>
                <SubjectContentBlock blocks={lessonNote.subjectContent} />
              </Section>
              <Section label="Board Summary" onEdit={() => openEditor("Board Summary", "boardSummary")}>
                <BoardSummaryBlock items={lessonNote.boardSummary} />
              </Section>
              <Section label="Evaluation Questions" onEdit={() => openEditor("Evaluation Questions", "evaluation")}>
                <QABlock items={lessonNote.evaluation} />
              </Section>
              <Section label="Lesson Summary" onEdit={() => openEditor("Lesson Summary", "summary")}>
                <ProseBlock v={lessonNote.summary} />
              </Section>
              <Section label="Assignment" onEdit={() => openEditor("Assignment", "assignment")}>
                <ListBlock items={lessonNote.assignment} numbered />
              </Section>
            </div>
          )}
          {phase === "note" && !generatingNote && !lessonNote && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {genError ? (
                <>
                  <p className="text-[14px] mb-1 font-semibold" style={{ color: "var(--color-error)" }}>
                    Generation didn&apos;t complete
                  </p>
                  <p className="text-[13px] mb-4" style={{ color: "var(--color-text-muted)" }}>
                    No Parats were deducted. Please try again.
                  </p>
                  <button
                    onClick={handleGenerateNote}
                    className="h-10 px-5 rounded-xl text-[13px] font-semibold text-white transition"
                    style={{ background: "var(--color-primary)" }}
                  >
                    Try again · ₽12
                  </button>
                  <button
                    onClick={() => { setGenError(false); setPhase("plan"); }}
                    className="text-[13px] font-semibold mt-3"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    ← Back to Plan
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[14px] mb-3" style={{ color: "var(--color-text-muted)" }}>
                    Ready to generate the full lesson note.
                  </p>
                  <button
                    onClick={() => setPhase("plan")}
                    className="text-[13px] font-semibold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    ← Back to Plan
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        </div>

        {/* Outline rail — desktop only */}
        <nav
          className="hidden xl:block w-52 shrink-0 sticky"
          style={{ top: 128, marginTop: 32 }}
          aria-label="Document outline"
        >
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-3 px-2.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            On this page
          </p>
          <div className="space-y-0.5">
            {(phase === "plan" ? PLAN_SECTIONS : NOTE_SECTIONS).map(label => (
              <button
                key={label}
                onClick={() =>
                  document.getElementById(slug(label))?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="block w-full text-left text-[12px] py-1.5 px-2.5 rounded-lg transition-colors"
                style={activeSection === slug(label)
                  ? { color: "var(--color-primary)", background: "var(--color-primary-dim)", fontWeight: 600 }
                  : { color: "var(--color-text-muted)" }}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>
        </div>

        <div className="h-28 lg:h-10" />
      </div>

      {/* ── Sticky bottom action bar (mobile; desktop actions live in the header) ── */}
      <div
        className="shrink-0 px-4 pt-3 bg-white sticky bottom-0 z-20 lg:hidden"
        style={{
          borderTop: "1px solid var(--color-border)",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {phase === "plan" && !hasNote && !generatingNote && (
          canGenerateNote ? (
            <button
              onClick={handleGenerateNote}
              disabled={!plan}
              className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2.5 disabled:opacity-40 transition"
              style={{ background: "var(--color-primary)" }}
            >
              <IconBolt className="w-5 h-5" />
              Generate Lesson Note
              <span
                className="text-[12px] font-bold px-2 py-0.5 rounded-full ml-0.5"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                ₽12
              </span>
            </button>
          ) : (
            <div className="text-center py-1.5">
              <p className="text-[13px] mb-1.5" style={{ color: "var(--color-error)" }}>
                Not enough Parats — need ₽12 to generate a note.
              </p>
              <Link href="/wallet" className="text-[13px] font-semibold" style={{ color: "var(--color-primary)" }}>
                Top up wallet →
              </Link>
            </div>
          )
        )}

        {phase === "plan" && hasNote && !generatingNote && (
          <button
            onClick={() => setPhase("note")}
            className="w-full py-4 rounded-2xl font-semibold text-white transition"
            style={{ background: "var(--color-primary)" }}
          >
            View Lesson Note →
          </button>
        )}

        {generatingNote && (
          <button
            disabled
            className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2.5 opacity-80"
            style={{ background: "var(--color-primary)" }}
          >
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" opacity="0.2" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
            Writing your lesson note…
          </button>
        )}

        {phase === "note" && hasNote && !generatingNote && (
          <button
            onClick={() => setShowExport(true)}
            className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2.5 transition"
            style={{ background: "var(--color-primary)" }}
          >
            <IconDownload className="w-5 h-5" />
            Export Material
          </button>
        )}
      </div>

      {/* ── Focused section editor ── */}
      {editing && phase === "plan" && plan && (
        <EditorSheet title={editing.label} onClose={() => setEditing(null)}>
          {editing.key === "objectives" && (
            <ObjectivesEditor value={plan.objectives} onChange={v => handlePlanChange({ ...plan, objectives: v })} />
          )}
          {editing.key === "previousKnowledge" && (
            <ProseEditor
              value={plan.previousKnowledge}
              onChange={v => handlePlanChange({ ...plan, previousKnowledge: v })}
              placeholder="What have students already learned that connects to this topic?"
            />
          )}
          {editing.key === "entryBehaviour" && (
            <ProseEditor
              value={plan.entryBehaviour}
              onChange={v => handlePlanChange({ ...plan, entryBehaviour: v })}
              placeholder="Prior knowledge students should have…"
            />
          )}
          {editing.key === "instructionalMaterials" && (
            <ListEditor
              items={plan.instructionalMaterials}
              onChange={v => handlePlanChange({ ...plan, instructionalMaterials: v })}
              addLabel="Add material"
            />
          )}
          {editing.key === "referenceBooks" && (
            <ListEditor
              items={plan.referenceBooks}
              onChange={v => handlePlanChange({ ...plan, referenceBooks: v })}
              addLabel="Add reference"
            />
          )}
          {editing.key === "presentation" && (
            <StepsEditor
              steps={plan.presentation}
              mode="plan"
              onChange={v => handlePlanChange({ ...plan, presentation: v })}
            />
          )}
          {editing.key === "evaluation" && (
            <ListEditor
              items={plan.evaluation}
              onChange={v => handlePlanChange({ ...plan, evaluation: v })}
              numbered
              addLabel="Add question"
            />
          )}
          {editing.key === "summary" && (
            <ProseEditor
              value={plan.summary}
              onChange={v => handlePlanChange({ ...plan, summary: v })}
              placeholder="How will you close the lesson?"
            />
          )}
          {editing.key === "assignment" && (
            <ProseEditor
              value={plan.assignment}
              onChange={v => handlePlanChange({ ...plan, assignment: v })}
              placeholder="What will students work on independently?"
            />
          )}
        </EditorSheet>
      )}

      {editing && phase === "note" && lessonNote && (
        <EditorSheet title={editing.label} onClose={() => setEditing(null)}>
          {editing.key === "objectives" && (
            <ObjectivesEditor value={lessonNote.objectives} onChange={v => handleNoteChange({ ...lessonNote, objectives: v })} />
          )}
          {editing.key === "previousKnowledge" && (
            <ProseEditor
              value={lessonNote.previousKnowledge}
              onChange={v => handleNoteChange({ ...lessonNote, previousKnowledge: v })}
              placeholder="Prior knowledge students bring…"
            />
          )}
          {editing.key === "entryBehaviour" && (
            <ProseEditor
              value={lessonNote.entryBehaviour}
              onChange={v => handleNoteChange({ ...lessonNote, entryBehaviour: v })}
              placeholder="Entry behaviour expected…"
            />
          )}
          {editing.key === "instructionalMaterials" && (
            <ListEditor
              items={lessonNote.instructionalMaterials}
              onChange={v => handleNoteChange({ ...lessonNote, instructionalMaterials: v })}
              addLabel="Add material"
            />
          )}
          {editing.key === "referenceBooks" && (
            <ListEditor
              items={lessonNote.referenceBooks}
              onChange={v => handleNoteChange({ ...lessonNote, referenceBooks: v })}
              addLabel="Add reference"
            />
          )}
          {editing.key === "presentation" && (
            <StepsEditor
              steps={lessonNote.presentation}
              mode="note"
              onChange={v => handleNoteChange({ ...lessonNote, presentation: v })}
            />
          )}
          {editing.key === "subjectContent" && (
            <SubjectContentEditor
              blocks={lessonNote.subjectContent}
              onChange={v => handleNoteChange({ ...lessonNote, subjectContent: v })}
            />
          )}
          {editing.key === "boardSummary" && (
            <ListEditor
              items={lessonNote.boardSummary}
              onChange={v => handleNoteChange({ ...lessonNote, boardSummary: v })}
              addLabel="Add point"
            />
          )}
          {editing.key === "evaluation" && (
            <QAEditor
              items={lessonNote.evaluation}
              onChange={v => handleNoteChange({ ...lessonNote, evaluation: v })}
            />
          )}
          {editing.key === "summary" && (
            <ProseEditor
              value={lessonNote.summary}
              onChange={v => handleNoteChange({ ...lessonNote, summary: v })}
              placeholder="How the lesson closes…"
            />
          )}
          {editing.key === "assignment" && (
            <ListEditor
              items={lessonNote.assignment}
              onChange={v => handleNoteChange({ ...lessonNote, assignment: v })}
              numbered
              addLabel="Add task"
            />
          )}
        </EditorSheet>
      )}

      {/* ── Export sheet ── */}
      {showExport && (
        <ExportSheet onClose={() => setShowExport(false)} onExport={handleExport} />
      )}
    </div>
  );
}
