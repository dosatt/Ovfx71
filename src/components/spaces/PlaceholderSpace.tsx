import Box from '@mui/joy@5.0.0-beta.48/Box';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import { SpaceType } from '../../types';

interface PlaceholderSpaceProps {
  type: SpaceType;
  title: string;
}

export function PlaceholderSpace({ type, title }: PlaceholderSpaceProps) {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.tertiary',
        p: 4
      }}
    >
      <Typography level="h4" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography level="body-sm">
        Coming soon - {type} editor is under development
      </Typography>
    </Box>
  );
}