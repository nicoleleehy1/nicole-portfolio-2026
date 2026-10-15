import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Stable resume URL; point the destination at whichever PDF is current.
  async rewrites() {
    return [
      {
        source: "/Nicole_Lee_Resume",
        destination: "/Nicole_Lee_Resume_Oct_2026.pdf",
      },
    ];
  },
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
