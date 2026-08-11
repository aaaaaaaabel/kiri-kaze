import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default defineNuxtPlugin((_nuxtApp) => {
  if (import.meta.client) {
    gsap.registerPlugin(ScrollTrigger);
    
    return {
      provide: {
        gsap,
        ScrollTrigger,
      },
    };
  }
});

