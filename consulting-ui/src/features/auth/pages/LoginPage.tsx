import { useState } from 'react';
import { Box, Button, Divider, Link, Snackbar, Stack, Typography } from '@mui/material';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { LoginForm } from '../components/LoginForm';
import { LoginVisualPanel } from '../components/LoginVisualPanel';

export function LoginPage() {
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
      }}
    >
      <LoginVisualPanel />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: { xs: 3, sm: 5 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 430 }}>
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
            <Typography sx={{ fontWeight: 750 }}>
              {import.meta.env.VITE_APP_NAME ?? 'Consulting SaaS'}
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: 'background.paper',
              border: { xs: 'none', sm: '1px solid' },
              borderColor: 'divider',
              borderRadius: 3,
              p: { xs: 0, sm: 4 },
            }}
          >
            <Typography variant="h5" component="h1" sx={{ mb: 0.5 }}>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Sign in to your workspace to continue managing your consulting operations.
            </Typography>

            <LoginForm onNotAvailable={setNotice} />

            <Divider sx={{ my: 3, fontSize: '0.75rem', color: 'text.secondary' }}>
              or continue with
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              size="large"
              onClick={() => setNotice("Google sign-in isn't configured yet.")}
              sx={{ fontWeight: 700 }}
            >
              <Box component="span" sx={{ fontWeight: 800, mr: 1 }}>
                G
              </Box>
              Continue with Google
            </Button>

            <Stack
              direction="row"
              spacing={1.25}
              sx={{
                mt: 3,
                p: 1.5,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                alignItems: 'flex-start',
              }}
            >
              <VerifiedUserOutlinedIcon
                fontSize="small"
                sx={{ color: 'text.secondary', mt: 0.25 }}
              />
              <Typography variant="caption" color="text.secondary">
                <Typography
                  component="span"
                  variant="caption"
                  color="text.primary"
                  fontWeight={700}
                >
                  Secure access.{' '}
                </Typography>
                Tenant-based permissions protect your workspace.
              </Typography>
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ display: 'block', mt: 3 }}
            >
              Need access?{' '}
              <Link
                component="button"
                type="button"
                variant="caption"
                underline="hover"
                onClick={() => setNotice('Contact your workspace administrator for access.')}
              >
                Contact your administrator
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        onClose={() => setNotice(null)}
        message={notice}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
}

export default LoginPage;
