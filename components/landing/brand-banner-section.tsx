import Image from "next/image";

export default function BrandBannerSection() {
  return (
    <div className="al-brand-banner">
      <div className="al-brand-banner-image-wrap">
        <Image
          src="/autolibre-banner.png"
          alt="AutoLibre.AI — Información y diagnóstico inteligente en un solo lugar"
          width={1500}
          height={600}
          priority
          className="al-brand-banner-img"
        />
      </div>
      <p className="al-brand-banner-slogan">
        Información y diagnóstico inteligente en un solo lugar.
      </p>
    </div>
  );
}
