import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HeroUIProvider } from '@heroui/react';
import { LibraryAppSection } from './LibrarySite';
import '../index.css';

function LibraryRoot() {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    // Apply theme class to document
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [theme]);

    // Circular Feedback (Ripple Effect)
    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            const circle = document.createElement("div");
            circle.className = "click-ripple";
            circle.style.left = `${e.clientX}px`;
            circle.style.top = `${e.clientY}px`;
            document.body.appendChild(circle);

            circle.addEventListener("animationend", () => {
                circle.remove();
            });
        };

        window.addEventListener("mousedown", handleGlobalClick);
        return () => window.removeEventListener("mousedown", handleGlobalClick);
    }, []);

    return (
        <HeroUIProvider>
            <div className="min-h-screen bg-background text-foreground">
                <LibraryAppSection />
            </div>
        </HeroUIProvider>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<LibraryRoot />);
