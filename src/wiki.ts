import type { DomeGeometry } from './geodesic';
import { CORE_PAGES } from './wiki-core';
import credits from './wiki-credits.json';
import { EXTRA_PAGES } from './wiki-extra';
import type { WikiGroup, WikiPage } from './wiki-kit';

/** The main wiki: the essentials, shown up front. */
const MAIN_GROUPS: WikiGroup[] = ['Learn', 'Build', 'History'];
/** Deeper pages, kept out of the way in one closed "More info" section. */
const MORE_GROUPS: WikiGroup[] = ['Learn', 'Build', 'Dome types', 'History', 'Reference'];

const MAIN = MAIN_GROUPS.flatMap((g) => CORE_PAGES.filter((p) => p.group === g));
const MORE = MORE_GROUPS.flatMap((g) => EXTRA_PAGES.filter((p) => p.group === g));
/** Reading order for previous / next. */
const PAGES: WikiPage[] = [...MAIN, ...MORE];
const pageBySlug = (slug?: string) => PAGES.find((p) => p.slug === slug);
const isMore = (p?: WikiPage) => !!p && MORE.includes(p);
const MORE_LABEL: Partial<Record<WikiGroup, string>> = { Learn: 'Understanding', Build: 'Building', History: 'Stories' };

const OPEN_KEY = 'wiki-more-open';
function readMoreOpen(): boolean {
  try {
    return localStorage.getItem(OPEN_KEY) === '1';
  } catch {
    return false;
  }
}
function writeMoreOpen(open: boolean) {
  try {
    localStorage.setItem(OPEN_KEY, open ? '1' : '0');
  } catch {
    // not persisted; the page still works
  }
}

export class Wiki {
  private article: HTMLElement;
  private nav: HTMLElement;
  private slug?: string;
  private navGen = 0;
  private moreOpen = readMoreOpen();

  constructor(private host: HTMLElement, private geometries: DomeGeometry[]) {
    host.innerHTML = `
      <main class="wiki-layout">
        <aside class="wiki-nav">
          <a class="wiki-home" href="#/wiki">Dome Wiki</a>
          <input class="wiki-search" type="search" placeholder="Search the wiki…" aria-label="Search the wiki" />
          <div class="wiki-nav-groups">
            ${MAIN_GROUPS.map(
              (g) => `<div class="nav-group" data-group="${g}"><h4>${g}</h4>${MAIN.filter((p) => p.group === g)
                .map((p) => `<a href="#/wiki/${p.slug}" data-slug="${p.slug}">${p.title}</a>`)
                .join('')}</div>`,
            ).join('')}
            <details class="nav-group nav-more" data-group="more">
              <summary>More info<span>${MORE.length}</span></summary>
              ${MORE.map((p) => `<a href="#/wiki/${p.slug}" data-slug="${p.slug}">${p.title}</a>`).join('')}
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
    for (const group of this.nav.querySelectorAll<HTMLElement>('.nav-group')) {
      let hits = 0;
      for (const a of group.querySelectorAll<HTMLElement>('a[data-slug]')) {
        const p = pageBySlug(a.dataset.slug);
        const hay = `${a.textContent} ${p?.teaser ?? ''} ${p?.keywords ?? ''}`.toLowerCase();
        const hit = !q || hay.includes(q);
        a.hidden = !hit;
        if (hit) hits++;
      }
      group.hidden = hits === 0;
      if (q && group instanceof HTMLDetailsElement) group.open = hits > 0;
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
        build one, and the people who dreamed them up.</p></header>
        ${MAIN_GROUPS.map(
          (g) => `<h2 class="group">${g}</h2><div class="wiki-cards">${MAIN.filter((p) => p.group === g)
            .map((p) => this.card(p))
            .join('')}</div>`,
        ).join('')}
        <details class="wiki-group more-info wiki-more"${this.moreOpen ? ' open' : ''}>
          <summary>
            <span class="more-title">More info</span>
            <span class="more-blurb">${MORE.length} deeper pages: coverings, foundations, doors, dome types, notable domes, glossary, chord charts and more</span>
          </summary>
          <div class="more-lists">
            ${MORE_GROUPS.map((g) => {
              const pages = MORE.filter((p) => p.group === g);
              return pages.length
                ? `<div><h4>${MORE_LABEL[g] ?? g}</h4>${pages
                    .map((p) => `<a href="#/wiki/${p.slug}"><b>${p.title}</b><span>${p.teaser}</span></a>`)
                    .join('')}</div>`
                : '';
            }).join('')}
          </div>
        </details>`;
    }
    const i = PAGES.indexOf(page);
    const prev = PAGES[i - 1];
    const next = PAGES[i + 1];
    const related = (page.related ?? []).map(pageBySlug).filter((p): p is WikiPage => !!p);
    return `<header class="wiki-head"><p class="crumbs"><a href="#/wiki">Dome Wiki</a> / ${isMore(page) ? 'More info / ' : ''}${page.group}</p><h1>${page.title}</h1></header>
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
    for (const a of this.nav.querySelectorAll<HTMLElement>('a[data-slug]')) a.classList.toggle('on', a.dataset.slug === slug);
    // "More info" opens only while you are reading one of its pages.
    const more = this.nav.querySelector<HTMLDetailsElement>('.nav-more');
    if (more) more.open = slug === 'credits' || isMore(pageBySlug(slug));
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
    this.article.querySelectorAll<HTMLElement>('.wiki-card, .wiki-more, .wiki-text > *, .related').forEach((el, k) => {
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
    const more = this.article.querySelector<HTMLDetailsElement>('.wiki-more');
    more?.addEventListener('toggle', () => {
      this.moreOpen = more.open;
      writeMoreOpen(more.open);
      if (more.open) {
        more.querySelectorAll<HTMLElement>('.more-lists a').forEach((a, k) =>
          a.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], {
            duration: 300,
            delay: k * 22,
            easing: 'ease-out',
            fill: 'backwards',
          }),
        );
      }
    });
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
