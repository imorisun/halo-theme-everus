import { defineConfig } from "vite";
import { haloThemePlugin } from "@halo-dev/vite-plugin-halo-theme";

/**
 * vite-plugin-halo-theme 会把嵌套的入口路径扁平化
 * （src/error/error.html -> "error_error" -> templates/error_error.html），
 * 但 Halo 在运行时按真实路径解析这些模板：
 *   - templates/error/error.html  —— 兜底错误页（templates.md 约定）
 *   - templates/modules/**.html    —— th:replace 运行时片段
 * 因此在这里把对应的入口名称还原为嵌套路径。
 */
const nestedEntryFix = {
  error_error: "error/error",
  modules_pagination: "modules/pagination",
  modules_post_card_list: "modules/post-card-list",
  modules_widgets_comment: "modules/widgets/comment",
};

function fixNestedEntries() {
  return {
    name: "everus-fix-nested-entries",
    config(config) {
      const input = config?.build?.rollupOptions?.input;
      if (!input || typeof input !== "object" || Array.isArray(input)) return;
      for (const [flat, nested] of Object.entries(nestedEntryFix)) {
        if (input[flat]) {
          input[nested] = input[flat];
          delete input[flat];
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [haloThemePlugin(), fixNestedEntries()],
});
