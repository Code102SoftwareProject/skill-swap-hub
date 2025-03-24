"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ColorPalette() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Only render after client-side hydration to prevent theme mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const colors = [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "popover",
    "popover-foreground",
    "primary",
    "primary-foreground",
    "secondary",
    "secondary-foreground",
    "muted",
    "muted-foreground",
    "accent",
    "accent-foreground",
    "destructive",
    "destructive-foreground",
    "border",
    "input",
    "ring",
    "chart-1",
    "chart-2",
    "chart-3",
    "chart-4",
    "chart-5",
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Color Palette</h1>
      
      <div className="flex justify-center mb-8">
        <button 
          className={`px-4 py-2 rounded-l-md ${theme === 'light' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          onClick={() => setTheme('light')}
        >
          Light Mode
        </button>
        <button 
          className={`px-4 py-2 rounded-r-md ${theme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          onClick={() => setTheme('dark')}
        >
          Dark Mode
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {colors.map((color) => (
          <div key={color} className="flex flex-col items-center">
            <div className="text-sm font-medium mb-1">{color}</div>
            <div 
              className={`w-full h-24 rounded-md border`}
              style={{ backgroundColor: `hsl(var(--${color}))` }}
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
}