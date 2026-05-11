import Image from "next/image";

export default function BrandBannerSection() {
  return (
    <div className="al-brand-banner">
      <div className="al-brand-banner-logo-wrap">
        <Image
          src="/autolibre-logo-horizontal.png"
          alt="AutoLibre.AI — Información y diagnóstico inteligente"
          width={700}
          height={350}
          priority
          className="al-brand-banner-logo"
        />
      </div>
      <p className="al-brand-banner-slogan">
        Información y diagnóstico inteligente en un solo lugar.
      </p>
    </div>
  );
}
