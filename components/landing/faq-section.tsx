"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { LandingPageContent } from "@/lib/landing-types";
import BrandHeading from "@/components/landing/brand-heading";

type FAQSectionProps = {
  readonly content: LandingPageContent["sections"]["faqs"];
};

const INITIAL_VISIBLE = 5;

export default function FAQSection({ content }: FAQSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const visibleItems = expanded ? content.items : content.items.slice(0, INITIAL_VISIBLE);
  const hasMore = content.items.length > INITIAL_VISIBLE;

  return (
    <div className="al-faq-content">
      <BrandHeading
        eyebrow={content.tag}
        title={content.heading}
        highlight={content.headingHighlight}
        centered
      />

      <div className="al-faq-list">
        {visibleItems.map((item) => {
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

      {hasMore && (
        <div className="al-faq-more">
          <button
            type="button"
            className="al-faq-more-btn"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                Ver menos
                <ChevronUp size={16} aria-hidden />
              </>
            ) : (
              <>
                Ver mas
                <ChevronDown size={16} aria-hidden />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
