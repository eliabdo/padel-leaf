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
    <div className="mb-12">
      <div className="text-xs font-semibold tracking-[0.18em] uppercase text-forest mb-4">
        — {number} / {label}
      </div>
      <h2 className="text-4xl md:text-5xl text-forest-deep max-w-3xl">
        {title}
        {italic && <em className="italic font-medium text-forest"> {italic}</em>}
      </h2>
    </div>
  );
}
