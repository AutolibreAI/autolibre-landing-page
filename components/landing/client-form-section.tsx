"use client";

import dynamic from "next/dynamic";
import type { LandingPageContent } from "@/lib/landing-types";

const FormSection = dynamic(() => import("./form-section"), {
  ssr: false,
  loading: () => <div style={{ minHeight: "600px" }} />,
});

type Props = { readonly content: LandingPageContent["sections"]["form"] };

export default function ClientFormSection({ content }: Props) {
  return <FormSection content={content} />;
}
