import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomeView.vue"),
      meta: { title: "模型测试结果列表" },
    },
    {
      path: "/create",
      name: "create",
      component: () => import("../views/CreateTestView.vue"),
      meta: { title: "创建测试" },
    },
    {
      path: "/annotate/:id",
      name: "annotate",
      component: () => import("../views/AnnotateView.vue"),
      meta: { title: "标注数据" },
    },
    {
      path: "/result/:id",
      name: "result",
      component: () => import("../views/ResultView.vue"),
      meta: { title: "测试结果" },
    },
  ],
});

// 动态设置页面标题
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || "模型测试系统"}`;
  next();
});

export default router;
