const RSS_URL = `https://dev.to/feed/jody/`;
const OPTIMAL_DESCRIPTION_LENGTH = 430;
const ONE_DAY = 86400;
const FETCH_DELAY = 5 * ONE_DAY; // 5 days
const CACHE_KEY = 'v1';

class Site {
  constructor() {
    this.setup();
  }

  async setup() {
    this.headerNav = document.querySelector('.header-nav');

    this.prefersDarkMode() && this.setFavicon('dark');
    this.copyrightYear();

    window.matchMedia('(prefers-color-scheme: dark)').addListener(() => {
      this.setFavicon(this.prefersDarkMode() ? 'dark' : 'light');
    });

    this.setSlimHeader();
    window.addEventListener('scroll', this.setSlimHeader.bind(this));

    await this.setupWriting();

    const notNearTop = window.pageYOffset > 100;
    document.querySelectorAll('.loading-hidden').forEach((el) => {
      el.classList.remove('loading-hidden');
      if (notNearTop) {
        el.classList.add('no-transition');
      }
    });
  }

  setSlimHeader() {
    this.headerNav.classList.toggle('slim', window.pageYOffset > 16);
  }

  setFavicon(scheme) {
    const pngFavicon = document.querySelector('.site-favicon');

    scheme || (scheme = 'light');

    if (pngFavicon) {
      pngFavicon.href = `assets/favicon-${scheme}.png`;
    }
  }

  prefersDarkMode() {
    return (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }

  copyrightYear() {
    document.querySelector('.copyright span').textContent = new Date().getFullYear();
  }

  async setupWriting() {
    let feedData = localStorage.getItem(`${CACHE_KEY}/feedData`);
    const lastFetch = parseInt(localStorage.getItem(`${CACHE_KEY}/lastFetch`));
    const now = new Date().getTime();

    // If the feed hasn't been fetch in more than 5 days,
    // or if the stored feed data doesn't exist, fetch it again
    if ((lastFetch && (now - lastFetch) / ONE_DAY > 5) || !feedData) {
      const response = await fetch(RSS_URL);
      feedData = await response.text();
      localStorage.setItem(`${CACHE_KEY}/feedData`, feedData);
      localStorage.setItem(`${CACHE_KEY}/lastFetch`, now);
    }

    const itemsContainer = document.querySelector('.writing-content');
    const template = document.querySelector('#writing-item-template');

    const data = new DOMParser().parseFromString(feedData, 'text/xml');
    const items = [...data.querySelectorAll('item')].slice(0, 5);

    if (!items.length) {
      return Promise.resolve();
    }

    [...data.querySelectorAll('item')].slice(0, 5).forEach((item) => {
      const clonedItem = template.content.cloneNode(true);

      const title = item.querySelector('title').textContent;
      const publishedDate = item.querySelector('pubDate').textContent;
      const link = item.querySelector('link').textContent;
      const description = this.parseDescription(
        item.querySelector('description').textContent
      );

      clonedItem.querySelector('h3').textContent = title;
      clonedItem.querySelector('.writing-body').textContent = description;
      clonedItem.querySelector('time').textContent = new Date(
        publishedDate
      ).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      clonedItem.querySelector('time').dateTime = publishedDate;
      clonedItem.querySelector('.read-more').href = link;

      itemsContainer.appendChild(clonedItem);
    });

    document
      .querySelectorAll('.writing-hidden')
      .forEach((el) => el.classList.remove('writing-hidden'));

    Promise.resolve();
  }

  parseDescription(description) {
    const html = new DOMParser().parseFromString(description, 'text/html');
    const body = html.querySelector('body');
    let output = '';

    let childIndex = 0;
    while (output.length <= OPTIMAL_DESCRIPTION_LENGTH) {
      const content = body.children[childIndex].textContent;
      output = `${output} ${content}`;
      childIndex++;
    }

    return output.replace(/(\r\n|\n|\r)/gm, '').trim();
  }
}

new Site();
