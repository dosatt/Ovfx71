import { useState, useEffect } from 'react';

export interface Settings {
  theme: 'light' | 'dark';
  transparency: boolean;
  blur: boolean;
  viewportTransparency: boolean;
  viewportBlur: boolean;
  backgroundType: 'solid' | 'gradient';
  backgroundColor: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
  buttonBorderRadius: string;
  tabBorderRadius: string;
  previewBorderRadius: string;
  buttonPaddingTop: number;
  buttonPaddingBottom: number;
  buttonPaddingLeft: number;
  buttonPaddingRight: number;
  tabPaddingTop: number;
  tabPaddingBottom: number;
  tabPaddingLeft: number;
  tabPaddingRight: number;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  transparency: true,
  blur: true,
  viewportTransparency: false,
  viewportBlur: false,
  backgroundType: 'gradient',
  backgroundColor: '#f5f7fa',
  gradientStart: '#f5f7fa',
  gradientEnd: '#e8ecf1',
  gradientAngle: 135,
  buttonBorderRadius: '999px',
  tabBorderRadius: '999px',
  previewBorderRadius: '12px',
  buttonPaddingTop: 0.75,
  buttonPaddingBottom: 0.75,
  buttonPaddingLeft: 2,
  buttonPaddingRight: 2,
  tabPaddingTop: 0.5,
  tabPaddingBottom: 0.66,
  tabPaddingLeft: 1.5,
  tabPaddingRight: 1.5
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('ovfx-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge con i default per aggiungere eventuali nuove proprietà
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        console.error('Errore nel parsing delle impostazioni salvate:', e);
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('ovfx-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const getBackgroundStyle = () => {
    if (settings.backgroundType === 'solid') {
      return settings.backgroundColor;
    }
    return `linear-gradient(${settings.gradientAngle}deg, ${settings.gradientStart} 0%, ${settings.gradientEnd} 100%)`;
  };

  return {
    settings,
    updateSettings,
    resetSettings,
    getBackgroundStyle
  };
}