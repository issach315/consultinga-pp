import { Box, Typography, alpha, useTheme } from '@mui/material';

const features = [
  {
    label: 'Employees & HR',
    description: 'Centralized workforce records, roles and org structure.',
  },
  {
    label: 'Recruitment',
    description: 'Track candidates and interviews through your hiring pipeline.',
  },
  { label: 'Attendance', description: 'Monitor time-off, shift schedules and daily attendance.' },
  { label: 'Payroll', description: 'Manage compensation, pay runs and payroll history.' },
];

const orbitNodes = [
  { label: 'HR', top: '2%', left: '40%' },
  { label: 'ATS', top: '32%', left: '4%' },
  { label: 'PAY', top: '28%', left: '92%' },
  { label: 'ORG', top: '78%', left: '14%' },
  { label: 'OPS', top: '80%', left: '86%' },
];

export function LoginVisualPanel() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const lineColor = alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08);
  const nodeBg = alpha(theme.palette.background.paper, 0.7);

  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        position: 'relative',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        p: 6,
        bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'background.default',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Decorative grid background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
          backgroundSize: '42px 42px',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, #000 25%, #000 75%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, #000 25%, #000 75%, transparent 100%)',
        }}
      />

      {/* Orbit decoration */}
      <Box
        sx={{
          position: 'absolute',
          right: '6%',
          top: '10%',
          width: 260,
          height: 260,
          opacity: 0.75,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 28,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '50%',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 60,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '50%',
            transform: 'rotate(55deg) scaleX(1.3)',
          }}
        />
        {orbitNodes.map((node) => (
          <Box
            key={node.label}
            sx={{
              position: 'absolute',
              top: node.top,
              left: node.left,
              transform: 'translate(-50%, -50%)',
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: nodeBg,
              display: 'grid',
              placeItems: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: 'text.secondary',
              boxShadow: '0 4px 15px rgba(15, 23, 42, 0.06)',
            }}
          >
            {node.label}
          </Box>
        ))}
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography sx={{ fontWeight: 750, fontSize: '1rem' }}>
          {import.meta.env.VITE_APP_NAME ?? 'Consulting SaaS'}
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 520, my: 'auto', position: 'relative', zIndex: 1 }}>
        <Typography
          sx={{
            fontSize: { xs: '2rem', lg: '2.6rem' },
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            my: 1.5,
          }}
        >
          Manage your workforce. Run your business.
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.dark', mb: 1 }}>
          Save hours every week with one platform for HR, hiring, and payroll.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 460 }}>
          A unified workspace for recruitment, employees, attendance, payroll and tenant operations.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1.5,
            mt: 4,
          }}
        >
          {features.map((feature) => (
            <Box
              key={feature.label}
              sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 1.75,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                {feature.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {feature.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ position: 'relative', zIndex: 1 }}>
        © {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME ?? 'Consulting SaaS'} ·
        Enterprise SaaS
      </Typography>
    </Box>
  );
}
