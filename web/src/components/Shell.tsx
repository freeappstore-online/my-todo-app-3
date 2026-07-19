import type { ReactNode } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
}

interface ShellProps {
  appName?: string;
  children: ReactNode;
  navItems?: NavItem[];
}

export default function Shell({ appName = "To-Do", children, navItems = [] }: ShellProps) {
  return (
    <>
      {/* Desktop layout */}
      <div className="hidden md:flex h-screen">
        <aside
          className="flex flex-col border-r h-full shrink-0"
          style={{ width: "17rem", borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <div className="p-6 font-bold text-xl" style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}>
            {appName}
          </div>
          <nav className="flex-1 px-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-sm font-semibold rounded-xl transition-all"
                style={{
                  background: item.active ? "var(--accent)" : "transparent",
                  color: item.active ? "#fff" : "var(--muted)",
                  borderRadius: "0.75rem",
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 text-xs" style={{ color: "var(--muted)" }}>
            <a
              href="https://freeappstore.online"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: "var(--muted)" }}
            >
              Part of FreeAppStore — free forever
            </a>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col h-screen md:hidden">
        <header
          className="flex items-center px-4 h-14 border-b shrink-0"
          style={{ borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <span className="font-bold text-lg" style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}>
            {appName}
          </span>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
        {navItems.length > 0 && (
          <nav
            className="flex items-center justify-around h-16 border-t shrink-0"
            style={{ borderColor: "var(--line)", background: "var(--panel)" }}
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-semibold transition-all"
                style={{ color: item.active ? "var(--accent)" : "var(--muted)" }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
