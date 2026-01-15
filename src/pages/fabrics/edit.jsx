import { Edit, ListButton, RefreshButton, DeleteButton } from "@refinedev/mui";
import { Box, TextField, Button, Typography, Paper, Grid, Stack, Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText, IconButton, InputAdornment, MenuItem, Chip, Alert, Divider, Menu } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";
import { Controller } from "react-hook-form";
import SaveIcon from '@mui/icons-material/Save';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useResource, useNotification } from "@refinedev/core";
import { useList } from "@refinedev/core";
import { supabaseAdminClient } from "../../supabase";

// --- Copy Fabric Modal ---
const CopyFabricModal = ({ open, onClose, fabrics, onSelectFabric }) => {
  const [query, setQuery] = useState("");
  const filtered = (fabrics || []).filter((f) =>
    f.name?.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Copy From Fabric...
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: '70vh' }}>
        <TextField
          fullWidth
          placeholder="Search fabrics…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ mb: 2 }}
          size="small"
        />
        <List dense>
          {filtered?.map((fabric) => (
            <ListItemButton key={fabric.id} onClick={() => onSelectFabric(fabric.id)}>
              <ListItemText primary={fabric.name} />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export const FabricEdit = () => {
  const { id: fabricId } = useParams();
  const { resource } = useResource();
  const { open: openNotification } = useNotification();

  const {
    saveButtonProps,
    refineCore: { queryResult, onFinish },
    control,
    register,
    formState: { errors, isDirty },
    reset,
    setValue,
    handleSubmit,
    watch,
  } = useForm({
    refineCoreProps: {
      action: "edit",
      id: fabricId,
      resource: resource?.name,
    },
    defaultValues: {
      name: "",
      default_price: null,
      description: "",
      care_instructions: "",
      shipping_returns: "",
    },
  });

  const fabricData = queryResult?.data?.data;
  const isFormLoading = queryResult?.isLoading;
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyTargetField, setCopyTargetField] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [bulkApplyMenuAnchor, setBulkApplyMenuAnchor] = useState(null);
  const [isBulkApplying, setIsBulkApplying] = useState(false);

  const { data: fabricsResponse } = useList({
    resource: "fabrics",
    pagination: { mode: "off" },
    sorters: [{ field: "name", order: "asc" }],
    meta: { select: "id,name,description,care_instructions,shipping_returns,default_price" },
  });
  const fabrics = (fabricsResponse?.data || []).filter(f => f.id !== Number(fabricId));

  // Fetch policies
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const { data, error } = await supabaseAdminClient
          .from("shipping_policies")
          .select("*")
          .order("is_default", { ascending: false })
          .order("name", { ascending: true });

        if (error) throw error;
        setPolicies(data || []);
      } catch (error) {
        console.error("Error fetching policies:", error);
      }
    };

    fetchPolicies();
  }, []);

  const handleOpenCopyModal = (fieldName) => {
    setCopyTargetField(fieldName);
    setIsCopyModalOpen(true);
  };
  const handleCloseCopyModal = () => {
    setIsCopyModalOpen(false);
    setCopyTargetField(null);
  };
  const handleSelectFabricToCopy = (selectedFabricId) => {
    if (!copyTargetField) return;
    const fabric = fabrics.find(f => f.id === selectedFabricId);
    if (fabric) {
      if (copyTargetField === "default_price") {
        setValue(copyTargetField, typeof fabric.default_price === "number" ? fabric.default_price : null, { shouldDirty: true });
      } else {
        setValue(copyTargetField, fabric[copyTargetField] || "", { shouldDirty: true });
      }
    }
    handleCloseCopyModal();
  };

  const handleOpenBulkApplyMenu = (event) => {
    setBulkApplyMenuAnchor(event.currentTarget);
  };
  const handleCloseBulkApplyMenu = () => {
    setBulkApplyMenuAnchor(null);
  };

  const handleBulkApply = async (applyToAll = false) => {
    handleCloseBulkApplyMenu();
    const fabricName = watch("name");
    const shippingReturns = watch("shipping_returns");

    if (!shippingReturns || shippingReturns.trim() === "") {
      openNotification?.({
        type: "error",
        message: "No Content to Apply",
        description: "The Shipping & Returns field is empty. Please add content before applying.",
      });
      return;
    }

    const confirmMessage = applyToAll
      ? `Apply this fabric's Shipping & Returns policy to ALL products?\n\nThis will update the shipping & returns field for every product in your database.`
      : `Apply this fabric's Shipping & Returns policy to all products of "${fabricName}" fabric?\n\nThis will update all products with fabric type "${fabricName}".`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsBulkApplying(true);

    try {
      let updatedCount = 0;

      if (applyToAll) {
        // Apply to all products
        const { data, error } = await supabaseAdminClient
          .from("products")
          .update({ shipping_returns: shippingReturns })
          .neq("id", 0) // Update all
          .select();

        if (error) throw error;
        updatedCount = data?.length || 0;
      } else {
        // Apply only to products of this fabric type
        const { data, error } = await supabaseAdminClient
          .from("products")
          .update({ shipping_returns: shippingReturns })
          .eq("fabric_type", fabricName)
          .select();

        if (error) throw error;
        updatedCount = data?.length || 0;
      }

      openNotification?.({
        type: "success",
        message: "Bulk Apply Successful",
        description: `Updated shipping & returns for ${updatedCount} product${updatedCount !== 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error("Error bulk applying:", error);
      openNotification?.({
        type: "error",
        message: "Bulk Apply Failed",
        description: error.message,
      });
    } finally {
      setIsBulkApplying(false);
    }
  };

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
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">Name</Typography>
                        <IconButton size="small" onClick={() => handleOpenCopyModal("name")} title="Copy Name from another fabric">
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <TextField {...register("name", { required: "This field is required" })} error={!!errors.name} helperText={errors.name?.message} margin="none" fullWidth name="name" variant="outlined" InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>Default Price (in ₹)</Typography>
                      <TextField 
                        {...register("default_price", { valueAsNumber: true })} 
                        margin="none" 
                        fullWidth 
                        type="number" 
                        name="default_price" 
                        variant="outlined" 
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton size="small" edge="end" onClick={() => handleOpenCopyModal("default_price")} title="Copy Default Price from another fabric">
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                            WebkitAppearance: 'none',
                            margin: 0,
                          },
                          '& input[type=number]': {
                            MozAppearance: 'textfield',
                          },
                        }}
                      />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>Shipping Policy Template</Typography>
                      <TextField
                        select
                        fullWidth
                        margin="none"
                        variant="outlined"
                        size="small"
                        value=""
                        onChange={(e) => {
                          const policyId = e.target.value;
                          if (policyId) {
                            const policy = policies.find(p => p.id === policyId);
                            if (policy) {
                              setValue("shipping_returns", policy.content || "", { shouldDirty: true });
                            }
                          }
                        }}
                        SelectProps={{
                          displayEmpty: true,
                        }}
                      >
                        <MenuItem value="">
                          <em>Select a policy template to apply</em>
                        </MenuItem>
                        {policies.map((policy) => (
                          <MenuItem key={policy.id} value={policy.id}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <span>{policy.name}</span>
                              {policy.is_default && <Chip label="Default" size="small" color="primary" />}
                            </Stack>
                          </MenuItem>
                        ))}
                      </TextField>
                      <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>
                        Select a template to populate the Shipping & Returns field below. You can then customize the text.
                      </Alert>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>Quick Actions</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        startIcon={<PublishedWithChangesIcon />}
                        onClick={handleOpenBulkApplyMenu}
                        disabled={isBulkApplying}
                        fullWidth
                      >
                        {isBulkApplying ? 'Applying...' : 'Apply to Products'}
                      </Button>
                      <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>
                        Apply this fabric's shipping & returns policy to its products.
                      </Alert>
                  </Grid>
                  <Grid item xs={12}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">Details & Craftsmanship (default)</Typography>
                        <IconButton size="small" onClick={() => handleOpenCopyModal("description")} title="Copy Details from another fabric">
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <TextField {...register("description")} margin="none" fullWidth name="description" variant="outlined" InputLabelProps={{ shrink: true }} multiline rows={4} />
                  </Grid>
                  <Grid item xs={12}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">Care Instructions (default)</Typography>
                        <IconButton size="small" onClick={() => handleOpenCopyModal("care_instructions")} title="Copy Care Instructions from another fabric">
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <TextField {...register("care_instructions")} margin="none" fullWidth name="care_instructions" variant="outlined" InputLabelProps={{ shrink: true }} multiline rows={4} />
                  </Grid>
                  <Grid item xs={12}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">Shipping & Returns (default)</Typography>
                        <IconButton size="small" onClick={() => handleOpenCopyModal("shipping_returns")} title="Copy Shipping & Returns from another fabric">
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <TextField {...register("shipping_returns")} margin="none" fullWidth name="shipping_returns" variant="outlined" InputLabelProps={{ shrink: true }} multiline rows={4} />
                  </Grid>
              </Grid>
          </Paper>
          {/* Image upload section has been completely removed as requested */}
        </Box>
      <CopyFabricModal 
        open={isCopyModalOpen}
        onClose={handleCloseCopyModal}
        fabrics={fabrics}
        onSelectFabric={handleSelectFabricToCopy}
      />
      
      {/* Bulk Apply Menu */}
      <Menu
        anchorEl={bulkApplyMenuAnchor}
        open={Boolean(bulkApplyMenuAnchor)}
        onClose={handleCloseBulkApplyMenu}
      >
        <MenuItem
          onClick={() => handleBulkApply(false)}
          disabled={isBulkApplying}
        >
          <ListItemText
            primary="Apply to Products of This Fabric"
            secondary={`Updates products with fabric type "${watch("name")}"`}
          />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => handleBulkApply(true)}
          disabled={isBulkApplying}
        >
          <ListItemText
            primary="Apply to All Products"
            secondary="Updates every product in the database"
          />
        </MenuItem>
      </Menu>
      </Edit>
    </>
  );
};