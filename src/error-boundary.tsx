import { Component, ReactNode } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Button from '@mui/joy@5.0.0-beta.48/Button';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            p: 4,
            gap: 2
          }}
        >
          <Typography level="h2">Something went wrong</Typography>
          <Typography level="body-md" sx={{ color: 'text.tertiary', textAlign: 'center', maxWidth: 600 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
          <Button onClick={() => window.location.reload()}>
            Reload Application
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}