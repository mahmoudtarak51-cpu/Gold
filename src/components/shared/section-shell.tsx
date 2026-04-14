type SectionShellProps = Readonly<{
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}>;

export function SectionShell({ eyebrow, title, description, children }: SectionShellProps) {
  return (
    <section className="glass-panel animate-rise-in rounded-[2rem] px-6 py-7 sm:px-8">
      <div className="max-w-3xl space-y-3">
        <p className="font-display text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
          {eyebrow}
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)]">
          {title}
        </h2>
        {description ? (
          <p className="text-base leading-7 text-[var(--muted)]">{description}</p>
        ) : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}
