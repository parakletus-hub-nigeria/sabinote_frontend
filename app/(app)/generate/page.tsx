"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconBack, IconBolt, IconCheck, IconPlus } from "@/components/icons";
import {
  useGetCurriculumSubjectsQuery,
  useGetCurriculumWeeksQuery,
  useGetCurriculumWeekQuery,
} from "@/lib/services/curriculumApi";
import { useGenerateLessonPlanMutation } from "@/lib/services/generateApi";
import { useGetMeQuery } from "@/lib/services/authApi";
import { useGetWalletQuery } from "@/lib/services/walletApi";
import { CLASS_LEVELS_UI, NIGERIAN_STATES } from "@/lib/constants";

const CLASSES = CLASS_LEVELS_UI;
// General curriculum is seeded with "SS1/SS2/SS3" (2 S's); state curriculum
// may use "SSS1/SSS2/SSS3". Normalise to 2-S form so both sources match.
const toApiClass = (c: string) => c.replace(" ", "").replace(/^SSS/, "SS");
const DURATIONS = [30, 40, 45, 60, 80];

const PEDAGOGICAL_OPTIONS: Array<{
  id: "standard" | "hands_on" | "exam_focus" | "remedial";
  title: string;
  subtitle: string;
  badge: string;
}> = [
  {
    id: "standard",
    title: "Standard",
    subtitle: "Balanced depth & evaluation",
    badge: "Recommended",
  },
  {
    id: "hands_on",
    title: "Hands-On",
    subtitle: "Practical pupil activities & realia",
    badge: "Interactive",
  },
  {
    id: "exam_focus",
    title: "Exam Focus",
    subtitle: "WAEC / BECE marking scheme alignment",
    badge: "High Yield",
  },
  {
    id: "remedial",
    title: "Remedial",
    subtitle: "Step-by-step scaffolding for learners",
    badge: "Scaffolded",
  },
];

function SectionLabel({ step, label }: { step: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{
          background: "var(--color-primary-dim)",
          color: "oklch(40% 0.22 290)",
        }}
      >
        {step}
      </span>
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </p>
    </div>
  );
}

export default function GeneratePage() {
  const router = useRouter();
  const { data: meData } = useGetMeQuery();
  const { data: walletData } = useGetWalletQuery();

  const [state, setState] = useState("");
  const [subject, setSubject] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [term, setTerm] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState<{
    id: string;
    source: "release" | "state" | "general";
    weekNumber: number;
    topic: string;
  } | null>(null);
  const selectedWeekId = selectedWeek?.id ?? null;

  const [duration, setDuration] = useState(40);
  const [statusIdx, setStatusIdx] = useState(0);
  const [generateError, setGenerateError] = useState<{
    message: string;
    isBalanceError: boolean;
  } | null>(null);

  // Phase 2 additions
  const [selectedAids, setSelectedAids] = useState<string[]>([]);
  const [customAidInput, setCustomAidInput] = useState("");
  const [pedagogicalEmphasis, setPedagogicalEmphasis] = useState<
    "standard" | "hands_on" | "exam_focus" | "remedial"
  >("standard");
  const [showSchemeDetails, setShowSchemeDetails] = useState(false);

  const profileState = meData?.data?.state ?? "";
  const resolvedState = state || profileState;

  const { data: subjectsData, isFetching: loadingSubjects } =
    useGetCurriculumSubjectsQuery(
      { state: resolvedState, classLevel: toApiClass(classLevel) },
      { skip: !resolvedState || !classLevel },
    );

  const { data: weeksData, isFetching: loadingWeeks } =
    useGetCurriculumWeeksQuery(
      {
        state: resolvedState,
        subject,
        classLevel: toApiClass(classLevel),
        term,
      },
      { skip: !resolvedState || !subject || !classLevel },
    );

  // Fetch full canonical week details for the live scheme preview card
  const { data: weekDetailData, isFetching: loadingWeekDetail } =
    useGetCurriculumWeekQuery(
      {
        state: resolvedState,
        subject,
        classLevel: toApiClass(classLevel),
        term,
        week: selectedWeek?.weekNumber ?? 1,
      },
      {
        skip:
          !resolvedState ||
          !subject ||
          !classLevel ||
          !selectedWeek?.weekNumber,
      },
    );

  const weekDetail = weekDetailData?.data;

  // Extract suggested learning aids from canonical week or fallbacks
  const suggestedAids = useMemo(() => {
    if (!weekDetail?.teachingAids) {
      return [
        "Chalkboard & coloured chalks",
        "Approved textbook & wall charts",
        "Real-world illustrative models",
        "Flashcards & activity worksheets",
      ];
    }
    const raw = weekDetail.teachingAids;
    const splitAids = raw
      .split(/[,;\n•]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);

    return splitAids.length > 0
      ? splitAids
      : [
          "Chalkboard & coloured chalks",
          "Approved textbook & wall charts",
          "Real-world illustrative models",
          "Flashcards & activity worksheets",
        ];
  }, [weekDetail?.teachingAids]);

  // Pre-select first 3 suggested aids when a new week is loaded
  useEffect(() => {
    if (suggestedAids.length > 0 && selectedAids.length === 0) {
      setSelectedAids(suggestedAids.slice(0, 3));
    }
  }, [suggestedAids, selectedAids.length]);

  // Proportional pacing calculation based on duration
  const pacing = useMemo(() => {
    const step1 = Math.max(3, Math.round(duration * 0.125));
    const step3 = Math.max(5, Math.round(duration * 0.25));
    const step2 = duration - step1 - step3;
    return { step1, step2, step3 };
  }, [duration]);

  const toggleAid = (aid: string) => {
    setSelectedAids((prev) =>
      prev.includes(aid) ? prev.filter((a) => a !== aid) : [...prev, aid],
    );
  };

  const handleAddCustomAid = () => {
    const trimmed = customAidInput.trim();
    if (!trimmed) return;
    if (!selectedAids.includes(trimmed)) {
      setSelectedAids((prev) => [...prev, trimmed]);
    }
    setCustomAidInput("");
  };

  const [generateLessonPlan, { isLoading: generating }] =
    useGenerateLessonPlanMutation();

  const subjects = subjectsData?.data?.subjects ?? [];
  const weeks = weeksData?.data?.weeks ?? [];
  const balance = walletData?.data?.balance ?? "0";
  const planCost = 8;
  const canGenerate = Number(balance) >= planCost;

  const statusMessages = [
    `Connecting to ${resolvedState || "state"} curriculum database...`,
    "Fetching scheme of work...",
    "Grounding pedagogy to stage & standards...",
    "Structuring your lesson plan...",
  ];

  async function handleGenerate() {
    if (!selectedWeek) return;
    setGenerateError(null);
    let interval: ReturnType<typeof setInterval> | null = null;
    try {
      let idx = 0;
      interval = setInterval(() => {
        idx = (idx + 1) % statusMessages.length;
        setStatusIdx(idx);
      }, 1400);

      const payload = {
        durationMinutes: duration,
        ...(selectedWeek.source === "release"
          ? { curriculumUnitId: selectedWeek.id }
          : selectedWeek.source === "state"
          ? { curriculumWeekId: selectedWeek.id }
          : { generalCurriculumId: selectedWeek.id }),
        learningAids: selectedAids.length > 0 ? selectedAids : undefined,
        pedagogicalEmphasis,
      };

      const res = await generateLessonPlan(payload).unwrap();
      router.push(`/notes/${res.data.noteId}`);
    } catch (err: any) {
      const status = err?.status;
      const errCode = err?.data?.error?.code;
      const details = err?.data?.error?.details;
      const rawMsg =
        (Array.isArray(details) ? details.join(", ") : null) ||
        err?.data?.error?.message ||
        err?.data?.message ||
        err?.message;

      const isBalance =
        status === 402 ||
        errCode === "PAYMENT_REQUIRED" ||
        rawMsg?.includes("Insufficient Parats");

      let friendlyMsg =
        "Failed to generate lesson plan. Please check your network and try again.";
      if (isBalance) {
        friendlyMsg =
          rawMsg ||
          `Insufficient balance. You need ₽${planCost} Parats to generate this lesson plan.`;
      } else if (
        status === 503 ||
        rawMsg?.toLowerCase().includes("ai generation failed")
      ) {
        friendlyMsg =
          "AI generation is momentarily unavailable. No Parats were deducted. Please try again in a few moments.";
      } else if (rawMsg) {
        friendlyMsg = rawMsg;
      }

      setGenerateError({
        message: friendlyMsg,
        isBalanceError: isBalance,
      });
    } finally {
      if (interval) clearInterval(interval);
    }
  }

  const selectClass =
    "w-full px-3 py-3 rounded-xl text-sm text-gray-900 border outline-none bg-white appearance-none transition-shadow";
  const selectStyle = { borderColor: "var(--color-border)" };
  const onFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    e.target.style.borderColor = "oklch(40% 0.22 290)";
    e.target.style.boxShadow = "0 0 0 3px oklch(40% 0.22 290 / 0.08)";
  };
  const onBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    e.target.style.borderColor = "var(--color-border)";
    e.target.style.boxShadow = "none";
  };

  const ChevronDown = () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  if (generating) {
    return (
      <div
        className="flex flex-col min-h-full px-5 py-8"
        style={{ background: "var(--color-surface)" }}
      >
        {/* Progress bar */}
        <div className="mb-10">
          <div
            className="h-0.5 rounded-full overflow-hidden"
            style={{ background: "var(--color-border)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                background: "oklch(40% 0.22 290)",
                width: "55%",
                transition: "width 1.4s var(--ease-out)",
                animation: "genFill 3s ease-out forwards",
              }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "var(--color-primary-dim)" }}
          >
            <IconBolt
              className="w-5 h-5"
              style={{ color: "oklch(40% 0.22 290)" }}
            />
          </div>

          <p
            className="text-xs font-bold uppercase tracking-[0.12em] mb-2"
            style={{ color: "oklch(40% 0.22 290)" }}
          >
            Generating
          </p>
          <h2
            className="font-display font-bold text-gray-900 text-2xl mb-2"
            style={{ letterSpacing: "-0.02em" }}
          >
            Building your lesson plan
          </h2>
          <p
            className="text-sm mb-8"
            style={{ color: "var(--color-text-muted)" }}
          >
            {statusMessages[statusIdx]}
          </p>

          {/* Skeleton lines */}
          <div className="space-y-2.5">
            <div className="animate-shimmer h-3.5 w-3/4 rounded-lg" />
            <div className="animate-shimmer h-3 w-full rounded-lg" />
            <div className="animate-shimmer h-3 w-5/6 rounded-lg" />
            <div className="animate-shimmer h-3 w-4/6 rounded-lg" />
            <div className="mt-5 animate-shimmer h-3.5 w-1/2 rounded-lg" />
            <div className="animate-shimmer h-3 w-full rounded-lg" />
            <div className="animate-shimmer h-3 w-3/4 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ background: "var(--color-surface)" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-2">
        <Link
          href="/dashboard"
          aria-label="Back to dashboard"
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-white hover:text-gray-700 transition-colors"
        >
          <IconBack />
        </Link>
        <div>
          <h1
            className="font-display font-bold text-gray-900 text-xl"
            style={{ letterSpacing: "-0.02em" }}
          >
            New lesson note
          </h1>
        </div>
      </div>

      {/* Balance strip */}
      <div
        className="mx-5 mb-5 mt-2 px-4 py-2.5 rounded-xl flex items-center justify-between"
        style={{ background: "white", border: "1px solid var(--color-border)" }}
      >
        <p
          className="text-xs font-medium"
          style={{ color: "var(--color-text-muted)" }}
        >
          Balance: <span className="font-bold text-gray-900">₽{balance}</span>
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          This plan costs{" "}
          <span className="font-semibold text-gray-900">₽{planCost}</span>
        </p>
      </div>

      {/* ── Generation Error Banner ── */}
      {generateError && (
        <div
          role="alert"
          className="mx-5 mb-5 p-4 rounded-2xl flex items-start gap-3.5 border transition-all animate-fade-in shadow-xs"
          style={{
            background: generateError.isBalanceError
              ? "oklch(96% 0.04 40)"
              : "oklch(96% 0.04 25)",
            borderColor: generateError.isBalanceError
              ? "oklch(82% 0.12 40)"
              : "oklch(82% 0.12 25)",
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{
              background: generateError.isBalanceError
                ? "oklch(90% 0.08 40)"
                : "oklch(90% 0.08 25)",
              color: generateError.isBalanceError
                ? "oklch(45% 0.18 40)"
                : "oklch(45% 0.18 25)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-bold uppercase tracking-wider mb-1"
              style={{
                color: generateError.isBalanceError
                  ? "oklch(45% 0.18 40)"
                  : "oklch(45% 0.18 25)",
              }}
            >
              {generateError.isBalanceError
                ? "Insufficient Parats"
                : "Generation Error"}
            </p>
            <p
              className="text-sm font-medium leading-relaxed"
              style={{ color: "oklch(22% 0.02 290)" }}
            >
              {generateError.message}
            </p>
            <div className="mt-3 flex items-center gap-3">
              {generateError.isBalanceError ? (
                <Link
                  href="/wallet"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "oklch(40% 0.22 290)" }}
                >
                  Top up Parats →
                </Link>
              ) : (
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "oklch(40% 0.22 290)" }}
                >
                  Try again
                </button>
              )}
              <button
                onClick={() => setGenerateError(null)}
                className="text-xs font-semibold px-2 py-1 rounded-lg text-gray-500 hover:text-gray-800 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 space-y-6 flex-1 pb-36">
        {/* Step 1: State */}
        <div>
          <SectionLabel step="1" label="Scheme of Work" />
          <div className="relative">
            <select
              value={resolvedState}
              onChange={(e) => {
                setState(e.target.value);
                setSubject("");
                setSelectedWeek(null);
                setSelectedAids([]);
                setGenerateError(null);
              }}
              className={selectClass}
              style={selectStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            >
              <option value="">Select state...</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown />
            </div>
          </div>
          {profileState && !state && (
            <p
              className="text-xs mt-1.5 font-medium"
              style={{ color: "oklch(40% 0.22 290)" }}
            >
              Using {profileState} from your profile
            </p>
          )}
        </div>

        {/* Step 2: Class & Subject */}
        <div>
          <SectionLabel step="2" label="Class &amp; subject" />
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select
                value={classLevel}
                onChange={(e) => {
                  setClassLevel(e.target.value);
                  setSubject("");
                  setSelectedWeek(null);
                  setSelectedAids([]);
                  setGenerateError(null);
                }}
                className={selectClass}
                style={selectStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              >
                <option value="">Class...</option>
                {CLASSES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown />
              </div>
            </div>
            <div className="relative">
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setSelectedWeek(null);
                  setSelectedAids([]);
                  setGenerateError(null);
                }}
                disabled={
                  !classLevel ||
                  !resolvedState ||
                  loadingSubjects ||
                  subjects.length === 0
                }
                className={`${selectClass} disabled:opacity-50`}
                style={selectStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              >
                <option value="">
                  {loadingSubjects
                    ? "Loading..."
                    : !resolvedState
                      ? "State first"
                      : !classLevel
                        ? "Class first"
                        : subjects.length === 0
                          ? "None found"
                          : "Subject..."}
                </option>
                {subjects.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown />
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Term */}
        <div>
          <SectionLabel step="3" label="Term" />
          <div
            className="grid grid-cols-3 gap-1.5 p-1 rounded-xl"
            style={{ background: "var(--color-border)" }}
          >
            {[1, 2, 3].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTerm(t);
                  setSelectedWeek(null);
                  setSelectedAids([]);
                  setGenerateError(null);
                }}
                className="py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-[0.98]"
                style={
                  term === t
                    ? {
                        background: "white",
                        color: "oklch(40% 0.22 290)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      }
                    : { color: "var(--color-text-muted)" }
                }
              >
                Term {t}
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Week & Topic */}
        <div>
          <SectionLabel step="4" label="Week &amp; topic" />
          {!subject || !classLevel ? (
            <div
              className="rounded-xl px-4 py-4 text-sm text-center"
              style={{
                background: "white",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              Select class and subject to see topics
            </div>
          ) : loadingWeeks ? (
            <div
              className="rounded-xl px-4 py-4 text-sm text-center"
              style={{
                background: "white",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              Loading curriculum...
            </div>
          ) : weeks.length === 0 ? (
            <div
              className="rounded-xl px-4 py-4 text-sm text-center"
              style={{
                background: "white",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              No topics available for this selection yet. Try another term or
              subject.
            </div>
          ) : (
            <div className="space-y-1.5">
              {weeks.every((w) => w.source === "general") && (
                <div
                  className="rounded-xl px-4 py-3 text-xs leading-relaxed mb-1"
                  style={{
                    background: "var(--color-primary-dim)",
                    color: "oklch(35% 0.15 290)",
                  }}
                >
                  <span className="font-semibold">{resolvedState}</span>{" "}
                  doesn&apos;t have a state-specific scheme for this subject
                  yet, so these topics follow the national (NERDC) curriculum.
                  Your note will still match your class, term, and week.
                </div>
              )}
              {weeks.map((w) => {
                const isSelected = selectedWeekId === w.id;
                const isNational = w.source === "general";
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setSelectedWeek({
                        id: w.id,
                        source: w.source,
                        weekNumber: w.week,
                        topic: w.topic,
                      });
                      setSelectedAids([]);
                      setGenerateError(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all active:scale-[0.98]"
                    style={
                      isSelected
                        ? {
                            background: "oklch(40% 0.22 290)",
                            border: "1.5px solid oklch(40% 0.22 290)",
                          }
                        : {
                            background: "white",
                            border: "1px solid var(--color-border)",
                          }
                    }
                  >
                    <span
                      className="text-xs font-mono font-bold w-6 shrink-0 tabular-nums"
                      style={{
                        color: isSelected
                          ? "rgba(255,255,255,0.5)"
                          : "var(--color-text-muted)",
                      }}
                    >
                      {String(w.week).padStart(2, "0")}
                    </span>
                    <span
                      className="text-sm font-medium flex-1 leading-snug"
                      style={{ color: isSelected ? "white" : "#374151" }}
                    >
                      {w.topic}
                    </span>
                    {isNational && !isSelected && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                        style={{
                          background: "var(--color-primary-dim)",
                          color: "oklch(40% 0.22 290)",
                        }}
                      >
                        National
                      </span>
                    )}
                    {isNational && isSelected && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          color: "white",
                        }}
                      >
                        National
                      </span>
                    )}
                    {isSelected && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Live Scheme Preview Card (When Week is Selected) ── */}
        {selectedWeek && (
          <div className="rounded-2xl p-4.5 border transition-all duration-200 bg-linear-to-b from-purple-50/40 via-white to-white border-purple-200/70 shadow-xs">
            {/* Header / Provenance badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                {selectedWeek.source === "release"
                  ? "2025 NERDC Scheme Verified"
                  : selectedWeek.source === "state"
                  ? `${resolvedState} State Approved`
                  : "National Scheme Baseline"}
              </span>
              <span className="text-[11px] font-mono font-medium text-gray-500">
                Wk {selectedWeek.weekNumber} • Term {term}
              </span>
            </div>

            {/* Topic title */}
            <h3 className="text-base font-bold text-gray-900 leading-snug">
              {weekDetail?.topic ?? selectedWeek.topic}
            </h3>

            {/* Sub-topics pills */}
            {weekDetail?.subTopics && weekDetail.subTopics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {weekDetail.subTopics.map((st, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-purple-50/70 border border-purple-100 text-purple-900"
                  >
                    {st}
                  </span>
                ))}
              </div>
            )}

            {/* Performance Objectives checklist */}
            {weekDetail?.objectives && weekDetail.objectives.length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-purple-100/70">
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-900/70 mb-2">
                  Expected Learning Outcomes
                </p>
                <div className="space-y-1.5">
                  {weekDetail.objectives.map((obj, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed"
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                        ✓
                      </span>
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsible Teaching Activities & Evaluation Guide */}
            {(weekDetail?.teachingActivities ||
              (weekDetail?.competencies && weekDetail.competencies.length > 0) ||
              weekDetail?.evaluation) && (
              <div className="mt-3 pt-2.5 border-t border-purple-100/60">
                <button
                  type="button"
                  onClick={() => setShowSchemeDetails((prev) => !prev)}
                  className="text-xs font-semibold text-purple-900 hover:text-purple-950 flex items-center gap-1.5 transition-colors active:scale-[0.98]"
                >
                  <span>
                    {showSchemeDetails
                      ? "Hide Official Activities & Evaluation"
                      : "View Official Activities & Evaluation Guide"}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className={`transition-transform duration-200 ${
                      showSchemeDetails ? "rotate-180" : ""
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {showSchemeDetails && (
                  <div className="mt-2.5 space-y-2.5 text-xs text-gray-700 bg-white/90 p-3 rounded-xl border border-purple-100">
                    {weekDetail.teachingActivities && (
                      <div>
                        <span className="font-semibold text-gray-900 block mb-0.5">
                          Teaching Activities:
                        </span>
                        <p className="text-gray-600 leading-relaxed">
                          {weekDetail.teachingActivities}
                        </p>
                      </div>
                    )}
                    {weekDetail.competencies &&
                      weekDetail.competencies.length > 0 && (
                        <div>
                          <span className="font-semibold text-gray-900 block mb-0.5">
                            National Core Competencies:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {weekDetail.competencies.map((comp, ci) => (
                              <span
                                key={ci}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                              >
                                {comp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    {weekDetail.evaluation && (
                      <div>
                        <span className="font-semibold text-gray-900 block mb-0.5">
                          Evaluation Guide:
                        </span>
                        <p className="text-gray-600 leading-relaxed">
                          {weekDetail.evaluation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Classroom Learning Aids */}
        {selectedWeek && (
          <div>
            <SectionLabel step="5" label="Classroom Learning Aids" />
            <p className="text-xs text-gray-500 mb-2.5">
              Select or add instructional materials available in your classroom.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {suggestedAids.map((aid) => {
                const isSelected = selectedAids.includes(aid);
                return (
                  <button
                    key={aid}
                    type="button"
                    onClick={() => toggleAid(aid)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all active:scale-[0.97]"
                    style={
                      isSelected
                        ? {
                            background: "oklch(40% 0.22 290)",
                            color: "white",
                            borderColor: "oklch(40% 0.22 290)",
                          }
                        : {
                            background: "white",
                            color: "#374151",
                            borderColor: "var(--color-border)",
                          }
                    }
                  >
                    {isSelected ? (
                      <IconCheck className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <IconPlus className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    )}
                    <span>{aid}</span>
                  </button>
                );
              })}
            </div>

            {/* Add Custom Aid Chip */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add other teaching aid (e.g., globe, beaker, counters)..."
                value={customAidInput}
                onChange={(e) => setCustomAidInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomAid();
                  }
                }}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-purple-600"
              />
              <button
                type="button"
                onClick={handleAddCustomAid}
                disabled={!customAidInput.trim()}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-700 disabled:opacity-40 transition-all active:scale-[0.97]"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Duration & Pacing Visualizer */}
        <div>
          <SectionLabel step="6" label="Duration &amp; Pacing" />
          <div className="flex gap-2 flex-wrap mb-3.5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
                style={
                  duration === d
                    ? { background: "oklch(40% 0.22 290)", color: "white" }
                    : {
                        background: "white",
                        border: "1px solid var(--color-border)",
                        color: "#374151",
                      }
                }
              >
                {d} min
              </button>
            ))}
          </div>

          {/* Pacing Timeline Visualizer */}
          <div className="p-3 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-2">
              <span>Pacing Breakdown ({duration} minutes)</span>
              <span className="font-mono text-purple-700">100% Paced</span>
            </div>

            {/* Segmented Timeline Bar */}
            <div className="h-2 rounded-full overflow-hidden flex bg-gray-100 mb-3">
              <div
                style={{ width: `${(pacing.step1 / duration) * 100}%` }}
                className="bg-indigo-500 h-full"
                title={`Step 1: ${pacing.step1} mins`}
              />
              <div
                style={{ width: `${(pacing.step2 / duration) * 100}%` }}
                className="bg-purple-600 h-full"
                title={`Step 2: ${pacing.step2} mins`}
              />
              <div
                style={{ width: `${(pacing.step3 / duration) * 100}%` }}
                className="bg-emerald-500 h-full"
                title={`Step 3: ${pacing.step3} mins`}
              />
            </div>

            {/* Mini Step Breakdown Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-indigo-50/60 border border-indigo-100/70">
                <span className="block text-[10px] font-bold text-indigo-700 uppercase">
                  Step 1 • {pacing.step1}m
                </span>
                <span className="text-[11px] text-gray-600">
                  Intro &amp; Review
                </span>
              </div>
              <div className="p-2 rounded-xl bg-purple-50/60 border border-purple-100/70">
                <span className="block text-[10px] font-bold text-purple-700 uppercase">
                  Step 2 • {pacing.step2}m
                </span>
                <span className="text-[11px] text-gray-600">
                  Core Demonstration
                </span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100/70">
                <span className="block text-[10px] font-bold text-emerald-700 uppercase">
                  Step 3 • {pacing.step3}m
                </span>
                <span className="text-[11px] text-gray-600">
                  Practice &amp; Eval
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 7: Pedagogical Focus & Teacher Tone */}
        <div>
          <SectionLabel step="7" label="Pedagogical Focus &amp; Tone" />
          <div className="grid grid-cols-2 gap-2.5">
            {PEDAGOGICAL_OPTIONS.map((opt) => {
              const isSelected = pedagogicalEmphasis === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPedagogicalEmphasis(opt.id)}
                  className="p-3 rounded-2xl text-left border transition-all active:scale-[0.97]"
                  style={
                    isSelected
                      ? {
                          background: "oklch(40% 0.22 290)",
                          borderColor: "oklch(40% 0.22 290)",
                          color: "white",
                        }
                      : {
                          background: "white",
                          borderColor: "var(--color-border)",
                          color: "#1f2937",
                        }
                  }
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{opt.title}</span>
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={
                        isSelected
                          ? {
                              background: "rgba(255,255,255,0.2)",
                              color: "white",
                            }
                          : {
                              background: "var(--color-primary-dim)",
                              color: "oklch(40% 0.22 290)",
                            }
                      }
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <p
                    className="text-[11px] leading-snug"
                    style={{
                      color: isSelected ? "rgba(255,255,255,0.85)" : "#6b7280",
                    }}
                  >
                    {opt.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Sticky CTA — mobile ── */}
      <div
        className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-107.5 px-5 py-4 lg:hidden"
        style={{
          background: "oklch(98.5% 0.002 290)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <GenerateCTA
          canGenerate={canGenerate}
          selectedWeekId={selectedWeekId}
          balance={balance}
          planCost={planCost}
          onGenerate={handleGenerate}
        />
      </div>

      {/* ── Desktop CTA ── */}
      <div className="hidden lg:block px-5 pb-8">
        <GenerateCTA
          canGenerate={canGenerate}
          selectedWeekId={selectedWeekId}
          balance={balance}
          planCost={planCost}
          onGenerate={handleGenerate}
        />
      </div>
    </div>
  );
}

function GenerateCTA({
  canGenerate,
  selectedWeekId,
  balance: _balance,
  planCost,
  onGenerate,
}: {
  canGenerate: boolean;
  selectedWeekId: string | null;
  balance: string;
  planCost: number;
  onGenerate: () => void;
}) {
  return (
    <>
      <button
        onClick={onGenerate}
        disabled={!selectedWeekId || !canGenerate}
        className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]"
        style={{ background: "oklch(40% 0.22 290)" }}
      >
        <IconBolt className="w-4.5 h-4.5" />
        Generate lesson plan
        <span
          className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ background: "rgba(255,255,255,0.18)" }}
        >
          ₽{planCost}
        </span>
      </button>
      {!canGenerate && (
        <p className="text-xs text-center mt-2 text-red-500">
          Insufficient balance.{" "}
          <Link
            href="/wallet"
            className="font-semibold"
            style={{ color: "oklch(40% 0.22 290)" }}
          >
            Top up →
          </Link>
        </p>
      )}
      {canGenerate && selectedWeekId && (
        <p
          className="text-xs text-center mt-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          Plan ₽8 + Note ₽12 = ₽20 total
        </p>
      )}
    </>
  );
}
