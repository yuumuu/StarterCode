window.Router = {
  routes: [],

  init(routes) {
    this.routes = routes;
    window.addEventListener("hashchange", () => this.handleHashChange());
    window.addEventListener("load", () => this.handleHashChange());
    // Trigger immediately
    this.handleHashChange();
  },

  async handleHashChange() {
    let hash = window.location.hash.slice(1) || "/";
    
    // Detect anchor vs route
    // #contact → anchor (scroll in current page)
    // #/about → route (SPA navigation)
    // #/about#team → route + anchor
    
    let path = "/";
    let anchor = null;
    
    if (hash.startsWith("/")) {
      // Route (with possible anchor)
      const parts = hash.split("#");
      path = parts[0];
      anchor = parts[1] || null;
    } else if (hash) {
      // Pure anchor (scroll in current page)
      anchor = hash;
      this.scrollToAnchor(anchor);
      this.updateActiveAnchors(anchor);
      return; // Don't change route
    }
    
    const [pathOnly, query] = path.split("?");

    // Find route
    let route = this.routes.find((r) => r.path === pathOnly);
    let params = {};

    // Regex Match Support
    if (!route) {
      for (const r of this.routes) {
        if (r.path.includes(":")) {
          const regexPath =
            "^" + r.path.replace(/:[a-zA-Z0-9_]+/g, "([^/]+)") + "$";
          const matcher = new RegExp(regexPath);
          const match = pathOnly.match(matcher);

          if (match) {
            route = r;
            const paramNames = (r.path.match(/:[a-zA-Z0-9_]+/g) || []).map(
              (p) => p.slice(1)
            );
            match.slice(1).forEach((val, i) => {
              params[paramNames[i]] = val;
            });
            break;
          }
        }
      }
    }

    // Store params and path
    this.params = params;
    this.currentPath = pathOnly;
    
    // Update Store Params
    if (window.Store) {
      window.Store.set("params", params);
    }

    // 404 Fallback
    if (!route) {
      route = this.routes.find((r) => r.path === "/404") || {
        component: "app/pages/404.html",
      };
    }

    // Pre-route hook
    if (route.beforeEnter) {
      const shouldProceed = await route.beforeEnter();
      if (!shouldProceed) return;
    }

    // Clear HTML cache for this route
    if (window.Framework && window.Framework.cache) {
      delete window.Framework.cache[route.component];
    }

    // Update Document Title
    if (route.title) {
      document.title = route.title;
    } else {
      document.title = 'Staco - Advanced Lightweight SPA'; // Default title
    }

    // Load Page
    await Framework.render(route.component, "router-view");

    // Update Active Links
    this.updateActiveLinks(pathOnly);
    
    // Scroll to anchor if present
    if (anchor) {
      setTimeout(() => this.scrollToAnchor(anchor), 100);
    }
    
    // Emit route changed events
    window.dispatchEvent(new CustomEvent('route:changed', {
      detail: { path: pathOnly, params }
    }));
    
    // Also dispatch 'route-changed' for compatibility with scroll-animate.js
    window.dispatchEvent(new CustomEvent('route-changed', {
      detail: { path: pathOnly, params }
    }));
  },
  
  // Update active route links
  updateActiveLinks(currentPath) {
    document.querySelectorAll('[href^="#/"]').forEach((link) => {
      const href = link.getAttribute('href');
      const linkPath = href.slice(1).split('#')[0]; // Remove # and anchor
      
      // Exact match or partial match for nested routes
      const isActive = currentPath === linkPath || 
                       (linkPath !== '/' && currentPath.startsWith(linkPath + '/'));
      
      link.classList.toggle('nav-link-active', isActive);
      
      // Keep legacy class for backward compatibility
      link.classList.toggle('active-link', isActive);
    });
  },
  
  // Update active anchor links
  updateActiveAnchors(currentAnchor) {
    document.querySelectorAll('[href^="#"]:not([href^="#/"])').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      
      const anchor = href.slice(1);
      const isActive = anchor === currentAnchor;
      link.classList.toggle('nav-anchor-active', isActive);
    });
  },
  
  // Scroll to anchor
  scrollToAnchor(anchor) {
    const element = document.getElementById(anchor);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.updateActiveAnchors(anchor);
    }
  },

  navigate(path) {
    window.location.hash = path;
  },
};
