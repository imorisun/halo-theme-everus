/* ==========================================================================
 * 第三方库入口 —— 由 Vite 打包自托管
 * --------------------------------------------------------------------------
 * 替代原先 4 个 cdn.jsdelivr.net 运行时请求：
 *   fancybox.css / fancybox.umd.js / gsap.min.js / ScrollTrigger.min.js
 *
 * 为什么这么做：
 *   1. jsdelivr 在国内长期存在解析与限速问题，而本主题面向中文站点；
 *   2. 第三方 CDN 属于运行时供应链依赖，站点可用性不该受其影响；
 *   3. 版本由 package.json 统一管理，可被 Dependabot 等工具追踪。
 *
 * 为什么仍然「挂到 window」而不是直接改成模块化：
 *   public/assets/js/main.js 是一个 780 行的传统全局脚本，内部通过
 *   `typeof gsap === 'undefined'` / `typeof Fancybox !== 'undefined'`
 *   这类全局判断来使用这些库，且它导出的 handleMomentUpvote /
 *   toggleMomentComments 需要作为全局函数供模板里的内联 onclick 调用。
 *   这里显式把三个库挂到 window，即可在【完全不改动 main.js】的前提下
 *   完成自托管迁移，避免一次性重写整个交互层带来的回归风险。
 *   后续若要把 main.js 逐步模块化，可以直接在此文件基础上演进。
 *
 * 加载顺序保证：
 *   本文件是 <script type="module">（语义等价于 defer），main.js 带 defer，
 *   两者按文档顺序执行，且都在 DOMContentLoaded 事件触发之前完成。
 *   main.js 的所有实际初始化都挂在 DOMContentLoaded 上（initLayoutOnce /
 *   initPageContent），因此运行时这些全局一定已就绪。
 * ========================================================================== */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Fancybox } from "@fancyapps/ui/dist/fancybox/fancybox.esm.js";

import "@fancyapps/ui/dist/fancybox/fancybox.css";

window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;
window.Fancybox = Fancybox;
