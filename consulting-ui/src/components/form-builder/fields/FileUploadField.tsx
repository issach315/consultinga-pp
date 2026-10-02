import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import ReplayIcon from '@mui/icons-material/Replay';
import { Controller, useFormContext } from 'react-hook-form';
import { apiClient } from '@/services/api/client';
import { useFieldState } from '../engine/useFieldState';
import type { FileUploadFieldSchema } from '../schema.types';
import type { FieldError } from '../engine/useFieldState';
import type { FieldRendererProps } from './fieldTypes';

export interface UploadedFileEntry {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  url?: string;
  errorMessage?: string;
}

interface RhfFileFieldControl {
  value: UploadedFileEntry[];
  onChange: (value: UploadedFileEntry[]) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileUploadControl({
  field,
  rhfField,
  disabled,
  error,
}: {
  field: FileUploadFieldSchema;
  rhfField: RhfFileFieldControl;
  disabled: boolean;
  error?: FieldError;
}) {
  const [entries, setEntriesState] = useState<UploadedFileEntry[]>(rhfField.value ?? []);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<Map<string, File>>(new Map());

  // setState's functional updater is the source of truth — required for
  // correctness when multiple files upload concurrently, since each
  // onUploadProgress callback would otherwise close over a stale entries array.
  const updateEntries = (updater: (prev: UploadedFileEntry[]) => UploadedFileEntry[]) => {
    setEntriesState((prev) => {
      const next = updater(prev);
      rhfField.onChange(next);
      return next;
    });
  };

  const uploadEntry = async (id: string, file: File) => {
    if (!field.uploadUrl) {
      updateEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'done', progress: 100 } : e)));
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post<{ url: string }>(field.uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
          updateEntries((prev) => prev.map((e) => (e.id === id ? { ...e, progress, status: 'uploading' } : e)));
        },
      });
      updateEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: 'done', progress: 100, url: data.url } : e)),
      );
    } catch {
      updateEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: 'error', errorMessage: 'Upload failed' } : e)),
      );
    }
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setLocalError(null);
    const accepted = Array.from(fileList).filter((file) => {
      if (field.maxSizeBytes && file.size > field.maxSizeBytes) {
        setLocalError(`"${file.name}" exceeds the ${formatBytes(field.maxSizeBytes)} limit.`);
        return false;
      }
      return true;
    });
    const newEntries: UploadedFileEntry[] = accepted.map((file) => {
      const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      filesRef.current.set(id, file);
      return { id, name: file.name, size: file.size, status: 'pending', progress: 0 };
    });

    updateEntries((prev) => (field.multiple ? [...prev, ...newEntries] : newEntries));
    newEntries.forEach((entry) => {
      const file = filesRef.current.get(entry.id);
      if (file) uploadEntry(entry.id, file);
    });
  };

  const removeEntry = (id: string) => {
    filesRef.current.delete(id);
    updateEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const retryEntry = (id: string) => {
    const file = filesRef.current.get(id);
    if (file) uploadEntry(id, file);
  };

  return (
    <Stack spacing={1.5}>
      {field.label && (
        <Typography variant="body2" fontWeight={600}>
          {field.label}
        </Typography>
      )}
      <Box
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (!disabled) addFiles(event.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        sx={{
          p: 2.5,
          textAlign: 'center',
          borderRadius: 2,
          border: '1px dashed',
          borderColor: dragActive ? 'primary.main' : 'divider',
          bgcolor: dragActive ? 'action.hover' : 'background.default',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <CloudUploadOutlinedIcon color="action" />
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {field.placeholder ?? 'Click or drag files to upload'}
        </Typography>
        {field.accept && (
          <Typography variant="caption" color="text.secondary" display="block">
            Accepted: {field.accept}
            {field.maxSizeBytes ? ` · Max ${formatBytes(field.maxSizeBytes)}` : ''}
          </Typography>
        )}
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple={field.multiple}
          accept={field.accept}
          disabled={disabled}
          onChange={(event) => addFiles(event.target.files)}
        />
      </Box>

      {(localError || error?.message) && <Alert severity="error">{localError ?? error?.message}</Alert>}

      {entries.length > 0 && (
        <List dense disablePadding>
          {entries.map((entry) => (
            <ListItem
              key={entry.id}
              disableGutters
              secondaryAction={
                <Stack direction="row" spacing={0.5}>
                  {entry.status === 'error' && (
                    <IconButton size="small" onClick={() => retryEntry(entry.id)} aria-label="Retry upload">
                      <ReplayIcon fontSize="small" />
                    </IconButton>
                  )}
                  {entry.url && (
                    <IconButton
                      size="small"
                      component="a"
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Download"
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton size="small" onClick={() => removeEntry(entry.id)} aria-label="Remove file">
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              }
            >
              <ListItemText
                primary={entry.name}
                secondary={
                  entry.status === 'uploading' ? (
                    <LinearProgress variant="determinate" value={entry.progress} sx={{ mt: 0.5 }} />
                  ) : entry.status === 'error' ? (
                    entry.errorMessage
                  ) : (
                    formatBytes(entry.size)
                  )
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  );
}

export function FileUploadField({ field }: FieldRendererProps<FileUploadFieldSchema>) {
  const { control } = useFormContext();
  const { disabled, error } = useFieldState(field);

  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: rhfField }) => (
        <FileUploadControl
          field={field}
          rhfField={{ value: rhfField.value ?? [], onChange: rhfField.onChange }}
          disabled={disabled}
          error={error}
        />
      )}
    />
  );
}
