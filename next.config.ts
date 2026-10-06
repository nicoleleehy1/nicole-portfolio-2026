import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

// Plugins are named as strings so they work with Turbopack.
const withMDX = createMDX({
  options: {
    remarkPlugins: [
      "remark-gfm",
      "remark-frontmatter",
      // Exposes each post's YAML front matter as `export const metadata`
      ["remark-mdx-frontmatter", { name: "metadata" }],
    ],
  },
});

export default withMDX(nextConfig);
