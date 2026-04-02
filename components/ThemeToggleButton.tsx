'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

const ThemeToggleButton = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md bg-secondary text-secondary-foreground"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
    </button>
  );
};

export default ThemeToggleButton;
