import { useState } from 'react';
import {
  Button,
  Input,
  Tabs,
  Tab,
  Card,
  CardBody,
  Divider,
} from '@heroui/react';
import {
  Monitor,
  Palette,
  Layout,
  Terminal,
  RotateCcw,
  Sun,
  Moon,
  Check,
  ChevronDown,
  Eye,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { DebugTreeView } from '../DebugTreeView';
import type { Settings as SettingsType } from '../../hooks/useSettings';

interface SettingsAppProps {
  settings: SettingsType;
  onUpdateSettings: (updates: Partial<SettingsType>) => void;
  onResetSettings: () => void;
  spacesState?: any;
  viewportsState?: any;
}

const PRESET_GRADIENTS = [
  { name: 'Ocean', start: '#667eea', end: '#764ba2', angle: 135 },
  { name: 'Sunset', start: '#ff6b6b', end: '#feca57', angle: 135 },
  { name: 'Forest', start: '#11998e', end: '#38ef7d', angle: 135 },
  { name: 'Lavender', start: '#a8caba', end: '#5d4e6d', angle: 135 },
  { name: 'Midnight', start: '#2c3e50', end: '#3498db', angle: 135 },
  { name: 'Warmth', start: '#f093fb', end: '#f5576c', angle: 135 },
];

const PRESET_COLORS = [
  '#ffffff', '#f5f7fa', '#e8ecf1',
  '#667eea', '#ff6b6b', '#11998e',
  '#1e1e1e', '#2d3748', '#4a5568', '#000000',
  '#E5E2D1', '#E5E0D2', '#C7C7C7', '#D2E5DE', '#D4E5E8'
];

const LIGHT_THEME_DEFAULTS = {
  backgroundType: 'gradient',
  backgroundColor: '#f5f7fa',
  gradientStart: '#f5f7fa',
  gradientEnd: '#e8ecf1',
  gradientAngle: 135
};

const DARK_THEME_DEFAULTS = {
  backgroundType: 'solid',
  backgroundColor: '#18181b', // zinc-950
  gradientStart: '#0f172a', // slate-950
  gradientEnd: '#1e293b', // slate-800
  gradientAngle: 135
};

// Custom Switch Component
const SettingSwitch = ({
  label,
  description,
  isSelected,
  onChange
}: {
  label: string;
  description?: string;
  isSelected: boolean;
  onChange: (val: boolean) => void;
}) => (
  <div
    className="flex justify-between items-center py-3 px-1 group cursor-pointer"
    onClick={() => onChange(!isSelected)}
  >
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-default-900">{label}</span>
      {description && <span className="text-xs text-default-500">{description}</span>}
    </div>
    <div className={`
      relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out
      ${isSelected ? 'bg-primary' : 'bg-default-200'}
    `}>
      <div className={`
        absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out
        ${isSelected ? 'translate-x-5' : 'translate-x-0'}
      `} />
    </div>
  </div>
);

// Custom Radio Card Component
const RadioCard = ({
  isSelected,
  onClick,
  icon: Icon,
  label,
  value
}: {
  isSelected: boolean;
  onClick: () => void;
  icon?: any;
  label: string;
  value?: string;
}) => (
  <div
    onClick={onClick}
    className={`
      relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
      ${isSelected
        ? 'border-primary bg-primary/5 shadow-sm'
        : 'border-default-200 bg-transparent hover:border-default-300 hover:bg-default-50'
      }
    `}
  >
    {isSelected && (
      <div className="absolute top-2 right-2 text-primary">
        <Check size={16} />
      </div>
    )}
    {Icon && <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-primary' : 'text-default-500'}`} />}
    <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-default-700'}`}>
      {label}
    </span>
  </div>
);

// Custom Slider Component
const SettingSlider = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (val: number) => void;
}) => (
  <div className="flex flex-col gap-3 py-2">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-default-900">{label}</span>
      <span className="text-xs font-mono bg-default-100 px-2 py-1 rounded text-default-600">
        {value}{unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="slider w-full h-2 bg-default-200 rounded-lg appearance-none cursor-pointer accent-primary"
    />
  </div>
);

export function SettingsApp({
  settings,
  onUpdateSettings,
  onResetSettings,
  spacesState,
  viewportsState
}: SettingsAppProps) {
  const [debugMode, setDebugMode] = useState<'json' | 'tree'>('json');

  const generateDesignSystemPrompt = () => {
    const prompt = `
Current Design System Settings:
- Theme: ${settings.theme}
- Background: ${settings.backgroundType === 'solid' ? settings.backgroundColor : `Linear Gradient (${settings.gradientAngle}deg, ${settings.gradientStart}, ${settings.gradientEnd})`}
- Transparency: ${settings.transparency ? 'On' : 'Off'}
- Blur: ${settings.blur ? 'On' : 'Off'}
- Button Radius: ${settings.buttonBorderRadius}
- Button Padding: Horizontal ${settings.buttonPaddingLeft}rem, Vertical ${settings.buttonPaddingTop}rem
- Viewport Transparency: ${settings.viewportTransparency ? 'On' : 'Off'}
- Viewport Blur: ${settings.viewportBlur ? 'On' : 'Off'}

Typography:
- Heading 1: text-4xl font-bold tracking-tight
- Heading 2: text-3xl font-bold tracking-tight
- Heading 3: text-2xl font-bold
- Heading 4: text-xl font-semibold
- Body: text-base leading-relaxed
- Small: text-sm text-default-500

Colors:
- Primary: hsl(var(--primary))
- Background: var(--background)
- Foreground: var(--foreground)

Please apply these settings to the application design.
    `.trim();

    navigator.clipboard.writeText(prompt);
  };

  if (!settings) return null;

  return (
    <div className="h-full w-full flex flex-col bg-transparent">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-8 px-6 space-y-8">

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
            <p className="text-default-500">
              Customize the look and feel of your workspace.
            </p>
          </div>

          <Tabs
            aria-label="Settings Options"
            color="primary"
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary h-0.5",
              tab: "max-w-fit px-0 h-12 text-default-500 data-[selected=true]:text-primary font-medium",
              tabContent: "group-data-[selected=true]:text-primary"
            }}
          >
            {/* --- APPEARANCE TAB --- */}
            <Tab
              key="appearance"
              title={
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4" />
                  <span>Appearance</span>
                </div>
              }
            >
              <div className="flex flex-col gap-8 py-6">

                {/* Theme Section */}
                <section className="space-y-4">
                  <h3 className="text-xs font-semibold text-default-400 uppercase tracking-wider">Theme</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <RadioCard
                      label="Light"
                      icon={Sun}
                      isSelected={settings.theme === 'light'}
                      onClick={() => onUpdateSettings({
                        theme: 'light',
                        // Apply light theme defaults if coming from dark
                        ...(settings.theme === 'dark' ? LIGHT_THEME_DEFAULTS : {})
                      })}
                    />
                    <RadioCard
                      label="Dark"
                      icon={Moon}
                      isSelected={settings.theme === 'dark'}
                      onClick={() => onUpdateSettings({
                        theme: 'dark',
                        // Apply dark theme defaults if coming from light
                        ...(settings.theme === 'light' ? DARK_THEME_DEFAULTS : {})
                      })}
                    />
                  </div>
                </section>

                <Divider />

                {/* Sidebar Section */}
                <section className="space-y-4">
                  <h3 className="text-xs font-semibold text-default-400 uppercase tracking-wider">Sidebar</h3>
                  <div className="bg-default-50/50 rounded-xl border border-divider p-4 space-y-2">
                    <SettingSwitch
                      label="Transparency"
                      description="Makes the sidebar background semi-transparent"
                      isSelected={settings.transparency}
                      onChange={(val) => onUpdateSettings({ transparency: val })}
                    />
                    <Divider className="opacity-50" />
                    <SettingSwitch
                      label="Blur"
                      description="Applies a frosted glass effect (backdrop-filter)"
                      isSelected={settings.blur}
                      onChange={(val) => onUpdateSettings({ blur: val })}
                    />
                  </div>
                </section>

                {/* Viewport Section */}
                <section className="space-y-4">
                  <h3 className="text-xs font-semibold text-default-400 uppercase tracking-wider">Viewport</h3>
                  <div className="bg-default-50/50 rounded-xl border border-divider p-4 space-y-2">
                    <SettingSwitch
                      label="Panel Transparency"
                      description="Makes content panels semi-transparent"
                      isSelected={settings.viewportTransparency}
                      onChange={(val) => onUpdateSettings({ viewportTransparency: val })}
                    />
                    <Divider className="opacity-50" />
                    <SettingSwitch
                      label="Panel Blur"
                      description="Applies a glass effect to content panels"
                      isSelected={settings.viewportBlur}
                      onChange={(val) => onUpdateSettings({ viewportBlur: val })}
                    />
                  </div>
                </section>

              </div>
            </Tab>

            {/* --- INTERFACE TAB --- */}
            <Tab
              key="ui"
              title={
                <div className="flex items-center space-x-2">
                  <Layout className="w-4 h-4" />
                  <span>Interface</span>
                </div>
              }
            >
              <div className="flex flex-col gap-8 py-6">

                {/* Buttons Section */}
                <section className="space-y-4">
                  <h3 className="text-xs font-semibold text-default-400 uppercase tracking-wider">Button Style</h3>
                  <div className="space-y-6">
                    <div>
                      <span className="text-sm font-medium text-default-900 mb-3 block">Radius</span>
                      <div className="flex gap-3">
                        {['4px', '8px', '12px', '999px'].map((radius) => (
                          <button
                            key={radius}
                            onClick={() => onUpdateSettings({ buttonBorderRadius: radius })}
                            className={`
                              flex-1 h-10 rounded-lg border text-sm font-medium transition-all
                              ${settings.buttonBorderRadius === radius
                                ? 'border-primary bg-primary text-primary-foreground shadow-md'
                                : 'border-default-200 bg-white hover:bg-default-50 text-default-700'
                              }
                            `}
                          >
                            {radius === '999px' ? 'Pill' : radius}
                          </button>
                        ))}
                      </div>
                    </div>

                    <SettingSlider
                      label="Horizontal Padding"
                      value={settings.buttonPaddingLeft}
                      min={0}
                      max={3}
                      step={0.1}
                      unit="rem"
                      onChange={(val) => onUpdateSettings({
                        buttonPaddingLeft: val,
                        buttonPaddingRight: val
                      })}
                    />
                  </div>
                </section>

                <Divider />

                {/* Previews Section */}
                <section className="space-y-4">
                  <h3 className="text-xs font-semibold text-default-400 uppercase tracking-wider">Space Previews</h3>
                  <div className="space-y-6">
                    <div>
                      <span className="text-sm font-medium text-default-900 mb-3 block">Card Radius</span>
                      <div className="flex gap-3">
                        {['4px', '8px', '12px', '16px'].map((radius) => (
                          <button
                            key={radius}
                            onClick={() => onUpdateSettings({ previewBorderRadius: radius })}
                            className={`
                              flex-1 h-10 rounded-lg border text-sm font-medium transition-all
                              ${settings.previewBorderRadius === radius
                                ? 'border-primary bg-primary text-primary-foreground shadow-md'
                                : 'border-default-200 bg-white hover:bg-default-50 text-default-700'
                              }
                            `}
                          >
                            {radius}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </Tab>

            {/* --- BACKGROUND TAB --- */}
            <Tab
              key="background"
              title={
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4" />
                  <span>Background</span>
                </div>
              }
            >
              <div className="flex flex-col gap-8 py-6">

                {/* Type Selection */}
                <div className="bg-default-100 p-1 rounded-xl flex">
                  <button
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.backgroundType === 'solid' ? 'bg-white shadow text-primary' : 'text-default-500 hover:text-default-700'}`}
                    onClick={() => onUpdateSettings({ backgroundType: 'solid' })}
                  >
                    Solid Color
                  </button>
                  <button
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.backgroundType === 'gradient' ? 'bg-white shadow text-primary' : 'text-default-500 hover:text-default-700'}`}
                    onClick={() => onUpdateSettings({ backgroundType: 'gradient' })}
                  >
                    Gradient
                  </button>
                </div>

                {settings.backgroundType === 'solid' ? (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <section className="space-y-4">
                      <h3 className="text-xs font-semibold text-default-400 uppercase tracking-wider">Preset Colors</h3>
                      <div className="grid grid-cols-6 gap-3">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            className={`
                              w-full aspect-square rounded-full border-2 transition-all hover:scale-110 shadow-sm
                              ${settings.backgroundColor === color ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-divider'}
                            `}
                            style={{ backgroundColor: color }}
                            onClick={() => onUpdateSettings({ backgroundColor: color })}
                            title={color}
                          />
                        ))}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-xs font-semibold text-default-400 uppercase tracking-wider">Customize</h3>
                      <div className="flex gap-4 items-center p-4 rounded-xl border border-divider bg-default-50">
                        <div
                          className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                          style={{ backgroundColor: settings.backgroundColor }}
                        />
                        <div className="flex-1">
                          <Input
                            type="text"
                            label="HEX Color"
                            value={settings.backgroundColor}
                            onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
                            size="sm"
                            variant="flat"
                          />
                        </div>
                        <div className="relative">
                          <input
                            type="color"
                            value={settings.backgroundColor}
                            onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <Button size="sm" variant="flat" isIconOnly>
                            <Palette size={18} />
                          </Button>
                        </div>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                    <section className="space-y-4">
                      <h3 className="text-xs font-semibold text-default-400 uppercase tracking-wider">Preset Gradients</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {PRESET_GRADIENTS.map((grad) => (
                          <button
                            key={grad.name}
                            className={`
                              h-14 rounded-xl border-2 transition-all hover:scale-[1.02] flex items-center justify-center relative overflow-hidden group
                              ${settings.gradientStart === grad.start ? 'border-primary shadow-md' : 'border-transparent'}
                            `}
                            style={{
                              background: `linear-gradient(to right, ${grad.start}, ${grad.end})`
                            }}
                            onClick={() => onUpdateSettings({
                              gradientStart: grad.start,
                              gradientEnd: grad.end,
                              gradientAngle: grad.angle
                            })}
                          >
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            <span className="text-white font-medium drop-shadow-md relative z-10">{grad.name}</span>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-xs font-semibold text-default-400 uppercase tracking-wider">Configuration</h3>
                      <div className="p-4 rounded-xl border border-divider bg-default-50 space-y-6">
                        <div className="flex gap-6">
                          <div className="flex-1 space-y-2">
                            <label className="text-xs font-medium text-default-500">Start Color</label>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded border border-divider"
                                style={{ backgroundColor: settings.gradientStart }}
                              />
                              <Input
                                size="sm"
                                value={settings.gradientStart}
                                onChange={(e) => onUpdateSettings({ gradientStart: e.target.value })}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <label className="text-xs font-medium text-default-500">End Color</label>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded border border-divider"
                                style={{ backgroundColor: settings.gradientEnd }}
                              />
                              <Input
                                size="sm"
                                value={settings.gradientEnd}
                                onChange={(e) => onUpdateSettings({ gradientEnd: e.target.value })}
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>

                        <Divider className="opacity-50" />

                        <SettingSlider
                          label="Gradient Angle"
                          value={settings.gradientAngle}
                          min={0}
                          max={360}
                          step={15}
                          unit="°"
                          onChange={(val) => onUpdateSettings({ gradientAngle: val })}
                        />
                      </div>
                    </section>
                  </div>
                )}
              </div>
            </Tab>

            {/* --- DESIGN SYSTEM TAB --- */}
            <Tab
              key="design-system"
              title={
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4" />
                  <span>Design System</span>
                </div>
              }
            >
              <div className="flex flex-col gap-8 py-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Palette size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">OVFX Design System</h2>
                      <p className="text-sm text-default-500">
                        Visual editor for themes and tokens. Changes are applied in real time.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">v2.0.0</div>
                    <div className="px-2 py-1 rounded bg-default-100 text-default-600 text-xs font-medium">Hero UI</div>
                    <div className="px-2 py-1 rounded bg-default-100 text-default-600 text-xs font-medium capitalize">{settings.theme} Mode</div>
                  </div>
                </div>

                <Divider />

                {/* Typography Section (Display Only as it relies on Tailwind classes) */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-default-400 uppercase tracking-wider">Typography</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-1">Heading 1</h1>
                        <p className="text-xs text-default-400 font-mono">text-4xl font-bold tracking-tight</p>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold tracking-tight mb-1">Heading 2</h2>
                        <p className="text-xs text-default-400 font-mono">text-3xl font-bold tracking-tight</p>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-1">Heading 3</h3>
                        <p className="text-xs text-default-400 font-mono">text-2xl font-bold</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-base leading-relaxed mb-1">
                          Body text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
                        </p>
                        <p className="text-xs text-default-400 font-mono">text-base leading-relaxed</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500 mb-1">
                          Muted text / Secondary. Duis aute irure dolor in reprehenderit.
                        </p>
                        <p className="text-xs text-default-400 font-mono">text-sm text-default-500</p>
                      </div>
                      <div>
                        <p className="text-tiny font-bold uppercase tracking-wider text-default-400 mb-1">Overline / Caption</p>
                        <p className="text-xs text-default-400 font-mono">text-tiny font-bold uppercase</p>
                      </div>
                    </div>
                  </div>
                </section>

                <Divider />

                {/* Interactive Components Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-default-400 uppercase tracking-wider">Components & Style</span>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Button Radius Control */}
                    <Card className="bg-default-50 border-divider shadow-none">
                      <CardBody className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium">Button Radius</label>
                          <span className="text-xs font-mono text-default-500">{settings.buttonBorderRadius}</span>
                        </div>
                        <div className="flex gap-2">
                          {['4px', '8px', '12px', '999px'].map((radius) => (
                            <button
                              key={radius}
                              onClick={() => onUpdateSettings({ buttonBorderRadius: radius })}
                              className={`
                                flex-1 h-8 rounded border text-xs font-medium transition-all
                                ${settings.buttonBorderRadius === radius
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-default-200 bg-white hover:bg-default-50 text-default-700'
                                }
                              `}
                            >
                              {radius === '999px' ? 'Pill' : radius}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button color="primary" size="sm">Primary</Button>
                          <Button variant="flat" color="secondary" size="sm">Secondary</Button>
                          <Button variant="bordered" size="sm">Outline</Button>
                          <Button variant="ghost" size="sm">Ghost</Button>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Viewport Style Control */}
                    <Card className="bg-default-50 border-divider shadow-none">
                      <CardBody className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium">Viewport Style</label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <SettingSwitch
                            label="Transparency"
                            isSelected={settings.viewportTransparency}
                            onChange={(val) => onUpdateSettings({ viewportTransparency: val })}
                          />
                          <SettingSwitch
                            label="Blur"
                            isSelected={settings.viewportBlur}
                            onChange={(val) => onUpdateSettings({ viewportBlur: val })}
                          />
                        </div>
                        <div className={`
                          p-4 rounded-xl border border-divider transition-all
                          ${settings.viewportTransparency ? 'bg-background/60 backdrop-blur-xl' : 'bg-background'}
                        `}>
                          <p className="text-sm">Preview content area style</p>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </section>

                <Divider />

                {/* Prompt Generation */}
                <section className="pt-2">
                  <Button
                    className="w-full"
                    color="primary"
                    size="lg"
                    startContent={<Copy size={18} />}
                    onPress={generateDesignSystemPrompt}
                  >
                    Copy Design System Prompt
                  </Button>
                  <p className="text-xs text-center text-default-400 mt-2">
                    Copy the current configuration to the clipboard to apply it via prompt.
                  </p>
                </section>
              </div>
            </Tab>

            {/* --- VISUAL AIDS TAB --- */}
            <Tab
              key="visual-aids"
              title={
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Visual Aids</span>
                </div>
              }
            >
              <div className="flex flex-col gap-8 py-6">
                <section className="space-y-4">
                  <h3 className="text-xs font-semibold text-default-400 uppercase tracking-wider">Debug Visuals</h3>
                  <div className="bg-default-50/50 rounded-xl border border-divider p-4 space-y-2">
                    <SettingSwitch
                      label="Show Text Outlines"
                      description="Shows a border around text elements for debugging layout"
                      isSelected={settings.showTextOutlines}
                      onChange={(val) => onUpdateSettings({ showTextOutlines: val })}
                    />
                    <Divider className="opacity-50" />

                    <SettingSwitch
                      label="Show Padding"
                      description="Visualizes padding areas"
                      isSelected={settings.showPadding}
                      onChange={(val) => onUpdateSettings({ showPadding: val })}
                    />
                    {settings.showPadding && (
                      <div className="pl-4 pr-2 pb-3 pt-1">
                        <div className="flex gap-4 items-center p-2 rounded-lg bg-default-100/50">
                          <div
                            className="w-8 h-8 rounded border border-divider shadow-sm"
                            style={{ backgroundColor: settings.paddingColor }}
                          />
                          <div className="flex-1">
                            <Input
                              type="text"
                              label="Padding Color"
                              value={settings.paddingColor}
                              onChange={(e) => onUpdateSettings({ paddingColor: e.target.value })}
                              size="sm"
                              variant="flat"
                              classNames={{ inputWrapper: "h-8 min-h-0" }}
                            />
                          </div>
                          <div className="relative w-8 h-8">
                            <input
                              type="color"
                              value={settings.paddingColor}
                              onChange={(e) => onUpdateSettings({ paddingColor: e.target.value })}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button size="sm" variant="flat" isIconOnly className="w-8 h-8 min-w-0">
                              <Palette size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <Divider className="opacity-50" />

                    <SettingSwitch
                      label="Show Margins"
                      description="Visualizes margin areas"
                      isSelected={settings.showMargins}
                      onChange={(val) => onUpdateSettings({ showMargins: val })}
                    />
                    {settings.showMargins && (
                      <div className="pl-4 pr-2 pb-3 pt-1">
                        <div className="flex gap-4 items-center p-2 rounded-lg bg-default-100/50">
                          <div
                            className="w-8 h-8 rounded border border-divider shadow-sm"
                            style={{ backgroundColor: settings.marginColor }}
                          />
                          <div className="flex-1">
                            <Input
                              type="text"
                              label="Margin Color"
                              value={settings.marginColor}
                              onChange={(e) => onUpdateSettings({ marginColor: e.target.value })}
                              size="sm"
                              variant="flat"
                              classNames={{ inputWrapper: "h-8 min-h-0" }}
                            />
                          </div>
                          <div className="relative w-8 h-8">
                            <input
                              type="color"
                              value={settings.marginColor}
                              onChange={(e) => onUpdateSettings({ marginColor: e.target.value })}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button size="sm" variant="flat" isIconOnly className="w-8 h-8 min-w-0">
                              <Palette size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </Tab>

            {/* --- DEBUG TAB --- */}
            <Tab
              key="debug"
              title={
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4" />
                  <span>Debug</span>
                </div>
              }
            >
              <div className="flex flex-col gap-6 py-6">
                <div className="flex justify-between items-center bg-default-50 p-2 rounded-lg border border-divider">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={debugMode === 'json' ? "solid" : "light"}
                      color={debugMode === 'json' ? "primary" : "default"}
                      onPress={() => setDebugMode('json')}
                    >
                      JSON
                    </Button>
                    <Button
                      size="sm"
                      variant={debugMode === 'tree' ? "solid" : "light"}
                      color={debugMode === 'tree' ? "primary" : "default"}
                      onPress={() => setDebugMode('tree')}
                    >
                      Tree
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    startContent={<RotateCcw className="w-4 h-4" />}
                    onPress={onResetSettings}
                  >
                    Total Reset
                  </Button>
                </div>

                <Card className="bg-[#1e1e1e] border-none shadow-md">
                  <CardBody className="p-0">
                    <div className="h-[400px] overflow-auto p-4 font-mono text-xs text-default-300">
                      {debugMode === 'json' ? (
                        <pre>{JSON.stringify({
                          settings,
                          spacesCount: spacesState?.spaces?.length,
                          viewportRoot: viewportsState?.rootViewport?.id
                        }, null, 2)}</pre>
                      ) : (
                        <div className="text-default-foreground">
                          <DebugTreeView spaces={spacesState?.spaces || []} viewports={viewportsState?.rootViewport} />
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
}