"use client";

import { useTranslations } from "next-intl";
import { SaveSearchButton } from "@/components/save-search-button";
import Link from "next/link";
import { useEffect, useState } from "react";

import { experienceLevels, listingCategories } from "@/lib/validations/listing";

type SearchResultListing = {
  id: string;
  title: string;
  category: string;
  location: string;
  isCurrentlyBoosted: boolean;
  jobDetails: { sector: string; experienceLevel: string } | null;
  tenderDetails: { sector: string; submissionDeadline: string } | null;
  auctionDetails: { auctionDate: string } | null;
  classifiedDetails: { subcategory: string; price: number | null } | null;
};

export default function ListingsSearchPage() {
  const t = useTranslations("browse");
  const tc = useTranslations("common");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState("");
  const [sector, setSector] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [results, setResults] = useState<SearchResultListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (category === "JOB" || category === "TENDER") {
      if (sector) params.set("sector", sector);
    }
    if (category === "JOB" && experienceLevel) params.set("experienceLevel", experienceLevel);

    const timeout = setTimeout(() => {
      setLoading(true);
      fetch(`/api/listings/search?${params.toString()}`)
        .then((r) => r.json())
        .then((data) => {
          setResults(data.listings ?? []);
          setTotal(data.total ?? 0);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [q, category, location, sector, experienceLevel]);

  return (
    <main style={{ maxWidth: 800, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>{t("title")}</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={() => setCategory("")} style={{ fontWeight: category === "" ? "bold" : "normal" }}>
          {t("all")}
        </button>
        {listingCategories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            style={{ fontWeight: category === c ? "bold" : "normal" }}
          >
            {t(`category${c}`)}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <input placeholder={t("searchKeyword")} value={q} onChange={(e) => setQ(e.target.value)} />
        <input placeholder={t("location")} value={location} onChange={(e) => setLocation(e.target.value)} />
        {(category === "JOB" || category === "TENDER") && (
          <input placeholder={t("sector")} value={sector} onChange={(e) => setSector(e.target.value)} />
        )}
        {category === "JOB" && (
          <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
            <option value="">{t("anyExperienceLevel")}</option>
            {experienceLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        )}
      </div>

      {category !== "" && (
        <p>
          <SaveSearchButton category={category} filters={{ keyword: q, location, sector, experienceLevel }} />
        </p>
      )}

      <p style={{ color: "#666" }}>{loading ? t("searching") : t("results", { count: total })}</p>

      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {results.map((listing) => (
          <li key={listing.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <Link href={`/listings/${listing.id}`} style={{ fontWeight: "bold" }}>
              {listing.title}
            </Link>
            {listing.isCurrentlyBoosted && (
              <span style={{ marginLeft: 8, background: "#ffe9a8", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
                {tc("featured")}
              </span>
            )}
            <p style={{ margin: "4px 0", color: "#666" }}>
              {listing.category} · {listing.location}
              {listing.jobDetails && ` · ${listing.jobDetails.sector} · ${listing.jobDetails.experienceLevel}`}
              {listing.tenderDetails && ` · ${listing.tenderDetails.sector}`}
              {listing.classifiedDetails && ` · ${listing.classifiedDetails.subcategory}`}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
