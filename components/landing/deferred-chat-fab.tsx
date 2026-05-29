"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { LandingPageContent } from "@/lib/landing-types";

const AIChatFab = dynamic(() => import("./ai-chat-fab"), { ssr: false });

type Props = { readonly config: LandingPageContent["sections"]["chat"] };

export default function DeferredChatFab({ config }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(() => setMounted(true), { timeout: 3000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(() => setMounted(true), 3000);
    return () => clearTimeout(id);
  }, []);

  if (!mounted) return null;
  return <AIChatFab config={config} />;
}
