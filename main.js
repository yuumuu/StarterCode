// Routes loaded from config/routes.js

// Initialize App - Use 'alpine:initialized' instead of 'alpine:init'
// This ensures Alpine is FULLY ready before we initialize the router
document.addEventListener('alpine:initialized', () => {
    console.log('Alpine fully initialized, starting Router...');
    
    // Initialize Router after Alpine is ready
    Router.init(routes);
    
    // Initialize scroll animations after a short delay to ensure DOM is ready
    setTimeout(() => {
        if (window.AOS) {
            console.log('Initializing AOS from main.js');
            window.AOS.init();
        }
    }, 300);
});

// Register App component for Alpine
document.addEventListener('alpine:init', () => {
    Alpine.data('App', () => ({
        init() {
            console.log('App component initialized');
        }
    }));
});

// Register Plugins
Framework.plugin('toast', (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded shadow-lg text-white transform transition-all duration-300 translate-y-10 opacity-0 ${
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    toast.innerText = message;
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    });

    // Remove after 3s
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
});

Framework.plugin('loader', (show) => {
    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'fixed inset-0 bg-white/80 flex items-center justify-center z-50 transition-opacity duration-300';
        loader.innerHTML = '<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>';
        document.body.appendChild(loader);
    }
    
    if (show) {
        loader.classList.remove('pointer-events-none', 'opacity-0');
    } else {
        loader.classList.add('opacity-0', 'pointer-events-none');
    }
});
