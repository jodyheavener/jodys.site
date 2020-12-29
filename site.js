const RSS_URL = `https://dev.to/feed/jody/`;
const OPTIMAL_DESCRIPTION_LENGTH = 430;

class Site {
  constructor() {
    this.prefersDarkMode() && this.setFavicon("dark");

    window.matchMedia("(prefers-color-scheme: dark)").addListener(() => {
      this.setFavicon(this.prefersDarkMode() ? "dark" : "light");
    });

    this.setupWriting();
  }

  setFavicon(scheme) {
    const pngFavicon = document.querySelector(".site-favicon");

    scheme || (scheme = "light");

    if (pngFavicon) {
      pngFavicon.href = `assets/favicon-${scheme}.png`;
    }
  }

  prefersDarkMode() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  async setupWriting() {
    const notNearTop = window.pageYOffset > 100;
    const itemsContainer = document.querySelector(".writing-content");
    const template = document.querySelector("#writing-item-template");
    const response = await fetch(RSS_URL);
    const raw = await response.text();
    const data = new DOMParser().parseFromString(raw, "text/xml");
    const items = [...data.querySelectorAll("item")].slice(0, 5);

    if (!items.length) {
      return;
    }

    [...data.querySelectorAll("item")].slice(0, 5).forEach((item) => {
      const clonedItem = template.content.cloneNode(true);

      const title = item.querySelector("title").textContent;
      const publishedDate = item.querySelector("pubDate").textContent;
      const link = item.querySelector("link").textContent;
      const description = this.parseDescription(
        item.querySelector("description").textContent
      );

      clonedItem.querySelector("h3").textContent = title;
      clonedItem.querySelector(".writing-body").textContent = description;
      clonedItem.querySelector("time").textContent = new Date(
        publishedDate
      ).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      clonedItem.querySelector("time").dateTime = publishedDate;
      clonedItem.querySelector(".read-more").href = link;

      itemsContainer.appendChild(clonedItem);
    });

    document
      .querySelectorAll(".writing-hidden")
      .forEach((el) => el.classList.remove("writing-hidden"));

    document.querySelectorAll(".loading-hidden").forEach((el) => {
      el.classList.remove("loading-hidden");
      if (notNearTop) {
        el.classList.add("no-transition");
      }
    });
  }

  parseDescription(description) {
    const html = new DOMParser().parseFromString(description, "text/html");
    const body = html.querySelector("body");
    let output = "";

    let childIndex = 0;
    while (output.length <= OPTIMAL_DESCRIPTION_LENGTH) {
      const content = body.children[childIndex].textContent;
      output = `${output} ${content}`;
      childIndex++;
    }

    return output.replace(/(\r\n|\n|\r)/gm, "").trim();
  }
}

new Site();
