# Documentation & Walkthrough

## 1. Overview
This is an **Advanced Lightweight SPA Framework** built with HTML, TailwindCSS, and Alpine.js. It runs entirely in the browser (no Node.js build step required), featuring a custom engine for components, layouts, routing, and state management.

It is designed to be simple, scalable, and easy to learn for developers familiar with basic web technologies.

---

## 2. How to Use

### Running the Project
Since this framework uses `fetch` to load components, you must serve it via a local server to avoid CORS errors.
- **VS Code**: Right-click `index.html` -> "Open with Live Server".
- **Python**: `python -m http.server`
- **Node**: `npx serve .`

### Creating a Page
Create a file in `app/pages/mypage.html`:
```html
<layout name="main">
    <slot name="content">
        <h1>My Page</h1>
        <include src="app/components/mycomponent.html" title="Hello World"></include>
    </slot>
</layout>
```

### Routing System

#### Basic Routes
Edit `routes.js`:
```js
const routes = [
    { path: '/', component: 'app/pages/home.html' },
    { path: '/about', component: 'app/pages/about.html' }
];
```

#### Dynamic Routes (Slugs)
The router supports dynamic parameters using the `:param` syntax.
```js
const routes = [
    { path: '/division/:slug', component: 'app/pages/divisions/detail.html' }
];
```
The parameter value is automatically extracted and stored in `$store.global.params`.

### Data Binding Helpers
The framework provides two powerful Alpine.js data helpers to easily fetch and bind JSON data.

#### 1. `collection(url)`
Fetches a JSON array from the given URL.
- **Usage**: `x-data="collection('data/items.json')"`
- **State**: Provides `items` (array), `loading` (bool), and `error` (string).

**Example:**
```html
<div x-data="collection('data/divisions.json')">
    <template x-if="loading">Loading...</template>
    
    <template x-for="item in items">
        <h2 x-text="item.title"></h2>
    </template>
</div>
```

#### 2. `item(url, key, value)`
Fetches a JSON array and finds a specific item where `item[key] === value`.
- **Usage**: `x-data="item('data/items.json', 'id', 1)"`
- **State**: Provides `item` (object), `loading` (bool), and `error` (string).

**Example (using dynamic slug):**
```html
<div x-data="item('data/divisions.json', 'slug', $store.global.params.slug)">
    <template x-if="loading">Loading...</template>
    
    <template x-if="item">
        <h1 x-text="item.title"></h1>
    </template>
</div>
```

### Creating a Component
Create `app/components/mycomponent.html`:
```html
<div class="p-4 border">
    <h2 class="text-xl">{{ title }}</h2>
    <slot></slot> <!-- Default slot -->
</div>
```

### Global Store
Access global state anywhere using `$store.global`.
```html
<button @click="$store.global.setTheme('dark')">Toggle Theme</button>
<span x-text="$store.global.theme"></span>
```

### Plugins
Use built-in plugins for common tasks.
```js
Framework.usePlugin('toast', 'Operation successful!', 'success');
Framework.usePlugin('loader', true); // Show loader
```

---

## 3. Architecture

### Core Structure
- **`index.html`**: Entry point. Loads libraries and core scripts.
- **`main.js`**: Bootstraps the app, initializes plugins.
- **`routes.js`**: Route definitions.
- **`core/engine.js`**: 
    - **HTML Loader**: Fetches and caches HTML files.
    - **Include Processor**: Handles `<include>` and `<layout>`.
    - **Template Engine**: Transforms `{{ var }}` to `x-text`.
    - **Data Helpers**: Implements `collection` and `item`.
- **`core/router.js`**: Hash-based router with regex support for dynamic parameters.
- **`core/store.js`**: Global state management wrapper around Alpine.store.

### Features
- **Zero Build Step**: Runs directly in the browser.
- **Component System**: Supports props, slots, and nesting.
- **Dynamic Routing**: Supports URL parameters.
- **Data Binding**: Easy JSON fetching with loading/error states.
- **XSS Sanitizer**: Uses DOMPurify for security.

---

## 4. Development Task Log

- [x] **Project Initialization**: Created directory structure and core files.
- [x] **Core Engine**: Implemented HTML Loader, Include Processor, Layout/Slot System.
- [x] **Router**: Implemented Hash-based routing with 404 handling.
- [x] **Store**: Implemented Global Store with Alpine integration.
- [x] **Features**: Added XSS Sanitizer, Toast/Loader Plugins.
- [x] **Advanced Routing**: Added Regex support for dynamic routes (slugs).
- **Data Binding**: Implemented `collection` and `item` helpers for easy JSON binding.
- [x] **Content**: Created Demo Pages, Navbar, Layouts, and Division pages.
- [x] **Documentation**: Updated with comprehensive usage guides.
