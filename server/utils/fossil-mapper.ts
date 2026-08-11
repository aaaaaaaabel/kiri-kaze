/**
 * 標本 + 物種資料組裝工具
 * fossils.speciesId 是真正的外鍵，這裡用查出的 species row 重組出
 * 跟前端既有 IFossil.speciesRef 一致的快照形狀，API 層以外不需要再轉換。
 */

import { eq } from "drizzle-orm";

type FossilRow = typeof schema.fossils.$inferSelect;
type SpeciesRow = typeof schema.species.$inferSelect;

export function toFossilDTO(fossil: FossilRow, speciesRow: SpeciesRow) {
  const { speciesId: _speciesId, ...rest } = fossil;
  return {
    ...rest,
    speciesRef: {
      id: speciesRow.id,
      slug: speciesRow.slug,
      name: {
        zh: speciesRow.name.zh,
        scientific: speciesRow.name.scientific,
      },
    },
  };
}

/** 依單筆 fossil row 查出對應物種並組成前端要的 IFossil 形狀，找不到物種則回傳 null */
export async function attachSpeciesRef(fossil: FossilRow | undefined) {
  if (!fossil) return null;
  const [speciesRow] = await db
    .select()
    .from(schema.species)
    .where(eq(schema.species.id, fossil.speciesId));
  if (!speciesRow) return null;
  return toFossilDTO(fossil, speciesRow);
}
