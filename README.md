# Boyong Tang

My personal website: who I am, what I work on, and how to reach me.

**Live:** [boyongtang.github.io](https://boyongtang.github.io)

The home page is a single view of the Pillars of Creation, as seen by the James Webb Space Telescope. Six
places on the pillars are the parts of me:

| Part | 中文 | What it holds |
| --- | --- | --- |
| Research | 研究 | what I study, as star chains by field (e.g. AI4S, XAI) |
| Intro | 个人介绍 | who I am: one profile card |
| Works | 作品 | what I have made |
| Contact | 联系 | how to reach me |
| Honors | 荣誉 | awards and honors |
| News | 动态 | what is new, as a timeline |

Choosing a part flies in to it and unfolds its stars (Intro opens the profile card instead); choosing a star
opens its card beside it; a click anywhere else, or Escape, steps back. Each part also has its own address
(`/sky/<part>/`), one screen that opens on it; without JavaScript that page lists the part's content.

Scrolling down the home page leads to a **second screen**: the same content as a plain academic page, with
the profile card staying in view on the left and a section per part on the right (About, News, Research,
Honors & Awards, Works, Contact), newest first.

## 维护指南 (Maintenance)

### 内容在哪里改

| 部分 | 文件 | 改什么 |
| --- | --- | --- |
| Research 研究 | [`src/data/stars.ts`](src/data/stars.ts) 的 `research` | 论文 |
| Works 作品 | [`src/data/stars.ts`](src/data/stars.ts) 的 `works` | 项目、代码仓库 |
| Contact 联系 | [`src/data/stars.ts`](src/data/stars.ts) 的 `contact` | 邮箱、GitHub 等链接 |
| Honors 荣誉 | [`src/data/stars.ts`](src/data/stars.ts) 的 `honors` | 奖项、奖学金、荣誉称号 |
| News 动态 | [`src/data/stars.ts`](src/data/stars.ts) 的 `news` | 新消息：论文上线、录用、获奖、入学等 |
| Intro 个人介绍 | [`src/data/profile.ts`](src/data/profile.ts) | 身份、简介、邮箱和 CV 按钮 |
| 论文配图 | [`public/research/`](public/research/) | 图片文件 |

两个文件开头的注释逐项解释了每个字段。留空 `''` 或不写的字段不会显示。

**两屏共用同一份数据：** 首页第一屏的星图和往下滑的第二屏，都从这两个文件读内容。改一次，两边同时更新，第二屏不用单独改。

### Research：加一篇论文

一条「链」是一个研究方向（如 AI4S），链上一颗星星是一篇论文。同一条链的星星按列出的顺序连线，所以从旧到新排。照着 KolTa 复制一份：

```ts
{
  name: 'KolTa',                  // 星星上的短名字（必填，尽量短）
  kind: 'Research Paper',         // 星星下面的小字
  note: 'Under Review',           // 状态：卡片里显示成小标签
  title: 'KolTa: A Physics-Informed …',            // 完整标题
  authors: 'Boyong Tang, Tao Wang, Lei Yang',      // 自己的名字自动加粗
  image: { src: '/research/kolta-predictor.svg', alt: '这张图画的是什么' },
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

### Honors：加一个奖项

一条链是一类荣誉（现在有「Competitions 竞赛」和「Sichuan University 四川大学」两条），一颗星是一个奖，按年份从旧到新排：

```ts
{ name: 'CUMCM', kind: 'Third Prize', note: '2026', title: 'China Undergraduate Mathematical Contest in Modeling (CUMCM)', bright: true },
```

`name` 写奖项简称，`kind` 写等级，`note` 写年份（显示成小标签），`title` 写全称。有证书或公示链接可以加 `links`。新的一类荣誉（比如「Scholarships 奖学金」）就加一条新链。

### News：发一条动态

一颗星是一条消息，按时间从旧到新排，连起来就是一条时间线。新消息加在 `news` 的最后：

```ts
{ name: 'KolTa preprint', kind: 'Preprint', note: 'Nov 2026', text: '一两句话说发生了什么。', links: [{ label: 'arXiv', href: '…' }], bright: true },
```

`note` 写日期（如 `'Nov 2026'`），`kind` 写类别（Preprint、Award、Talk…）。最新、最重要的那条可以加 `bright: true`，旧的那条去掉 `bright`。消息太多时可以删掉最早的几条。

### Intro：个人介绍

都在 `profile.ts`。Intro 没有星星，点开后这张卡片显示在屏幕正中间。字段有：`role`（一句身份）、`affiliation`（学校）、`email` / `generalEmail`（邮箱按钮，留空 `''` 就不显示）、`github`、`googleScholar`（Google Scholar 主页链接，只留 `?user=…` 这一段，去掉 `&hl=…&authuser=…`）、`bio` / `bioZh`（中英文简介）、`tagline`（首页名字下的一句话）、`cv`（把 PDF 放进 `public/`，写成 `'/cv.pdf'`）、`interests`（研究方向，第二屏名字下面的小标签，如 `['AI for Science (AI4S)', …]`）。

### 第二屏（首页往下滑）

由 [`src/components/Overview.astro`](src/components/Overview.astro) 自动生成，平时不用改它：

- **左边卡片：** 名字、身份、学校、`interests` 标签、邮箱 / GitHub / CV 按钮，来自 `profile.ts`。往下滑时一直停在左边；手机上在最上面。
- **右边板块，从上到下：** About（`bio`）→ News → Research → Honors & Awards → Works → Contact。
- **排序：** News、Research、Works 新的在上（在 `stars.ts` 里照旧从旧到新写，第二屏会自动倒过来）；Honors 按 `note` 里的年份从新到旧，同一年保持你写的顺序。
- **怎么显示：** News 和 Honors 是「日期 + 一行」；Research 和 Works 是卡片，有 `image` 的配图放左边，点图看大图；Contact 是按钮；没有内容的板块显示「Uncharted · 待探索」。
- **想调板块顺序或标题：** 改 `Overview.astro` 里的 `sections` 列表。

### 动效（闪光与流动）

两屏上的小动效都是纯 CSS 加一小段脚本，不依赖任何库。平时不用动；想调快慢、强弱或关掉某一个，按下表找：

| 动效 | 在哪里 | 怎么调 |
| --- | --- | --- |
| 名字上划过的流光 | [`Explorer.astro`](src/components/Explorer.astro) 的 `.ex__cap--home .ex__name` 和 `@keyframes ex-glint` | `animation` 里的 `7s` 是多久划一次，`3.2s` 是打开页面后多久开始；渐变里的 `#ffe2b8` 是流光的颜色 |
| 流星 | [`Explorer.astro`](src/components/Explorer.astro) 里两行 `<span class="ex__meteor" …>` | 每行的 `style`：`--mx` / `--my` 起点位置，`--ma` 角度，`--mt` 多久出现一次，`--md` 第一次等多久。想多一颗就复制一行，想少就删一行 |
| 星星卡片升起 | [`Explorer.astro`](src/components/Explorer.astro) 的 `@keyframes ex-card-in` | `.ex__card` 的 `animation: … 360ms` |
| 第二屏内容滑入 | [`Overview.astro`](src/components/Overview.astro) 里的 `<script>`，样式是 `.ov .rv` / `.ov .rv.is-in` | 滑入多远：`translateY(18px)`；多快：`700ms` / `800ms`；同时出现的几项前后错开：脚本里的 `70`（毫秒） |
| 标题下流动的光、标题前闪烁的小星 | [`Overview.astro`](src/components/Overview.astro) 的 `.ov__head::after`（`ov-flow`）和 `.ov__head::before`（`ov-twinkle`） | `7s` / `3.6s` 是一圈的时间 |
| 卡片上跟着鼠标的光斑、悬停时变亮的边 | [`Overview.astro`](src/components/Overview.astro) 的 `.ov__card::before, .ov__paper::before` 和 `:hover` 规则 | 光斑强弱：`var(--c) 28%`；大小：`340px` |
| 头像外绕圈的光点 | [`Overview.astro`](src/components/Overview.astro) 的 `.ov__mark::before`（`ov-orbit`） | `7s` 是一圈的时间 |
| 按钮和链接标签上的流光 | [`global.css`](src/styles/global.css) 的 `.btn::after`；链接标签是 `Overview.astro` 的 `.ov__chips a:hover` | `750ms` 是划过的时间 |

- **颜色跟着板块走：** 第二屏的动效都用 `var(--c)`，也就是该板块在 [`src/data/facets.ts`](src/data/facets.ts) 里的颜色。改了板块颜色，动效颜色自动跟着变。
- **关掉某一个：** 把对应的 `animation: …` 那一行删掉或注释掉即可，其他不受影响。
- **「减少动态效果」：** 系统开了这个设置（或在 404 页的页脚点了 Reduce motion）时，以上动效全部自动停下，内容照常显示。所以**新加动画时，一定写在这两层里面**，照着现有的抄：

  ```css
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .你的类名 {
      animation: …;
    }
  }
  ```

- **第二屏新加了一种内容块：** 想让它也滑入，把它的类名加进 `Overview.astro` 脚本开头那一长串选择器里（`.ov__card, .ov__head, …`）。不加也没关系，它会直接显示。
- **没有 JavaScript 时：** 滑入效果和鼠标光斑不出现，内容全部正常显示（隐藏状态是脚本加上去的，不是写死在样式里）。

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
- **`.btn` 带 `overflow: hidden`**（流光要靠它裁掉）。以后想给按钮加伸到外面的东西（角标、外发光），要加在按钮外面一层，否则会被裁掉。
- **改完动效，手机宽度也看一眼：** 在浏览器里把窗口拉窄，或用开发者工具的手机模式，确认第二屏的内容都滑出来了。

### 其他

- 每个部分的名字、颜色、一句话说明：[`src/data/facets.ts`](src/data/facets.ts)。第二屏板块标题前的小圆点也用这个颜色。
- 每个部分在图上的位置、天空明暗：[`src/data/pillars.ts`](src/data/pillars.ts)。

## How it is built

- [Astro](https://astro.build), all static: every page is plain HTML at build time.
- The living sky behind every page is WebGL 2 ([`src/scripts/pillars-gl.ts`](src/scripts/pillars-gl.ts)).
  A depth mask separates the pillars from the sky, giving parallax with the mouse, drifting gas, twinkling
  stars, and a darker sky round full-colour pillars. Without WebGL a still copy of the picture stands in.
- The pillars screen: [`src/components/Explorer.astro`](src/components/Explorer.astro) (markup and styles) and
  [`src/scripts/explorer.ts`](src/scripts/explorer.ts) (the camera, flying in to a part, the cards; on the
  home page it also keeps the sky's pillars in step as the page scrolls).
- The home page's second screen: [`src/components/Overview.astro`](src/components/Overview.astro), built
  from the same data. Only the home page scrolls (`scrolls` on [`src/layouts/Base.astro`](src/layouts/Base.astro)).
  Which part is the profile card: `PROFILE_PART` in [`src/data/facets.ts`](src/data/facets.ts).
- Star layout, at build time: [`src/lib/sky.ts`](src/lib/sky.ts). Where the picture sits on a screen:
  [`src/lib/pillars-fit.ts`](src/lib/pillars-fit.ts). The sky's mouse parallax and dimming:
  [`src/scripts/backdrop.ts`](src/scripts/backdrop.ts).
- Small motion on both screens, all CSS plus one short script: a glint across the name, the odd meteor
  and a rising star card ([`Explorer.astro`](src/components/Explorer.astro)); on the second screen,
  content rising in as it scrolls into view, light running under each heading, cards lit where the pointer
  is, and a point of light circling the mark ([`Overview.astro`](src/components/Overview.astro)); a glint
  on buttons ([`global.css`](src/styles/global.css)). The maintenance guide above says how to tune each.
- Motion respects the system's reduced-motion setting ([`src/scripts/motion.ts`](src/scripts/motion.ts)):
  every animation is declared inside `prefers-reduced-motion: no-preference` and
  `html:not([data-motion='reduce'])`, so nothing new moves when motion is off.

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
