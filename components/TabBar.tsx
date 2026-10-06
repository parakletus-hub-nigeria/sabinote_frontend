"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconLibrary, IconBolt, IconWallet, IconUser } from "./icons";

const tabs = [
  { href: "/dashboard", label: "Home",    icon: IconHome    },
  { href: "/notes",     label: "Library", icon: IconLibrary },
  { href: "/generate",  label: "",        icon: IconBolt,   isCenter: true },
  { href: "/wallet",    label: "Wallet",  icon: IconWallet  },
  { href: "/settings",  label: "You",     icon: IconUser    },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 bg-white pb-safe"
      style={{ borderTop: "1px solid var(--color-border)" }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-3">
        {tabs.map(tab => {
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));

          if (tab.isCenter) {
            return (
              <Link key={tab.href} href={tab.href} prefetch={true} className="flex flex-col items-center -mt-5">
                <span
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white"
                  style={{
                    background: "oklch(40% 0.22 290)",
                    boxShadow: "0 4px 20px oklch(40% 0.22 290 / 0.35)",
                  }}
                >
                  <tab.icon className="w-6 h-6" />
                </span>
              </Link>
            );
          }

          return (
            <Link key={tab.href} href={tab.href} prefetch={true} className="flex flex-col items-center gap-1 min-w-12">
              <span style={{ color: isActive ? "oklch(40% 0.22 290)" : "var(--color-text-muted)" }}
                className="transition-colors duration-150">
                <tab.icon />
              </span>
              <span
                className="text-[10px] font-medium transition-colors duration-150"
                style={{ color: isActive ? "oklch(40% 0.22 290)" : "var(--color-text-muted)" }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
