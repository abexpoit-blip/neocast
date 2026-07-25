import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface SiteSettings {
  shop_name: string;
  shop_tag: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_sub: string;
  hero_cta: string;
  ticker_items: string[];
  default_commission_percent: number;
  min_card_price: number;
  deposit_fee_percent: number;
  deposit_fee_flat: number;
  min_deposit: number;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  shop_name: "Zoru Shop",
  shop_tag: "ПРОВЕРЕННЫЙ МАРКЕТПЛЕЙС",
  hero_eyebrow: "С ВОЗВРАЩЕНИЕМ",
  hero_title: "Проверенный маркетплейс Zoru Shop.",
  hero_sub:
    "Проверенный товар, мгновенная доставка, авто-замена и безопасные расчёты.",
  hero_cta: "Войти в маркетплейс",
  ticker_items: [
    "● ЖИВОЙ СКЛАД · СВЕЖИЕ ПОСТУПЛЕНИЯ ЕЖЕДНЕВНО",
    "★ ПРОВЕРЕННЫЕ ПРОДАВЦЫ · МГНОВЕННАЯ ДОСТАВКА",
    "● 99.4% ВАЛИДНОСТЬ НА ЭТОЙ НЕДЕЛЕ",
    "↗ АВТОЗАМЕНА В ТЕЧЕНИЕ 5 МИНУТ",
    "● ПОДДЕРЖКА 24/7 · TELEGRAM",
  ],
  default_commission_percent: 20,
  min_card_price: 1,
  deposit_fee_percent: 0,
  deposit_fee_flat: 0,
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
    const { settings } = await api.get<{ settings: Record<string, unknown> }>("/site-settings");
    const row = settings as Partial<SiteSettings> | null;
    const merged: SiteSettings = {
      ...DEFAULT_SETTINGS,
      ...(row ?? {}),
      ticker_items: Array.isArray(row?.ticker_items)
        ? (row!.ticker_items as string[])
        : DEFAULT_SETTINGS.ticker_items,
      min_deposit: (row?.min_deposit != null && Number(row.min_deposit) > 0) ? Number(row.min_deposit) : DEFAULT_SETTINGS.min_deposit,
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
    return () => {
      listeners.delete(setSettings);
    };
  }, []);
  return settings;
}
