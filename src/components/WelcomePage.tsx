import Box from '@mui/joy@5.0.0-beta.48/Box';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Button from '@mui/joy@5.0.0-beta.48/Button';
import Card from '@mui/joy@5.0.0-beta.48/Card';
import { 
  FileText, 
  Layout, 
  Database, 
  BarChart3, 
  Globe, 
  Mail, 
  MessageSquare, 
  Calendar,
  Pencil,
  Clock
} from 'lucide-react';

interface WelcomePageProps {
  onCreateSpace: (type: 'page' | 'canvas' | 'database' | 'dashboard') => void;
  onOpenApp: (appType: 'browser' | 'mail' | 'chat' | 'calendar' | 'draw') => void;
  recentSpaces?: Array<{ id: string; title: string; type: string }>;
  onOpenSpace?: (spaceId: string) => void;
}

export function WelcomePage({ onCreateSpace, onOpenApp, recentSpaces = [], onOpenSpace }: WelcomePageProps) {
  const spaces = [
    { type: 'page' as const, icon: FileText, label: 'Page', description: 'Documento con editor di testo' },
    { type: 'canvas' as const, icon: Layout, label: 'Canvas', description: 'Tela infinita per idee visive' },
    { type: 'database' as const, icon: Database, label: 'Database', description: 'Tabelle e dati strutturati' },
    { type: 'dashboard' as const, icon: BarChart3, label: 'Dashboard', description: 'Pannello di controllo' }
  ];

  const apps = [
    { type: 'browser' as const, icon: Globe, label: 'Browser', description: 'Naviga sul web' },
    { type: 'mail' as const, icon: Mail, label: 'Mail', description: 'Gestisci le email' },
    { type: 'chat' as const, icon: MessageSquare, label: 'Chat', description: 'Messaggistica istantanea' },
    { type: 'calendar' as const, icon: Calendar, label: 'Calendar', description: 'Organizza eventi' }
  ];

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'auto',
        p: 1.5,
        '&::-webkit-scrollbar': { display: 'none' },
        '-ms-overflow-style': 'none',
        scrollbarWidth: 'none'
      }}
    >
      <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography level="h3" sx={{ mb: 0.25 }}>
            Benvenuto in OVFX
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
            Crea un nuovo spazio o apri un'applicazione
          </Typography>
        </Box>

        {/* Spaces */}
        <Box sx={{ mb: 2 }}>
          <Typography level="title-sm" sx={{ mb: 1, px: 0.5 }}>
            Nuovo Spazio
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 1
            }}
          >
            {spaces.map(({ type, icon: Icon, label, description }) => (
              <Card
                key={type}
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  p: 1,
                  '&:hover': {
                    borderColor: 'primary.outlinedBorder',
                    transform: 'translateY(-1px)',
                    boxShadow: 'sm'
                  }
                }}
                onClick={() => onCreateSpace(type)}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box
                    sx={{
                      p: 0.5,
                      borderRadius: 'sm',
                      bgcolor: 'primary.softBg',
                      color: 'primary.solidBg',
                      flexShrink: 0
                    }}
                  >
                    <Icon size={14} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography level="title-xs" sx={{ mb: 0.125 }}>
                      {label}
                    </Typography>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.7rem' }}>
                      {description}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Apps */}
        <Box sx={{ mb: 2 }}>
          <Typography level="title-sm" sx={{ mb: 1, px: 0.5 }}>
            Applicazioni
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 1
            }}
          >
            {apps.map(({ type, icon: Icon, label, description }) => (
              <Card
                key={type}
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  p: 1,
                  '&:hover': {
                    borderColor: 'primary.outlinedBorder',
                    transform: 'translateY(-1px)',
                    boxShadow: 'sm'
                  }
                }}
                onClick={() => onOpenApp(type)}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box
                    sx={{
                      p: 0.5,
                      borderRadius: 'sm',
                      bgcolor: 'success.softBg',
                      color: 'success.solidBg',
                      flexShrink: 0
                    }}
                  >
                    <Icon size={14} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography level="title-xs" sx={{ mb: 0.125 }}>
                      {label}
                    </Typography>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '0.7rem' }}>
                      {description}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Recent Files */}
        {recentSpaces.length > 0 && (
          <Box>
            <Typography level="title-sm" sx={{ mb: 1, px: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Clock size={14} />
              Recenti
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              {recentSpaces.map((space) => (
                <Button
                  key={space.id}
                  variant="plain"
                  size="sm"
                  onClick={() => onOpenSpace?.(space.id)}
                  sx={{
                    justifyContent: 'flex-start',
                    px: 1,
                    py: 0.75,
                    minHeight: 'auto',
                    fontSize: '0.8125rem',
                    '&:hover': {
                      bgcolor: 'background.level1'
                    }
                  }}
                >
                  <FileText size={12} />
                  <Typography level="body-sm" sx={{ ml: 0.75 }}>
                    {space.title}
                  </Typography>
                  <Typography level="body-xs" sx={{ ml: 'auto', color: 'text.tertiary', fontSize: '0.7rem' }}>
                    {space.type}
                  </Typography>
                </Button>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}