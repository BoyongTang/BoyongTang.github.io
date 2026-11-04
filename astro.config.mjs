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
  // the old research atlas became the star band (home) and its nebulae
  redirects: {
    '/atlas': '/',
    '/atlas/math': '/sky/research/',
    '/atlas/ai': '/sky/research/',
    '/atlas/teaching': '/sky/research/',
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
  },
});
