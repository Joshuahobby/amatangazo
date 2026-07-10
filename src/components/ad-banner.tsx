import { getTranslations } from "next-intl/server";
import Image from "next/image";

export async function AdBanner({ type }: { type: "horizontal" | "vertical" }) {
  const t = await getTranslations("home");
  const isHorizontal = type === "horizontal";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow duration-300 hover:shadow-lg ${
        isHorizontal ? "h-40 w-full md:h-48" : "h-96 w-full max-w-[300px]"
      }`}
    >
      <Image
        src={isHorizontal ? "/images/ad-horizontal.png" : "/images/ad-vertical.png"}
        alt="Advertisement"
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        sizes={isHorizontal ? "100vw" : "300px"}
      />
      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
        {t("sponsoredLabel")}
      </div>
    </div>
  );
}
