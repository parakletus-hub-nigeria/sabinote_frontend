"use client";

import { useEffect, useState } from "react";
import { IconCheck } from "@/components/icons";
import { useAppSelector } from "@/lib/hooks";
import { selectWallet, selectCurrentUser } from "@/lib/slices/authSlice";
import {
  useGetPackagesQuery,
  useGetWalletQuery,
  useGetTransactionsQuery,
  useInitiateTopupMutation,
  useVerifyTopupMutation,
  type WalletPackage,
} from "@/lib/services/walletApi";

type PayState = "idle" | "opening" | "verifying" | "success" | "failed";

function errorMessage(err: unknown, fallback: string) {
  const data = (err as { data?: { message?: string | string[] } })?.data;
  const msg = Array.isArray(data?.message) ? data?.message[0] : data?.message;
  return msg || fallback;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DEFAULT_PACKAGES: WalletPackage[] = [
  { id: "pkg_50", parats: 50, priceNGN: 250 },
  { id: "pkg_100", parats: 100, priceNGN: 500 },
  { id: "pkg_500", parats: 500, priceNGN: 2000 },
];

const PACKAGE_META: Record<
  string,
  { label: string; note: string; popular?: boolean; save?: string }
> = {
  pkg_50: { label: "Starter", note: "2 complete lessons" },
  pkg_100: { label: "Popular", note: "5 complete lessons", popular: true },
  pkg_500: {
    label: "School",
    note: "25 lessons · best value",
    save: "Save 20%",
  },
};

export default function WalletPage() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [payState, setPayState] = useState<PayState>("idle");
  const [payError, setPayError] = useState("");
  const authWallet = useAppSelector(selectWallet);
  const authUser = useAppSelector(selectCurrentUser);

  const {
    data: pkgData,
    isLoading: packagesLoading,
    isError: packagesError,
    refetch: refetchPackages,
  } = useGetPackagesQuery();
  const {
    data: walletData,
    isLoading: walletLoading,
    isError: walletError,
    refetch: refetchWallet,
  } = useGetWalletQuery();
  const {
    data: txData,
    isLoading: txLoading,
    isError: txError,
    refetch: refetchTx,
  } = useGetTransactionsQuery({ limit: 20 });
  const [initiateTopup] = useInitiateTopupMutation();
  const [verifyTopup] = useVerifyTopupMutation();

  const packages =
    pkgData?.data?.packages && pkgData.data.packages.length > 0
      ? pkgData.data.packages
      : DEFAULT_PACKAGES;
  const balance = walletData?.data?.balance ?? authWallet?.balance ?? "0";
  const transactions = txData?.data?.transactions ?? [];
  const estimatedLessons = Math.floor(Number(balance) / 20);

  // "success"/"failed" are transient banners — clear back to idle after a beat
  useEffect(() => {
    if (payState !== "success" && payState !== "failed") return;
    const t = setTimeout(() => setPayState("idle"), 6000);
    return () => clearTimeout(t);
  }, [payState]);

  // Paystack's webhook may beat or trail the verify call, so give a just-completed
  // payment a few chances to be confirmed before telling the user to wait.
  async function verifyWithRetry(reference: string) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await verifyTopup({ reference }).unwrap();
        return true;
      } catch {
        if (attempt < 3) await sleep(1500);
      }
    }
    return false;
  }

  async function handlePurchase() {
    if (selectedIdx === null) return;
    const pkg = packages[selectedIdx];
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      setPayError("Payments aren't configured yet. Please contact support.");
      setPayState("failed");
      return;
    }

    setPayError("");
    setPayState("opening");
    try {
      const res = await initiateTopup({ packageId: pkg.id }).unwrap();
      const { email, reference } = res.data;

      const PaystackPop = (await import("@paystack/inline-js")).default;
      const popup = new PaystackPop();
      popup.newTransaction({
        key: publicKey,
        email,
        amount: pkg.priceNGN * 100, // kobo
        reference,
        currency: "NGN",
        onCancel: () => setPayState("idle"),
        onError: (err) => {
          setPayError(err?.message || "Couldn't open the payment window.");
          setPayState("failed");
        },
        onSuccess: async (transaction) => {
          setPayState("verifying");
          const ok = await verifyWithRetry(transaction.reference);
          if (ok) {
            setPayState("success");
            setSelectedIdx(null);
          } else {
            setPayError(
              "Payment received, but we couldn't confirm it yet. Your Parats will appear shortly — refresh in a minute.",
            );
            setPayState("failed");
          }
          refetchWallet();
          refetchTx();
        },
      });
    } catch (err) {
      setPayError(errorMessage(err, "Couldn't start the payment. Try again."));
      setPayState("failed");
    }
  }

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ background: "var(--color-surface)" }}
    >
      {/* ── Header ── */}
      <div className="px-5 pt-7 pb-4">
        <p
          className="text-xs font-semibold uppercase tracking-[0.12em] mb-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          Wallet
        </p>
        <h1
          className="font-display font-bold text-gray-900 leading-none"
          style={{ fontSize: "2rem", letterSpacing: "-0.03em" }}
        >
          Your balance
        </h1>
      </div>

      {/* ── Balance display — no gradient card ── */}
      <div className="px-5 mb-6">
        <div
          className="rounded-2xl px-5 py-5"
          style={{
            background: "white",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-end justify-between">
            <div>
              <p
                className="text-xs font-medium mb-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                Available
              </p>
              {walletLoading && !walletData && !authWallet?.balance ? (
                <div
                  className="rounded-lg animate-pulse"
                  style={{
                    width: "8rem",
                    height: "3.25rem",
                    background: "var(--color-border)",
                  }}
                />
              ) : walletError && !walletData && !authWallet?.balance ? (
                <p
                  className="text-sm font-medium"
                  style={{ color: "#DC2626" }}
                >
                  Couldn&apos;t load balance
                </p>
              ) : (
                <p
                  className="font-display font-bold leading-none"
                  style={{
                    fontSize: "3.25rem",
                    letterSpacing: "-0.04em",
                    color: "oklch(40% 0.22 290)",
                  }}
                >
                  ₽{balance}
                </p>
              )}
            </div>
            <div className="text-right pb-1">
              {walletError ? (
                <button
                  onClick={() => refetchWallet()}
                  className="text-xs font-semibold px-2 py-1 rounded transition"
                  style={{ color: "oklch(40% 0.22 290)", background: "var(--color-primary-dim)" }}
                >
                  Retry
                </button>
              ) : (
                <p
                  className="text-xs font-medium"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {estimatedLessons > 0 ? (
                    <>
                      {estimatedLessons} lesson{estimatedLessons !== 1 ? "s" : ""}
                      <br />
                      remaining
                    </>
                  ) : (
                    "Top up to start"
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Usage bar */}
          {!walletLoading && !walletError && Number(balance) > 0 && (
            <div className="mt-4">
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: "var(--color-border)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    background: "oklch(40% 0.22 290)",
                    width: `${Math.min(100, (Number(balance) / 500) * 100)}%`,
                    transition: "width 0.6s var(--ease-out)",
                  }}
                />
              </div>
              <p
                className="text-xs mt-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                ₽20 per complete lesson (plan + note)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Top up ── */}
      <div className="px-5 mb-5">
        <h2
          className="font-display font-semibold text-gray-900 mb-3"
          style={{ fontSize: "1.1rem", letterSpacing: "-0.02em" }}
        >
          Top up
        </h2>

        <div className="space-y-2.5" role="radiogroup" aria-label="Top-up package">
          {packages.map((pkg, i) => {
            const meta = PACKAGE_META[pkg.id] ?? {
              label: pkg.id,
              note: `${pkg.parats} Parats`,
            };
            const selected = selectedIdx === i;
            return (
              <button
                key={pkg.id}
                role="radio"
                aria-checked={selected}
                onClick={() => setSelectedIdx(selected ? null : i)}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left relative"
                style={
                  selected
                    ? {
                        background: "white",
                        border: "1.5px solid oklch(40% 0.22 290)",
                        boxShadow: "0 2px 12px oklch(40% 0.22 290 / 0.12)",
                      }
                    : {
                        background: "white",
                        border: "1px solid var(--color-border)",
                      }
                }
              >
                {meta.popular && (
                  <span
                    className="absolute -top-2.5 left-4 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "oklch(40% 0.22 290)" }}
                  >
                    MOST POPULAR
                  </span>
                )}

                {/* Parat count */}
                <div
                  className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                  style={
                    selected
                      ? { background: "oklch(40% 0.22 290)" }
                      : { background: "var(--color-primary-dim)" }
                  }
                >
                  <span
                    className="font-mono font-bold text-base leading-none"
                    style={{
                      color: selected ? "white" : "oklch(40% 0.22 290)",
                    }}
                  >
                    {pkg.parats}
                  </span>
                  <span
                    className="text-[10px] font-medium mt-0.5"
                    style={{
                      color: selected
                        ? "rgba(255,255,255,0.65)"
                        : "oklch(40% 0.22 290 / 0.6)",
                    }}
                  >
                    ₽
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900">
                      ₦{pkg.priceNGN.toLocaleString()}
                    </span>
                    {meta.save && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{ background: "#ECFDF5", color: "#059669" }}
                      >
                        {meta.save}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {meta.note}
                  </p>
                </div>

                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={
                    selected
                      ? {
                          borderColor: "oklch(40% 0.22 290)",
                          background: "oklch(40% 0.22 290)",
                        }
                      : { borderColor: "#D1D5DB" }
                  }
                >
                  {selected && <IconCheck className="w-2.5 h-2.5 text-white" />}
                </div>
              </button>
            );
          })}

          {packagesLoading && packages.length === 0 &&
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-18 rounded-2xl animate-pulse"
                style={{
                  border: "1px solid var(--color-border)",
                  background: "var(--color-border)",
                  opacity: 0.5,
                }}
              />
            ))}

          {!packagesLoading && packagesError && packages.length === 0 && (
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                border: "1px solid var(--color-border)",
                background: "white",
              }}
            >
              <p
                className="text-sm mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                Couldn&apos;t load packages.
              </p>
              <button
                onClick={() => refetchPackages()}
                className="text-xs font-semibold px-2.5 py-1 rounded transition"
                style={{ color: "oklch(40% 0.22 290)", background: "var(--color-primary-dim)" }}
              >
                Retry
              </button>
            </div>
          )}
        </div>

        <div aria-live="polite">
          <button
            onClick={handlePurchase}
            disabled={
              selectedIdx === null ||
              payState === "opening" ||
              payState === "verifying" ||
              packages.length === 0
            }
            className="w-full py-4 mt-4 rounded-2xl font-semibold text-sm text-white disabled:opacity-40"
            style={{ background: "oklch(40% 0.22 290)" }}
          >
            {payState === "opening"
              ? "Opening payment…"
              : payState === "verifying"
                ? "Confirming payment…"
                : selectedIdx !== null
                  ? `Pay ₦${packages[selectedIdx].priceNGN.toLocaleString()} for ${packages[selectedIdx].parats} Parats`
                  : "Select a package"}
          </button>

          {payState === "success" && (
            <p
              className="text-center text-xs font-semibold mt-2.5 flex items-center justify-center gap-1.5"
              style={{ color: "#059669" }}
            >
              <span aria-hidden="true">
                <IconCheck className="w-3 h-3" />
              </span>
              Payment confirmed — Parats added to your wallet
            </p>
          )}
          {payState === "failed" && (
            <p className="text-center text-xs mt-2.5" style={{ color: "#DC2626" }}>
              {payError || "Something went wrong. Try again."}
            </p>
          )}
        </div>

        <p
          className="text-center text-xs mt-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          Secure payment by Paystack. New accounts start with free Parats.
        </p>
      </div>

      {/* ── Transaction history ── */}
      <div className="px-5 pb-6">
        <h2
          className="font-display font-semibold text-gray-900 mb-3"
          style={{ fontSize: "1.1rem", letterSpacing: "-0.02em" }}
        >
          History
        </h2>

        {txLoading && !txData ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-14 rounded-2xl animate-pulse"
                style={{ background: "var(--color-border)", opacity: 0.5 }}
              />
            ))}
          </div>
        ) : txError && !txData ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              border: "1px solid var(--color-border)",
              background: "white",
            }}
          >
            <p className="text-sm mb-2" style={{ color: "var(--color-text-muted)" }}>
              Couldn&apos;t load history.
            </p>
            <button
              onClick={() => refetchTx()}
              className="text-xs font-semibold px-2.5 py-1 rounded transition"
              style={{ color: "oklch(40% 0.22 290)", background: "var(--color-primary-dim)" }}
            >
              Retry
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              border: "1px solid var(--color-border)",
              background: "white",
            }}
          >
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              No transactions yet.
            </p>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden bg-white"
            style={{ border: "1px solid var(--color-border)" }}
          >
            {transactions.map((tx, i) => (
              <div
                key={tx.transactionId}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{
                  borderBottom:
                    i < transactions.length - 1
                      ? "1px solid var(--color-border)"
                      : undefined,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-sm font-semibold"
                  style={
                    tx.type === "credit"
                      ? { background: "#ECFDF5", color: "#059669" }
                      : { background: "#FEF2F2", color: "#DC2626" }
                  }
                  aria-hidden="true"
                >
                  {tx.type === "credit" ? "+" : "−"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {tx.description ?? tx.purpose}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {new Date(tx.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className="text-sm font-bold shrink-0 font-mono"
                  style={{
                    color: tx.type === "credit" ? "#059669" : "#DC2626",
                  }}
                >
                  {tx.type === "credit" ? "+" : "−"}₽
                  {tx.type === "credit" ? tx.amountAdded : tx.amountDeducted}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
