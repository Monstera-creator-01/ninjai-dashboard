"use client";

import { useRouter } from "next/navigation";
import { CsvUploadZone } from "./csv-upload-zone";

export function CsvUploadZoneWithRefresh() {
  const router = useRouter();
  return <CsvUploadZone onUploadComplete={() => router.refresh()} />;
}
