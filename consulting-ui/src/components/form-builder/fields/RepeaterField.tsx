import type { ComponentType } from 'react';
import { Box, Button, Card, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useFieldState } from '../engine/useFieldState';
import type { FieldSchema, RepeaterFieldSchema } from '../schema.types';

function defaultValueFor(field: FieldSchema): unknown {
  if (field.defaultValue !== undefined) return field.defaultValue;
  if (field.type === 'multiselect' || field.type === 'multiAutocomplete' || field.type === 'fileUpload') return [];
  if (field.type === 'checkbox' || field.type === 'switch') return false;
  return '';
}

function buildDefaultItem(fields: FieldSchema[]): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === 'heading' || field.type === 'paragraph' || field.type === 'divider') continue;
    item[field.name] = defaultValueFor(field);
  }
  return item;
}

export interface RepeaterFieldProps {
  field: RepeaterFieldSchema;
  role?: string;
  // Injected by FieldRenderer rather than imported directly, to avoid a
  // circular dependency between FieldRenderer <-> RepeaterField.
  renderField: ComponentType<{ field: FieldSchema; role?: string }>;
}

export function RepeaterField({ field, role, renderField: RenderField }: RepeaterFieldProps) {
  const { control } = useFormContext();
  const { disabled } = useFieldState(field);
  const {
    fields: items,
    append,
    remove,
    move,
    insert,
  } = useFieldArray({ control, name: field.name });

  const canAdd = field.maxItems == null || items.length < field.maxItems;
  const canRemove = field.minItems == null || items.length > field.minItems;

  return (
    <Stack spacing={2}>
      {field.label && (
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            {field.label}
          </Typography>
          {field.description && (
            <Typography variant="caption" color="text.secondary">
              {field.description}
            </Typography>
          )}
        </Box>
      )}

      {items.map((item, index) => (
        <Card key={item.id} variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="body2" fontWeight={600}>
              {field.itemLabel ?? 'Item'} #{index + 1}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Move up">
                <span>
                  <IconButton
                    size="small"
                    disabled={disabled || index === 0}
                    onClick={() => move(index, index - 1)}
                    aria-label="Move up"
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Move down">
                <span>
                  <IconButton
                    size="small"
                    disabled={disabled || index === items.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label="Move down"
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Duplicate">
                <span>
                  <IconButton
                    size="small"
                    disabled={disabled || !canAdd}
                    onClick={() => insert(index + 1, item)}
                    aria-label="Duplicate"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Remove">
                <span>
                  <IconButton
                    size="small"
                    disabled={disabled || !canRemove}
                    onClick={() => remove(index)}
                    aria-label="Remove"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            {field.fields.map((subfield) => (
              <Grid key={subfield.name} size={subfield.grid ?? { xs: 12, sm: 6 }}>
                <RenderField field={{ ...subfield, name: `${field.name}.${index}.${subfield.name}` }} role={role} />
              </Grid>
            ))}
          </Grid>
        </Card>
      ))}

      <Box>
        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          size="small"
          disabled={disabled || !canAdd}
          onClick={() => append(buildDefaultItem(field.fields))}
        >
          Add {field.itemLabel ?? 'item'}
        </Button>
      </Box>
    </Stack>
  );
}
