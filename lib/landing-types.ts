type PrimaryAction = {
  readonly label: string;
  readonly href: string;
};
type BenefitItem = {
  readonly id: string;
  readonly text: string;
};
type VerticalItem = {
  readonly id: string;
  readonly emoji: string;
  readonly status: string;
  readonly title: string;
  readonly description: string;
};
type SocialLink = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
};
type VisualCheckpoint = {
  readonly id: string;
  readonly label: string;
};
type HeroContent = {
  readonly eyebrow: string;
  readonly headingLineOne: string;
  readonly headingLineTwo: string;
  readonly description: string;
  readonly mainAction: PrimaryAction;
  readonly secondaryAction: PrimaryAction;
  readonly socialProof: string;
};
type FormSectionContent = {
  readonly tag: string;
  readonly heading: string;
  readonly headingHighlight: string;
  readonly benefits: readonly BenefitItem[];
};
type VerticalsSectionContent = {
  readonly tag: string;
  readonly heading: string;
  readonly headingHighlight: string;
  readonly items: readonly VerticalItem[];
};
type FinalCtaContent = {
  readonly heading: string;
  readonly headingHighlight: string;
  readonly description: string;
  readonly action: PrimaryAction;
};
type FooterContent = {
  readonly legalLabel: string;
  readonly legalLinks: readonly PrimaryAction[];
  readonly socialLinks: readonly SocialLink[];
};
type LandingSections = {
  readonly hero: HeroContent;
  readonly form: FormSectionContent;
  readonly verticals: VerticalsSectionContent;
  readonly finalCta: FinalCtaContent;
  readonly footer: FooterContent;
};
type LandingBrand = {
  readonly name: string;
  readonly badge: string;
  readonly year: string;
};
export type LandingPageContent = {
  readonly brand: LandingBrand;
  readonly sections: LandingSections;
  readonly visualCheckpoints: readonly VisualCheckpoint[];
};
