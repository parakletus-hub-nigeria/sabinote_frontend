"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconBack, IconBolt } from "@/components/icons";
import {
  useGetCurriculumSubjectsQuery,
  useGetCurriculumWeeksQuery,
} from "@/lib/services/curriculumApi";
import { useGenerateLessonPlanMutation } from "@/lib/services/generateApi";
import { useGetMeQuery } from "@/lib/services/authApi";
import { useGetWalletQuery } from "@/lib/services/walletApi";
import { useGetResourcesQuery } from "@/lib/services/resourcesApi";
import { CLASS_LEVELS_UI, NIGERIAN_STATES } from "@/lib/constants";

const CLASSES = CLASS_LEVELS_UI;
// General curriculum is seeded with "SS1/SS2/SS3" (2 S's); state curriculum
// may use "SSS1/SSS2/SSS3". Normalise to 2-S form so both sources match.
const toApiClass = (c: string) => c.replace(" ", "").replace(/^SSS/, "SS");
const DURATIONS = [30, 40, 45, 60, 80];

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
  const [subjectChoice, setSubject] = useState("");
  const [classChoice, setClassLevel] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [changingState, setChangingState] = useState(false);
  const [error, setError] = useState("");
  const [term, setTerm] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState<{
    id: string;
    source: "state" | "general";
  } | null>(null);
  const selectedWeekId = selectedWeek?.id ?? null;
  const [duration, setDuration] = useState(40);
  const [statusIdx, setStatusIdx] = useState(0);

  // Saved preferences (Settings → Preferences) pre-fill the form until the user picks something else
  const prefs = meData?.data?.settings;
  const profileState = meData?.data?.state ?? "";
  const resolvedState = state || profileState;
  const alwaysConfirmState = prefs?.alwaysConfirmState ?? true;
  const showStatePicker = alwaysConfirmState || !profileState || changingState;
  const defaultClass = CLASSES.includes(prefs?.defaultClassLevel ?? "")
    ? (prefs?.defaultClassLevel as string)
    : "";
  const classLevel = classChoice || defaultClass;

  const { data: subjectsData, isFetching: loadingSubjects } =
    useGetCurriculumSubjectsQuery(
      { state: resolvedState, classLevel: toApiClass(classLevel) },
      { skip: !resolvedState || !classLevel },
    );

  const subjects = subjectsData?.data?.subjects ?? [];
  const defaultSubject =
    prefs?.defaultSubject && subjects.includes(prefs.defaultSubject)
      ? prefs.defaultSubject
      : "";
  const subject = subjectChoice || defaultSubject;

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

  const [generateLessonPlan, { isLoading: generating }] =
    useGenerateLessonPlanMutation();
  const { data: resourcesData } = useGetResourcesQuery();
  const resources = resourcesData?.data ?? [];

  const weeks = weeksData?.data?.weeks ?? [];
  const balance = walletData?.data?.balance ?? "0";
  const planCost = 8;
  const canGenerate = Number(balance) >= planCost;

  const statusMessages = [
    `Connecting to ${resolvedState || "state"} curriculum database...`,
    "Fetching scheme of work...",
    "Structuring your lesson plan...",
  ];

  async function handleGenerate() {
    if (!selectedWeek) return;
    setError("");
    let interval: ReturnType<typeof setInterval> | undefined;
    try {
      let idx = 0;
      interval = setInterval(() => {
        idx = (idx + 1) % statusMessages.length;
        setStatusIdx(idx);
      }, 1400);
      const payload = {
        durationMinutes: duration,
        ...(resourceId ? { resourceId } : {}),
        ...(selectedWeek.source === "state"
          ? { curriculumWeekId: selectedWeek.id }
          : { generalCurriculumId: selectedWeek.id }),
      };
      const res = await generateLessonPlan(payload).unwrap();
      router.push(`/notes/${res.data.noteId}`);
    } catch (err) {
      const data = (err as { data?: { message?: string | string[] } })?.data;
      const msg = Array.isArray(data?.message) ? data?.message[0] : data?.message;
      setError(msg || "Couldn't generate the lesson plan. Please try again.");
    } finally {
      clearInterval(interval);
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

      <div className="px-5 space-y-6 flex-1 pb-36">
        {/* Step 1: State */}
        <div>
          <SectionLabel step="1" label="Scheme of Work" />
          {showStatePicker ? (
            <div className="relative">
              <select
                value={resolvedState}
                onChange={(e) => {
                  setState(e.target.value);
                  setSubject("");
                  setSelectedWeek(null);
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
          ) : (
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl text-sm"
              style={{ background: "white", border: "1px solid var(--color-border)" }}
            >
              <span className="font-medium text-gray-900">{resolvedState}</span>
              <button
                onClick={() => setChangingState(true)}
                className="text-xs font-semibold"
                style={{ color: "oklch(40% 0.22 290)" }}
              >
                Change
              </button>
            </div>
          )}
          {showStatePicker && profileState && !state && (
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
                }}
                className="py-2.5 rounded-lg text-sm font-semibold transition-all"
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
                    onClick={() =>
                      setSelectedWeek({ id: w.id, source: w.source })
                    }
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all"
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

        {/* Step 5: Duration */}
        <div>
          <SectionLabel step="5" label="Duration" />
          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
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
        </div>

        {/* Step 6: Reference material (optional) */}
        <div>
          <SectionLabel step="6" label="Reference material (optional)" />
          <div className="relative">
            <select
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              className={selectClass}
              style={selectStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            >
              <option value="">None</option>
              {resources.map((r) => (
                <option key={r.resourceId} value={r.resourceId}>
                  {r.resourceName}
                  {r.subject ? ` · ${r.subject}` : ""}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown />
            </div>
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
            {resources.length === 0 ? (
              <>
                No resources yet.{" "}
                <Link href="/resources" className="font-semibold" style={{ color: "oklch(40% 0.22 290)" }}>
                  Upload one →
                </Link>
              </>
            ) : (
              "Attach a textbook or material to this lesson."
            )}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium rounded-xl px-4 py-3" style={{ background: "#FEF2F2", color: "#DC2626" }}>
            {error}
          </p>
        )}
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
        className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40"
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
