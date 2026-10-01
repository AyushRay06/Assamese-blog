import sanitizeHtml from "sanitize-html";

export function sanitizePostHtml(dirtyHtml: string): string {
  if (!dirtyHtml || typeof dirtyHtml !== "string") {
    return "";
  }

  return sanitizeHtml(dirtyHtml, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "a", "b", "i", "strong", "em", "strike", "s", "del", "u",
      "ul", "ol", "nl", "li",
      "blockquote", "code", "pre", "hr", "br",
      "img", "figure", "figcaption",
      "table", "thead", "caption", "tbody", "tr", "th", "td",
      "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel", "title"],
      img: ["src", "srcset", "alt", "title", "width", "height", "loading", "class"],
      "*": ["class", "dir", "lang", "style", "id"],
    },
    allowedSchemes: ["http", "https", "mailto", "data"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const isExternal = attribs.href && !attribs.href.startsWith("/") && !attribs.href.startsWith("#");
        return {
          tagName: "a",
          attribs: {
            ...attribs,
            ...(isExternal
              ? {
                  target: "_blank",
                  rel: "noopener noreferrer nofollow",
                }
              : {}),
          },
        };
      },
      img: (tagName, attribs) => {
        return {
          tagName: "img",
          attribs: {
            ...attribs,
            loading: "lazy",
            decoding: "async",
          },
        };
      },
    },
  });
}
