"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

import { SaveSearchButton } from "@/components/save-search-button";
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

export type ListingsSearchInitial = {
  q: string;
  category: string;
  location: string;
  sector: string;
  experienceLevel: string;
};

export function ListingsSearch({ initial }: { initial: ListingsSearchInitial }) {
  const t = useTranslations("browse");
  const tc = useTranslations("common");
  const tp = useTranslations("post");
  const [q, setQ] = useState(initial.q);
  const [category, setCategory] = useState(initial.category);
  const [location, setLocation] = useState(initial.location);
  const [sector, setSector] = useState(initial.sector);
  const [experienceLevel, setExperienceLevel] = useState(initial.experienceLevel);
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
      // Keep the URL shareable/bookmarkable without a server round-trip; the
      // native History API integrates with the Next router (see next docs,
      // linking-and-navigating). The server page re-keys this component only
      // on real navigations, so typing never remounts it.
      const query = params.toString();
      window.history.replaceState(null, "", query ? `/listings?${query}` : "/listings");
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
    <main className="page">
      <h1 className="page-title">{t("title")}</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("")}
          aria-pressed={category === ""}
          className={category === "" ? "btn-primary btn-sm" : "btn-outline btn-sm"}
        >
          {t("all")}
        </button>
        {listingCategories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={category === c ? "btn-primary btn-sm" : "btn-outline btn-sm"}
          >
            {t(`category${c}`)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input placeholder={t("searchKeyword")} value={q} onChange={(e) => setQ(e.target.value)} className="input w-auto flex-1" />
        <input
          placeholder={t("location")}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="input w-auto flex-1"
        />
        {(category === "JOB" || category === "TENDER") && (
          <input placeholder={t("sector")} value={sector} onChange={(e) => setSector(e.target.value)} className="input w-auto flex-1" />
        )}
        {category === "JOB" && (
          <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="input w-auto flex-1">
            <option value="">{t("anyExperienceLevel")}</option>
            {experienceLevels.map((level) => (
              <option key={level} value={level}>
                {tp(`experienceLevel${level}`)}
              </option>
            ))}
          </select>
        )}
      </div>

      {category !== "" && (
        <p className="mt-3">
          <SaveSearchButton category={category} filters={{ keyword: q, location, sector, experienceLevel }} />
        </p>
      )}

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {loading ? t("searching") : t("results", { count: total })}
      </p>

      <ul className="mt-3 flex flex-col gap-3">
        {results.map((listing) => (
          <li key={listing.id} className="card">
            <Link href={`/listings/${listing.id}`} className="font-semibold text-foreground hover:text-primary">
              {listing.title}
            </Link>
            {listing.isCurrentlyBoosted && <span className="badge-featured ml-2">{tc("featured")}</span>}
            <p className="mt-1 text-sm text-muted">
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
