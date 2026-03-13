import { Edit, ListButton, RefreshButton, DeleteButton } from "@refinedev/mui";
import { Box, TextField, Typography, Paper, Grid, Button, Stack, Chip, Menu, MenuItem, ListItemText } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";
import { useParams } from "react-router-dom";
import SaveIcon from '@mui/icons-material/Save';
import { useState, useEffect } from "react";
import { supabaseAdminClient } from "../../supabase";
import PublicIcon from '@mui/icons-material/Public';
import { useNotification } from "@refinedev/core";

export const PrintEdit = () => {
  const { id: printId } = useParams();
  const [productCount, setProductCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [visibilityMenuAnchor, setVisibilityMenuAnchor] = useState(null);
  const [isVisibilityApplying, setIsVisibilityApplying] = useState(false);
  const { open: openNotification } = useNotification();

  const {
    saveButtonProps,
    queryResult,
    refineCore: { onFinish },
    register,
    formState: { errors },
    watch,
  } = useForm({
    refineCoreProps: {
      action: "edit",
      id: printId,
      resource: "prints",
      onFinish: async (values) => {
        // Auto-generate slug from name
        const slug = values.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');

        const updatePayload = {
          name: values.name.trim(),
          slug: slug,
        };

        // Also update the print_type field in products to keep them synced
        try {
          await supabaseAdminClient
            .from('products')
            .update({ print_type: values.name.trim() })
            .eq('print_id', printId);
        } catch (error) {
          console.error('Error syncing product print_type:', error);
        }

        onFinish?.(updatePayload);
      },
    },
  });

  const printData = queryResult?.data?.data;
  const isFormLoading = queryResult?.isLoading;

  const watchedName = watch("name");
  const previewSlug = watchedName
    ? watchedName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
    : "";

  // Fetch product count
  useEffect(() => {
    const fetchProductCount = async () => {
      setIsLoadingCount(true);
      try {
        const { count } = await supabaseAdminClient
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('print_id', printId);
        
        setProductCount(count || 0);
      } catch (error) {
        console.error('Error fetching product count:', error);
        setProductCount(0);
      } finally {
        setIsLoadingCount(false);
      }
    };

    if (printId) {
      fetchProductCount();
    }
  }, [printId]);

  const handleOpenVisibilityMenu = (event) => {
    setVisibilityMenuAnchor(event.currentTarget);
  };

  const handleCloseVisibilityMenu = () => {
    setVisibilityMenuAnchor(null);
  };

  const handleBulkVisibilityUpdate = async (isPublic) => {
    handleCloseVisibilityMenu();

    const confirmMessage = `Set all products of this print type to ${isPublic ? "Public" : "Private"}?\n\nThis updates website visibility for all products using this print type.`;
    if (!window.confirm(confirmMessage)) return;

    setIsVisibilityApplying(true);
    try {
      const { data, error } = await supabaseAdminClient
        .from("products")
        .update({ is_public: isPublic })
        .eq("print_id", printId)
        .select("id");

      if (error) throw error;

      openNotification?.({
        type: "success",
        message: "Visibility update successful",
        description: `Updated ${data?.length || 0} product${(data?.length || 0) !== 1 ? "s" : ""} to ${isPublic ? "Public" : "Private"}`,
      });
    } catch (error) {
      console.error("Error updating print product visibility:", error);
      openNotification?.({
        type: "error",
        message: "Visibility update failed",
        description: error.message,
      });
    } finally {
      setIsVisibilityApplying(false);
    }
  };

  return (
    <Edit
      title={<Typography variant="h5">Edit Print Type</Typography>}
      breadcrumb={null}
      saveButtonProps={saveButtonProps}
      headerButtons={
        <Box>
          <ListButton size="small" sx={{ mr: 1 }} />
          <RefreshButton size="small" />
        </Box>
      }
      isLoading={isFormLoading}
      footerButtons={({ deleteButtonProps, saveButtonProps }) => {
        const canDelete = productCount === 0;
        
        return (
          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ p: 2 }}>
            <DeleteButton
              {...deleteButtonProps}
              variant="outlined"
              color="error"
              disabled={!canDelete}
              title={
                !canDelete
                  ? `Cannot delete: ${productCount} product${productCount > 1 ? 's' : ''} use${productCount === 1 ? 's' : ''} this print type`
                  : 'Delete this print type'
              }
            />
            <Button
              {...saveButtonProps}
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
      {isFormLoading ? (
        <Typography>Loading print type data...</Typography>
      ) : (
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Print Type Name
                  </Typography>
                  <Chip
                    label={
                      isLoadingCount
                        ? "Loading..."
                        : `${productCount} product${productCount !== 1 ? 's' : ''}`
                    }
                    size="small"
                    color={productCount > 0 ? "primary" : "default"}
                    variant="outlined"
                  />
                </Stack>
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
                  InputLabelProps={{ shrink: true }}
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
                  {previewSlug || printData?.slug || "slug-will-appear-here"}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  The slug is automatically generated from the name and used in URLs
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                  Product Visibility Actions
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PublicIcon />}
                  onClick={handleOpenVisibilityMenu}
                  disabled={isVisibilityApplying || productCount === 0}
                >
                  {isVisibilityApplying ? "Updating..." : "Set Visibility for This Print's Products"}
                </Button>
              </Grid>

              {productCount > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, backgroundColor: 'warning.lighter', borderRadius: 1, border: '1px solid', borderColor: 'warning.light' }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Note:</strong> This print type is currently used by {productCount} product{productCount > 1 ? 's' : ''}.
                      Updating the name will automatically update the print type for all associated products.
                      You cannot delete this print type until all products are reassigned or deleted.
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Box>
      )}
      <Menu
        anchorEl={visibilityMenuAnchor}
        open={Boolean(visibilityMenuAnchor)}
        onClose={handleCloseVisibilityMenu}
      >
        <MenuItem
          onClick={() => handleBulkVisibilityUpdate(true)}
          disabled={isVisibilityApplying}
        >
          <ListItemText
            primary="Make Products Public"
            secondary="Visible on website"
          />
        </MenuItem>
        <MenuItem
          onClick={() => handleBulkVisibilityUpdate(false)}
          disabled={isVisibilityApplying}
        >
          <ListItemText
            primary="Make Products Private"
            secondary="Hidden from website"
          />
        </MenuItem>
      </Menu>
    </Edit>
  );
};
