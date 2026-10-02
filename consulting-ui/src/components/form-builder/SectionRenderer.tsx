import { Accordion, AccordionDetails, AccordionSummary, Box, Card, Divider, Grid, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useFormContext } from 'react-hook-form';
import { FieldRenderer } from './FieldRenderer';
import { evaluateCondition, isFieldVisibleForRole } from './engine/conditions';
import type { SectionSchema } from './schema.types';

interface SectionRendererProps {
  section: SectionSchema;
  role?: string;
}

const DEFAULT_GRID = { xs: 12, sm: 6 };

function SectionFields({ section, role }: SectionRendererProps) {
  return (
    <Grid container spacing={2.5}>
      {section.fields.map((field) => (
        <Grid key={field.name} size={field.grid ?? DEFAULT_GRID}>
          <FieldRenderer field={field} role={role} />
        </Grid>
      ))}
    </Grid>
  );
}

function SectionHeader({ section }: { section: SectionSchema }) {
  if (!section.title) return null;
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700}>
        {section.title}
      </Typography>
      {section.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {section.description}
        </Typography>
      )}
    </Box>
  );
}

export function SectionRenderer({ section, role }: SectionRendererProps) {
  const { watch } = useFormContext();

  if (!isFieldVisibleForRole(section.permissions, role)) return null;
  if (section.showWhen && !evaluateCondition(section.showWhen, watch() as Record<string, unknown>)) {
    return null;
  }

  if (section.layout === 'accordion') {
    return (
      <Accordion disableGutters defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          {section.title ? <SectionHeader section={section} /> : <Typography variant="subtitle1">{section.id}</Typography>}
        </AccordionSummary>
        <AccordionDetails>
          <SectionFields section={section} role={role} />
        </AccordionDetails>
      </Accordion>
    );
  }

  if (section.layout === 'plain') {
    return (
      <Stack spacing={2}>
        <SectionHeader section={section} />
        <SectionFields section={section} role={role} />
      </Stack>
    );
  }

  return (
    <Card variant="outlined">
      {section.title && (
        <>
          <Box sx={{ px: 3, py: 2 }}>
            <SectionHeader section={section} />
          </Box>
          <Divider />
        </>
      )}
      <Box sx={{ p: 3 }}>
        <SectionFields section={section} role={role} />
      </Box>
    </Card>
  );
}
