"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconEdit, IconLogout, IconUpload, IconShield } from "@/components/icons";
import { ReleaseBadge } from "@/components/release";
import { PLATFORM_RELEASE_MANIFEST } from "@/lib/config/release.manifest";
import { useAppSelector } from "@/lib/hooks";
import { selectCurrentUser } from "@/lib/slices/authSlice";
import {
  useGetMeQuery,
  useLogoutMutation,
  useChangePasswordMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useLogoutOthersMutation,
} from "@/lib/services/authApi";
import {
  useUpdateProfileMutation,
  useUpdateSettingsMutation,
  useDeleteAccountMutation,
} from "@/lib/services/usersApi";
import {
  useGetNotificationsQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
} from "@/lib/services/notificationsApi";
import { clearCredentials, setCredentials, selectRefreshToken } from "@/lib/slices/authSlice";
import { useAppDispatch } from "@/lib/hooks";
import { NIGERIAN_SUBJECTS, NIGERIAN_STATES, CLASS_LEVELS_UI } from "@/lib/constants";

const STATES   = NIGERIAN_STATES;
const SUBJECTS = NIGERIAN_SUBJECTS;
const CLASSES  = CLASS_LEVELS_UI;

const TABS = [
  { key: "profile",       label: "Profile"       },
  { key: "preferences",   label: "Preferences"   },
  { key: "notifications", label: "Notifications" },
  { key: "security",      label: "Security"      },
];

const inputCls = "w-full px-4 py-3 rounded-xl text-sm text-gray-900 border outline-none bg-white transition-shadow";
const selectCls = "w-full px-4 py-3 rounded-xl text-sm text-gray-900 border outline-none bg-white appearance-none transition-shadow";
const baseStyle = { borderColor: "var(--color-border)" };
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "oklch(40% 0.22 290)";
  e.target.style.boxShadow   = "0 0 0 3px oklch(40% 0.22 290 / 0.1)";
};
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "var(--color-border)";
  e.target.style.boxShadow   = "none";
};

type Notice = { kind: "ok" | "err"; text: string } | null;

function apiError(err: unknown, fallback: string) {
  const e = err as { status?: number | string; data?: { message?: string | string[] } };
  const msg = Array.isArray(e?.data?.message) ? e.data?.message[0] : e?.data?.message;
  if (msg) return msg;
  if (e?.status === "FETCH_ERROR") return "Network error — check your connection and try again.";
  return fallback;
}

function NoticeBar({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <p
      role={notice.kind === "err" ? "alert" : "status"}
      className="text-xs font-medium px-3 py-2 rounded-lg"
      style={
        notice.kind === "ok"
          ? { background: "#ECFDF5", color: "#059669" }
          : { background: "#FEF2F2", color: "#DC2626" }
      }
    >
      {notice.text}
    </p>
  );
}

function describeDevice(ua?: string | null) {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-label={label}
      role="switch"
      aria-checked={checked}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200"
      style={{ background: checked ? "oklch(40% 0.22 290)" : "var(--color-border)" }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(24px)" : "translateX(4px)" }}
      />
    </button>
  );
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-muted)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
      </div>
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3.5" style={{ border: "1px solid var(--color-border)" }}>
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function SaveButton({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-3.5 rounded-xl font-semibold text-white text-sm disabled:opacity-60"
      style={{ background: "oklch(40% 0.22 290)" }}
    >
      {loading ? "Saving..." : label}
    </button>
  );
}

export default function SettingsPage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { data: meData } = useGetMeQuery();
  const [updateProfile, { isLoading: savingProfile }] = useUpdateProfileMutation();
  const [updateSettings, { isLoading: savingPrefs }]  = useUpdateSettingsMutation();
  const [logoutMutation] = useLogoutMutation();
  const [changePassword, { isLoading: changingPw }] = useChangePasswordMutation();
  const [revokeSession] = useRevokeSessionMutation();
  const [logoutOthers, { isLoading: loggingOutOthers }] = useLogoutOthersMutation();
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();
  const [markAllRead] = useMarkAllReadMutation();
  const [markRead] = useMarkReadMutation();
  const refreshToken = useAppSelector(selectRefreshToken);
  const currentUser = useAppSelector(selectCurrentUser);
  const isAdmin = currentUser?.role === "admin";

  const user     = meData?.data;
  const settings = meData?.data?.settings;

  const [activeTab,          setActiveTab]          = useState("profile");
  const [firstName,          setFirstName]          = useState("");
  const [lastName,           setLastName]           = useState("");
  const [phoneNumber,        setPhoneNumber]        = useState("");
  const [state,              setState]              = useState("Lagos");
  const [stateChanged,       setStateChanged]       = useState(false);
  const [defaultSubject,     setDefaultSubject]     = useState("");
  const [defaultClass,       setDefaultClass]       = useState("");
  const [difficulty,         setDifficulty]         = useState<"basic" | "standard" | "advanced">("standard");
  const [alwaysConfirmState, setAlwaysConfirmState] = useState(true);
  const [emailNotifs,        setEmailNotifs]        = useState(true);
  const [notifyGeneration,   setNotifyGeneration]   = useState(true);
  const [notifyTopup,        setNotifyTopup]        = useState(true);
  const [currentPw,          setCurrentPw]          = useState("");
  const [newPw,              setNewPw]              = useState("");
  const [confirmPw,          setConfirmPw]          = useState("");
  const [showDelete,         setShowDelete]         = useState(false);
  const [deletePw,           setDeletePw]           = useState("");
  const [notice,             setNotice]             = useState<{ tab: string; value: Notice }>({ tab: "", value: null });

  const tabNotice: Notice = notice.tab === activeTab ? notice.value : null;

  const { data: sessionsData } = useGetSessionsQuery(
    { refreshToken: refreshToken ?? undefined },
    { skip: activeTab !== "security" },
  );
  const { data: notifData } = useGetNotificationsQuery(
    { page: 1, limit: 8 },
    { skip: activeTab !== "notifications" },
  );
  const sessions = sessionsData?.data ?? [];
  const notifications = notifData?.data?.notifications ?? [];

  function flash(tab: string, kind: "ok" | "err", text: string) {
    setNotice({ tab, value: { kind, text } });
    if (kind === "ok") setTimeout(() => setNotice((n) => (n.value?.text === text ? { tab: "", value: null } : n)), 4000);
  }

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setPhoneNumber(user.phoneNumber ?? "");
      setState(user.state ?? "Lagos");
    }
    if (settings) {
      setDefaultSubject(settings.defaultSubject ?? "");
      setDefaultClass(settings.defaultClassLevel ?? "");
      setDifficulty(settings.noteDifficultyLevel ?? "standard");
      setAlwaysConfirmState(settings.alwaysConfirmState ?? true);
      setEmailNotifs(settings.emailNotifications ?? true);
      setNotifyGeneration(settings.notifyGenerationComplete ?? true);
      setNotifyTopup(settings.notifyWalletTopup ?? true);
    }
  }, [user, settings]);

  async function handleSaveProfile() {
    if (!firstName.trim() || !lastName.trim()) {
      flash("profile", "err", "First and last name are required.");
      return;
    }
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        state,
      }).unwrap();
      setStateChanged(false);
      flash("profile", "ok", "Profile saved.");
    } catch (err) {
      flash("profile", "err", apiError(err, "Couldn't save your profile."));
    }
  }

  async function handleSavePrefs() {
    try {
      await updateSettings({
        defaultSubject: defaultSubject || null,
        defaultClassLevel: defaultClass || null,
        noteDifficultyLevel: difficulty,
        alwaysConfirmState,
      }).unwrap();
      flash("preferences", "ok", "Preferences saved.");
    } catch (err) {
      flash("preferences", "err", apiError(err, "Couldn't save your preferences."));
    }
  }

  async function handleSaveNotifications() {
    try {
      await updateSettings({
        emailNotifications: emailNotifs,
        notifyGenerationComplete: notifyGeneration,
        notifyWalletTopup: notifyTopup,
      }).unwrap();
      flash("notifications", "ok", "Notification settings saved.");
    } catch (err) {
      flash("notifications", "err", apiError(err, "Couldn't save notification settings."));
    }
  }

  async function handleChangePassword() {
    if (!currentPw) return flash("security", "err", "Enter your current password.");
    if (newPw.length < 8) return flash("security", "err", "New password must be at least 8 characters.");
    if (newPw !== confirmPw) return flash("security", "err", "New passwords don't match.");
    try {
      const res = await changePassword({ currentPassword: currentPw, newPassword: newPw }).unwrap();
      // Every other device was signed out; keep this one on the fresh tokens.
      dispatch(setCredentials(res.data));
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      flash("security", "ok", "Password updated. Other devices have been signed out.");
    } catch (err) {
      flash("security", "err", apiError(err, "Couldn't update your password."));
    }
  }

  async function handleSignOutOthers() {
    if (!refreshToken) return;
    try {
      await logoutOthers({ refreshToken }).unwrap();
      flash("security", "ok", "Signed out of all other devices.");
    } catch (err) {
      flash("security", "err", apiError(err, "Couldn't sign out other devices."));
    }
  }

  async function handleRevoke(sessionId: string) {
    try { await revokeSession(sessionId).unwrap(); }
    catch (err) { flash("security", "err", apiError(err, "Couldn't end that session.")); }
  }

  async function handleDeleteAccount() {
    try {
      await deleteAccount({ password: deletePw || undefined }).unwrap();
      dispatch(clearCredentials());
      router.replace("/auth/login");
    } catch (err) {
      flash("security", "err", apiError(err, "Couldn't delete your account."));
    }
  }

  async function handleLogout() {
    try { await logoutMutation(refreshToken ? { refreshToken } : undefined).unwrap(); }
    catch { /* sign out locally regardless */ }
    finally { dispatch(clearCredentials()); router.replace("/auth/login"); }
  }

  const initials = user ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}` : "?";

  return (
    <div className="flex flex-col min-h-full" style={{ background: "var(--color-surface)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-7 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--color-text-muted)" }}>Account</p>
        <h1 className="font-display font-bold text-gray-900 leading-none" style={{ fontSize: "2rem", letterSpacing: "-0.03em" }}>
          Settings
        </h1>
      </div>

      {/* ── Profile card ── */}
      <div className="mx-5 mb-5 bg-white rounded-2xl p-4 flex items-center gap-3.5" style={{ border: "1px solid var(--color-border)" }}>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold shrink-0 font-display"
          style={{ background: "oklch(40% 0.22 290)", color: "white" }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-gray-900 text-sm leading-snug">
            {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
          </p>
          <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-text-muted)" }}>{user?.email}</p>
          <span
            className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "var(--color-primary-dim)", color: "oklch(40% 0.22 290)" }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            {user?.state}
          </span>
        </div>
        <button
          aria-label="Edit profile"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
          style={{ color: "var(--color-text-muted)" }}
          onClick={() => setActiveTab("profile")}
        >
          <IconEdit className="w-4 h-4" />
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div className="px-5 mb-5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-0.5 w-max" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "1px" }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all relative"
              style={{ color: activeTab === tab.key ? "oklch(40% 0.22 290)" : "var(--color-text-muted)" }}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: "oklch(40% 0.22 290)" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-8 flex-1">

        {/* ── Profile Tab ── */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "First name", value: firstName, set: setFirstName },
                { label: "Last name",  value: lastName,  set: setLastName  },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <input type="text" value={f.value} onChange={e => f.set(e.target.value)}
                    className={inputCls} style={baseStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
              <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                placeholder="+234 800 000 0000"
                className={inputCls} style={baseStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={user?.email ?? ""} disabled
                className="w-full px-4 py-3 rounded-xl text-sm border outline-none cursor-not-allowed"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
              <SelectWrapper>
                <select value={state} onChange={e => { setState(e.target.value); setStateChanged(true); }}
                  className={selectCls} style={baseStyle} onFocus={onFocus} onBlur={onBlur}>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </SelectWrapper>
              {stateChanged && (
                <p className="text-xs mt-1.5 font-medium" style={{ color: "#B45309" }}>
                  Changing your state switches your curriculum to {state}. Existing notes are unaffected.
                </p>
              )}
            </div>

            <NoticeBar notice={tabNotice} />
            <SaveButton onClick={handleSaveProfile} loading={savingProfile} label="Save profile" />
          </div>
        )}

        {/* ── Preferences Tab ── */}
        {activeTab === "preferences" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Default subject</label>
              <SelectWrapper>
                <select value={defaultSubject} onChange={e => setDefaultSubject(e.target.value)}
                  className={selectCls} style={baseStyle} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">None</option>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </SelectWrapper>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Default class level</label>
              <SelectWrapper>
                <select value={defaultClass} onChange={e => setDefaultClass(e.target.value)}
                  className={selectCls} style={baseStyle} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">None</option>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </SelectWrapper>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Note difficulty</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl" style={{ background: "var(--color-border)" }}>
                {(["basic", "standard", "advanced"] as const).map(d => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className="py-2.5 rounded-lg text-xs font-semibold transition-all capitalize"
                    style={difficulty === d
                      ? { background: "oklch(40% 0.22 290)", color: "white" }
                      : { background: "transparent", color: "var(--color-text-muted)" }
                    }
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <SettingRow label="Always confirm state" desc="Show state before each generation">
              <Toggle label="Always confirm state" checked={alwaysConfirmState} onChange={() => setAlwaysConfirmState(v => !v)} />
            </SettingRow>

            <NoticeBar notice={tabNotice} />
            <SaveButton onClick={handleSavePrefs} loading={savingPrefs} label="Save preferences" />
          </div>
        )}

        {/* ── Notifications Tab ── */}
        {activeTab === "notifications" && (
          <div className="space-y-3">
            <SettingRow label="Generation complete" desc="In-app alert when your plan or note is ready">
              <Toggle label="Generation complete" checked={notifyGeneration} onChange={() => setNotifyGeneration(v => !v)} />
            </SettingRow>
            <SettingRow label="Wallet top-up confirmed" desc="In-app alert when Parats are added">
              <Toggle label="Wallet top-up confirmed" checked={notifyTopup} onChange={() => setNotifyTopup(v => !v)} />
            </SettingRow>
            <SettingRow label="Email notifications" desc="Also get these updates by email as email delivery rolls out">
              <Toggle label="Email notifications" checked={emailNotifs} onChange={() => setEmailNotifs(v => !v)} />
            </SettingRow>

            <NoticeBar notice={tabNotice} />
            <SaveButton onClick={handleSaveNotifications} loading={savingPrefs} label="Save notification settings" />

            <div className="pt-3">
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-sm font-semibold text-gray-900">Recent notifications</h2>
                {notifications.some(n => !n.isRead) && (
                  <button onClick={() => markAllRead()} className="text-xs font-semibold" style={{ color: "oklch(40% 0.22 290)" }}>
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-center py-5 bg-white rounded-xl" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                  You&apos;re all caught up.
                </p>
              ) : (
                <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
                  {notifications.map((n, i) => (
                    <button
                      key={n.notificationId}
                      onClick={() => !n.isRead && markRead(n.notificationId)}
                      className="w-full text-left px-4 py-3 flex gap-3 items-start"
                      style={{ borderBottom: i < notifications.length - 1 ? "1px solid var(--color-border)" : undefined }}
                    >
                      <span
                        className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                        style={{ background: n.isRead ? "transparent" : "oklch(40% 0.22 290)" }}
                        aria-label={n.isRead ? undefined : "Unread"}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-gray-900">{n.title}</span>
                        <span className="block text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{n.body}</span>
                        <span className="block text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                          {new Date(n.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Security Tab ── */}
        {activeTab === "security" && (
          <div className="space-y-4">
            {[
              { label: "Current password",     value: currentPw, set: setCurrentPw, auto: "current-password" },
              { label: "New password",         value: newPw,     set: setNewPw,     auto: "new-password" },
              { label: "Confirm new password", value: confirmPw, set: setConfirmPw, auto: "new-password" },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                <input type="password" value={f.value} onChange={e => f.set(e.target.value)}
                  autoComplete={f.auto} placeholder="••••••••"
                  className={inputCls} style={baseStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            ))}
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>At least 8 characters. Changing your password signs out your other devices.</p>

            <NoticeBar notice={tabNotice} />
            <SaveButton onClick={handleChangePassword} loading={changingPw} label="Update password" />

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-sm font-semibold text-gray-900">Where you&apos;re signed in</h2>
                {sessions.length > 1 && (
                  <button onClick={handleSignOutOthers} disabled={loggingOutOthers || !refreshToken}
                    className="text-xs font-semibold disabled:opacity-50" style={{ color: "oklch(40% 0.22 290)" }}>
                    Sign out other devices
                  </button>
                )}
              </div>
              <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
                {sessions.length === 0 ? (
                  <p className="text-xs text-center py-5" style={{ color: "var(--color-text-muted)" }}>No active sessions found.</p>
                ) : sessions.map((sess, i) => (
                  <div key={sess.sessionId} className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < sessions.length - 1 ? "1px solid var(--color-border)" : undefined }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {describeDevice(sess.userAgent)}
                        {sess.isCurrent && (
                          <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: "var(--color-primary-dim)", color: "oklch(40% 0.22 290)" }}>This device</span>
                        )}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        Active {new Date(sess.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        {sess.ipAddress ? ` · ${sess.ipAddress}` : ""}
                      </p>
                    </div>
                    {!sess.isCurrent && (
                      <button onClick={() => handleRevoke(sess.sessionId)} className="text-xs font-semibold text-red-500 shrink-0">
                        Sign out
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl p-4" style={{ border: "1px solid #FEE2E2" }}>
              <p className="text-sm font-semibold text-red-600 mb-0.5">Danger zone</p>
              <p className="text-xs mb-3" style={{ color: "#F87171" }}>
                Deletes your account, notes, resources and wallet balance. This is permanent and cannot be undone.
              </p>
              {showDelete ? (
                <div className="space-y-2.5">
                  <input type="password" value={deletePw} onChange={e => setDeletePw(e.target.value)}
                    autoComplete="current-password" placeholder="Enter your password to confirm"
                    className={inputCls} style={baseStyle} onFocus={onFocus} onBlur={onBlur} />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setShowDelete(false); setDeletePw(""); }}
                      className="py-3 rounded-xl font-semibold text-sm" style={{ background: "white", border: "1px solid var(--color-border)", color: "#374151" }}>
                      Cancel
                    </button>
                    <button onClick={handleDeleteAccount} disabled={deleting || !deletePw}
                      className="py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50" style={{ background: "#DC2626" }}>
                      {deleting ? "Deleting..." : "Delete forever"}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowDelete(true)}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-colors"
                  style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}>
                  Delete account
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Admin panel link (mobile, admin only) ── */}
      {isAdmin && (
        <div className="px-5 pb-2 lg:hidden">
          <Link
            href="/admin"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: "oklch(40% 0.22 290)" }}
          >
            <IconShield className="w-4 h-4" />
            Admin panel
          </Link>
        </div>
      )}

      {/* ── Resources (mobile only) ── */}
      <div className="px-5 pb-2 lg:hidden">
        <Link
          href="/resources"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors"
          style={{ background: "var(--color-primary-dim)", color: "oklch(40% 0.22 290)" }}
        >
          <IconUpload className="w-4 h-4" />
          My resources
        </Link>
      </div>

      {/* ── System Version & Release Info ── */}
      <div className="px-5 pb-4">
        <div
          className="rounded-2xl p-4 bg-white flex flex-col gap-3 shadow-xs"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-[#641BC4] uppercase tracking-wider">
                System Platform
              </p>
              <h4 className="text-sm font-bold text-gray-900 mt-0.5">
                SabiNote {PLATFORM_RELEASE_MANIFEST.current.versionTag}
              </h4>
            </div>
            <ReleaseBadge variant="light" />
          </div>
          <div className="text-xs text-gray-500 space-y-1.5 pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span>Curriculum Baseline:</span>
              <span className="font-semibold text-gray-800">
                {PLATFORM_RELEASE_MANIFEST.current.curriculumBaseline.tag} ({PLATFORM_RELEASE_MANIFEST.current.curriculumBaseline.totalUnits.toLocaleString()} units)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Codename:</span>
              <span className="font-medium text-gray-700 truncate max-w-[220px]">
                {PLATFORM_RELEASE_MANIFEST.current.codename}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Log out ── */}
      <div className="px-5 pb-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-gray-100"
          style={{ color: "var(--color-text-muted)" }}
        >
          <IconLogout className="w-4 h-4" />
          Log out
        </button>
      </div>
    </div>
  );
}
