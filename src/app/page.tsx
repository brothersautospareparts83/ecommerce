import Link from "next/link";
import { categories } from "@/lib/categories";
import { T } from "@/lib/i18n";

/** Plain home page, to be redesigned. */
export default function HomePage() {
  return (
    <>
      <h1 className="text-2xl font-bold">
        <T en="Brothers Auto Spare Parts" sw="Brothers Auto Spare Parts" />
      </h1>
      <p>
        <T en="Spare parts for cars and motorcycles. Orders are finished on WhatsApp." sw="Vipuri vya magari na pikipiki. Oda zinakamilishwa kwa WhatsApp." />
      </p>
      <h2 className="mt-4 font-bold"><T en="Categories" sw="Makundi" /></h2>
      <ul>
        {categories.map((c) => (
          <li key={c.slug}>
            <Link href={`/categories/${c.slug}`}>{c.name}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
