"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LandingPageContent } from "@/lib/landing-types";
import BrandHeading from "@/components/landing/brand-heading";

type FAQSectionProps = {
  readonly content: LandingPageContent["sections"]["faqs"];
};

export default function FAQSection({ content }: FAQSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="al-faq-content">
      <BrandHeading
        eyebrow={content.tag}
        title={content.heading}
        highlight={content.headingHighlight}
        centered
      />

      <div className="al-faq-list">
        {content.items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className={`al-faq-item ${isOpen ? "al-faq-open" : ""}`}>
              <button
                type="button"
                className="al-faq-trigger"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-content-${item.id}`}
              >
                <span>{item.question}</span>
                <ChevronDown 
                  size={20} 
                  aria-hidden 
                  className={`al-faq-chevron ${isOpen ? "al-faq-chevron-open" : ""}`}
                />
              </button>
              <div 
                id={`faq-content-${item.id}`}
                className="al-faq-answer"
                hidden={!isOpen}
              >
                <p>{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
