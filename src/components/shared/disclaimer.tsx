type DisclaimerProps = Readonly<{
  children: React.ReactNode;
}>;

export function Disclaimer({ children }: DisclaimerProps) {
  return (
    <aside className="glass-panel animate-rise-in rounded-[1.75rem] border-l-4 border-l-[var(--accent)] px-5 py-4 text-sm leading-7 text-[var(--muted)]">
      <p className="font-display text-xs uppercase tracking-[0.22em] text-[var(--accent-strong)]">
        Pricing Notice
      </p>
      <p className="mt-2">{children}</p>
    </aside>
  );
}
