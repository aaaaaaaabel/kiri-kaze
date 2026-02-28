import { promiseTimeout } from '@vueuse/core'
import { ref, onMounted, onUnmounted } from 'vue'

export function useInfiniteScroll(
    fetchMore: () => Promise<void>,
    getHasMore?: () => boolean,
) {
    const target = ref<HTMLElement | null>(null)
    const isLoading = ref(false)
    let observer: IntersectionObserver | null = null

    const createObserverInfiniteScroll = async (_target: HTMLElement | null) => {
        if (!_target || import.meta.server) return

        target.value = _target
        await nextTick()

        target.value = _target
        observer = new IntersectionObserver(
            async (entries) => {
                const entry = entries[0]
                if (!entry?.isIntersecting || isLoading.value) return

                // 沒有更多資料時不觸發，並停止 observe，避免一直卡在載入
                if (getHasMore && !getHasMore()) {
                    if (observer && target.value) observer.unobserve(target.value)
                    return
                }

                isLoading.value = true
                await fetchMore()
                isLoading.value = false

                await nextTick()

                const scrollable = document.documentElement.scrollHeight > window.innerHeight
                if (!scrollable) {
                    await promiseTimeout(300)
                    if (target.value && getHasMore?.()) observer?.observe(target.value)
                } else {
                    observer?.unobserve(target.value!)
                    observer?.observe(target.value!)
                }
            },
            {
                rootMargin: '100px',
            },
        )
        if (target.value) observer.observe(target.value)
    }
    const removeObserverInfiniteScroll = () => {
        if (observer && target.value) observer.unobserve(target.value)
    }
    onMounted(() => {})
    onUnmounted(removeObserverInfiniteScroll)

    return {
        isLoading,
        createObserverInfiniteScroll,
        removeObserverInfiniteScroll,
    }
}


