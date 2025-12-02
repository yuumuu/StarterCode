#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const args = process.argv.slice(2);
const command = args[0];

const COLORS = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m"
};

function log(msg, color = COLORS.reset) {
    console.log(`${color}${msg}${COLORS.reset}`);
}

function error(msg) {
    console.error(`${COLORS.red}Error: ${msg}${COLORS.reset}`);
}

function showHelp() {
    log("\nStaco CLI - Development Tools", COLORS.cyan);
    log("-----------------------------");
    log("Usage: node staco <command> [options]\n");
    log("Commands:");
    log("  rename <new-name>            Rename the project");
    log("  generate controller <name>   Create a new controller");
    log("  generate view <name>         Create a new view");
    log("  generate component <name>    Create a new component");
    log("  help                         Show this help message\n");
}

// --- Helper Functions ---

function getProjectRoot() {
    return __dirname;
}

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Commands ---

async function renameProject(newName) {
    if (!newName) {
        error("Please provide a new project name.");
        log("Usage: node staco rename <new-name>");
        return;
    }

    const root = getProjectRoot();
    log(`Renaming project to '${newName}'...`, COLORS.cyan);

    // 1. Update index.html
    const indexPath = path.join(root, 'index.html');
    if (fs.existsSync(indexPath)) {
        let content = fs.readFileSync(indexPath, 'utf8');
        content = content.replace(/<title>.*?<\/title>/, `<title>${newName}</title>`);
        fs.writeFileSync(indexPath, content);
        log("✓ Updated index.html title", COLORS.green);
    } else {
        log("! index.html not found", COLORS.yellow);
    }

    // 2. Update config/base-path.js
    const basePathFile = path.join(root, 'config', 'base-path.js');
    if (fs.existsSync(basePathFile)) {
        let content = fs.readFileSync(basePathFile, 'utf8');
        // Simple and safe replacement for the return statement
        if (content.includes("return '/Staco/';")) {
             content = content.replace("return '/Staco/';", `return '/${newName}/';`);
             // Also try to update the check logic if it matches standard pattern
             content = content.replace("pathname.startsWith('/Staco')", `pathname.startsWith('/${newName}')`);
             fs.writeFileSync(basePathFile, content);
             log("✓ Updated config/base-path.js", COLORS.green);
        } else {
             log("! config/base-path.js does not contain standard '/Staco/' string. Skipping.", COLORS.yellow);
        }
    } else {
        log("! config/base-path.js not found", COLORS.yellow);
    }

    // 3. Update README.md
    const readmePath = path.join(root, 'README.md');
    if (fs.existsSync(readmePath)) {
        let content = fs.readFileSync(readmePath, 'utf8');
        if (content.startsWith('# Staco')) {
            content = content.replace(/^# Staco/, `# ${newName}`);
            fs.writeFileSync(readmePath, content);
            log("✓ Updated README.md title", COLORS.green);
        }
    }

    log(`\nSuccess! Project renamed to '${newName}'.`, COLORS.green);
}

function generateController(name) {
    if (!name) {
        error("Please provide a controller name.");
        return;
    }
    const className = capitalize(name) + 'Controller';
    const filePath = path.join(getProjectRoot(), 'app', 'Controllers', `${className}.js`);

    if (fs.existsSync(filePath)) {
        error(`Controller '${className}' already exists.`);
        return;
    }

    const content = `// app/Controllers/${className}.js
window.${className} = {
    // Data to be available in the view
    async index() {
        return {
            title: '${capitalize(name)} Page',
            message: 'Welcome to ${capitalize(name)}'
        };
    },

    // Example action
    async submit() {
        console.log('${className} action triggered');
    }
};
`;

    ensureDirectoryExistence(filePath);
    fs.writeFileSync(filePath, content);
    log(`✓ Created controller: app/Controllers/${className}.js`, COLORS.green);
}

function generateView(name) {
    if (!name) {
        error("Please provide a view name.");
        return;
    }
    const filePath = path.join(getProjectRoot(), 'app', 'Views', `${name.toLowerCase()}.html`);

    if (fs.existsSync(filePath)) {
        error(`View '${name}' already exists.`);
        return;
    }

    const content = `<!-- title: ${capitalize(name)} -->
<layout name="main">
    <slot name="content">
        <div class="container mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold mb-4" x-text="title"></h1>
            <p class="text-gray-600" x-text="message"></p>
        </div>
    </slot>
</layout>
`;

    ensureDirectoryExistence(filePath);
    fs.writeFileSync(filePath, content);
    log(`✓ Created view: app/Views/${name.toLowerCase()}.html`, COLORS.green);
}

function generateComponent(name) {
    if (!name) {
        error("Please provide a component name.");
        return;
    }
    const filePath = path.join(getProjectRoot(), 'app', 'Components', `${name.toLowerCase()}.html`);

    if (fs.existsSync(filePath)) {
        error(`Component '${name}' already exists.`);
        return;
    }

    const content = `<!-- app/Components/${name.toLowerCase()}.html -->
<div class="p-4 bg-white rounded-lg shadow" x-data="{ open: false }">
    <h3 class="font-bold text-lg mb-2">${capitalize(name)} Component</h3>
    <slot></slot>
</div>
`;

    ensureDirectoryExistence(filePath);
    fs.writeFileSync(filePath, content);
    log(`✓ Created component: app/Components/${name.toLowerCase()}.html`, COLORS.green);
}

// --- Main Execution ---

switch (command) {
    case 'rename':
        renameProject(args[1]);
        break;
    case 'generate':
    case 'g':
        const type = args[1];
        const name = args[2];
        if (type === 'controller' || type === 'c') generateController(name);
        else if (type === 'view' || type === 'v') generateView(name);
        else if (type === 'component' || type === 'comp') generateComponent(name);
        else {
            error(`Unknown generator type: ${type}`);
            log("Available types: controller, view, component");
        }
        break;
    case 'help':
    case '--help':
    case '-h':
        showHelp();
        break;
    default:
        showHelp();
        break;
}
