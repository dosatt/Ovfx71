import { useState } from 'react';
import Modal from '@mui/joy@5.0.0-beta.48/Modal';
import ModalDialog from '@mui/joy@5.0.0-beta.48/ModalDialog';
import ModalClose from '@mui/joy@5.0.0-beta.48/ModalClose';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Button from '@mui/joy@5.0.0-beta.48/Button';
import Switch from '@mui/joy@5.0.0-beta.48/Switch';
import Radio from '@mui/joy@5.0.0-beta.48/Radio';
import RadioGroup from '@mui/joy@5.0.0-beta.48/RadioGroup';
import Input from '@mui/joy@5.0.0-beta.48/Input';
import Slider from '@mui/joy@5.0.0-beta.48/Slider';
import FormControl from '@mui/joy@5.0.0-beta.48/FormControl';
import FormLabel from '@mui/joy@5.0.0-beta.48/FormLabel';
import { DebugTreeView } from './DebugTreeView';
import type { Settings } from '../hooks/useSettings';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  onResetSettings: () => void;
  spacesState?: any;
  viewportsState?: any;
}

const PRESET_GRADIENTS = [
  { name: 'Ocean Blue', start: '#667eea', end: '#764ba2', angle: 135 },
  { name: 'Sunset', start: '#ff6b6b', end: '#feca57', angle: 135 },
  { name: 'Forest', start: '#11998e', end: '#38ef7d', angle: 135 },
  { name: 'Lavender', start: '#a8caba', end: '#5d4e6d', angle: 135 },
  { name: 'Gray', start: '#f5f7fa', end: '#e8ecf1', angle: 135 },
  { name: 'Purple', start: '#6a11cb', end: '#2575fc', angle: 135 }
];

const PRESET_COLORS = [
  '#ffffff', '#f5f7fa', '#e8ecf1', '#d1d5db',
  '#667eea', '#764ba2', '#ff6b6b', '#feca57',
  '#11998e', '#38ef7d', '#a8caba', '#5d4e6d'
];

export function SettingsModal({
  open,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
  spacesState,
  viewportsState
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'ui' | 'background' | 'debug'>('appearance');
  const [debugView, setDebugView] = useState<'json' | 'tree'>('json');

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        sx={{
          maxWidth: 600,
          width: '90vw',
          maxHeight: '85vh',
          overflow: 'auto'
        }}
      >
        <ModalClose />
        <Typography level="h4" sx={{ mb: 2 }}>
          Impostazioni
        </Typography>

        {/* Custom Tab Navigation */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Button
            variant={activeTab === 'appearance' ? 'soft' : 'plain'}
            onClick={() => setActiveTab('appearance')}
            sx={{ flex: 1, borderRadius: 0, borderBottom: '2px solid', borderColor: activeTab === 'appearance' ? 'primary.500' : 'transparent' }}
          >
            Aspetto
          </Button>
          <Button
            variant={activeTab === 'ui' ? 'soft' : 'plain'}
            onClick={() => setActiveTab('ui')}
            sx={{ flex: 1, borderRadius: 0, borderBottom: '2px solid', borderColor: activeTab === 'ui' ? 'primary.500' : 'transparent' }}
          >
            UI
          </Button>
          <Button
            variant={activeTab === 'background' ? 'soft' : 'plain'}
            onClick={() => setActiveTab('background')}
            sx={{ flex: 1, borderRadius: 0, borderBottom: '2px solid', borderColor: activeTab === 'background' ? 'primary.500' : 'transparent' }}
          >
            Sfondo
          </Button>
          <Button
            variant={activeTab === 'debug' ? 'soft' : 'plain'}
            onClick={() => setActiveTab('debug')}
            sx={{ flex: 1, borderRadius: 0, borderBottom: '2px solid', borderColor: activeTab === 'debug' ? 'primary.500' : 'transparent' }}
          >
            Debug
          </Button>
        </Box>

        {/* Appearance Tab Content */}
        {activeTab === 'appearance' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
            {/* Sidebar Section */}
            <Box>
              <Typography level="title-sm" sx={{ mb: 2, color: 'primary.500' }}>
                Sidebar
              </Typography>
              
              {/* Transparency */}
              <FormControl sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <FormLabel>Trasparenza</FormLabel>
                    <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                      Rende la sidebar semi-trasparente
                    </Typography>
                  </Box>
                  <Switch
                    checked={settings.transparency}
                    onChange={(e) => onUpdateSettings({ transparency: e.target.checked })}
                  />
                </Box>
              </FormControl>

              {/* Blur */}
              <FormControl>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <FormLabel>Effetto Sfocatura</FormLabel>
                    <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                      Applica un effetto blur alla sidebar
                    </Typography>
                  </Box>
                  <Switch
                    checked={settings.blur}
                    onChange={(e) => onUpdateSettings({ blur: e.target.checked })}
                  />
                </Box>
              </FormControl>
            </Box>

            {/* Viewport Section */}
            <Box>
              <Typography level="title-sm" sx={{ mb: 2, color: 'primary.500' }}>
                Viewport
              </Typography>
              
              {/* Viewport Transparency */}
              <FormControl sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <FormLabel>Trasparenza Viewport</FormLabel>
                    <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                      Rende i viewport semi-trasparenti
                    </Typography>
                  </Box>
                  <Switch
                    checked={settings.viewportTransparency}
                    onChange={(e) => onUpdateSettings({ viewportTransparency: e.target.checked })}
                  />
                </Box>
              </FormControl>

              {/* Viewport Blur */}
              <FormControl>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <FormLabel>Effetto Sfocatura Viewport</FormLabel>
                    <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                      Applica un effetto blur ai viewport
                    </Typography>
                  </Box>
                  <Switch
                    checked={settings.viewportBlur}
                    onChange={(e) => onUpdateSettings({ viewportBlur: e.target.checked })}
                  />
                </Box>
              </FormControl>
            </Box>
          </Box>
        )}

        {/* UI Tab Content */}
        {activeTab === 'ui' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
            {/* UI Elements Section */}
            <Box>
              <Typography level="title-sm" sx={{ mb: 2, color: 'primary.500' }}>
                Elementi UI
              </Typography>
              
              {/* Button Border Radius */}
              <FormControl sx={{ mb: 2 }}>
                <FormLabel>Arrotondamento Pulsante "Nuovo"</FormLabel>
                <Typography level="body-sm" sx={{ color: 'text.tertiary', mb: 1 }}>
                  Controlla quanto sono arrotondati gli angoli del pulsante
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Button
                    size="sm"
                    variant={settings.buttonBorderRadius === '4px' ? 'soft' : 'outlined'}
                    onClick={() => onUpdateSettings({ buttonBorderRadius: '4px' })}
                    sx={{ flex: 1 }}
                  >
                    Quadrato
                  </Button>
                  <Button
                    size="sm"
                    variant={settings.buttonBorderRadius === '8px' ? 'soft' : 'outlined'}
                    onClick={() => onUpdateSettings({ buttonBorderRadius: '8px' })}
                    sx={{ flex: 1 }}
                  >
                    Medio
                  </Button>
                  <Button
                    size="sm"
                    variant={settings.buttonBorderRadius === '999px' ? 'soft' : 'outlined'}
                    onClick={() => onUpdateSettings({ buttonBorderRadius: '999px' })}
                    sx={{ flex: 1 }}
                  >
                    Pillola
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, p: 2, bgcolor: 'background.level1', borderRadius: 'sm' }}>
                  <Typography level="body-sm">Anteprima:</Typography>
                  <Button
                    size="sm"
                    sx={{ borderRadius: settings.buttonBorderRadius }}
                  >
                    Nuovo
                  </Button>
                </Box>
              </FormControl>

              {/* Tab Border Radius */}
              <FormControl>
                <FormLabel>Arrotondamento Tabs Viewport</FormLabel>
                <Typography level="body-sm" sx={{ color: 'text.tertiary', mb: 1 }}>
                  Controlla quanto sono arrotondate le tabs nei viewport
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Button
                    size="sm"
                    variant={settings.tabBorderRadius === '4px' ? 'soft' : 'outlined'}
                    onClick={() => onUpdateSettings({ tabBorderRadius: '4px' })}
                    sx={{ flex: 1 }}
                  >
                    Quadrato
                  </Button>
                  <Button
                    size="sm"
                    variant={settings.tabBorderRadius === '8px' ? 'soft' : 'outlined'}
                    onClick={() => onUpdateSettings({ tabBorderRadius: '8px' })}
                    sx={{ flex: 1 }}
                  >
                    Medio
                  </Button>
                  <Button
                    size="sm"
                    variant={settings.tabBorderRadius === '999px' ? 'soft' : 'outlined'}
                    onClick={() => onUpdateSettings({ tabBorderRadius: '999px' })}
                    sx={{ flex: 1 }}
                  >
                    Pillola
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, p: 2, bgcolor: 'background.level1', borderRadius: 'sm' }}>
                  <Typography level="body-sm">Anteprima:</Typography>
                  <Button
                    size="sm"
                    variant="soft"
                    sx={{ borderRadius: settings.tabBorderRadius }}
                  >
                    Tab 1
                  </Button>
                  <Button
                    size="sm"
                    variant="plain"
                    sx={{ borderRadius: settings.tabBorderRadius }}
                  >
                    Tab 2
                  </Button>
                </Box>
              </FormControl>
              
              {/* Preview Border Radius */}
              <FormControl sx={{ mb: 2 }}>
                <FormLabel>Arrotondamento Anteprime Space</FormLabel>
                <Typography level="body-sm" sx={{ color: 'text.tertiary', mb: 1 }}>
                  Controlla quanto sono arrotondati gli angoli delle anteprime
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Button
                    size="sm"
                    variant={settings.previewBorderRadius === '4px' ? 'soft' : 'outlined'}
                    onClick={() => onUpdateSettings({ previewBorderRadius: '4px' })}
                    sx={{ flex: 1 }}
                  >
                    Quadrato
                  </Button>
                  <Button
                    size="sm"
                    variant={settings.previewBorderRadius === '8px' ? 'soft' : 'outlined'}
                    onClick={() => onUpdateSettings({ previewBorderRadius: '8px' })}
                    sx={{ flex: 1 }}
                  >
                    Piccolo
                  </Button>
                  <Button
                    size="sm"
                    variant={settings.previewBorderRadius === '12px' ? 'soft' : 'outlined'}
                    onClick={() => onUpdateSettings({ previewBorderRadius: '12px' })}
                    sx={{ flex: 1 }}
                  >
                    Medio
                  </Button>
                  <Button
                    size="sm"
                    variant={settings.previewBorderRadius === '16px' ? 'soft' : 'outlined'}
                    onClick={() => onUpdateSettings({ previewBorderRadius: '16px' })}
                    sx={{ flex: 1 }}
                  >
                    Grande
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, p: 2, bgcolor: 'background.level1', borderRadius: 'sm' }}>
                  <Typography level="body-sm">Anteprima:</Typography>
                  <Box
                    sx={{
                      width: 80,
                      height: 40,
                      bgcolor: 'background.surface',
                      border: '1px solid',
                      borderColor: 'neutral.300',
                      borderRadius: settings.previewBorderRadius,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography level="body-xs">Preview</Typography>
                  </Box>
                </Box>
              </FormControl>
            </Box>

            {/* Padding Section */}
            <Box>
              <Typography level="title-sm" sx={{ mb: 2, color: 'primary.500' }}>
                Padding Pulsante "Nuovo"
              </Typography>
              
              {/* Button Padding Top */}
              <FormControl sx={{ mb: 2 }}>
                <FormLabel>Padding Superiore: {settings.buttonPaddingTop.toFixed(2)}</FormLabel>
                <Typography level="body-sm" sx={{ color: 'text.tertiary', mb: 1 }}>
                  Spazio interno dall&apos;alto del pulsante
                </Typography>
                <Slider
                  value={settings.buttonPaddingTop}
                  onChange={(_, value) => onUpdateSettings({ buttonPaddingTop: value as number })}
                  min={0}
                  max={3}
                  step={0.125}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => value.toFixed(2)}
                />
              </FormControl>

              {/* Button Padding Bottom */}
              <FormControl sx={{ mb: 2 }}>
                <FormLabel>Padding Inferiore: {settings.buttonPaddingBottom.toFixed(2)}</FormLabel>
                <Typography level="body-sm" sx={{ color: 'text.tertiary', mb: 1 }}>
                  Spazio interno dal basso del pulsante
                </Typography>
                <Slider
                  value={settings.buttonPaddingBottom}
                  onChange={(_, value) => onUpdateSettings({ buttonPaddingBottom: value as number })}
                  min={0}
                  max={3}
                  step={0.125}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => value.toFixed(2)}
                />
              </FormControl>

              {/* Button Padding Left */}
              <FormControl sx={{ mb: 2 }}>
                <FormLabel>Padding Sinistro: {settings.buttonPaddingLeft.toFixed(2)}</FormLabel>
                <Typography level="body-sm" sx={{ color: 'text.tertiary', mb: 1 }}>
                  Spazio interno da sinistra del pulsante
                </Typography>
                <Slider
                  value={settings.buttonPaddingLeft}
                  onChange={(_, value) => onUpdateSettings({ buttonPaddingLeft: value as number })}
                  min={0}
                  max={5}
                  step={0.125}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => value.toFixed(2)}
                />
              </FormControl>

              {/* Button Padding Right */}
              <FormControl sx={{ mb: 3 }}>
                <FormLabel>Padding Destro: {settings.buttonPaddingRight.toFixed(2)}</FormLabel>
                <Typography level="body-sm" sx={{ color: 'text.tertiary', mb: 1 }}>
                  Spazio interno da destra del pulsante
                </Typography>
                <Slider
                  value={settings.buttonPaddingRight}
                  onChange={(_, value) => onUpdateSettings({ buttonPaddingRight: value as number })}
                  min={0}
                  max={5}
                  step={0.125}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => value.toFixed(2)}
                />
              </FormControl>

              {/* Button Preview */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4, p: 2, bgcolor: 'background.level1', borderRadius: 'sm' }}>
                <Typography level="body-sm">Anteprima Pulsante:</Typography>
                <Button
                  size="sm"
                  sx={{ 
                    borderRadius: settings.buttonBorderRadius,
                    pt: settings.buttonPaddingTop,
                    pb: settings.buttonPaddingBottom,
                    pl: settings.buttonPaddingLeft,
                    pr: settings.buttonPaddingRight
                  }}
                >
                  Nuovo
                </Button>
              </Box>

              <Typography level="title-sm" sx={{ mb: 2, color: 'primary.500' }}>
                Padding Tabs Viewport
              </Typography>

              {/* Tab Padding Top */}
              <FormControl sx={{ mb: 2 }}>
                <FormLabel>Padding Superiore: {settings.tabPaddingTop.toFixed(2)}</FormLabel>
                <Typography level="body-sm" sx={{ color: 'text.tertiary', mb: 1 }}>
                  Spazio interno dall&apos;alto delle tabs
                </Typography>
                <Slider
                  value={settings.tabPaddingTop}
                  onChange={(_, value) => onUpdateSettings({ tabPaddingTop: value as number })}
                  min={0}
                  max={2.5}
                  step={0.125}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => value.toFixed(2)}
                />
              </FormControl>

              {/* Tab Padding Bottom */}
              <FormControl sx={{ mb: 2 }}>
                <FormLabel>Padding Inferiore: {settings.tabPaddingBottom.toFixed(2)}</FormLabel>
                <Typography level="body-sm" sx={{ color: 'text.tertiary', mb: 1 }}>
                  Spazio interno dal basso delle tabs
                </Typography>
                <Slider
                  value={settings.tabPaddingBottom}
                  onChange={(_, value) => onUpdateSettings({ tabPaddingBottom: value as number })}
                  min={0}
                  max={2.5}
                  step={0.125}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => value.toFixed(2)}
                />
              </FormControl>

              {/* Tab Padding Left */}
              <FormControl sx={{ mb: 2 }}>
                <FormLabel>Padding Sinistro: {settings.tabPaddingLeft.toFixed(2)}</FormLabel>
                <Typography level="body-sm" sx={{ color: 'text.tertiary', mb: 1 }}>
                  Spazio interno da sinistra delle tabs
                </Typography>
                <Slider
                  value={settings.tabPaddingLeft}
                  onChange={(_, value) => onUpdateSettings({ tabPaddingLeft: value as number })}
                  min={0}
                  max={4}
                  step={0.125}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => value.toFixed(2)}
                />
              </FormControl>

              {/* Tab Padding Right */}
              <FormControl sx={{ mb: 3 }}>
                <FormLabel>Padding Destro: {settings.tabPaddingRight.toFixed(2)}</FormLabel>
                <Typography level="body-sm" sx={{ color: 'text.tertiary', mb: 1 }}>
                  Spazio interno da destra delle tabs
                </Typography>
                <Slider
                  value={settings.tabPaddingRight}
                  onChange={(_, value) => onUpdateSettings({ tabPaddingRight: value as number })}
                  min={0}
                  max={4}
                  step={0.125}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => value.toFixed(2)}
                />
              </FormControl>

              {/* Tab Preview */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'background.level1', borderRadius: 'sm', flexWrap: 'wrap' }}>
                <Typography level="body-sm">Anteprima Tabs:</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Button
                    size="sm"
                    variant="soft"
                    sx={{ 
                      borderRadius: settings.tabBorderRadius,
                      pt: settings.tabPaddingTop,
                      pb: settings.tabPaddingBottom,
                      pl: settings.tabPaddingLeft,
                      pr: settings.tabPaddingRight
                    }}
                  >
                    Tab 1
                  </Button>
                  <Button
                    size="sm"
                    variant="plain"
                    sx={{ 
                      borderRadius: settings.tabBorderRadius,
                      pt: settings.tabPaddingTop,
                      pb: settings.tabPaddingBottom,
                      pl: settings.tabPaddingLeft,
                      pr: settings.tabPaddingRight
                    }}
                  >
                    Tab 2
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Background Tab Content */}
        {activeTab === 'background' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
            {/* Background Type */}
            <FormControl>
              <FormLabel>Tipo di Sfondo</FormLabel>
              <RadioGroup
                value={settings.backgroundType}
                onChange={(e) => onUpdateSettings({ backgroundType: e.target.value as 'solid' | 'gradient' })}
              >
                <Radio value="solid" label="Colore Solido" />
                <Radio value="gradient" label="Gradiente" />
              </RadioGroup>
            </FormControl>

            {/* Solid Color */}
            {settings.backgroundType === 'solid' && (
              <FormControl>
                <FormLabel>Colore</FormLabel>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
                    sx={{ width: 80 }}
                  />
                  <Input
                    value={settings.backgroundColor}
                    onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
                    sx={{ flex: 1 }}
                  />
                </Box>
                <Typography level="body-sm" sx={{ mb: 1, color: 'text.tertiary' }}>
                  Preset:
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1 }}>
                  {PRESET_COLORS.map(color => (
                    <Box
                      key={color}
                      onClick={() => onUpdateSettings({ backgroundColor: color })}
                      sx={{
                        width: '100%',
                        aspectRatio: '1',
                        bgcolor: color,
                        borderRadius: 'sm',
                        border: '2px solid',
                        borderColor: settings.backgroundColor === color ? 'primary.500' : 'divider',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: 'sm'
                        }
                      }}
                    />
                  ))}
                </Box>
              </FormControl>
            )}

            {/* Gradient */}
            {settings.backgroundType === 'gradient' && (
              <>
                <FormControl>
                  <FormLabel>Colore Iniziale</FormLabel>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Input
                      type="color"
                      value={settings.gradientStart}
                      onChange={(e) => onUpdateSettings({ gradientStart: e.target.value })}
                      sx={{ width: 80 }}
                    />
                    <Input
                      value={settings.gradientStart}
                      onChange={(e) => onUpdateSettings({ gradientStart: e.target.value })}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </FormControl>

                <FormControl>
                  <FormLabel>Colore Finale</FormLabel>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Input
                      type="color"
                      value={settings.gradientEnd}
                      onChange={(e) => onUpdateSettings({ gradientEnd: e.target.value })}
                      sx={{ width: 80 }}
                    />
                    <Input
                      value={settings.gradientEnd}
                      onChange={(e) => onUpdateSettings({ gradientEnd: e.target.value })}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </FormControl>

                <FormControl>
                  <FormLabel>Angolo: {settings.gradientAngle}°</FormLabel>
                  <Slider
                    value={settings.gradientAngle}
                    onChange={(_, value) => onUpdateSettings({ gradientAngle: value as number })}
                    min={0}
                    max={360}
                    step={15}
                    marks
                    valueLabelDisplay="auto"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Preset Gradienti</FormLabel>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                    {PRESET_GRADIENTS.map(preset => (
                      <Box
                        key={preset.name}
                        onClick={() => onUpdateSettings({
                          gradientStart: preset.start,
                          gradientEnd: preset.end,
                          gradientAngle: preset.angle
                        })}
                        sx={{
                          height: 60,
                          background: `linear-gradient(${preset.angle}deg, ${preset.start} 0%, ${preset.end} 100%)`,
                          borderRadius: 'sm',
                          border: '2px solid',
                          borderColor: 'divider',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: 'md'
                          }
                        }}
                      >
                        <Typography
                          level="body-sm"
                          sx={{
                            color: 'white',
                            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                            fontWeight: 'bold'
                          }}
                        >
                          {preset.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </FormControl>
              </>
            )}

            {/* Preview */}
            <FormControl>
              <FormLabel>Anteprima</FormLabel>
              <Box
                sx={{
                  height: 120,
                  borderRadius: 'md',
                  background: settings.backgroundType === 'solid'
                    ? settings.backgroundColor
                    : `linear-gradient(${settings.gradientAngle}deg, ${settings.gradientStart} 0%, ${settings.gradientEnd} 100%)`,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              />
            </FormControl>
          </Box>
        )}

        {/* Debug Tab Content */}
        {activeTab === 'debug' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography level="title-sm">Database Tree</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, bgcolor: 'background.level1', borderRadius: 'md', p: 0.5 }}>
                <Box
                  onClick={() => setDebugView('json')}
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 'sm',
                    cursor: 'pointer',
                    bgcolor: debugView === 'json' ? 'primary.softBg' : 'transparent',
                    color: debugView === 'json' ? 'primary.500' : 'text.secondary',
                    '&:hover': {
                      bgcolor: debugView === 'json' ? 'primary.softBg' : 'background.level2',
                    },
                  }}
                >
                  <Typography level="body-sm">JSON</Typography>
                </Box>
                <Box
                  onClick={() => setDebugView('tree')}
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 'sm',
                    cursor: 'pointer',
                    bgcolor: debugView === 'tree' ? 'primary.softBg' : 'transparent',
                    color: debugView === 'tree' ? 'primary.500' : 'text.secondary',
                    '&:hover': {
                      bgcolor: debugView === 'tree' ? 'primary.softBg' : 'background.level2',
                    },
                  }}
                >
                  <Typography level="body-sm">Tree</Typography>
                </Box>
              </Box>
            </Box>
            
            {debugView === 'json' ? (
              <>
                {/* Spaces */}
                <Box>
                  <Typography level="title-sm" sx={{ mb: 1, color: 'primary.500' }}>Spaces ({spacesState?.spaces?.length || 0})</Typography>
                  <Box
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      bgcolor: 'background.level1',
                      p: 2,
                      borderRadius: 'md',
                      maxHeight: 300,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}
                  >
                    {JSON.stringify(spacesState?.spaces || [], null, 2)}
                  </Box>
                </Box>

                {/* Viewports */}
                <Box>
                  <Typography level="title-sm" sx={{ mb: 1, color: 'primary.500' }}>Viewports</Typography>
                  <Box
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      bgcolor: 'background.level1',
                      p: 2,
                      borderRadius: 'md',
                      maxHeight: 300,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}
                  >
                    {JSON.stringify(viewportsState?.root || {}, null, 2)}
                  </Box>
                </Box>
              </>
            ) : (
              <DebugTreeView
                spaces={spacesState?.spaces || []}
                viewports={viewportsState?.root}
                settings={settings}
              />
            )}
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button variant="plain" color="neutral" onClick={onResetSettings}>
            Ripristina
          </Button>
          <Button onClick={onClose}>
            Chiudi
          </Button>
        </Box>
      </ModalDialog>
    </Modal>
  );
}