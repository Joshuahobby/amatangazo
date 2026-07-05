"use client";

import { useTranslations } from "next-intl";

import { preferredLanguages } from "@/lib/validations/listing";

export type BaseListingValue = {
  title: string;
  description: string;
  location: string;
  language: (typeof preferredLanguages)[number];
};

export function BaseListingFields({
  value,
  onChange,
}: {
  value: BaseListingValue;
  onChange: (value: BaseListingValue) => void;
}) {
  const t = useTranslations("post");
  return (
    <fieldset className="flex flex-col gap-4 border-none p-0">
      <label className="field">
        {t("fieldTitle")}
        <input
          name="title"
          required
          minLength={3}
          maxLength={200}
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          className="input font-normal"
        />
      </label>
      <label className="field">
        {t("fieldDescription")}
        <textarea
          name="description"
          required
          minLength={10}
          rows={5}
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          className="input font-normal"
        />
      </label>
      <label className="field">
        {t("fieldLocation")}
        <input
          name="location"
          required
          value={value.location}
          onChange={(e) => onChange({ ...value, location: e.target.value })}
          className="input font-normal"
        />
      </label>
      <label className="field">
        {t("fieldLanguage")}
        <select
          name="language"
          value={value.language}
          onChange={(e) => onChange({ ...value, language: e.target.value as BaseListingValue["language"] })}
          className="input font-normal"
        >
          {preferredLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}

export const initialBaseListingValue: BaseListingValue = {
  title: "",
  description: "",
  location: "",
  language: "EN",
};
