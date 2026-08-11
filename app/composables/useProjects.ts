/**
 * 作品集專案操作 Composable
 * 資料來源：NuxtHub server API
 */

import type { IProject, ProjectCategory } from "~/types/portfolio";
import type { SortDirection, IPaginationOptions } from "~/types/common";
import type { ApiError } from "~/types/api";
import { apiFetch } from "~/api/client";

/**
 * 排序選項
 */
export type ProjectSortOption = "createdAt" | "updatedAt" | "period";

/**
 * 查詢選項
 */
export interface IFetchProjectsOptions extends IPaginationOptions {
  /** 排序欄位 */
  sortBy?: ProjectSortOption;
  /** 排序方向 */
  sortDirection?: SortDirection;
  /** 專案分類篩選 */
  category?: ProjectCategory;
  /** 是否只顯示精選的專案 */
  featuredOnly?: boolean;
  /** 是否只顯示公開的專案 */
  publicOnly?: boolean;
}

/**
 * 使用作品集專案資料的 Composable
 */
export const useProjects = () => {
  const loading = ref(false);
  const error = ref<ApiError | null>(null);
  const projects = ref<IProject[]>([]);
  const currentProject = ref<IProject | null>(null);

  /**
   * 獲取專案列表
   * @param options 查詢選項
   * @returns 專案陣列
   */
  const fetchProjects = async (options: IFetchProjectsOptions = {}): Promise<IProject[]> => {
    loading.value = true;
    error.value = null;
    try {
      const result = await apiFetch<IProject[]>(
        "/api/projects",
        {
          query: {
            publicOnly: options.publicOnly ?? true,
            featuredOnly: options.featuredOnly ?? false,
            category: options.category,
            sortBy: options.sortBy,
            sortDirection: options.sortDirection,
            pageSize: options.pageSize,
            lastDocId: options.lastDocId,
          },
        },
        "獲取專案列表失敗",
      );
      projects.value = result;
      return result;
    } catch (err) {
      projects.value = [];
      error.value = err as ApiError;
      return [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根據 slug 獲取單筆專案
   * @param slug 專案 slug
   * @returns 專案資料
   */
  const fetchProjectBySlug = async (slug: string): Promise<IProject | null> => {
    loading.value = true;
    error.value = null;
    try {
      const project = await apiFetch<IProject>(`/api/projects/slug/${slug}`, {}, `找不到 slug 為 ${slug} 的專案`);
      currentProject.value = project;
      return project;
    } catch (err) {
      error.value = err as ApiError;
      currentProject.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根據 ID 獲取單筆專案
   * @param id 專案 ID
   * @returns 專案資料
   */
  const fetchProjectById = async (id: string): Promise<IProject | null> => {
    loading.value = true;
    error.value = null;
    try {
      const project = await apiFetch<IProject>(`/api/projects/${id}`, {}, `找不到 ID 為 ${id} 的專案`);
      currentProject.value = project;
      return project;
    } catch (err) {
      error.value = err as ApiError;
      currentProject.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 清除錯誤狀態
   */
  const clearError = () => {
    error.value = null;
  };

  /**
   * 重置狀態
   */
  const reset = () => {
    projects.value = [];
    currentProject.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    // 狀態
    projects: readonly(projects),
    currentProject: readonly(currentProject),
    loading: readonly(loading),
    error: readonly(error),

    // 方法
    fetchProjects,
    fetchProjectBySlug,
    fetchProjectById,
    clearError,
    reset,
  };
};
