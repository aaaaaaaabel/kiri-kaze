/**
 * 化石標本命名邏輯
 * 僅供 scripts/generate-mock-data.ts 使用，集中 slug / shortCode 產生規則。
 */

/** 學名轉 slug，例如 "Barrandeops sp." → "barrandeops-sp" */
export function scientificToSlug(scientific: string): string {
  return scientific
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const COUNTRY_CODE_MAP: Record<string, string> = {
  摩洛哥: "morocco",
  Morocco: "morocco",
  美國: "usa",
  USA: "usa",
  "United States": "usa",
  加拿大: "canada",
  Canada: "canada",
  中國: "china",
  China: "china",
  墨西哥: "mexico",
  Mexico: "mexico",
};

/** 國家轉 code，例如 "Morocco" → "morocco"；未知國家 fallback 為小寫連字號 */
export function countryToCode(country: string): string {
  return COUNTRY_CODE_MAP[country] ?? country.toLowerCase().replace(/\s+/g, "-");
}

/** 州/省轉 code，例如 "Alnif" → "alnif" */
export function stateToCode(state: string): string {
  return state.toLowerCase().replace(/\s+/g, "-");
}

/** 產區 id，例如 country="Morocco" state="Alnif" → "morocco-alnif" */
export function buildLocationId(country: string, state: string): string {
  return `${countryToCode(country)}-${stateToCode(state)}`;
}

/** 11 位數 shortCode（基於 slug 的固定 hash） */
export function generateShortCode(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    const char = slug.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString().slice(0, 11).padStart(11, "0");
}

export interface INamingInput {
  species: string;
  country: string;
  state: string;
}

export interface INamingResult {
  speciesSlug: string;
  locationId: string;
  specimenNumber: number;
  numStr: string;
  fossilSlug: string;
  shortCode: string;
}

/**
 * 對一批標本計算 speciesSlug / locationId / 標本編號 / fossilSlug / shortCode。
 * 先算出每個物種的產區集合大小（決定 slug 格式），再依 input.json 出現順序、
 * 以「物種+產區」分組計算標本編號。
 * @param inputs 標本清單（依 input.json 原始順序）
 * @returns 與 inputs 一一對應的命名結果陣列
 */
export function computeFossilNaming(inputs: INamingInput[]): INamingResult[] {
  const speciesLocationSets = new Map<string, Set<string>>();
  for (const input of inputs) {
    const speciesSlug = scientificToSlug(input.species);
    const locationId = buildLocationId(input.country, input.state);
    if (!speciesLocationSets.has(speciesSlug)) {
      speciesLocationSets.set(speciesSlug, new Set());
    }
    speciesLocationSets.get(speciesSlug)!.add(locationId);
  }

  const locationCounters = new Map<string, number>();
  const results: INamingResult[] = [];

  for (const input of inputs) {
    const speciesSlug = scientificToSlug(input.species);
    const locationId = buildLocationId(input.country, input.state);
    const locationKey = `${speciesSlug}::${locationId}`;

    const specimenNumber = (locationCounters.get(locationKey) ?? 0) + 1;
    locationCounters.set(locationKey, specimenNumber);

    const hasMultipleLocations = (speciesLocationSets.get(speciesSlug)?.size ?? 0) > 1;
    const numStr = specimenNumber.toString().padStart(3, "0");
    const fossilSlug = hasMultipleLocations
      ? `${speciesSlug}-${locationId}-${numStr}`
      : `${speciesSlug}-${numStr}`;

    results.push({
      speciesSlug,
      locationId,
      specimenNumber,
      numStr,
      fossilSlug,
      shortCode: generateShortCode(fossilSlug),
    });
  }

  return results;
}
