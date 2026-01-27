/**
 * 分類學相關型別定義
 * 用於化石的分類學層級結構
 */

/**
 * 分類學階層等級
 */
export type TaxonomyRank = 'kingdom' | 'phylum' | 'class' | 'order' | 'family' | 'genus' | 'species'

/**
 * 分類學階層資訊
 */
export interface ITaxonomyRank {
    /** 階層等級 */
    rank: TaxonomyRank
    /** 中文名稱 */
    nameZh: string
    /** 英文名稱 */
    nameEn: string
    /** 學名 (拉丁文) */
    scientificName?: string
}

/**
 * 完整分類學資訊
 * 包含從界到種的完整分類路徑
 */
export interface ITaxonomy {
    /** 界 Kingdom */
    kingdom?: ITaxonomyRank
    /** 門 Phylum (如: 節肢動物門 Arthropoda) */
    phylum?: ITaxonomyRank
    /** 綱 Class (如: 三葉蟲綱 Trilobita) */
    class?: ITaxonomyRank
    /** 目 Order */
    order?: ITaxonomyRank
    /** 科 Family */
    family?: ITaxonomyRank
    /** 屬 Genus */
    genus?: ITaxonomyRank
    /** 種 Species */
    species?: ITaxonomyRank
}

/**
 * 分類學階層的中文對照
 */
export const TAXONOMY_RANK_LABELS: Record<TaxonomyRank, { zh: string; en: string }> = {
    kingdom: { zh: '界', en: 'Kingdom' },
    phylum: { zh: '門', en: 'Phylum' },
    class: { zh: '綱', en: 'Class' },
    order: { zh: '目', en: 'Order' },
    family: { zh: '科', en: 'Family' },
    genus: { zh: '屬', en: 'Genus' },
    species: { zh: '種', en: 'Species' },
}

/**
 * 分類學階層順序 (從大到小)
 */
export const TAXONOMY_RANK_ORDER: TaxonomyRank[] = [
    'kingdom',
    'phylum',
    'class',
    'order',
    'family',
    'genus',
    'species',
]

