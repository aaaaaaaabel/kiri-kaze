/**
 * 作品集專案 Composable（mock 版本）
 * Firebase 連不上期間，讀取 data/mock/projects.json 取代 Firestore。
 * 對外函式簽名與 useProjects 完全一致。
 */

import type { IProject, ProjectCategory } from "~/types/portfolio";
import type { SortDirection, IPaginationOptions } from "~/types/common";
import rawProjects from "~~/data/mock/projects.json";

type MockProjectSortOption = "createdAt" | "updatedAt" | "period";

interface IMockFetchProjectsOptions extends IPaginationOptions {
  sortBy?: MockProjectSortOption;
  sortDirection?: SortDirection;
  category?: ProjectCategory;
  featuredOnly?: boolean;
  publicOnly?: boolean;
}

const projectsStore: IProject[] = rawProjects as unknown as IProject[];

/**
 * 使用作品集專案資料的 Composable（mock 版本）
 */
export const useMockProjects = () => {
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const projects = ref<IProject[]>([]);
  const currentProject = ref<IProject | null>(null);

  /** 取得專案列表 */
  const fetchProjects = async (options: IMockFetchProjectsOptions = {}): Promise<IProject[]> => {
    loading.value = true;
    error.value = null;
    try {
      const { pageSize = 20, category, featuredOnly = false, publicOnly = true, lastDocId } = options;

      let result = projectsStore.filter((p) => (publicOnly ? p.isPublic !== false : true));
      if (featuredOnly) result = result.filter((p) => p.featured);
      if (category) result = result.filter((p) => p.category === category);

      if (lastDocId) {
        const cursorIndex = result.findIndex((p) => p.id === lastDocId);
        if (cursorIndex >= 0) result = result.slice(cursorIndex + 1);
      }
      if (pageSize) result = result.slice(0, pageSize);

      projects.value = result;
      return result;
    } finally {
      loading.value = false;
    }
  };

  /** 依 slug 取得單筆專案 */
  const fetchProjectBySlug = async (slug: string): Promise<IProject | null> => {
    const project = projectsStore.find((p) => p.slug === slug) ?? null;
    currentProject.value = project;
    if (!project) error.value = new Error(`找不到 slug 為 ${slug} 的專案`);
    return project;
  };

  /** 依 ID 取得單筆專案 */
  const fetchProjectById = async (id: string): Promise<IProject | null> => {
    const project = projectsStore.find((p) => p.id === id) ?? null;
    currentProject.value = project;
    if (!project) error.value = new Error(`找不到 ID 為 ${id} 的專案`);
    return project;
  };

  /** 新增專案（僅記憶體內新增，不落地） */
  const createProject = async (data: Partial<IProject>): Promise<string> => {
    const id = data.id ?? data.slug ?? `mock-${projectsStore.length + 1}`;
    const now = new Date();
    projectsStore.push({ ...data, id, createdAt: now, updatedAt: now } as IProject);
    return id;
  };

  /** 更新專案（僅記憶體內更新，不落地） */
  const updateProject = async (id: string, data: Partial<IProject>): Promise<void> => {
    const index = projectsStore.findIndex((p) => p.id === id);
    if (index === -1) return;
    projectsStore[index] = { ...projectsStore[index], ...data, updatedAt: new Date() } as IProject;
    if (currentProject.value?.id === id) currentProject.value = projectsStore[index]!;
  };

  /** 刪除專案（僅記憶體內刪除，不落地） */
  const deleteProject = async (id: string): Promise<void> => {
    const index = projectsStore.findIndex((p) => p.id === id);
    if (index !== -1) projectsStore.splice(index, 1);
    projects.value = projects.value.filter((p) => p.id !== id);
    if (currentProject.value?.id === id) currentProject.value = null;
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    projects.value = [];
    currentProject.value = null;
    error.value = null;
    loading.value = false;
  };

  /** 保留與 useProjects 相同的介面，mock 模式下永遠立即 resolve */
  const waitForFirestore = () => Promise.resolve();

  return {
    projects: readonly(projects),
    currentProject: readonly(currentProject),
    loading: readonly(loading),
    error: readonly(error),
    fetchProjects,
    fetchProjectBySlug,
    fetchProjectById,
    createProject,
    updateProject,
    deleteProject,
    clearError,
    reset,
    waitForFirestore,
  };
};
