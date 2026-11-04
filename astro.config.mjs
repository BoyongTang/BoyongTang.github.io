// @ts-check
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

// A user site (BoyongTang.github.io) is served from the domain root, so no `base` is needed.
export default defineConfig({
  site: 'https://boyongtang.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
  },
});
