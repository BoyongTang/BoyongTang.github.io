// @ts-check
import { defineConfig } from 'astro/config';

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
    // the Toolbox part was removed and Path became the personal introduction
    '/sky/toolbox': '/',
    '/sky/path': '/sky/intro/',
    // the separate pages became the four parts
    '/about': '/sky/intro/',
    '/research': '/sky/research/',
    '/publications': '/sky/research/',
    '/projects': '/sky/works/',
    '/notes': '/',
  },
});
