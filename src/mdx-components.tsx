import type { MDXComponents } from "mdx/types";

// Styling comes from the `.prose` wrapper; this only makes external links open in a new tab.
const components: MDXComponents = {
  a: ({ href = "", ...props }) =>
    href.startsWith("http") ? (
      <a href={href} target="_blank" rel="noreferrer" {...props} />
    ) : (
      <a href={href} {...props} />
    ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
