/** Text wordmark until the real metadatum logo is supplied (PLAN.md Q15). */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-heading text-lg font-semibold tracking-tight ${className}`}>
      metadatum<span className="text-brand-pink" aria-hidden>.</span>{" "}
      <span className="font-medium text-muted-foreground">People</span>
    </span>
  );
}
