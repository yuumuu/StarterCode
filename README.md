# Staco - Advanced Lightweight SPA Framework

> **🌐 Live Demo:** [yuumuu.github.io/Staco](https://yuumuu.github.io/Staco)

## What is Staco?

Modern, lightweight SPA framework with **zero build step**. Built with HTML, TailwindCSS, and Alpine.js for rapid development and production-ready applications.

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yuumuu/Staco.git
cd Staco
```

### 2. Start Local Server
```bash
# Option 1: npx
npx serve -l 3000 .

# Option 2: Python
python -m http.server 3000
```

### 3. Start Building!
Open `http://localhost:3000` and you're ready to code.

## CLI Tools 🛠️

Staco includes a built-in CLI tool to help you manage your project.

### Usage
Run the CLI using Node.js:
```bash
node staco <command>
```

### Commands

#### 1. Rename Project
Renames the project from "Staco" to your custom name (updates `index.html`, `base-path.js`, etc).
```bash
node staco rename MyAwesomeApp
```

#### 2. Generate Code
Quickly scaffold new files:

**Controller:**
```bash
node staco generate controller User
# Creates app/Controllers/UserController.js
```

**View:**
```bash
node staco generate view dashboard
# Creates app/Views/dashboard.html
```

**Component:**
```bash
node staco generate component card
# Creates app/Components/card.html
```


## Core Concepts

### 1. The `App` Object
Staco uses a global `App` object (alias for `Framework`) to handle core functionality.

```javascript
// Fetch Data
const data = await App.fetchJSON('data.json');

// Render Views
await App.render('app/Views/page.html', 'router-view');

// Use Plugins
App.usePlugin('toast', 'Hello World!');
```

### 2. Smart Routing
Routes are defined in `config/routes.js`. Staco supports hash-based routing with dynamic parameters.

```javascript
// config/routes.js
const routes = [
    { path: '/', component: 'app/Views/home.html' },
    { path: '/users/:id', component: 'app/Views/user-detail.html' }
];
```

### 3. MVC Controllers
Controllers in `app/Controllers/` are auto-discovered. No manual import needed.

```javascript
// app/Controllers/UserController.js
window.UserController = {
    async list() {
        return {
            users: await App.fetchJSON('api/users.json')
        };
    }
};
```

### 4. Views & Components
Build UI using HTML components with slots and props.

**Layouts:**
```html
<!-- app/Views/home.html -->
<layout name="main">
    <slot name="content">
        <h1>Welcome</h1>
    </slot>
</layout>
```

**Components:**
```html
<include src="app/Components/card.html" title="My Card">
    <p>Card content</p>
</include>
```

## New Features 🚀

### 🔌 Centralized Plugin System
Staco now has a modular plugin system located in `app/Plugins/`.

**Available Plugins:**
- **Toast**: `App.usePlugin('toast', 'Message', 'success|error|info')`
- **Loader**: `App.usePlugin('loader', true|false)`
- **Modal**: `App.usePlugin('modal', { title, content, onConfirm })`
- **Notification**: `App.usePlugin('notification', { message, type })`

**Creating Plugins:**
Create a file in `app/Plugins/` and register it in `app/Plugins/index.js`.

### 🏷️ Custom Page Titles
Set browser tab titles directly from your Views.

**Method 1: HTML Comment (Recommended)**
```html
<!-- title: Dashboard - My App -->
<layout name="main">...</layout>
```

**Method 2: Meta Tag**
```html
<meta name="page-title" content="Dashboard">
```

## Syntax Reference

### HTML Directives
- `<include src="...">`: Include component
- `<layout name="...">`: Use layout
- `<slot name="...">`: Define slot content

### Alpine.js Integration
Staco is built on Alpine.js. Use all standard directives:
- `x-data`: Define state
- `x-text`: Bind text
- `x-if`: Conditional rendering
- `x-for`: Loops
- `x-model`: Two-way binding

### TailwindCSS
Full TailwindCSS support via CDN (or local build if configured). Use utility classes directly in your HTML.

## Project Structure

```
Staco/
├── app/
│   ├── Components/      # Reusable UI components
│   ├── Controllers/     # MVC controllers
│   ├── Layouts/         # Page layouts
│   ├── Plugins/         # System plugins (NEW)
│   └── Views/           # Page views
├── config/              # App configuration & routes
├── core/System/         # Framework core (Engine, Router, Store)
├── public/              # Static assets (css, js, media)
└── storage/data/        # JSON data files
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

---

**Built with ❤️ by the Staco community**
