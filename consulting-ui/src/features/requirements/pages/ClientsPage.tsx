import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Snackbar,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useDataTableState } from '@/components/data-table';
import { PageHeader } from '@/components/layout';
import { useAccess } from '@/features/access';
import { ApiError } from '@/types';
import {
  useClientListQuery,
  useCreateClientMutation,
  useDeleteClientMutation,
  useUpdateClientMutation,
} from '../api/clientQueries';
import { ClientFormDialog } from '../components/ClientFormDialog';
import { ClientTable } from '../components/ClientTable';
import type { ClientFormValues } from '../schemas/clientSchema';
import type { Client, ClientPayload, ClientStatus } from '../types/client.types';

function toPayload(values: ClientFormValues): ClientPayload {
  return {
    ...values,
    industry: values.industry || undefined,
    contactPersonPhone: values.contactPersonPhone || undefined,
    designation: values.designation || undefined,
    website: values.website || undefined,
    address: values.address || undefined,
    city: values.city || undefined,
    state: values.state || undefined,
    country: values.country || undefined,
    postalCode: values.postalCode || undefined,
    notes: values.notes || undefined,
  };
}

export function ClientsPage() {
  const { can } = useAccess();
  const tableState = useDataTableState({ initialSortBy: 'createdAt' });
  const [status, setStatus] = useState<ClientStatus | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canCreate = can('requirements', 'clients', 'CREATE');
  const canUpdate = can('requirements', 'clients', 'UPDATE');
  const canDelete = can('requirements', 'clients', 'DELETE');

  const clientsQuery = useClientListQuery({
    ...tableState.queryParams,
    status: status || undefined,
  });
  const createClient = useCreateClientMutation();
  const updateClient = useUpdateClientMutation();
  const deleteClient = useDeleteClientMutation();

  const openCreate = () => {
    setEditingClient(null);
    createClient.reset();
    setFormOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    updateClient.reset();
    setFormOpen(true);
  };

  const closeForm = () => {
    if (createClient.isPending || updateClient.isPending) return;
    setFormOpen(false);
    setEditingClient(null);
  };

  const submitClient = async (values: ClientFormValues) => {
    const payload = toPayload(values);
    if (editingClient) {
      await updateClient.mutateAsync({ id: editingClient.id, payload });
      setNotice(`${values.companyName} was updated.`);
    } else {
      const created = await createClient.mutateAsync(payload);
      setNotice(`${created.companyName} was onboarded as ${created.clientCode}.`);
    }
    setFormOpen(false);
    setEditingClient(null);
  };

  const confirmDelete = async () => {
    if (!deletingClient) return;
    setDeleteError(null);
    try {
      await deleteClient.mutateAsync(deletingClient.id);
      setNotice(`${deletingClient.companyName} was deleted.`);
      setDeletingClient(null);
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : 'Unable to delete the client.');
    }
  };

  const formMutation = editingClient ? updateClient : createClient;

  return (
    <>
      <PageHeader
        title="Clients"
        description="Onboard and manage client accounts for your requirements pipeline."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Requirements', path: '/clients' },
          { label: 'Client' },
        ]}
        actions={
          canCreate ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Onboard client
            </Button>
          ) : undefined
        }
      />

      <ClientTable
        rows={clientsQuery.data?.items ?? []}
        rowCount={clientsQuery.data?.meta.totalItems ?? 0}
        loading={clientsQuery.isLoading || clientsQuery.isFetching}
        error={clientsQuery.error}
        tableState={tableState}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onEdit={openEdit}
        onDelete={(client) => {
          setDeleteError(null);
          setDeletingClient(client);
        }}
        onRetry={() => clientsQuery.refetch()}
        statusFilterControl={
          <TextField
            select
            label="Status"
            size="small"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ClientStatus | '');
              tableState.setPaginationModel((current) => ({ ...current, page: 0 }));
            }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </TextField>
        }
      />

      <ClientFormDialog
        open={formOpen}
        client={editingClient}
        loading={formMutation.isPending}
        error={formMutation.error}
        onClose={closeForm}
        onSubmit={submitClient}
      />

      <Dialog
        open={Boolean(deletingClient)}
        onClose={() => setDeletingClient(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete client?</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          This will remove <strong>{deletingClient?.companyName}</strong> from active client
          records.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingClient(null)} disabled={deleteClient.isPending}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            loading={deleteClient.isPending}
            onClick={confirmDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={5000}
        onClose={() => setNotice(null)}
        message={notice}
      />
    </>
  );
}

export default ClientsPage;
