/** No animation: shows its content as it is. Kept so existing pages still compile until the redesign. */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <div className={className}>{children}</div>;
}
