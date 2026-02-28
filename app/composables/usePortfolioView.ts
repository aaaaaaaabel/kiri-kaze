import { ref, readonly } from 'vue'

type ViewMode = 'grid' | 'image'

const viewMode = ref<ViewMode>('grid')

export const usePortfolioView = () => {
    const toggleView = () => {
        viewMode.value = viewMode.value === 'grid' ? 'image' : 'grid'
    }

    const isGridView = () => viewMode.value === 'grid'
    const isImageView = () => viewMode.value === 'image'

    return {
        viewMode: readonly(viewMode),
        toggleView,
        isGridView,
        isImageView,
    }
}

