// @ts-check
import { defineConfig } from 'astro/config';

// A user site (BoyongTang.github.io) is served from the domain root, so no `base` is needed.
export default defineConfig({
  site: 'https://boyongtang.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // old addresses, so links to them still land somewhere: the research atlas, the Toolbox and Path parts,
  // and the separate pages, which all became the four parts
  redirects: {
    '/atlas': '/',
    '/atlas/math': '/sky/research/',
    '/atlas/ai': '/sky/research/',
    '/atlas/teaching': '/sky/research/',
    '/sky/toolbox': '/',
    '/sky/path': '/sky/intro/',
    '/about': '/sky/intro/',
    '/research': '/sky/research/',
    '/publications': '/sky/research/',
    '/projects': '/sky/works/',
    '/notes': '/',
  },
});
