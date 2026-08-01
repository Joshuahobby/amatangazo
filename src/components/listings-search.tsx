"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { ListingRow, type ListingRowData } from "@/components/listing-row";
import { ListingRowSkeleton } from "@/components/listing-row-skeleton";
import { SaveButton } from "@/components/save-button";
import { SaveSearchButton } from "@/components/save-search-button";
import { experienceLevels, listingCategories } from "@/lib/validations/listing";

const SORT_OPTIONS = [
  { value: "relevance", labelKey: "sortRelevance" },
  { value: "newest", labelKey: "sortNewest" },
  { value: "salary_desc", labelKey: "sortSalaryDesc" },
  { value: "deadline_asc", labelKey: "sortDeadlineAsc" },
  { value: "price_asc", labelKey: "sortPriceAsc" },
  { value: "price_desc", labelKey: "sortPriceDesc" },
] as const;

const PAGE_SIZE = 20;

export type ListingsSearchInitial = {
  q: string;
  category: string;
  location: string;
  sector: string;
  experienceLevel: string;
  sort: string;
};

export function ListingsSearch({ initial }: { initial: ListingsSearchInitial }) {
  const t = useTranslations("browse");
  const tp = useTranslations("post");
  const [q, setQ] = useState(initial.q);
  const [category, setCategory] = useState(initial.category);
  const [location, setLocation] = useState(initial.location);
  const [sector, setSector] = useState(initial.sector);
  const [experienceLevel, setExperienceLevel] = useState(initial.experienceLevel);
  const [sort, setSort] = useState(initial.sort);
  const [subcategory, setSubcategory] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [results, setResults] = useState<ListingRowData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(1);
  const searchKeyRef = useRef(0);

  const buildParams = useCallback((page: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (sort) params.set("sort", sort);
    if (category === "JOB" || category === "TENDER") {
      if (sector) params.set("sector", sector);
    }
    if (category === "JOB" && experienceLevel) params.set("experienceLevel", experienceLevel);
    if (category === "CLASSIFIED" && subcategory) params.set("subcategory", subcategory);
    if (category === "TENDER") {
      if (budgetMin) params.set("budgetMin", budgetMin);
      if (budgetMax) params.set("budgetMax", budgetMax);
    }
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    return params;
  }, [q, category, location, sector, experienceLevel, sort, subcategory, budgetMin, budgetMax]);

  useEffect(() => {
    const params = buildParams(1);
    pageRef.current = 1;
    const key = ++searchKeyRef.current;

    const timeout = setTimeout(() => {
      const query = params.toString();
      window.history.replaceState(null, "", query ? `/listings?${query}` : "/listings");
      setLoading(true);
      setResults([]);
      fetch(`/api/listings/search?${params.toString()}`)
        .then((r) => r.json())
        .then((data) => {
          if (key === searchKeyRef.current) {
            setResults(data.listings ?? []);
            setTotal(data.total ?? 0);
          }
        })
        .finally(() => {
          if (key === searchKeyRef.current) setLoading(false);
        });
    }, 300);

    return () => clearTimeout(timeout);
  }, [buildParams]);

  const handleLoadMore = async () => {
    const nextPage = pageRef.current + 1;
    setLoadingMore(true);
    const params = buildParams(nextPage);
    const res = await fetch(`/api/listings/search?${params.toString()}`);
    const data = await res.json();
    setResults((prev) => [...prev, ...(data.listings ?? [])]);
    pageRef.current = nextPage;
    setLoadingMore(false);
  };

  const hasMore = results.length < total;
  const loadedCount = results.length;

  return (
    <>
      <h1 className="page-title">{t("title")}</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setCategory(""); setSubcategory(""); setBudgetMin(""); setBudgetMax(""); }}
          aria-pressed={category === ""}
          className={category === "" ? "btn-primary btn-sm" : "btn-outline btn-sm"}
        >
          {t("all")}
        </button>
        {listingCategories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => { setCategory(c); setSubcategory(""); setBudgetMin(""); setBudgetMax(""); }}
            aria-pressed={category === c}
            className={category === c ? "btn-primary btn-sm" : "btn-outline btn-sm"}
          >
            {t(`category${c}`)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input placeholder={t("searchKeyword")} value={q} onChange={(e) => setQ(e.target.value)} className="input w-auto flex-1" />
        <input placeholder={t("location")} value={location} onChange={(e) => setLocation(e.target.value)} className="input w-auto flex-1" />
        {(category === "JOB" || category === "TENDER") && (
          <input placeholder={t("sector")} value={sector} onChange={(e) => setSector(e.target.value)} className="input w-auto flex-1" />
        )}
        {category === "JOB" && (
          <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="input w-auto flex-1">
            <option value="">{t("anyExperienceLevel")}</option>
            {experienceLevels.map((level) => (
              <option key={level} value={level}>{tp(`experienceLevel${level}`)}</option>
            ))}
          </select>
        )}
        {category === "CLASSIFIED" && (
          <input placeholder={t("subcategory")} value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="input w-auto flex-1" />
        )}
        {category === "TENDER" && (
          <>
            <input type="number" min="0" placeholder={t("budgetMin")} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} className="input w-auto flex-1" />
            <input type="number" min="0" placeholder={t("budgetMax")} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} className="input w-auto flex-1" />
          </>
        )}
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input w-auto sm:max-w-36">
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
          ))}
        </select>
      </div>

      {category !== "" && (
        <p className="mt-3">
          <SaveSearchButton category={category} filters={{ keyword: q, location, sector, experienceLevel }} />
        </p>
      )}

      {!loading && (
        <p className="mt-4 text-sm text-muted" aria-live="polite">
          {t("results", { count: total })}
          {loadedCount < total && ` · ${t("showing", { count: loadedCount })}`}
        </p>
      )}

      {!loading && results.length === 0 && (
        <div className="mt-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-border/40 text-muted">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="mt-4 font-semibold text-foreground">{t("noResults")}</p>
          <p className="mt-1 text-sm text-muted">{t("noResultsHint")}</p>
        </div>
      )}

      {(loading || results.length > 0) && (
        <div className="row-list mt-3">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ListingRowSkeleton key={i} />)
            : results.map((listing) => (
                <div key={listing.id} className="relative">
                  <ListingRow listing={listing} />
                  {/* Sits outside the row's own <Link>, so it stays a separate
                      control rather than a nested interactive element. */}
                  <span className="absolute right-3 top-3 z-10 sm:right-24">
                    <SaveButton listingId={listing.id} />
                  </span>
                </div>
              ))}
        </div>
      )}

      {hasMore && !loading && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="btn-outline btn-lg"
          >
            {loadingMore ? t("loadingMore") : t("loadMore", { count: total - loadedCount })}
          </button>
        </div>
      )}
    </>
  );
}
