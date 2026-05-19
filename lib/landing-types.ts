export type PrimaryAction = {
  readonly label: string;
  readonly href: string;
};

export type BenefitItem = {
  readonly id: string;
  readonly text: string;
};

export type VerticalItem = {
  readonly id: string;
  readonly emoji: string;
  readonly status: string;
  readonly title: string;
  readonly description: string;
};

export type SocialLink = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
};

export type VisualCheckpoint = {
  readonly id: string;
  readonly label: string;
};

export type HeroContent = {
  readonly eyebrow: string;
  readonly headingLineOne: string;
  readonly headingLineTwo: string;
  readonly description: string | readonly string[];
  readonly mainAction: PrimaryAction;
  readonly secondaryAction: PrimaryAction;
  readonly socialProof: string;
};

export type FormSectionContent = {
  readonly tag: string;
  readonly heading: string;
  readonly headingHighlight: string;
  readonly benefits: readonly BenefitItem[];
  readonly microcopy: string;
  readonly reasonOptions: readonly string[];
};

export type VerticalsSectionContent = {
  readonly tag: string;
  readonly heading: string;
  readonly headingHighlight: string;
  readonly items: readonly VerticalItem[];
};

export type FinalCtaContent = {
  readonly heading: string;
  readonly headingHighlight: string;
  readonly description: string;
  readonly action: PrimaryAction;
};

export type FooterContent = {
  readonly closingPhrase: string;
  readonly legalLabel: string;
  readonly legalLinks: readonly PrimaryAction[];
  readonly socialLinks: readonly SocialLink[];
  readonly secondaryCta: PrimaryAction;
};

export type ProblemItem = {
  readonly id: string;
  readonly icon: string;
  readonly title: string;
  readonly text: string;
};

export type ProblemSectionContent = {
  readonly tag: string;
  readonly heading: string;
  readonly headingHighlight: string;
  readonly description: string;
  readonly subheading: string;
  readonly items: readonly ProblemItem[];
};

export type FAQItem = {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
};

export type FAQSectionContent = {
  readonly tag: string;
  readonly heading: string;
  readonly headingHighlight: string;
  readonly items: readonly FAQItem[];
};

export type ChatConfig = {
  readonly fabTooltip: string;
  readonly panelTitle: string;
  readonly placeholder: string;
  readonly welcomeMessage: string;
};

export type LandingSections = {
  readonly hero: HeroContent;
  readonly form: FormSectionContent;
  readonly verticals: VerticalsSectionContent;
  readonly problem: ProblemSectionContent;
  readonly faqs: FAQSectionContent;
  readonly finalCta: FinalCtaContent;
  readonly footer: FooterContent;
  readonly chat: ChatConfig;
};

export type LandingBrand = {
  readonly name: string;
  readonly badge: string;
  readonly year: string;
};

export type LandingPageContent = {
  readonly brand: LandingBrand;
  readonly sections: LandingSections;
  readonly visualCheckpoints: readonly VisualCheckpoint[];
};
