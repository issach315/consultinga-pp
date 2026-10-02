import { Box, Button, Stack } from '@mui/material';
import { SectionRenderer } from './SectionRenderer';
import type { FormSchema } from './schema.types';

interface SingleFormProps {
  schema: FormSchema;
  role?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function SingleForm({ schema, role, submitLabel = 'Submit', isSubmitting }: SingleFormProps) {
  return (
    <Stack spacing={2.5}>
      {(schema.sections ?? []).map((section) => (
        <SectionRenderer key={section.id} section={section} role={role} />
      ))}

      <Box
        sx={{
          position: { xs: 'sticky', md: 'static' },
          bottom: 0,
          py: 2,
          bgcolor: 'background.default',
          borderTop: { xs: '1px solid', md: 'none' },
          borderColor: 'divider',
        }}
      >
        <Button
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
          fullWidth
          sx={{ maxWidth: { md: 240 } }}
        >
          {submitLabel}
        </Button>
      </Box>
    </Stack>
  );
}
