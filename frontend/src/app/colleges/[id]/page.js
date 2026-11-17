import { notFound } from "next/navigation";
import { COLLEGES } from "@/data/colleges";
import CollegeDetailClient from "./CollegeDetailClient";

export function generateStaticParams() {
  return COLLEGES.map((c) => ({
    id: c.slug,
  }));
}

export default async function CollegeDetailPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const college = COLLEGES.find((c) => c.slug === id || c.id === id);

  if (!college) {
    notFound();
  }

  return <CollegeDetailClient college={college} />;
}


