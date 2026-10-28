import type { DomeGeometry } from './geodesic';
import { CORE_PAGES } from './wiki-core';
import credits from './wiki-credits.json';
import { EXTRA_PAGES } from './wiki-extra';
import type { WikiGroup, WikiPage } from './wiki-kit';

const GROUPS: { id: WikiGroup; blurb: string }[] = [
  { id: 'Learn', blurb: 'How domes work: frequency, height, struts and the geometry behind them.' },
  { id: 'Build', blurb: 'From cut list to standing dome: struts, hubs, covers, anchoring and doors.' },
  { id: 'Dome types', blurb: 'Greenhouses, pool domes, glamping, radomes and other variations.' },
  { id: 'History', blurb: 'Fuller, the great domes, the counterculture, and the molecules named after him.' },
  { id: 'Reference', blurb: 'Glossary, chord factor charts, comparisons and file exports.' },
];

/** Pages in reading order: each group's core pages first, then the newer ones. */
const PAGES: WikiPage[] = GROUPS.flatMap((g) => [...CORE_PAGES, ...EXTRA_PAGES].filter((p) => p.group === g.id));
const pageBySlug = (slug?: string) => PAGES.find((p) => p.slug === slug);
const inGroup = (g: WikiGroup) => PAGES.filter((p) => p.group === g);

/** Which index groups are open, remembered per viewer. The first group starts open. */
const OPEN_KEY = 'wiki-open-groups';
function readOpen(): Set<string> {
  try {
    const raw = localStorage.getItem(OPEN_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    // storage unavailable: fall through to the default
  }
  return new Set([GROUPS[0].id]);
}
function writeOpen(open: Set<string>) {
  try {
    localStorage.setItem(OPEN_KEY, JSON.stringify([...open]));
  } catch {
    // not persisted; the page still works
  }
}

export class Wiki {
  private article: HTMLElement;
  private nav: HTMLElement;
  private slug?: string;
  private navGen = 0;
  private openGroups = readOpen();

  constructor(private host: HTMLElement, private geometries: DomeGeometry[]) {
    host.innerHTML = `
      <main class="wiki-layout">
        <aside class="wiki-nav">
          <a class="wiki-home" href="#/wiki">Dome Wiki</a>
          <input class="wiki-search" type="search" placeholder="Search the wiki…" aria-label="Search the wiki" />
          <div class="wiki-nav-groups">
            ${GROUPS.map(
              (g) => `<details class="nav-group" data-group="${g.id}">
                <summary>${g.id}<span>${inGroup(g.id).length}</span></summary>
                ${inGroup(g.id)
                  .map((p) => `<a href="#/wiki/${p.slug}" data-slug="${p.slug}">${p.title}</a>`)
                  .join('')}
              </details>`,
            ).join('')}
            <details class="nav-group" data-group="About"><summary>About<span>1</span></summary>
              <a href="#/wiki/credits" data-slug="credits">Image credits</a>
            </details>
          </div>
          <p class="search-empty" hidden>No pages match.</p>
        </aside>
        <article class="wiki-article"></article>
      </main>`;
    this.article = host.querySelector('.wiki-article')!;
    this.nav = host.querySelector('.wiki-nav')!;
    this.nav.querySelector<HTMLInputElement>('.wiki-search')!.addEventListener('input', (e) => this.search((e.target as HTMLInputElement).value));
  }

  /** Filter the sidebar by title, teaser and keywords; matching groups open. */
  private search(text: string) {
    const q = text.trim().toLowerCase();
    let any = false;
    for (const group of this.nav.querySelectorAll<HTMLDetailsElement>('.nav-group')) {
      let hits = 0;
      for (const a of group.querySelectorAll<HTMLElement>('a[data-slug]')) {
        const p = pageBySlug(a.dataset.slug);
        const hay = `${a.textContent} ${p?.teaser ?? ''} ${p?.keywords ?? ''}`.toLowerCase();
        const hit = !q || hay.includes(q);
        a.hidden = !hit;
        if (hit) hits++;
      }
      group.hidden = hits === 0;
      if (q) group.open = hits > 0;
      any ||= hits > 0;
    }
    if (!q) this.markNav(this.slug);
    this.nav.querySelector<HTMLElement>('.search-empty')!.hidden = any;
  }

  private card(p: WikiPage) {
    return `<a class="wiki-card" href="#/wiki/${p.slug}">
      <span class="wiki-card-art">${p.art()}</span>
      <span class="wiki-card-title">${p.title}</span>
      <span class="wiki-card-teaser">${p.teaser}</span>
    </a>`;
  }

  private html(slug?: string) {
    if (slug === 'credits') {
      return `<header class="wiki-head"><p class="crumbs"><a href="#/wiki">Dome Wiki</a></p><h1>Image credits</h1></header>
        <div class="wiki-text"><p>Diagrams and dome artwork are from the original OpenDome calculator or generated from the dome
        geometry. Photographs are from Wikimedia Commons:</p>
        <ul class="credits">${(credits as { title: string; page: string; license: string; author: string }[])
          .map((c) => `<li><a href="${c.page}" target="_blank" rel="noopener">${c.title}</a>, ${c.author}. ${c.license}.</li>`)
          .join('')}</ul></div>`;
    }
    const page = pageBySlug(slug);
    if (!page) {
      return `<header class="wiki-head"><h1>Dome Wiki</h1><p class="sub">Everything about geodesic domes: how they work, how to
        build one, and the people who dreamed them up. ${PAGES.length} pages in ${GROUPS.length} sections.</p></header>
        <div class="wiki-groups">
          ${GROUPS.map((g) => {
            const pages = inGroup(g.id);
            return `<details class="wiki-group" data-group="${g.id}"${this.openGroups.has(g.id) ? ' open' : ''}>
              <summary>
                <span class="wg-title">${g.id}<small>${pages.length} pages</small></span>
                <span class="wg-blurb">${g.blurb}</span>
                <span class="wg-peek">${pages
                  .slice(0, 4)
                  .map((p) => `<i>${p.art()}</i>`)
                  .join('')}</span>
              </summary>
              <div class="wiki-cards">${pages.map((p) => this.card(p)).join('')}</div>
            </details>`;
          }).join('')}
        </div>`;
    }
    const i = PAGES.indexOf(page);
    const prev = PAGES[i - 1];
    const next = PAGES[i + 1];
    const related = (page.related ?? []).map(pageBySlug).filter((p): p is WikiPage => !!p);
    return `<header class="wiki-head"><p class="crumbs"><a href="#/wiki">Dome Wiki</a> / ${page.group}</p><h1>${page.title}</h1></header>
      <div class="wiki-text">${page.body({ geometries: this.geometries })}</div>
      ${
        related.length
          ? `<section class="related"><h4>Related</h4><div>${related
              .map((p) => `<a href="#/wiki/${p.slug}"><b>${p.title}</b><span>${p.teaser}</span></a>`)
              .join('')}</div></section>`
          : ''
      }
      <nav class="pager">
        ${prev ? `<a href="#/wiki/${prev.slug}" class="prev"><small>Previous</small>${prev.title}</a>` : '<span></span>'}
        ${next ? `<a href="#/wiki/${next.slug}" class="next"><small>Next</small>${next.title}</a>` : '<span></span>'}
      </nav>`;
  }

  private markNav(slug?: string) {
    const page = pageBySlug(slug);
    const group = slug === 'credits' ? 'About' : page?.group;
    for (const a of this.nav.querySelectorAll<HTMLElement>('a[data-slug]')) a.classList.toggle('on', a.dataset.slug === slug);
    // Only the current page's section stays open; the home page opens the first.
    for (const d of this.nav.querySelectorAll<HTMLDetailsElement>('.nav-group')) {
      d.open = d.dataset.group === (group ?? GROUPS[0].id);
    }
    this.nav.querySelector('.wiki-home')?.classList.toggle('on', !slug);
  }

  /** Show a page. With `animate`, the old article slides out and the new one in. */
  async show(slug: string | undefined, animate: boolean) {
    const gen = ++this.navGen;
    const from = this.slug;
    this.slug = slug;
    this.markNav(slug);
    if (animate && from !== slug) {
      const order = (s?: string) => (s ? PAGES.findIndex((p) => p.slug === s) : -1);
      const dir = order(slug) >= order(from) ? 1 : -1;
      await this.article
        .animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(${-14 * dir}px)` }], {
          duration: 160,
          easing: 'ease-in',
          fill: 'forwards',
        })
        .finished.catch(() => undefined);
      if (gen !== this.navGen) return;
      this.render(slug);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      this.article.getAnimations().forEach((a) => a.cancel());
      this.article.animate([{ opacity: 0, transform: `translateY(${24 * dir}px)` }, { opacity: 1, transform: 'none' }], {
        duration: 380,
        easing: 'cubic-bezier(.2,.9,.3,1)',
      });
    } else {
      this.render(slug);
    }
  }

  private render(slug?: string) {
    this.article.innerHTML = this.html(slug);
    this.wire();
    // Content arrives in a quick cascade.
    this.article.querySelectorAll<HTMLElement>('.wiki-group, .wiki-text > *, .related').forEach((el, k) => {
      if (k > 14) return;
      el.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], {
        duration: 420,
        delay: 60 + k * 45,
        easing: 'cubic-bezier(.2,.9,.3,1)',
        fill: 'backwards',
      });
    });
  }

  /** Per-page behaviour: remembered index groups, animated accordions, glossary filter. */
  private wire() {
    for (const d of this.article.querySelectorAll<HTMLDetailsElement>('.wiki-group')) {
      d.addEventListener('toggle', () => {
        if (d.open) {
          this.openGroups.add(d.dataset.group!);
          d.querySelectorAll<HTMLElement>('.wiki-card').forEach((c, k) =>
            c.animate([{ opacity: 0, transform: 'translateY(12px) scale(.97)' }, { opacity: 1, transform: 'none' }], {
              duration: 360,
              delay: k * 40,
              easing: 'cubic-bezier(.2,.9,.3,1)',
              fill: 'backwards',
            }),
          );
        } else this.openGroups.delete(d.dataset.group!);
        writeOpen(this.openGroups);
      });
    }
    for (const d of this.article.querySelectorAll<HTMLDetailsElement>('.acc-item')) {
      d.addEventListener('toggle', () => {
        if (d.open) {
          d.querySelector('.acc-body')?.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], {
            duration: 260,
            easing: 'ease-out',
          });
        }
      });
    }
    const filter = this.article.querySelector<HTMLInputElement>('.glossary-filter');
    filter?.addEventListener('input', () => {
      const q = filter.value.trim().toLowerCase();
      for (const t of this.article.querySelectorAll<HTMLElement>('.term')) t.hidden = !!q && !t.dataset.term!.includes(q);
    });
  }
}
