const Store = {
    init() {
        // Initialize Alpine store
        document.addEventListener('alpine:init', () => {
            Alpine.store('global', {
                user: null,
                theme: 'light',
                params: {},
                
                setUser(u) { this.user = u; },
                setTheme(t) { this.theme = t; }
            });
        });
    },

    get(key) {
        return Alpine.store('global')[key];
    },

    set(key, value) {
        Alpine.store('global')[key] = value;
    },
    
    // Simple subscription (Alpine effects)
    subscribe(key, callback) {
        // Alpine.effect(() => callback(Alpine.store('global')[key]))
        // But we need to wait for Alpine to be ready.
        document.addEventListener('alpine:initialized', () => {
            Alpine.effect(() => {
                const val = Alpine.store('global')[key];
                callback(val);
            });
        });
    }
};

Store.init();
