# Boyong Tang

My personal website: who I am, what I work on, and how to reach me.

**Live:** [boyongtang.github.io](https://boyongtang.github.io)

The home page is a single view of the Pillars of Creation, as seen by the James Webb Space Telescope. Four
places on the pillars are the four parts of me:

| Part | 中文 | What it holds |
| --- | --- | --- |
| Research | 研究 | what I study, as star chains by field (e.g. AI4S, XAI) |
| Intro | 个人介绍 | who I am: one profile card |
| Works | 作品 | what I have made |
| Contact | 联系 | how to reach me |

The whole site is that one screen, with nothing to scroll. Choosing a part flies in to it and unfolds its
stars (Intro opens the profile card instead); choosing a star opens its card; a click anywhere else, or
Escape, steps back. Each part also has its own address (`/sky/<part>/`), which opens on it; without
JavaScript that page lists the part's content.

## 维护指南 (Maintenance)

### 内容在哪里改

| 部分 | 文件 | 改什么 |
| --- | --- | --- |
| Research 研究 | [`src/data/stars.ts`](src/data/stars.ts) 的 `research` | 论文 |
| Works 作品 | [`src/data/stars.ts`](src/data/stars.ts) 的 `works` | 项目、代码仓库 |
| Contact 联系 | [`src/data/stars.ts`](src/data/stars.ts) 的 `contact` | 邮箱、GitHub 等链接 |
| Intro 个人介绍 | [`src/data/profile.ts`](src/data/profile.ts) | 身份、简介、邮箱和 CV 按钮 |
| 论文配图 | [`public/research/`](public/research/) | 图片文件 |

两个文件开头的注释逐项解释了每个字段。留空 `''` 或不写的字段不会显示。

### Research：加一篇论文

一条「链」是一个研究方向（如 AI4S），链上一颗星星是一篇论文。同一条链的星星按列出的顺序连线，所以从旧到新排。照着 KolTa 复制一份：

```ts
{
  name: 'KolTa',                  // 星星上的短名字（必填，尽量短）
  kind: 'Research Paper',         // 星星下面的小字
  note: 'Under Review',           // 状态：卡片里显示成小标签
  title: 'KolTa: A Physics-Informed …',            // 完整标题
  authors: 'Boyong Tang, Tao Wang, Lei Yang',      // 自己的名字自动加粗
  image: { src: '/research/KolTa-predictor.svg', alt: '这张图画的是什么' },
  text: '一两句话：解决什么问题，效果多好。',
  links: [
    { label: 'arXiv', href: 'https://arxiv.org/abs/…' },
    { label: 'Code', href: 'https://github.com/…' },
  ],
  bright: true,                   // 更大更亮：留给最重要的论文
},
```

- **论文被录用：** 把 `note` 改成会议或期刊名，如 `'ICML 2026'`。
- **新开一个方向：** 在 `research` 里加一条新链（文件里有一段注释掉的 XAI 示例），`chain` 写英文名，`zh` 写中文名。
- **在某篇论文基础上的新工作：** 加 `from: '那篇的 name'`，会从那颗星分出一条支线。名字对不上时构建会停下，并说明是哪一条。

### Works：加一个作品

格式和 Research 一样，一颗星星是一个项目，`link` 写仓库或演示地址。一颗星都没有时，网站自动显示「UNCHARTED · 待探索 · Coming soon」，加了第一颗就消失。文件里有一段注释掉的 KolTa 代码仓库示例，代码公开后取消注释、补上 `link` 即可。

### Contact：联系方式

每一项是 `name` 加 `link`。邮箱链接要以 `mailto:` 开头，如 `'mailto:you@example.com'`。

> **换邮箱时改两处：** `stars.ts` 的 `contact`，以及 `profile.ts` 里的 `email` / `generalEmail`（个人卡片的按钮）。

### Intro：个人介绍

都在 `profile.ts`：`role`（一句身份）、`affiliation`（学校）、`bio` / `bioZh`（中英文简介）、`tagline`（首页名字下的一句话）、`cv`（把 PDF 放进 `public/`，写成 `'/cv.pdf'`）。

### 论文配图

- PNG、JPG、WebP、SVG 都可以。示意图能导出 SVG 最好（放大不糊）；照片、截图、点很多的散点图用 PNG 或 JPG。
- 宽 800–1000 像素就够，文件尽量在 300KB 以内。
- 文件名只用英文、数字和短横线，不要空格和中文。
- 卡片会给图加白底框，透明背景也没问题。点卡片里的图会在新标签页打开大图，细节多的图也看得清。
- 导出 SVG：matplotlib 用 `plt.savefig('fig.svg', bbox_inches='tight')`；PDF 图用 `pdftocairo -svg fig.pdf fig.svg`（`brew install poppler`）；arXiv 网页版的图在图上右键「检查」，找 `<object … data="….svg">` 里的文件名，接在 `https://arxiv.org/html/<编号>/` 后面下载。

### 预览、检查、发布

```bash
npm install      # 第一次用时装依赖
npm run dev      # 本地预览，打开它显示的地址；保存文件页面自动刷新
npm test         # 构建，并检查所有站内链接和 #锚点（CI 也跑这一步）
npm run og       # 重画链接预览图 public/og.png（改了名字或身份时）
```

发布走 PR：新建分支 → 提交 → 推送 → 在 GitHub 上开 PR → Merge。合进 `main` 后 GitHub Actions 自动部署到 GitHub Pages（[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)），一两分钟后线上更新，可在仓库的 Actions 页看进度。这个仓库的提交邮箱已在本地设为 `boyong.tang.math.ai@gmail.com`。

### 容易出错的地方

- **注释掉一整段时，括号也要注释掉。** 只注释内容、留下 `],` 或 `},`，整个网站会构建失败。
- **提交前先保存文件。** VS Code 标签上有白点表示还没保存。
- **`name` 在同一部分里不要重复**，`from` 要和前面某颗星的 `name` 一字不差。
- **只放真实内容：** 没有的栏目就空着，网站会自动隐藏或显示「待探索」。

### 其他

- 四个部分的名字、颜色、一句话说明：[`src/data/facets.ts`](src/data/facets.ts)。
- 每个部分在图上的位置、天空明暗：[`src/data/pillars.ts`](src/data/pillars.ts)。

## How it is built

- [Astro](https://astro.build), all static: every page is plain HTML at build time.
- The living sky behind every page is WebGL 2 ([`src/scripts/pillars-gl.ts`](src/scripts/pillars-gl.ts)).
  A depth mask separates the pillars from the sky, giving parallax with the mouse, drifting gas, twinkling
  stars, and a darker sky round full-colour pillars. Without WebGL a still copy of the picture stands in.
- The one screen: [`src/components/Explorer.astro`](src/components/Explorer.astro) (markup and styles) and
  [`src/scripts/explorer.ts`](src/scripts/explorer.ts) (the camera, flying in to a part, the cards).
  Which part is the profile card: `PROFILE_PART` in [`src/data/facets.ts`](src/data/facets.ts).
- Star layout, at build time: [`src/lib/sky.ts`](src/lib/sky.ts). Where the picture sits on a screen:
  [`src/lib/pillars-fit.ts`](src/lib/pillars-fit.ts). The sky's mouse parallax and dimming:
  [`src/scripts/backdrop.ts`](src/scripts/backdrop.ts).
- Motion respects the system's reduced-motion setting ([`src/scripts/motion.ts`](src/scripts/motion.ts)).

## The picture

*Pillars of Creation (NIRCam)*, by NASA, ESA, CSA, STScI; J. DePasquale, A. Koekemoer, A. Pagan (STScI).
Licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Source:
[esawebb.org/images/weic2216b](https://esawebb.org/images/weic2216b/). The credit is shown on every page
that shows the picture.

To rebuild the web copies and masks in `public/sky/`, download the publication JPEG (2309 × 4000) from that
page to `assets-src/pillars-webb.jpg` (kept out of git), then run:

```bash
python3 scripts/make-pillars.py   # needs numpy and Pillow
```
