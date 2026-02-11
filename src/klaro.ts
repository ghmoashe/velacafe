import config from "./klaro.config";

type KlaroModule = {
  setup?: (config?: unknown) => unknown;
  show?: (config?: unknown, modal?: boolean, api?: unknown) => unknown;
};

type KlaroGlobal = {
  klaro?: {
    show?: () => void;
  };
};

let klaroModulePromise: Promise<KlaroModule> | null = null;
let klaroModule: KlaroModule | null = null;
let setupPromise: Promise<unknown> | null = null;
let lastLang: string | null = null;

function normalizeLang(lang?: string) {
  return lang?.toLowerCase().split("-")[0];
}

function resolveKlaroModule(mod: unknown): KlaroModule {
  if (!mod || typeof mod !== "object") return {};
  const candidate = mod as KlaroModule;
  if (candidate.setup || candidate.show) return candidate;
  const withDefault = (mod as { default?: unknown }).default;
  if (withDefault && typeof withDefault === "object") {
    const def = withDefault as KlaroModule;
    if (def.setup || def.show) return def;
  }
  return candidate;
}

async function loadKlaro() {
  if (!klaroModulePromise) {
    klaroModulePromise = import("klaro").then((mod) => resolveKlaroModule(mod));
  }
  const mod = await klaroModulePromise;
  klaroModule = mod;
  return mod;
}

export async function setupKlaro(lang?: string) {
  const normalized = normalizeLang(lang);
  const fallback =
    typeof config.lang === "string" && config.lang ? config.lang : "de";
  const resolvedLang = normalized ?? fallback;
  const Klaro = await loadKlaro();
  if (!Klaro?.setup) return null;
  if (!setupPromise || lastLang !== resolvedLang) {
    lastLang = resolvedLang;
    setupPromise = Promise.resolve(Klaro.setup({ ...config, lang: resolvedLang }));
  }
  return setupPromise;
}

export async function openKlaroSettings(lang?: string) {
  const Klaro = klaroModule ?? (await loadKlaro());
  await setupKlaro(lang);
  if (Klaro?.show) {
    Klaro.show(undefined, true);
    return;
  }
  (window as typeof window & KlaroGlobal).klaro?.show?.();
}
