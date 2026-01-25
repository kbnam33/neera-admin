import { Create } from "@refinedev/mui";
import { Box, TextField, Typography, Paper, Grid, Button } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";
import SaveIcon from '@mui/icons-material/Save';

export const PrintCreate = () => {
  const {
    saveButtonProps,
    refineCore: { onFinish },
    register,
    formState: { errors },
    watch,
  } = useForm({
    refineCoreProps: {
      action: "create",
      resource: "prints",
      onFinish: async (values) => {
        // Auto-generate slug from name
        const slug = values.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen

        const createPayload = {
          name: values.name.trim(),
          slug: slug,
        };

        onFinish?.(createPayload);
      },
    },
    defaultValues: {
      name: "",
    },
  });

  const watchedName = watch("name");
  const previewSlug = watchedName
    ? watchedName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
    : "";

  return (
    <Create
      title={<Typography variant="h5">Create New Print Type</Typography>}
      breadcrumb={null}
      saveButtonProps={saveButtonProps}
      footerButtons={({ saveButtonProps }) => {
        return (
          <Button
            {...saveButtonProps}
            variant="outlined"
            color="secondary"
            startIcon={<SaveIcon />}
          >
            Save Print Type
          </Button>
        );
      }}
    >
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Print Type Name
              </Typography>
              <TextField
                {...register("name", {
                  required: "Print type name is required",
                  validate: (value) => {
                    const trimmed = value.trim();
                    if (!trimmed) {
                      return "Print type name cannot be empty";
                    }
                    if (trimmed.length < 2) {
                      return "Print type name must be at least 2 characters";
                    }
                    return true;
                  },
                })}
                error={!!errors.name}
                helperText={errors.name?.message}
                margin="none"
                fullWidth
                name="name"
                variant="outlined"
                autoFocus
                placeholder="e.g., Geometric, Abstract, Paisley"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Slug (Auto-generated)
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  p: 1.5,
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  color: previewSlug ? 'text.primary' : 'text.secondary',
                  fontFamily: 'monospace',
                }}
              >
                {previewSlug || "slug-will-appear-here"}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                The slug is automatically generated from the name and used in URLs
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ p: 2, backgroundColor: 'info.lighter', borderRadius: 1, border: '1px solid', borderColor: 'info.light' }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Note:</strong> After creating a print type, you can assign it to products when creating or editing them.
                  The print type will appear in the dropdown menu on the product form.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Create>
  );
};
