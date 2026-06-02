/**
 * The "— 01 / THE CLUB" editorial section header from the Lovable mockup.
 */
export function SectionHeader({
  number,
  label,
  title,
  italic,
}: {
  number: string;
  label: string;
  title: string;
  italic?: string;
}) {
  return (
    <div className="mb-8 sm:mb-12">
      <div className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-forest mb-3 sm:mb-4">
        — {number} / {label}
      </div>
      <h2 className="text-3xl sm:text-4xl md:text-5xl text-forest-deep max-w-3xl leading-[1.08]">
        {title}
        {italic && <em className="italic font-medium text-forest"> {italic}</em>}
      </h2>
    </div>
  );
}
