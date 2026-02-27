"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Card from "@/components/Card";
import { useAppData } from "@/hooks/useAppData";
import type { AdminProfile } from "@/lib/domain/types";
import { strings } from "@/lib/i18n";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

const inputStyles =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/60";

const choirRoleLabels: Record<
  AdminProfile["choir_roles"][number]["role"],
  string
> = {
  Chair: "Vorstand",
  Conductor: "Leitung",
  Manager: "Organisation"
};

type CityAutocompleteSuggestion = {
  placeId: string;
  city: string;
  country: string;
  label: string;
};

export default function ProfilePage() {
  const { adminProfile, choirs, personSettings, replaceSnapshot, snapshot } = useAppData();
  const router = useRouter();

  const languageOptions = ["Deutsch", "Französisch", "Italienisch", "Englisch"];
  const defaultLanguage = languageOptions.includes(adminProfile.language)
    ? adminProfile.language
    : "Deutsch";
  const [languageOpen, setLanguageOpen] = useState(false);
  const [language, setLanguage] = useState(defaultLanguage);
  const [firstName, setFirstName] = useState(adminProfile.first_name);
  const [lastName, setLastName] = useState(adminProfile.last_name);
  const [email, setEmail] = useState(adminProfile.email);
  const [phone, setPhone] = useState(adminProfile.phone ?? "");
  const [city, setCity] = useState(adminProfile.city);
  const [cityAutocompleteOpen, setCityAutocompleteOpen] = useState(false);
  const [cityAutocompleteLoading, setCityAutocompleteLoading] = useState(false);
  const [cityAutocompleteError, setCityAutocompleteError] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<CityAutocompleteSuggestion[]>([]);
  const [selectedCitySuggestion, setSelectedCitySuggestion] =
    useState<CityAutocompleteSuggestion | null>(
      adminProfile.city
        ? {
            placeId: `legacy-admin:${adminProfile.city}`,
            city: adminProfile.city,
            country: "",
            label: adminProfile.city
          }
        : null
    );
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const cityAutocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!languageRef.current?.contains(event.target as Node)) {
        setLanguageOpen(false);
      }
      if (!cityAutocompleteRef.current?.contains(event.target as Node)) {
        setCityAutocompleteOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!cityAutocompleteOpen) return;
    const query = city.trim();
    if (query.length < 2) {
      setCitySuggestions([]);
      setCityAutocompleteError("");
      setCityAutocompleteLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      const run = async () => {
        setCityAutocompleteLoading(true);
        setCityAutocompleteError("");
        try {
          const response = await fetch(
            `/api/cities/autocomplete?q=${encodeURIComponent(query)}`,
            { signal: controller.signal }
          );
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(
              typeof payload?.error === "string"
                ? payload.error
                : "Städte konnten nicht geladen werden."
            );
          }

          const rawSuggestions: unknown[] = Array.isArray(payload?.suggestions)
            ? payload.suggestions
            : [];
          const suggestions = rawSuggestions
            .filter(
              (
                item: unknown
              ): item is {
                placeId: string;
                city: string;
                country?: string;
                label?: string;
              } =>
                Boolean(
                  item &&
                    typeof item === "object" &&
                    typeof (item as { placeId?: unknown }).placeId === "string" &&
                    typeof (item as { city?: unknown }).city === "string"
                )
            )
            .map((item): CityAutocompleteSuggestion => ({
              placeId: item.placeId,
              city: item.city,
              country: item.country || "",
              label: item.label || item.city
            }));
          setCitySuggestions(suggestions);
        } catch (error) {
          if (controller.signal.aborted) return;
          const message =
            error instanceof Error && error.message
              ? error.message
              : "Städte konnten nicht geladen werden.";
          setCitySuggestions([]);
          setCityAutocompleteError(message);
        } finally {
          if (!controller.signal.aborted) {
            setCityAutocompleteLoading(false);
          }
        }
      };
      void run();
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [city, cityAutocompleteOpen]);

  const cityValidationMessage = useMemo(() => {
    const trimmed = city.trim();
    if (!trimmed) return "";
    if (selectedCitySuggestion && selectedCitySuggestion.city === trimmed) return "";
    return "Bitte eine Stadt aus der Vorschlagsliste auswählen.";
  }, [city, selectedCitySuggestion]);

  const choirCards = adminProfile.choir_roles.map((entry) => {
    const choir = choirs.find((item) => item.id === entry.choir_id);
    return {
      ...entry,
      choirName: choir?.name ?? "Ensemble",
      city: choir?.city ?? "",
      rehearsal: choir?.rehearsal_pattern
    };
  });

  const saveProfile = async () => {
    if (city.trim() && (!selectedCitySuggestion || selectedCitySuggestion.city !== city.trim())) {
      window.alert("Bitte eine Stadt aus der Vorschlagsliste auswählen.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/profile/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          city,
          language
        })
      });

      if (!response.ok) {
        throw new Error("save failed");
      }

      replaceSnapshot({
        ...snapshot,
        adminProfile: {
          ...snapshot.adminProfile,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          city,
          language
        },
        personSettings: {
          ...personSettings,
          language
        }
      });
    } catch {
      window.alert("Profil konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/login");
      router.refresh();
    } catch {
      window.alert("Abmeldung fehlgeschlagen.");
      setLoggingOut(false);
    }
  };

  const handleComingSoon = () => {
    window.alert("Diese Funktion kommt in einer späteren Version der App.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-slate-900">
                {strings.profile.basicsTitle}
              </h3>
              <p className="text-sm text-slate-500">
                {strings.profile.basicsSubtitle}
              </p>
            </div>
            <form className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-600">
                {strings.profile.fields.firstName}
                <input
                  className={inputStyles}
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  type="text"
                />
              </label>
              <label className="text-sm text-slate-600">
                {strings.profile.fields.lastName}
                <input
                  className={inputStyles}
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  type="text"
                />
              </label>
              <label className="text-sm text-slate-600">
                {strings.profile.fields.email}
                <input
                  className={inputStyles}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                />
              </label>
              <label className="text-sm text-slate-600">
                {strings.profile.fields.phone}
                <input
                  className={inputStyles}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  type="tel"
                />
              </label>
              <label className="text-sm text-slate-600">
                {strings.profile.fields.city}
                <div className="relative mt-2" ref={cityAutocompleteRef}>
                  <input
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200/60 ${
                      cityValidationMessage
                        ? "border-rose-300 focus:border-rose-400"
                        : "border-slate-200 focus:border-slate-300"
                    }`}
                    value={city}
                    onFocus={() => setCityAutocompleteOpen(true)}
                    onChange={(event) => {
                      setCity(event.target.value);
                      setSelectedCitySuggestion(null);
                      setCityAutocompleteOpen(true);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setCityAutocompleteOpen(false);
                        return;
                      }
                      if (event.key === "Enter" && citySuggestions.length > 0) {
                        event.preventDefault();
                        const suggestion = citySuggestions[0];
                        setCity(suggestion.city);
                        setSelectedCitySuggestion(suggestion);
                        setCityAutocompleteOpen(false);
                      }
                    }}
                    autoComplete="off"
                    type="text"
                    aria-invalid={cityValidationMessage ? "true" : "false"}
                    aria-describedby={cityValidationMessage ? "admin-city-error" : undefined}
                  />
                  {cityAutocompleteOpen && city.trim().length >= 2 ? (
                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                      {cityAutocompleteLoading ? (
                        <div className="px-3 py-2 text-sm text-slate-500">Suche Städte...</div>
                      ) : cityAutocompleteError ? (
                        <div className="px-3 py-2 text-sm text-rose-600">
                          {cityAutocompleteError}
                        </div>
                      ) : citySuggestions.length > 0 ? (
                        <ul className="max-h-56 overflow-y-auto">
                          {citySuggestions.map((suggestion) => (
                            <li key={suggestion.placeId}>
                              <button
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  setCity(suggestion.city);
                                  setSelectedCitySuggestion(suggestion);
                                  setCityAutocompleteOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                              >
                                {suggestion.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-3 py-2 text-sm text-slate-500">
                          Keine passenden Städte gefunden.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
                {cityValidationMessage ? (
                  <div id="admin-city-error" className="mt-1 text-xs text-rose-600">
                    {cityValidationMessage}
                  </div>
                ) : null}
              </label>
              <div className="text-sm text-slate-600 relative" ref={languageRef}>
                {strings.profile.fields.language}
                <button
                  type="button"
                  onClick={() => setLanguageOpen((prev) => !prev)}
                  className="mt-2 flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/60"
                  aria-haspopup="listbox"
                  aria-expanded={languageOpen}
                >
                  <span className="truncate">{language}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
                {languageOpen ? (
                  <div className="absolute right-0 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                    <ul className="py-2">
                      {languageOptions.map((option) => (
                        <li key={option}>
                          <button
                            type="button"
                            onClick={() => {
                              setLanguage(option);
                              setLanguageOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {option}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <div className="sm:col-span-2 mt-2 border-t border-slate-100 pt-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void saveProfile()}
                    disabled={saving}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 disabled:opacity-60"
                  >
                    {saving ? "Speichert..." : strings.profile.actions.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    disabled={loggingOut}
                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:opacity-60"
                  >
                    {loggingOut ? "Abmeldung..." : "Abmelden"}
                  </button>
                </div>
              </div>
            </form>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {strings.profile.choirTitle}
                </h3>
                <p className="text-sm text-slate-500">
                  {strings.profile.choirSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new Event("choirmaster:create-choir"));
                }}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300"
              >
                {strings.profile.actions.addChoir}
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              {choirCards.map((entry) => (
                <div
                  key={entry.choir_id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {entry.choirName}
                      </p>
                      <p className="text-xs text-slate-500">{entry.city}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                        {choirRoleLabels[entry.role]}
                      </span>
                      <button
                        type="button"
                        onClick={handleComingSoon}
                        className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300"
                      >
                        {strings.profile.actions.editChoir}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                    <div>
                      Probe
                      <p className="text-sm text-slate-700">
                        {entry.rehearsal?.weekdays.join(", ")} ·{" "}
                        {entry.rehearsal?.start_time}–{entry.rehearsal?.end_time}
                      </p>
                    </div>
                    <div>
                      Ort
                      <p className="text-sm text-slate-700">
                        {entry.rehearsal?.default_location ?? "Noch offen"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
