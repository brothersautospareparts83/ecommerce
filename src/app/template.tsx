/** Re-mounts on every navigation, so each page eases in softly. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="m-page">{children}</div>;
}
