import type { Metadata } from "next";
import { Suspense } from "react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Advanced Parts Finder" };

const labels: Record<string, string> = {
  vin: "chassis / VIN",
  oem: "OEM part number",
  name: "product name",
  vehicle: "vehicle selection",
};

async function Finder({ searchParams }: Pick<PageProps<"/finder">, "searchParams">) {
  const { mode, q } = await searchParams;
  const m = typeof mode === "string" ? labels[mode] : undefined;
  const query = typeof q === "string" ? q.slice(0, 80) : "";
  const note = query && m ? ` Your ${m} search for “${query}” has not been run.` : "";
  return (
    <ComingSoon
      title="Advanced Parts Finder"
      description={`Search by chassis/VIN, OEM number, product name or vehicle. Search arrives with the catalog phases.${note}`}
    />
  );
}

export default function FinderPage(props: PageProps<"/finder">) {
  return (
    <Suspense>
      <Finder searchParams={props.searchParams} />
    </Suspense>
  );
}
