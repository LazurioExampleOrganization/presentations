import { fileURLToPath } from "node:url";
import { viteShutdownPlugin } from "@lazurio/module-kit";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), viteShutdownPlugin()],
  envDir: false,
  resolve: {
    alias: {
      react: fileURLToPath(new URL("./node_modules/react", import.meta.url)),
      "react/jsx-runtime": fileURLToPath(
        new URL("./node_modules/react/jsx-runtime.js", import.meta.url),
      ),
      "react-dom": fileURLToPath(new URL("./node_modules/react-dom", import.meta.url)),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react/jsx-runtime", "react-dom"],
  },
});
