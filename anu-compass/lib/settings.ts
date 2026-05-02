import { PROVIDER_OPTIONS, type ClientSettings, type ProviderId } from "./types";

const STORAGE_KEY = "anu-compass:settings:v1";

export function loadSettings(): ClientSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClientSettings;
    if (!parsed.provider || !parsed.apiKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSettings(settings: ClientSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function clearSettings(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function defaultSettingsFor(provider: ProviderId): ClientSettings {
  const opt = PROVIDER_OPTIONS.find((p) => p.id === provider)!;
  return {
    provider,
    apiKey: "",
    model: opt.defaultModel,
    baseUrl: opt.defaultBaseUrl,
  };
}
