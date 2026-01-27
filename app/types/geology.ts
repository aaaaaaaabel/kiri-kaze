/**
 * 地質年代相關型別定義
 * 用於化石的地質年代分類
 */

/**
 * 地質年代階層等級
 */
export type GeologicalRank = 'eon' | 'era' | 'period' | 'epoch'

/**
 * 宙 Eon (最長的地質時間單位)
 */
export type GeologicalEon = 'phanerozoic' | 'proterozoic' | 'archean' | 'hadean'

/**
 * 代 Era (宙下的次級單位)
 */
export type GeologicalEra = 'paleozoic' | 'mesozoic' | 'cenozoic' | 'neoproterozoic' | 'mesoproterozoic' | 'paleoproterozoic'

/**
 * 紀 Period (代下的次級單位)
 */
export type GeologicalPeriod =
    | 'cambrian'
    | 'ordovician'
    | 'silurian'
    | 'devonian'
    | 'carboniferous'
    | 'permian'
    | 'triassic'
    | 'jurassic'
    | 'cretaceous'
    | 'paleogene'
    | 'neogene'
    | 'quaternary'

/**
 * 世 Epoch (紀下的次級單位)
 */
export type GeologicalEpoch =
    | 'terreneuvian'
    | 'series2'
    | 'miaolingian'
    | 'furongian'
    | 'lower'
    | 'middle'
    | 'upper'
    | 'paleocene'
    | 'eocene'
    | 'oligocene'
    | 'miocene'
    | 'pliocene'
    | 'pleistocene'
    | 'holocene'

/**
 * 地質年代階層資訊
 */
export interface IGeologicalRank {
    /** 階層等級 */
    rank: GeologicalRank
    /** 中文名稱 */
    nameZh: string
    /** 英文名稱 */
    nameEn: string
    /** 開始時間 (百萬年前 Ma) */
    startMa?: number
    /** 結束時間 (百萬年前 Ma) */
    endMa?: number
}

/**
 * 完整地質年代資訊
 * 包含從宙到世的完整地質年代路徑
 */
export interface IGeologicalAge {
    /** 宙 Eon (如: Phanerozoic 顯生宙) */
    eon?: IGeologicalRank & { value: GeologicalEon }
    /** 代 Era (如: Paleozoic 古生代, Mesozoic 中生代, Cenozoic 新生代) */
    era?: IGeologicalRank & { value: GeologicalEra }
    /** 紀 Period (如: Cambrian 寒武紀, Jurassic 侏羅紀, Cretaceous 白堊紀) */
    period?: IGeologicalRank & { value: GeologicalPeriod }
    /** 世 Epoch */
    epoch?: IGeologicalRank & { value: GeologicalEpoch }
}

/**
 * 地質年代階層的中文對照
 */
export const GEOLOGICAL_RANK_LABELS: Record<GeologicalRank, { zh: string; en: string }> = {
    eon: { zh: '宙', en: 'Eon' },
    era: { zh: '代', en: 'Era' },
    period: { zh: '紀', en: 'Period' },
    epoch: { zh: '世', en: 'Epoch' },
}

/**
 * 地質年代階層順序 (從大到小)
 */
export const GEOLOGICAL_RANK_ORDER: GeologicalRank[] = ['eon', 'era', 'period', 'epoch']

/**
 * 常見地質年代的對照表
 */
export const GEOLOGICAL_EON_LABELS: Record<GeologicalEon, { zh: string; en: string }> = {
    phanerozoic: { zh: '顯生宙', en: 'Phanerozoic' },
    proterozoic: { zh: '元古宙', en: 'Proterozoic' },
    archean: { zh: '太古宙', en: 'Archean' },
    hadean: { zh: '冥古宙', en: 'Hadean' },
}

export const GEOLOGICAL_ERA_LABELS: Record<GeologicalEra, { zh: string; en: string }> = {
    paleozoic: { zh: '古生代', en: 'Paleozoic' },
    mesozoic: { zh: '中生代', en: 'Mesozoic' },
    cenozoic: { zh: '新生代', en: 'Cenozoic' },
    neoproterozoic: { zh: '新元古代', en: 'Neoproterozoic' },
    mesoproterozoic: { zh: '中元古代', en: 'Mesoproterozoic' },
    paleoproterozoic: { zh: '古元古代', en: 'Paleoproterozoic' },
}

export const GEOLOGICAL_PERIOD_LABELS: Record<GeologicalPeriod, { zh: string; en: string }> = {
    cambrian: { zh: '寒武紀', en: 'Cambrian' },
    ordovician: { zh: '奧陶紀', en: 'Ordovician' },
    silurian: { zh: '志留紀', en: 'Silurian' },
    devonian: { zh: '泥盆紀', en: 'Devonian' },
    carboniferous: { zh: '石炭紀', en: 'Carboniferous' },
    permian: { zh: '二疊紀', en: 'Permian' },
    triassic: { zh: '三疊紀', en: 'Triassic' },
    jurassic: { zh: '侏羅紀', en: 'Jurassic' },
    cretaceous: { zh: '白堊紀', en: 'Cretaceous' },
    paleogene: { zh: '古近紀', en: 'Paleogene' },
    neogene: { zh: '新近紀', en: 'Neogene' },
    quaternary: { zh: '第四紀', en: 'Quaternary' },
}

