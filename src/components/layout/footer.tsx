import Link from "next/link";
import { site, toIntl } from "@/lib/site";

/** Plain footer, to be redesigned. */
export function Footer() {
  return (
    <footer>
      <p>{site.name} · {site.location}</p>
      <p>
        {site.phones.map((p) => (
          <a key={p} href={`tel:+${toIntl(p)}`} className="pr-3">{p}</a>
        ))}
      </p>
      <p>
        <Link href="/privacy" className="pr-3">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </p>
    </footer>
  );
}
