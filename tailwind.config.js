/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#135bec",
                "primary-dark": "#0e44b3",
                "primary-hover": "#0e4bce",
                "accent": "#f5c518",
                "background-light": "#f6f6f8",
                "background-dark": "#101622",
                "surface-light": "#ffffff",
                "surface-dark": "#1a2233",
                "card-light": "#ffffff",
                "card-dark": "#1a2230",
                "border-light": "#e2e8f0",
                "border-dark": "#334155",
                "text-main": "#0d121b",
                "text-secondary": "#4c669a",
                "event-fellowship": "#10b981",
                "event-meeting": "#fbbf24",
                "availability-primary": "#13ec37",
                "availability-dark": "#0fb32b",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
                "full": "9999px"
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries'),
    ],
}
