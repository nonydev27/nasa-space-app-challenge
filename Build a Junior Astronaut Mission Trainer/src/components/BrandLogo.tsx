const MARK_SRC = `${import.meta.env.BASE_URL}brand/astrolab-mark.svg`;

/** The AstroLab planet-and-orbit mark. Decorative: pair it with visible "AstroLab" text. */
export function BrandMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return <img src={MARK_SRC} width={size} height={size} alt="" aria-hidden="true" className={`brand-mark ${className}`.trim()} draggable={false} />;
}

/** Small "by Nonydev" credit shown under the wordmark. */
export function BrandByline({ className = '' }: { className?: string }) {
  return (
    <span className={`brand-byline ${className}`.trim()}>
      by <b>Nonydev</b>
    </span>
  );
}
