import { Edit, ListButton, RefreshButton, DeleteButton } from "@refinedev/mui";
import { Box, TextField, Button, Typography, Paper, Grid, Stack } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";
import SaveIcon from '@mui/icons-material/Save';
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useResource } from "@refinedev/core";

export const FabricEdit = () => {
  const { id: fabricId } = useParams();
  const { resource } = useResource();

  const {
    saveButtonProps,
    refineCore: { queryResult, onFinish },
    register,
    formState: { errors, isDirty },
    reset,
    handleSubmit,
  } = useForm({
    refineCoreProps: {
      action: "edit",
      id: fabricId,
      resource: resource?.name,
    },
    defaultValues: {
      name: "",
      // image_url field is no longer needed here
    },
  });

  const fabricData = queryResult?.data?.data;
  const isFormLoading = queryResult?.isLoading;

  useEffect(() => {
    if (fabricData && !isDirty) {
      reset(fabricData);
    }
  }, [fabricData, reset, isDirty]);

  // Handle save by stripping 'id' and 'created_at'
  const handleSave = (values) => {
    const { id, created_at, ...updatePayload } = values;
    onFinish?.(updatePayload);
  };

  return (
    <>
      <Edit
          title={<Typography variant="h5">Edit Fabric</Typography>}
          breadcrumb={null}
          headerButtons={
            <Box>
              <ListButton size="small" sx={{ mr: 1 }} />
              <RefreshButton size="small" />
            </Box>
          }
          isLoading={isFormLoading}
          footerButtons={({ deleteButtonProps }) => {
            const { onClick, ...restSaveButtonProps } = saveButtonProps;

            return (
              <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ p: 2 }}>
                <DeleteButton {...deleteButtonProps} variant="outlined" color="error" />
                <Button
                  {...restSaveButtonProps}
                  type="submit"
                  form="fabric-edit-form"
                  variant="outlined"
                  color="secondary"
                  startIcon={<SaveIcon />}
                >
                  Save Changes
                </Button>
              </Stack>
            );
          }}
      >
        <Box component="form" id="fabric-edit-form" onSubmit={handleSubmit(handleSave)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                  <Grid item xs={12}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>Name</Typography>
                      <TextField {...register("name", { required: "This field is required" })} error={!!errors.name} helperText={errors.name?.message} margin="none" fullWidth name="name" variant="outlined" InputLabelProps={{ shrink: true }} />
                  </Grid>
              </Grid>
          </Paper>
          {/* Image upload section has been completely removed as requested */}
        </Box>
      </Edit>
    </>
  );
};