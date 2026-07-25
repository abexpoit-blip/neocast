import { useEffect, useState } from "react";
import { readSiteSettings } from "@/lib/store";

export interface SiteSettings {
  shop_name: string;
  shop_tag: string;
  tagline: string;
  support_telegram: string;
  currency_symbol: string;
  min_deposit: number;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  shop_name: "Zoru Shop",
  shop_tag: "ЦИФРОВЫЕ ТОВАРЫ",
  tagline: "Маркетплейс цифровых товаров",
  support_telegram: "@zorushop",
  currency_symbol: "$",
  min_deposit: 5,
};

let cache: SiteSettings | null = null;
const listeners = new Set<(s: SiteSettings) => void>();

const broadcast = (s: SiteSettings) => {
  cache = s;
  listeners.forEach((l) => l(s));
};

export const refreshSiteSettings = async (): Promise<SiteSettings> => {
  try {
    const row = await readSiteSettings();
    const merged: SiteSettings = {
      shop_name: row.brand_name || DEFAULT_SETTINGS.shop_name,
      shop_tag: row.shop_tag || DEFAULT_SETTINGS.shop_tag,
      tagline: row.tagline || DEFAULT_SETTINGS.tagline,
      support_telegram: row.support_telegram || DEFAULT_SETTINGS.support_telegram,
      currency_symbol: row.currency_symbol || DEFAULT_SETTINGS.currency_symbol,
      min_deposit: Number(row.min_deposit) > 0 ? Number(row.min_deposit) : DEFAULT_SETTINGS.min_deposit,
    };
    broadcast(merged);
    return merged;
  } catch {
    broadcast(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cache ?? DEFAULT_SETTINGS);
  useEffect(() => {
    listeners.add(setSettings);
    if (!cache) void refreshSiteSettings();
    return () => { listeners.delete(setSettings); };
  }, []);
  return settings;
}
