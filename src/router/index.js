import { createRouter, createWebHistory  ,createWebHashHistory} from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    
    {
      path: '/categories',
      component: () => import('../views/CategoriesView.vue'),
    },
    {
      path: '/ranking',
      component: () => import('../views/RankingView.vue'),
    },
    {
      path: '/news',
      component: () => import('../views/NewsView.vue'),
    },
    {
      path: '/collections',
      component: () => import('../views/CollectionsView.vue'),
    },
    {
      path: '/about',
      component: () => import('../views/AboutView.vue'),
    },


  ],
})

export default router
