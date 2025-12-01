window.Framework = {
  cache: {},
  plugins: {},

  // --- Plugin System ---
  plugin(name, fn) {
    this.plugins[name] = fn;
  },

  usePlugin(name, ...args) {
    if (this.plugins[name]) {
      return this.plugins[name](...args);
    }
  },

  // --- HTML Loader & Include Engine ---
  async fetchHTML(url) {
    if (this.cache[url]) return this.cache[url];
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load ${url}`);
      const html = await response.text();
      this.cache[url] = html;
      return html;
    } catch (e) {
      console.error(e);
      return `<!-- Error loading ${url} -->`;
    }
  },

  async processIncludes(html) {
    // Regex to match <include ...> ... </include> or <include ... />
    // We need to capture attributes and inner content (for slots)
    const regex =
      /<include\s+src=["']([^"']+)["']([^>]*)>(.*?)<\/include>|<include\s+src=["']([^"']+)["']([^>]*)\/>/gs;

    let match;
    let processed = html;

    // We use a loop with regex.exec to handle nested structures carefully,
    // but for simplicity in this recursive approach, we'll find all top-level includes first.
    // Actually, regex replacement with async callback is hard.
    // Let's find matches and replace them one by one.

    while ((match = regex.exec(processed)) !== null) {
      const fullMatch = match[0];
      const src = match[1] || match[4];
      const attrsString = match[2] || match[5] || "";
      const innerContent = match[3] || ""; // Content inside <include>...</include> (Slots)

      // 1. Fetch Component
      let componentHtml = await this.fetchHTML(src);

      // 2. Handle Slots (Component Slots)
      // Parse innerContent for <slot name="x">...</slot> or default content
      // And replace <slot name="x"></slot> in componentHtml
      if (innerContent.trim()) {
        const slots = {};
        const slotRegex =
          /<slot\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/slot>/g;
        let slotMatch;
        let hasNamedSlots = false;

        while ((slotMatch = slotRegex.exec(innerContent)) !== null) {
          slots[slotMatch[1]] = slotMatch[2];
          hasNamedSlots = true;
        }

        // If no named slots found but there is content, treat as default slot
        if (!hasNamedSlots && innerContent.trim()) {
          slots["default"] = innerContent;
        }

        // Replace slots in component
        for (const [name, content] of Object.entries(slots)) {
          // Match <slot name="name"></slot> or <slot name="name" />
          const targetRegex = new RegExp(
            `<slot\\s+name=["']${name}["']\\s*><\\/slot>|<slot\\s+name=["']${name}["']\\s*\\/>`,
            "g"
          );
          componentHtml = componentHtml.replace(targetRegex, content);
        }

        // Handle default slot replacement if component has <slot></slot> (unnamed)
        if (slots["default"]) {
          componentHtml = componentHtml.replace(
            /<slot\s*><\/slot>|<slot\s*\/>/g,
            slots["default"]
          );
        }
      }

      // Cleanup unused slots in component
      componentHtml = componentHtml.replace(
        /<slot[^>]*><\/slot>|<slot[^>]*\/>/g,
        ""
      );

      // 3. Handle Props (Attributes)
      // Parse attributes: title="Hello" -> {{ title }} replacement OR x-data injection
      // Let's do simple text replacement for {{ prop }} for now, as it's "static" props.
      // And also support passing them as x-data if requested?
      // The user asked for "Props".
      const attrRegex = /(\w+)=["']([^"']*)["']/g;
      let attrMatch;
      const props = {};
      while ((attrMatch = attrRegex.exec(attrsString)) !== null) {
        props[attrMatch[1]] = attrMatch[2];
      }

      // Replace {{ propName }} in componentHtml
      for (const [key, value] of Object.entries(props)) {
        const propRegex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
        componentHtml = componentHtml.replace(propRegex, value);
      }

      // 4. Recursive Processing
      // We must process the *result* because the included component might have includes.
      componentHtml = await this.processIncludes(componentHtml);

      // 5. Replace in original HTML
      // We need to be careful about the index because 'processed' changes length.
      // So we restart the loop or use a different approach.
      // Easiest is to replace the *first* match and recurse, or replace all matches found in this pass.
      // Since we are in a while loop on 'processed', if we modify 'processed', the regex index is invalid.
      // Better approach: Find all matches first, then replace.
      processed = processed.replace(fullMatch, componentHtml);

      // Reset regex to start from beginning because string changed
      regex.lastIndex = 0;
    }

    return processed;
  },

  // --- Layout System ---
  async processLayout(html) {
    const layoutRegex =
      /<layout\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/layout>/;
    const match = layoutRegex.exec(html);

    if (match) {
      const layoutName = match[1];
      const content = match[2];

      // Extract slots from content
      const slots = {};
      const slotRegex = /<slot\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/slot>/g;
      let slotMatch;
      while ((slotMatch = slotRegex.exec(content)) !== null) {
        slots[slotMatch[1]] = slotMatch[2];
      }

      // Load Layout File
      let layoutHtml = await this.fetchHTML(`app/Layouts/${layoutName}.html`);

      // Inject slots into layout
      // Layout should have <slot name="xyz"></slot> placeholders (not the custom tag, but maybe a marker?)
      // Actually, the prompt says: <layout name="main"><slot name="content"></slot></layout>
      // So the PAGE has the <layout> tag wrapping the content.
      // And the LAYOUT file should have... wait.
      // Usually layout files have a placeholder. Let's assume standard <slot name="content"></slot> in layout file.

      // Replace <slot name="X"></slot> in layout with actual content
      for (const [name, slotContent] of Object.entries(slots)) {
        const targetRegex = new RegExp(
          `<slot\\s+name=["']${name}["']\\s*><\\/slot>`,
          "g"
        );
        layoutHtml = layoutHtml.replace(targetRegex, slotContent);
      }

      // Default slot (if any content is outside named slots? or just named slots for now)
      // For simplicity, let's stick to named slots as requested.

      return layoutHtml;
    }
    return html;
  },

  // --- Template Engine ---
  transformTemplate(html) {
    // 1. {{ variable }} -> <span x-text="variable"></span>
    // We use a span to avoid breaking structure, but sometimes it might be inside an attribute.
    // Attribute interpolation is harder: class="{{ active ? 'red' : 'blue' }}"
    // Alpine handles attributes via :class.
    // Let's assume text content interpolation for now.

    // Text Interpolation
    html = html.replace(/\{\{\s*([^}]+)\s*\}\}/g, '<span x-text="$1"></span>');

    // 2. {% if cond %} ... {% endif %} -> <template x-if="cond"> ... </template>
    html = html.replace(/{%\s*if\s+([^%]+)\s*%}/g, '<template x-if="$1">');
    html = html.replace(/{%\s*endif\s*%}/g, "</template>");

    // 3. {% for item in list %} ... {% endfor %} -> <template x-for="item in list"> ... </template>
    html = html.replace(/{%\s*for\s+([^%]+)\s*%}/g, '<template x-for="$1">');
    html = html.replace(/{%\s*endfor\s*%}/g, "</template>");

    return html;
  },

  // --- XSS Sanitizer ---
  sanitize(html) {
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ["include", "layout", "slot", "template", "span", "div"], // Allow our structural tags if they survive
      ADD_ATTR: [
        "x-data",
        "x-text",
        "x-if",
        "x-for",
        "x-bind",
        "x-on",
        "src",
        "name",
        "@click",
        ":class",
      ], // Allow Alpine attributes
    });
  },

  // --- Data Loader ---
  async fetchJSON(url, safe = true) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load JSON: ${url}`);
      const data = await res.json();
      // Basic sanitization if 'safe' is true (recursively sanitize strings)
      if (safe) {
        const sanitizeValue = (v) => {
          if (typeof v === "string") return DOMPurify.sanitize(v);
          if (typeof v === "object" && v !== null) {
            for (let k in v) v[k] = sanitizeValue(v[k]);
          }
          return v;
        };
        return sanitizeValue(data);
      }
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  // --- Main Render Function ---
  async render(componentPath, targetId) {
    const target = document.getElementById(targetId);
    if (!target) {
      console.error("Target element not found:", targetId);
      return;
    }

    // 1. Fetch Page
    let html = await this.fetchHTML(componentPath);

    // 2. Process Layouts
    html = await this.processLayout(html);

    // 3. Process Includes
    html = await this.processIncludes(html);

    // 4. Transform Template Syntax
    html = this.transformTemplate(html);

    // 5. Inject Content
    target.innerHTML = html;
    
    // 6. Execute Scripts
    this.executeScripts(target);

    // 7. Re-initialize Alpine.js with improved timing
    if (window.Alpine) {
      // Use a longer delay to ensure DOM is fully ready
      setTimeout(async () => {
        try {
          if (typeof Alpine.initTree === "function") {
            // Destroy old Alpine instances first
            if (typeof Alpine.destroyTree === "function") {
              try {
                Alpine.destroyTree(target);
              } catch (e) {
                console.warn('Alpine destroyTree warning:', e);
              }
            }
            // Initialize new Alpine instances
            await Alpine.initTree(target);
            console.log('Alpine re-initialized for new content');
          } else if (typeof Alpine.init === "function") {
            Alpine.init();
            console.log('Alpine initialized (legacy method)');
          }
        } catch (e) {
          console.warn('Alpine initialization warning:', e);
          // Fallback to basic init
          if (typeof Alpine.init === "function") {
            try {
              Alpine.init();
            } catch (err) {
              console.error('Alpine init failed:', err);
            }
          }
        }
      }, 100); // Increased delay for better reliability
    }
  },

  executeScripts(container) {
    const scripts = container.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value)
      );
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      document.head.appendChild(newScript);
      document.head.removeChild(newScript);
      oldScript.remove();
    });
  },
};

// --- Alpine Helpers ---
document.addEventListener("alpine:init", () => {
  // Helper to fetch a collection (array)
  Alpine.data("collection", (url) => ({
    items: [],
    loading: true,
    error: null,

    async init() {
      this.loading = true;
      const data = await Framework.fetchJSON(url);
      if (data) {
        this.items = data;
      } else {
        this.error = "Failed to load data";
      }
      this.loading = false;
    },
  }));

  // Helper to fetch a single item by key/value
  Alpine.data("item", (url, key, value) => ({
    item: null,
    loading: true,
    error: null,

    async init() {
      this.loading = true;
      const data = await Framework.fetchJSON(url);
      if (data) {
        this.item = data.find((i) => i[key] === value);
        if (!this.item) {
          this.error = "Item not found";
        }
      } else {
        this.error = "Failed to load data";
      }
      this.loading = false;
    },
  }));
});
