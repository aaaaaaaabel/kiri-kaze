<template>
  <div class="species-page">
    <!-- Loading -->
    <LoadingSpinner v-if="loading" full-height />

    <!-- Error -->
    <div v-else-if="error" class="species-page__error">
      <h2>找不到此物種</h2>
      <p>{{ error.message }}</p>
      <NuxtLink to="/" class="back-button">返回首頁</NuxtLink>
    </div>

    <!-- Content -->
    <div
      v-else-if="species && specimens.length > 0"
      class="species-page__content"
    >
      <!-- 頂部標題 -->
      <header class="species-header">
        <NuxtLink to="/" class="back-link">返回首頁</NuxtLink>
        <h1 class="species-title">{{ species.name.scientific }}</h1>
      </header>

      <!-- 國家 Tabs（從資料庫自動生成） -->
      <div v-if="countryTabs && countryTabs.length > 0" class="country-tabs">
        <button
          v-for="country in countryTabs"
          :key="country"
          class="country-tab-btn"
          :class="[{ active: activeCountry === country }]"
          @click="switchCountry(country)"
        >
          {{ country }}
        </button>
      </div>

      <div class="species-layout">
        <!-- 左側: 大圖 + 輪播 -->
        <div class="species-main">
          <!-- 大圖區 -->
          <div class="main-image">
            <img
              v-if="currentImage?.url"
              :src="currentImage.url"
              :alt="currentImage.caption || species?.name?.zh || '化石圖片'"
            >
            <div v-else class="no-image-placeholder">
              <p>暫無圖片</p>
            </div>
          </div>

          <!-- 縮圖輪播 -->
          <div v-if="allImages.length > 1" class="thumbnail-carousel">
            <button
              v-for="(img, index) in allImages"
              :key="index"
              class="thumbnail-btn"
              :class="[
                { active: currentImageIndex === index },
              ]"
              @click="currentImageIndex = index"
            >
              <img :src="img.url" :alt="img.caption" >
            </button>
          </div>
        </div>

        <!-- 右側: Tabs + 資訊 -->
        <div class="species-sidebar">
          <!-- 產區 Tabs（第一層）- 只有多個產區時才顯示 -->
          <div
            v-if="Object.keys(groupedByLocation).length > 1"
            class="location-tabs"
          >
            <button
              v-for="(locationSpecimens, locationKey) in groupedByLocation"
              :key="locationKey"
              class="location-tab-btn"
              :class="[
                { active: activeLocation === locationKey },
              ]"
              @click="switchLocation(locationKey)"
            >
              {{ getLocationDisplayName(locationKey) }}
              <span class="specimen-count">
                ({{ locationSpecimens?.length || 0 }})
              </span>
            </button>
          </div>

          <!-- 內容區 -->
          <div class="content">
            <!-- 概述內容 -->
            <div v-if="activeTab === 'overview'" class="overview-content">
              <section class="content-section">
                <h2>物種描述</h2>
                <p>{{ species.description.zh }}</p>
              </section>

              <section class="content-section">
                <h2>分類資訊</h2>
                <table class="info-table">
                  <tbody>
                    <tr>
                      <td>界</td>
                      <td>{{ species.taxonomy.kingdom }}</td>
                    </tr>
                    <tr>
                      <td>門</td>
                      <td>{{ species.taxonomy.phylum }}</td>
                    </tr>
                    <tr>
                      <td>綱</td>
                      <td>{{ species.taxonomy.class }}</td>
                    </tr>
                    <tr>
                      <td>目</td>
                      <td>{{ species.taxonomy.order }}</td>
                    </tr>
                    <tr>
                      <td>科</td>
                      <td>{{ species.taxonomy.family }}</td>
                    </tr>
                    <tr>
                      <td>屬</td>
                      <td>{{ species.taxonomy.genus }}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section v-if="species.characteristics" class="content-section">
                <h2>特徵</h2>
                <p>{{ species.characteristics }}</p>
              </section>

              <section v-if="species.habitat" class="content-section">
                <h2>棲息地</h2>
                <p>{{ species.habitat }}</p>
              </section>
            </div>

            <!-- 標本內容 -->
            <div v-else-if="currentSpecimen" class="specimen-content">
              <section class="content-section">
                <h2>標本資訊</h2>
                <table class="info-table">
                  <tbody>
                    <tr v-if="currentSpecimen.specimen.bodyPart">
                      <td>類型</td>
                      <td>{{ currentSpecimen.specimen.bodyPart.specific }}</td>
                    </tr>
                    <tr v-if="currentSpecimen.specimen.bodyPart?.position">
                      <td>部位</td>
                      <td>{{ currentSpecimen.specimen.bodyPart.position }}</td>
                    </tr>
                    <tr>
                      <td>完整度</td>
                      <td>{{ currentSpecimen.specimen.completeness }}%</td>
                    </tr>
                    <tr>
                      <td>保存狀態</td>
                      <td>
                        {{
                          getConditionLabel(currentSpecimen.specimen.condition)
                        }}
                      </td>
                    </tr>
                    <tr v-if="currentSpecimen.specimen.catalogNumber">
                      <td>館藏編號</td>
                      <td>{{ currentSpecimen.specimen.catalogNumber }}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section
                v-if="currentSpecimen.specimen.measurements"
                class="content-section"
              >
                <h2>尺寸</h2>
                <table class="info-table">
                  <tbody>
                    <tr v-if="currentSpecimen.specimen.measurements.length">
                      <td>長度</td>
                      <td>
                        {{ currentSpecimen.specimen.measurements.length }} cm
                      </td>
                    </tr>
                    <tr v-if="currentSpecimen.specimen.measurements.width">
                      <td>寬度</td>
                      <td>
                        {{ currentSpecimen.specimen.measurements.width }} cm
                      </td>
                    </tr>
                    <tr v-if="currentSpecimen.specimen.measurements.height">
                      <td>高度</td>
                      <td>
                        {{ currentSpecimen.specimen.measurements.height }} cm
                      </td>
                    </tr>
                    <tr v-if="currentSpecimen.specimen.measurements.weight">
                      <td>重量</td>
                      <td>
                        {{ currentSpecimen.specimen.measurements.weight }} g
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section
                v-if="currentSpecimen.specimen.location"
                class="content-section"
              >
                <h2>產地資訊</h2>
                <p
                  v-if="
                    currentSpecimen.specimen.location.state &&
                    currentSpecimen.specimen.location.country
                  "
                >
                  {{ currentSpecimen.specimen.location.state }},
                  {{ currentSpecimen.specimen.location.country }}
                </p>
                <p v-if="currentSpecimen.specimen.location.formation">
                  地層: {{ currentSpecimen.specimen.location.formation }}
                </p>
                <p v-if="currentSpecimen.specimen.collectionDate">
                  發現日期: {{ currentSpecimen.specimen.collectionDate }}
                </p>
              </section>

              <section
                v-if="currentSpecimen.description?.zh"
                class="content-section"
              >
                <h2>標本描述</h2>
                <p>{{ currentSpecimen.description.zh }}</p>
              </section>
            </div>
          </div>

          <!-- Tabs 區 -->
          <div class="tabs">
            <!-- 概述 Tab -->
            <button
              class="tab-btn"
              :class="[{ active: activeTab === 'overview' }]"
              @click="switchTab('overview')"
            >
              概述
            </button>

            <!-- 標本 Tabs (按部位分組) -->
            <template
              v-for="(group, groupName) in groupedSpecimens"
              :key="groupName"
            >
              <!-- ⭐ 防呆：只有當群組有標本時才顯示 -->
              <div v-if="group && group.length > 0" class="tab-group">
                <div class="tab-group-label">
                  {{ getBodyPartLabel(groupName) }}
                </div>
                <button
                  v-for="specimen in group"
                  :key="specimen.id"
                  class="tab-btn tab-btn--specimen"
                  :class="[
                    { active: activeTab === specimen.id },
                  ]"
                  @click="switchTab(specimen.id)"
                >
                  {{ getSpecimenLabel(specimen) }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick } from "vue";
import type { ISpecies, IFossil } from "~/types/fossil";
import { useSpecies } from "~/composables/useSpecies";
import { useFossils } from "~/composables/useFossils";
import { useMedia } from "~/composables/useMedia";
import { useWidgetsBlocksEvents } from "~/composables/useWidgetsBlocksEvents";
import LoadingSpinner from "~/components/ui/LoadingSpinner.vue";

const route = useRoute();
const router = useRouter();

// Server API composables
const { fetchSpeciesBySlug, fetchSpeciesByCode } = useSpecies();
const { fetchFossilsBySpeciesSlug, fetchFossilByCode } =
  useFossils();
const { toMediaUrl } = useMedia();

// 狀態
const species = ref<ISpecies | null>(null);
const specimens = ref<IFossil[]>([]);
const loading = ref(true);
const error = ref<Error | null>(null);

// 當前選中的 Tab (overview 或標本 ID)
const activeTab = ref<string>("overview");

// 當前選中的產區
const activeLocation = ref<string | null>(null);

// 當前選中的國家
const activeCountry = ref<string | null>(null);

// 當前圖片索引
const currentImageIndex = ref(0);

// 從 route 取得 slug（Nuxt 3 有時 params.slug 為 undefined，改從 path 解析備援）
const slugParam = computed(() => {
  const p = route.params.slug;
  if (p != null && p !== "") {
    const s = Array.isArray(p) ? p[0] : p;
    if (s && String(s).trim()) return String(s).trim();
  }
  const path = route.path || "";
  const match = path.match(/^\/species\/?([^/?#]+)/);
  return match && match[1] ? decodeURIComponent(match[1]) : "";
});

// 載入資料 - 增強防呆版本
const loadData = async (slug: string) => {
  loading.value = true;
  error.value = null;

  try {
    // ⭐ 優先使用 code query parameter
    const code = route.query.code as string | undefined;

    let foundSpecies: ISpecies | null = null;
    let speciesSlug = slug;

    if (code) {
      // 使用 code 查詢
      foundSpecies = await fetchSpeciesByCode(code);
      if (foundSpecies) {
        speciesSlug = foundSpecies.slug;
        // 如果 path 中的 slug 與查詢到的不同，更新 URL
        if (slug !== speciesSlug) {
          await router.replace({
            path: `/species/${speciesSlug}`,
            query: { code },
          });
        }
      }
    }

    // 如果 code 查詢失敗或沒有 code，使用 slug
    if (!foundSpecies) {
      // ⭐ 防呆：檢查 slug
      if (!slug || !slug.trim()) {
        throw new Error("無效的 slug");
      }

      foundSpecies = await fetchSpeciesBySlug(slug);
      if (!foundSpecies) {
        throw new Error(`找不到 slug 為 ${slug} 的物種`);
      }
      speciesSlug = slug;
    }

    species.value = foundSpecies;

    // 查詢該物種的所有標本（從 server API）
    const foundSpecimens = await fetchFossilsBySpeciesSlug(speciesSlug);

    // ⭐ 防呆：允許沒有標本的情況（顯示空狀態）
    if (foundSpecimens.length === 0) {
      specimens.value = [];
      activeTab.value = "overview";
      activeLocation.value = null;
      // 不拋出錯誤，只顯示空狀態
      return;
    }

    // 轉換圖片 URL
    const convertedSpecimens = foundSpecimens.map((specimen) => ({
      ...specimen,
      thumbnail:
        specimen.thumbnail?.startsWith("http") ||
        specimen.thumbnail?.startsWith("/")
          ? specimen.thumbnail
          : toMediaUrl(specimen.thumbnail || ""),
      images: specimen.images?.map((img) => ({
        ...img,
        url:
          img.url?.startsWith("http") || img.url?.startsWith("/")
            ? img.url
            : toMediaUrl(img.url || ""),
      })),
    }));

    specimens.value = convertedSpecimens;

    // ⭐ 初始化國家選擇（如果有國家 tabs）
    await nextTick();
    if (countryTabs.value.length > 0 && !activeCountry.value) {
      // 預設選擇第一個國家
      activeCountry.value = countryTabs.value[0] || null;
    }

    // ⭐ 確保 activeLocation 被初始化（使用 nextTick 確保 computed 已更新）
    if (
      Object.keys(groupedByLocation.value).length > 0 &&
      !activeLocation.value
    ) {
      const firstLocation =
        Object.keys(groupedByLocation.value).find((key) => key !== "unknown") ||
        Object.keys(groupedByLocation.value)[0];
      activeLocation.value = firstLocation || null;
    }

    // ⭐ 防呆：處理預選的標本
    const specimenIdFromQuery = route.query.specimen as string;
    const specimenCodeFromQuery = route.query.code as string;

    if (specimenCodeFromQuery) {
      // 優先使用 code 查找標本
      const foundSpecimen = await fetchFossilByCode(specimenCodeFromQuery);
      if (foundSpecimen && foundSpecimen.speciesRef?.slug === speciesSlug) {
        activeTab.value = foundSpecimen.id || foundSpecimen.slug;
      } else {
        activeTab.value = "overview";
      }
    } else if (specimenIdFromQuery) {
      // 使用 ID 查找標本
      const foundSpecimen = convertedSpecimens.find(
        (s) => s.id === specimenIdFromQuery || s.slug === specimenIdFromQuery,
      );
      if (foundSpecimen && foundSpecimen.speciesRef?.slug === speciesSlug) {
        activeTab.value = foundSpecimen.id || foundSpecimen.slug;
      } else {
        activeTab.value = "overview";
      }
    } else {
      activeTab.value = "overview";
    }

    // 重置圖片索引
    currentImageIndex.value = 0;
  } catch (err) {
    error.value = err as Error;
  } finally {
    loading.value = false;
    // 標記頁面載入完成
    const { toggleWidgetsBlockComplete } = useWidgetsBlocksEvents();
    toggleWidgetsBlockComplete(true);
  }
};

// Watch 路由變化（使用 slugParam 以支援 params 為空時從 path 解析）
// 僅在 client 執行 loadData：SSR 時 useSpecies/useFossils 為 stub 會回傳 null，導致誤顯示「找不到此物種」
watch(
  slugParam,
  (newSlug) => {
    if (!newSlug) {
      loading.value = false;
      error.value = new Error("無效的網址：缺少物種 slug");
      return;
    }
    if (import.meta.client) {
      loadData(newSlug);
    }
  },
  { immediate: true },
);

// Watch query 變化 (Tab 切換)
watch(
  () => [route.query.code, route.query.specimen],
  async ([code, specimenId]) => {
    if (code) {
      // 使用 code 查找標本
      const foundSpecimen = await fetchFossilByCode(code as string);
      if (foundSpecimen) {
        activeTab.value = foundSpecimen.id || foundSpecimen.slug;
        currentImageIndex.value = 0;
      }
    } else if (!specimenId) {
      activeTab.value = "overview";
    }
  },
);

// 切換 Tab
const switchTab = async (tabId: string) => {
  if (tabId === "overview") {
    // 切換到概述,移除 query
    router.replace({ query: {} });
  } else {
    // 找到對應的標本，使用 shortCode
    const foundSpecimen = specimens.value.find(
      (s) => s.id === tabId || s.slug === tabId,
    );
    const code = foundSpecimen?.shortCode || foundSpecimen?.id;

    if (code) {
      // 使用 code 更新 query
      router.replace({
        path: `/species/${species.value?.slug || slugParam.value}`,
        query: { code },
      });
    } else {
      // 如果沒有 shortCode，使用舊的方式
      router.replace({ query: { specimen: tabId } });
    }
  }

  activeTab.value = tabId;
  currentImageIndex.value = 0;
};

// 從標本中提取唯一的國家列表 - 自動生成
const countryTabs = computed(() => {
  const countries = new Set<string>();

  if (!specimens.value || specimens.value.length === 0) {
    return [];
  }

  specimens.value.forEach((specimen) => {
    const country = specimen?.specimen?.location?.country;
    if (country && country.trim()) {
      countries.add(country.trim());
    }
  });

  const result = Array.from(countries).sort();
  return result;
});

// 根據選中的國家過濾標本
const filteredSpecimens = computed(() => {
  if (!activeCountry.value) {
    return specimens.value;
  }

  return specimens.value.filter((specimen) => {
    return specimen?.specimen?.location?.country === activeCountry.value;
  });
});

// 切換國家
const switchCountry = (country: string) => {
  activeCountry.value = country;
  activeTab.value = "overview"; // 切換國家時重置到概述
  activeLocation.value = null; // 重置產區選擇
  currentImageIndex.value = 0;
};

// 按產區分組標本（第一層）- 使用過濾後的標本
const groupedByLocation = computed(() => {
  const groups: Record<string, IFossil[]> = {};

  // ⭐ 使用過濾後的標本
  const specimensToGroup = filteredSpecimens.value;

  // ⭐ 防呆：檢查標本陣列
  if (!specimensToGroup || specimensToGroup.length === 0) {
    return groups;
  }

  specimensToGroup.forEach((specimen) => {
    // ⭐ 防呆：確保 specimen 和 location 存在
    if (!specimen?.specimen?.location) {
      // 沒有 location 的標本歸類到 "unknown"
      const key = "unknown";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(specimen);
      return;
    }

    // 取得產區 key
    const locationKey = getLocationKey(specimen);

    if (!groups[locationKey]) {
      groups[locationKey] = [];
    }
    groups[locationKey].push(specimen);
  });

  return groups;
});

// 取得產區 key - 防呆版本
const getLocationKey = (specimen: IFossil): string => {
  const loc = specimen?.specimen?.location;
  if (!loc) return "unknown";

  // 優先使用 locationId
  if (loc.locationId && loc.locationId.trim()) {
    return loc.locationId.trim();
  }

  // 如果沒有 locationId，組合現有資訊
  const parts = [loc.country, loc.state, loc.formation].filter(
    (part) => part && part.trim(),
  ); // ⭐ 過濾空字串

  return parts.length > 0 ? parts.join("-") : "unknown";
};

// 取得產區顯示名稱 - 防呆版本
const getLocationDisplayName = (locationKey: string): string => {
  // ⭐ 防呆：檢查是否有該產區的標本
  const specimens = groupedByLocation.value[locationKey];
  if (!specimens || specimens.length === 0) {
    return "未知產區";
  }

  // 從第一個標本取得 location 資訊
  const firstSpecimen = specimens[0];
  if (!firstSpecimen?.specimen?.location) {
    return "未知產區";
  }

  const loc = firstSpecimen.specimen.location;

  // 優先使用 displayName
  if (loc.displayName && loc.displayName.trim()) {
    return loc.displayName.trim();
  }

  // 組合顯示名稱
  const parts = [loc.country, loc.state, loc.formation].filter(
    (part) => part && part.trim(),
  ); // ⭐ 過濾空字串

  if (parts.length === 0) {
    return locationKey === "unknown" ? "未知產區" : locationKey;
  }

  return parts.join(", ");
};

// 初始化產區選擇
watch(
  () => groupedByLocation.value,
  (groups) => {
    if (Object.keys(groups).length > 0) {
      // 如果還沒有選中產區，優先選擇第一個非 "unknown" 的產區
      if (!activeLocation.value) {
        const firstLocation =
          Object.keys(groups).find((key) => key !== "unknown") ||
          Object.keys(groups)[0];
        activeLocation.value = firstLocation || null;
      }
      // ⭐ 如果當前選中的產區不存在，重新選擇
      else if (!groups[activeLocation.value]) {
        const firstLocation =
          Object.keys(groups).find((key) => key !== "unknown") ||
          Object.keys(groups)[0];
        activeLocation.value = firstLocation || null;
      }
    }
  },
  { immediate: true },
);

// 當前產區的標本 - 防呆（基於過濾後的標本）
const currentLocationSpecimens = computed(() => {
  if (!activeLocation.value) {
    // 如果沒有選中產區，返回第一個產區的標本
    const firstLocation = Object.keys(groupedByLocation.value)[0];
    return firstLocation ? groupedByLocation.value[firstLocation] : [];
  }

  const specimens = groupedByLocation.value[activeLocation.value];
  return specimens || [];
});

// 切換產區 - 防呆版本
const switchLocation = (locationKey: string) => {
  // ⭐ 防呆：檢查產區是否存在
  if (!groupedByLocation.value[locationKey]) {
    return;
  }

  activeLocation.value = locationKey;
  activeTab.value = "overview"; // 切換產區時重置到概述
  currentImageIndex.value = 0;
};

// 當前標本
const currentSpecimen = computed(() => {
  if (activeTab.value === "overview") return null;
  return specimens.value.find((s) => s.id === activeTab.value);
});

// 合併 thumbnail 和 images 陣列，生成完整的圖片列表
const allImages = computed(() => {
  if (activeTab.value === "overview") {
    // 概述 Tab: 使用第一個標本的圖片
    const firstSpecimen = currentLocationSpecimens.value?.[0];
    if (!firstSpecimen) return [];

    const images: Array<{
      url: string;
      caption?: string;
      type?: string;
      order?: number;
    }> = [];

    // 如果有 thumbnail，加入作為第一張
    if (firstSpecimen.thumbnail) {
      images.push({
        url: firstSpecimen.thumbnail,
        caption: firstSpecimen.speciesRef?.name?.zh || "標本縮圖",
        type: "thumbnail",
        order: 0,
      });
    }

    // 加入其他圖片
    if (firstSpecimen.images && firstSpecimen.images.length > 0) {
      images.push(...firstSpecimen.images);
    }

    return images;
  } else {
    // 標本 Tab: 使用當前標本的圖片
    if (!currentSpecimen.value) return [];

    const images: Array<{
      url: string;
      caption?: string;
      type?: string;
      order?: number;
    }> = [];

    // 如果有 thumbnail，加入作為第一張
    if (currentSpecimen.value.thumbnail) {
      images.push({
        url: currentSpecimen.value.thumbnail,
        caption: currentSpecimen.value.speciesRef?.name?.zh || "標本縮圖",
        type: "thumbnail",
        order: 0,
      });
    }

    // 加入其他圖片
    if (
      currentSpecimen.value.images &&
      currentSpecimen.value.images.length > 0
    ) {
      images.push(...currentSpecimen.value.images);
    }

    return images;
  }
});

// 當前圖片 - 增強防呆版本（使用合併後的圖片列表）
const currentImage = computed(() => {
  if (activeTab.value === "overview") {
    // 概述 Tab: 顯示物種代表圖或第一個標本的圖
    if (species.value?.representativeImage) {
      return {
        url: species.value.representativeImage,
        caption: species.value.name?.zh || "物種代表圖",
      };
    }

    // 使用合併後的圖片列表
    const images = allImages.value;
    if (images.length > 0) {
      const index = Math.max(
        0,
        Math.min(currentImageIndex.value, images.length - 1),
      );
      return images[index] || images[0] || null;
    }

    return null;
  } else {
    // 標本 Tab: 顯示該標本的當前圖片
    const images = allImages.value;
    if (images.length === 0) {
      return null;
    }

    // ⭐ 防呆：確保索引有效
    const index = Math.max(
      0,
      Math.min(currentImageIndex.value, images.length - 1),
    );
    return images[index] || images[0] || null;
  }
});

// ⭐ 防呆：確保圖片索引不超出範圍
watch(
  () =>
    [allImages.value, currentImageIndex.value] as [
      Array<{ url: string; caption?: string }>,
      number,
    ],
  ([images, index]) => {
    if (images && images.length > 0 && typeof index === "number") {
      const maxIndex = images.length - 1;
      if (index > maxIndex) {
        currentImageIndex.value = Math.max(0, maxIndex);
      }
    }
  },
);

// 按部位分組當前產區的標本（第二層）- 防呆版本
const groupedSpecimens = computed(() => {
  const groups: Record<string, IFossil[]> = {};

  // ⭐ 防呆：檢查是否有標本
  if (
    !currentLocationSpecimens.value ||
    currentLocationSpecimens.value.length === 0
  ) {
    return groups;
  }

  currentLocationSpecimens.value.forEach((specimen) => {
    // ⭐ 防呆：確保 specimen 存在
    if (!specimen?.specimen) {
      return;
    }

    // 取得部位類型
    const partType = specimen.specimen.bodyPart?.specific || "complete";

    if (!groups[partType]) {
      groups[partType] = [];
    }
    groups[partType].push(specimen);
  });

  return groups;
});

// 工具函數: 取得部位標籤
const getBodyPartLabel = (partType: string): string => {
  const labels: Record<string, string> = {
    tooth: "牙齒",
    claw: "爪",
    femur: "股骨",
    skull: "頭骨",
    vertebra: "脊椎",
    rib: "肋骨",
    complete: "完整標本",
  };
  return labels[partType] || partType;
};

// 工具函數: 取得標本標籤 - 增強防呆
const getSpecimenLabel = (specimen: IFossil): string => {
  // ⭐ 防呆：確保 specimen 存在
  if (!specimen) {
    return "未知標本";
  }

  // 優先使用館藏編號
  if (specimen.specimen?.catalogNumber?.trim()) {
    return specimen.specimen.catalogNumber.trim();
  }

  // 使用部位描述
  if (specimen.specimen?.bodyPart?.position?.trim()) {
    return specimen.specimen.bodyPart.position.trim();
  }

  // 使用 ID 後4碼（防呆：確保 ID 存在）
  if (specimen.id && specimen.id.length >= 4) {
    return `標本 #${specimen.id.slice(-4)}`;
  }

  return "標本";
};

// 工具函數: 取得保存狀態標籤
const getConditionLabel = (condition: string): string => {
  const labels: Record<string, string> = {
    excellent: "優秀",
    good: "良好",
    fair: "尚可",
    poor: "較差",
  };
  return labels[condition] || condition;
};

// SEO Meta
useHead(() => ({
  title: species.value
    ? `${species.value.name.zh} (${species.value.name.scientific})`
    : "Fossil Index",
}));
</script>

<style scoped lang="scss">
@use "~/assets/styles/abstracts" as *;
@use "sass:color";

.species-page {
  min-height: 100vh;
  padding-top: 80px;
  background: var(--lc-color-gray-light);

  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: var(--lc-space-lg);
    text-align: center;
  }

  &__content {
    max-width: 1200px;
    padding: 0 var(--lc-space-sm) var(--lc-space-lg);
    margin: 0 auto;
  }
}

.species-header {
  padding: var(--lc-space-sm) 0 var(--lc-space-lg);
  text-align: center;

  .back-link {
    display: inline-block;
    margin-bottom: var(--lc-space-sm);
    font-size: 14px;
    color: $lc-color-black;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .species-title {
    margin: 0 0 8px;
    font-size: 2.5rem;
    font-style: italic;
    font-weight: 700;
    color: var(--lc-color-text-soft);
  }
}

// 國家 Tabs 樣式（參考圖片設計）
.country-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--lc-space-lg);
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: var(--lc-space-sm) 0;
  margin-bottom: var(--lc-space-lg);
  background-color: #1a1a1a; // 深色背景，跟品牌黑色不同色階，保留原樣

  @include tb {
    gap: var(--lc-space-md);
    padding: 16px 0;
  }

  @include sp {
    gap: var(--lc-space-sm);
    padding: 12px 0;
  }

  .country-tab-btn {
    position: relative;
    padding: 8px 0;
    font-family: $lc-font-en;
    font-size: 1rem;
    font-weight: 400;
    color: var(--lc-color-text-subtle); // 灰色文字（未選中）
    cursor: pointer;
    background: transparent;
    border: none;
    transition: color 0.3s ease;

    @include tb {
      font-size: 0.95rem;
    }

    @include sp {
      font-size: 0.9rem;
    }

    &:hover {
      color: var(--lc-color-gray-mid);
    }

    &.active {
      color: var(--lc-color-white); // 白色文字（選中）

      // 綠色底線
      &::after {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        height: 2px;
        content: "";
        background-color: $lc-color-accent;
      }
    }
  }
}

.species-layout {
  display: grid;
  grid-template-columns: 1fr 460px;
  gap: var(--lc-space-lg);

  @include tb {
    grid-template-columns: 1fr;
    gap: var(--lc-space-md);
  }

  @include sp {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

// 左側: 大圖 + 輪播
.species-main {
  .main-image {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin: 0 auto var(--lc-space-sm);
    overflow: hidden;
    @include lc-white-card;

    img {
      display: block;
      width: 100%;
      height: auto;
    }

    .no-image-placeholder {
      padding: 60px var(--lc-space-sm);
      color: var(--lc-color-text-subtle);
      text-align: center;

      p {
        margin: 0;
        font-size: 0.95rem;
      }
    }
  }

  .thumbnail-carousel {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-start;
    padding: 8px 0;
    overflow-x: auto;

    .thumbnail-btn {
      flex-shrink: 0;
      width: 120px;
      height: 120px;
      padding: 0;
      overflow: hidden;
      cursor: pointer;
      background: var(--lc-color-white);
      border: 2px solid transparent;
      border-radius: $lc-radius-xs;
      transition: all var(--lc-transition-quick);

      &:hover {
        border-color: var(--lc-color-gray-mid);
      }

      &.active {
        border-color: $lc-color-black;
        box-shadow: 0 0 0 2px rgba($lc-color-black, 0.2);
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }
}

// 右側: Tabs + 內容
.species-sidebar {
  // 產區 Tabs 樣式
  .location-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 16px;
    margin-bottom: var(--lc-space-sm);
    @include lc-white-card;

    .location-tab-btn {
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 10px 16px;
      font-size: 0.9rem;
      color: var(--lc-color-text-muted);
      cursor: pointer;
      background: transparent;
      border: 1px solid var(--lc-color-border-light);
      border-radius: $lc-radius-xs;
      transition: all var(--lc-transition-quick);

      &:hover {
        background: var(--lc-color-gray-light);
        border-color: var(--lc-color-gray-mid);
      }

      &.active {
        font-weight: 600;
        color: var(--lc-color-white);
        background: $lc-color-black;
        border-color: $lc-color-black;
      }

      .specimen-count {
        font-size: 0.85rem;
        opacity: 0.8;
      }
    }
  }

  .tabs {
    padding: 16px;
    @include lc-white-card;

    .tab-btn {
      width: 100%;
      padding: 12px 16px;
      margin-bottom: 4px;
      font-size: 0.95rem;
      color: var(--lc-color-text-muted);
      text-align: left;
      cursor: pointer;
      background: transparent;
      border: none;
      border-radius: $lc-radius-xs;
      transition: all var(--lc-transition-quick);

      &:hover {
        background: var(--lc-color-gray-light);
      }

      &.active {
        font-weight: 600;
        color: var(--lc-color-white);
        background: $lc-color-black;
      }

      &--specimen {
        padding-left: 32px;
        font-size: 0.9rem;
      }
    }

    .tab-group {
      margin-top: 12px;

      &-label {
        padding: 8px 16px;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--lc-color-text-subtle);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }
  }

  .content {
    padding: 24px;
    margin-bottom: var(--lc-space-sm);
    @include lc-white-card;

    .content-section {
      margin-bottom: 32px;

      &:last-child {
        margin-bottom: 0;
      }

      h2 {
        margin: 0 0 16px;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--lc-color-text-soft);
      }

      p {
        margin: 0;
        line-height: 1.8;
        color: var(--lc-color-text-muted);
      }

      .info-table {
        width: 100%;
        border-collapse: collapse;

        td {
          padding: 10px 12px;
          font-size: 0.95rem;
          border-bottom: 1px solid #eee;

          &:first-child {
            width: 100px;
            font-weight: 600;
            color: var(--lc-color-text-subtle);
          }

          &:last-child {
            color: var(--lc-color-text-soft);
          }
        }

        tr:last-child td {
          border-bottom: none;
        }
      }
    }
  }
}

.back-button {
  display: inline-block;
  padding: 12px 24px;
  margin-top: var(--lc-space-sm);
  color: var(--lc-color-white);
  text-decoration: none;
  background: $lc-color-black;
  border-radius: $lc-radius-xs;
  transition: background var(--lc-transition-quick);

  &:hover {
    background: color.adjust($lc-color-black, $lightness: -10%);
  }
}
</style>
