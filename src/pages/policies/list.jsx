import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  Tooltip,
  CircularProgress,
  Badge,
  Avatar,
} from "@mui/material";
import { List } from "@refinedev/mui";
import { useState, useEffect } from "react";
import { supabaseAdminClient } from "../../supabase";
import { 
  Add, 
  Edit, 
  Delete, 
  Star, 
  Sync, 
  PublishedWithChanges, 
  ExpandMore,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Description,
  LocalShipping,
} from "@mui/icons-material";
import { useNotification } from "@refinedev/core";

export const PolicyList = () => {
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    is_default: false,
  });
  const [isBulkApplying, setIsBulkApplying] = useState(false);
  const [fabricAssociations, setFabricAssociations] = useState({});
  const [loadingAssociations, setLoadingAssociations] = useState(false);
  const [expandedPolicyId, setExpandedPolicyId] = useState(null);
  const [selectedFabrics, setSelectedFabrics] = useState({});
  const { open: openNotification } = useNotification();

  const fetchPolicies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabaseAdminClient
        .from("shipping_policies")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPolicies(data || []);
    } catch (error) {
      console.error("Error fetching policies:", error);
      openNotification?.({
        type: "error",
        message: "Failed to load policies",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFabricAssociations = async (policyId) => {
    const policy = policies.find(p => p.id === policyId);
    if (!policy) return;

    setLoadingAssociations(true);
    try {
      // Get ALL fabrics
      const { data: fabrics, error: fabricError } = await supabaseAdminClient
        .from("fabrics")
        .select("id, name, shipping_returns")
        .order("name", { ascending: true });

      if (fabricError) throw fabricError;

      // For each fabric, determine status and get product sync info
      const fabricsWithStatus = await Promise.all(
        (fabrics || []).map(async (fabric) => {
          // Determine policy status
          const usesThisPolicy = fabric.shipping_returns === policy.content;
          const hasAnyPolicy = fabric.shipping_returns && fabric.shipping_returns.trim() !== '';
          
          let policyStatus = 'none';
          if (usesThisPolicy) {
            policyStatus = 'current'; // Using this policy
          } else if (hasAnyPolicy) {
            policyStatus = 'different'; // Using a different policy
          }

          // Count total products of this fabric
          const { count: totalProducts } = await supabaseAdminClient
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("fabric_type", fabric.name);

          // Count products that match the fabric's shipping_returns (only relevant if fabric has policy)
          let syncedProducts = 0;
          if (hasAnyPolicy) {
            const { count } = await supabaseAdminClient
              .from("products")
              .select("*", { count: "exact", head: true })
              .eq("fabric_type", fabric.name)
              .eq("shipping_returns", fabric.shipping_returns);
            syncedProducts = count || 0;
          }

          return {
            ...fabric,
            policyStatus, // 'current', 'different', or 'none'
            totalProducts: totalProducts || 0,
            syncedProducts: syncedProducts || 0,
            syncPercentage: totalProducts ? Math.round((syncedProducts / totalProducts) * 100) : 100,
          };
        })
      );

      setFabricAssociations(prev => ({
        ...prev,
        [policyId]: fabricsWithStatus,
      }));
    } catch (error) {
      console.error("Error fetching fabric associations:", error);
      openNotification?.({
        type: "error",
        message: "Failed to load fabric associations",
        description: error.message,
      });
    } finally {
      setLoadingAssociations(false);
    }
  };

  const handleAccordionChange = (policyId) => {
    const isExpanding = expandedPolicyId !== policyId;
    setExpandedPolicyId(isExpanding ? policyId : null);
    
    if (isExpanding && !fabricAssociations[policyId]) {
      fetchFabricAssociations(policyId);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleOpenDialog = (policy = null) => {
    if (policy) {
      setEditingPolicy(policy);
      setFormData({
        name: policy.name,
        content: policy.content,
        is_default: policy.is_default,
      });
    } else {
      setEditingPolicy(null);
      setFormData({
        name: "",
        content: "",
        is_default: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPolicy(null);
    setFormData({ name: "", content: "", is_default: false });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      openNotification?.({
        type: "error",
        message: "Validation Error",
        description: "Name and content are required",
      });
      return;
    }

    try {
      // If setting as default, unset all other defaults first
      if (formData.is_default) {
        await supabaseAdminClient
          .from("shipping_policies")
          .update({ is_default: false })
          .neq("id", editingPolicy?.id || 0);
      }

      if (editingPolicy) {
        // Update existing
        const { error } = await supabaseAdminClient
          .from("shipping_policies")
          .update(formData)
          .eq("id", editingPolicy.id);

        if (error) throw error;

        openNotification?.({
          type: "success",
          message: "Policy Updated",
          description: `"${formData.name}" has been updated successfully`,
        });
      } else {
        // Create new
        const { error } = await supabaseAdminClient
          .from("shipping_policies")
          .insert([formData]);

        if (error) throw error;

        openNotification?.({
          type: "success",
          message: "Policy Created",
          description: `"${formData.name}" has been created successfully`,
        });
      }

      fetchPolicies();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving policy:", error);
      openNotification?.({
        type: "error",
        message: "Failed to save policy",
        description: error.message,
      });
    }
  };

  const handleDelete = async (policy) => {
    if (policy.is_default) {
      openNotification?.({
        type: "error",
        message: "Cannot Delete",
        description: "Cannot delete the default policy. Set another policy as default first.",
      });
      return;
    }

    if (!window.confirm(`Delete policy "${policy.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabaseAdminClient
        .from("shipping_policies")
        .delete()
        .eq("id", policy.id);

      if (error) throw error;

      openNotification?.({
        type: "success",
        message: "Policy Deleted",
        description: `"${policy.name}" has been deleted`,
      });

      fetchPolicies();
    } catch (error) {
      console.error("Error deleting policy:", error);
      openNotification?.({
        type: "error",
        message: "Failed to delete policy",
        description: error.message,
      });
    }
  };

  const handleSetDefault = async (policyId) => {
    try {
      // Unset all defaults
      await supabaseAdminClient
        .from("shipping_policies")
        .update({ is_default: false })
        .neq("id", 0);

      // Set this one as default
      const { error} = await supabaseAdminClient
        .from("shipping_policies")
        .update({ is_default: true })
        .eq("id", policyId);

      if (error) throw error;

      openNotification?.({
        type: "success",
        message: "Default Policy Set",
        description: "This policy is now the default for all new fabrics",
      });

      fetchPolicies();
    } catch (error) {
      console.error("Error setting default:", error);
      openNotification?.({
        type: "error",
        message: "Failed to set default",
        description: error.message,
      });
    }
  };

  const handleApplyToSelectedFabrics = async (policyId) => {
    const policy = policies.find(p => p.id === policyId);
    const selectedFabricIds = selectedFabrics[policyId] || [];
    
    if (!policy || selectedFabricIds.length === 0) {
      openNotification?.({
        type: "warning",
        message: "No Fabrics Selected",
        description: "Please select at least one fabric to assign the policy to.",
      });
      return;
    }

    const fabrics = fabricAssociations[policyId] || [];
    const selectedFabricObjs = fabrics.filter(f => selectedFabricIds.includes(f.id));
    
    // Count how many will be updated vs already have it
    const toUpdate = selectedFabricObjs.filter(f => f.policyStatus !== 'current').length;
    const alreadyHave = selectedFabricObjs.filter(f => f.policyStatus === 'current').length;

    let confirmMessage = `Assign "${policy.name}" to ${selectedFabricIds.length} fabric${selectedFabricIds.length > 1 ? 's' : ''}?\n\n`;
    if (toUpdate > 0) {
      confirmMessage += `• ${toUpdate} fabric${toUpdate > 1 ? 's' : ''} will be updated\n`;
    }
    if (alreadyHave > 0) {
      confirmMessage += `• ${alreadyHave} fabric${alreadyHave > 1 ? 's already have' : ' already has'} this policy\n`;
    }
    confirmMessage += `\nThis will update each fabric's shipping & returns field with this policy's content.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsBulkApplying(true);
    try {
      let updatedCount = 0;
      
      for (const fabricId of selectedFabricIds) {
        const { error } = await supabaseAdminClient
          .from("fabrics")
          .update({ shipping_returns: policy.content })
          .eq("id", fabricId);

        if (!error) updatedCount++;
      }

      openNotification?.({
        type: "success",
        message: "Policy Assigned Successfully",
        description: `Assigned "${policy.name}" to ${updatedCount} fabric${updatedCount !== 1 ? 's' : ''}`,
      });

      // Refresh associations
      fetchFabricAssociations(policyId);
      setSelectedFabrics(prev => ({ ...prev, [policyId]: [] }));
    } catch (error) {
      console.error("Error assigning policy:", error);
      openNotification?.({
        type: "error",
        message: "Failed to assign policy",
        description: error.message,
      });
    } finally {
      setIsBulkApplying(false);
    }
  };

  const handleSyncProductsToFabrics = async (policyId) => {
    const policy = policies.find(p => p.id === policyId);
    const selectedFabricIds = selectedFabrics[policyId] || [];
    
    if (!policy || selectedFabricIds.length === 0) {
      openNotification?.({
        type: "warning",
        message: "No Fabrics Selected",
        description: "Please select at least one fabric to sync products for.",
      });
      return;
    }

    const fabrics = fabricAssociations[policyId] || [];
    const selectedFabricObjs = fabrics.filter(f => selectedFabricIds.includes(f.id));

    if (!window.confirm(
      `Sync products to match their fabrics?\n\nThis will update products of ${selectedFabricIds.length} selected fabric${selectedFabricIds.length > 1 ? 's' : ''} to match their fabric's shipping & returns policy.`
    )) {
      return;
    }

    setIsBulkApplying(true);
    try {
      let totalUpdated = 0;

      for (const fabric of selectedFabricObjs) {
        const { data, error } = await supabaseAdminClient
          .from("products")
          .update({ shipping_returns: fabric.shipping_returns })
          .eq("fabric_type", fabric.name)
          .select();

        if (!error && data) totalUpdated += data.length;
      }

      openNotification?.({
        type: "success",
        message: "Products Synced",
        description: `Updated ${totalUpdated} product${totalUpdated !== 1 ? 's' : ''} to match their fabrics`,
      });

      // Refresh associations
      fetchFabricAssociations(policyId);
    } catch (error) {
      console.error("Error syncing products:", error);
      openNotification?.({
        type: "error",
        message: "Failed to sync products",
        description: error.message,
      });
    } finally {
      setIsBulkApplying(false);
    }
  };

  const handleToggleFabric = (policyId, fabricId) => {
    setSelectedFabrics(prev => {
      const currentSelected = prev[policyId] || [];
      const isSelected = currentSelected.includes(fabricId);
      
      return {
        ...prev,
        [policyId]: isSelected
          ? currentSelected.filter(id => id !== fabricId)
          : [...currentSelected, fabricId],
      };
    });
  };

  const handleToggleAllFabrics = (policyId) => {
    const fabrics = fabricAssociations[policyId] || [];
    const currentSelected = selectedFabrics[policyId] || [];
    const allSelected = fabrics.length > 0 && currentSelected.length === fabrics.length;

    setSelectedFabrics(prev => ({
      ...prev,
      [policyId]: allSelected ? [] : fabrics.map(f => f.id),
    }));
  };

  return (
    <List
      title={
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
            <LocalShipping />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={700}>Shipping & Returns Policies</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage policy templates and apply them to fabrics
            </Typography>
          </Box>
        </Stack>
      }
      breadcrumb={null}
      headerButtons={
        <Button
          variant="contained"
          size="large"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            borderRadius: 2,
            textTransform: "none",
            px: 3,
          }}
        >
          Create New Policy
        </Button>
      }
    >
      <Stack spacing={3}>
        {/* Enhanced Info Card */}
        <Card 
          elevation={0} 
          sx={{ 
            bgcolor: "primary.50", 
            border: 1, 
            borderColor: "primary.200",
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box sx={{ 
                bgcolor: "primary.main", 
                color: "white", 
                borderRadius: 2, 
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Description />
              </Box>
              <Box flex={1}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  How Policy Management Works
                </Typography>
                <Stack spacing={0.5} component="ul" sx={{ pl: 2, mb: 0 }}>
                  <Typography variant="body2" component="li">
                    <strong>Create Templates:</strong> Build reusable shipping & returns policy texts
                  </Typography>
                  <Typography variant="body2" component="li">
                    <strong>Set Default:</strong> Auto-applies to new fabrics when created
                  </Typography>
                  <Typography variant="body2" component="li">
                    <strong>View All Fabrics:</strong> See every fabric with status indicators (🟢 using this, 🟡 different policy, 🔴 no policy)
                  </Typography>
                  <Typography variant="body2" component="li">
                    <strong>Assign to Fabrics:</strong> Select any fabrics and assign this policy directly
                  </Typography>
                  <Typography variant="body2" component="li">
                    <strong>Sync Products:</strong> Update products to match their fabric's policy
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Policy Cards */}
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={6}>
            <CircularProgress size={48} />
          </Box>
        ) : policies.length === 0 ? (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 8, 
              textAlign: "center",
              border: 2,
              borderStyle: "dashed",
              borderColor: "divider",
              borderRadius: 3,
            }}
          >
            <LocalShipping sx={{ fontSize: 80, color: "text.disabled", mb: 2 }} />
            <Typography variant="h5" fontWeight={600} color="text.secondary" gutterBottom>
              No Policies Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: "auto" }}>
              Create your first shipping & returns policy template to streamline fabric and product management
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ borderRadius: 2, textTransform: "none", px: 4 }}
            >
              Create First Policy
            </Button>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {policies.map((policy) => {
              const fabrics = fabricAssociations[policy.id] || [];
              const selectedCount = (selectedFabrics[policy.id] || []).length;
              const isExpanded = expandedPolicyId === policy.id;
              
              return (
                <Card
                  key={policy.id}
                  elevation={isExpanded ? 8 : 2}
                  sx={{
                    border: policy.is_default ? 2 : 0,
                    borderColor: policy.is_default ? "primary.main" : "transparent",
                    borderRadius: 3,
                    transition: "all 0.3s",
                    "&:hover": {
                      elevation: 4,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Policy Header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                        <Avatar 
                          sx={{ 
                            bgcolor: policy.is_default ? "primary.main" : "secondary.main",
                            width: 56,
                            height: 56,
                          }}
                        >
                          <LocalShipping sx={{ fontSize: 30 }} />
                        </Avatar>
                        <Box flex={1}>
                          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                            <Typography variant="h6" fontWeight={700}>
                              {policy.name}
                            </Typography>
                            {policy.is_default && (
                              <Chip
                                icon={<Star />}
                                label="Default"
                                color="primary"
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                          </Stack>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {policy.content}
                          </Typography>
                        </Box>
                      </Stack>
                      
                      {/* Action Buttons */}
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Edit Policy">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(policy)}
                            sx={{ 
                              bgcolor: "action.hover",
                              "&:hover": { bgcolor: "action.selected" },
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={policy.is_default ? "Cannot delete default" : "Delete Policy"}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(policy)}
                              disabled={policy.is_default}
                              color="error"
                              sx={{ 
                                bgcolor: "action.hover",
                                "&:hover": { bgcolor: "error.50" },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        {!policy.is_default && (
                          <Tooltip title="Set as Default">
                            <IconButton
                              size="small"
                              onClick={() => handleSetDefault(policy.id)}
                              sx={{ 
                                bgcolor: "action.hover",
                                "&:hover": { bgcolor: "warning.50" },
                              }}
                            >
                              <Star fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>

                  {/* Expandable Fabric Management Section */}
                  <Accordion 
                    expanded={isExpanded}
                    onChange={() => handleAccordionChange(policy.id)}
                    elevation={0}
                    sx={{ 
                      "&:before": { display: "none" },
                      borderTop: 1,
                      borderColor: "divider",
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMore />}
                      sx={{ 
                        bgcolor: isExpanded ? "action.selected" : "action.hover",
                        "&:hover": { bgcolor: "action.selected" },
                        minHeight: 56,
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="body1" fontWeight={600}>
                          View All Fabrics & Assign Policy
                        </Typography>
                        {isExpanded && fabrics.length > 0 && (
                          <Stack direction="row" spacing={1}>
                            <Chip 
                              label={`${fabrics.length} total`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip 
                              label={`${fabrics.filter(f => f.policyStatus === 'current').length} using`}
                              size="small"
                              color="success"
                            />
                          </Stack>
                        )}
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 3 }}>
                      {loadingAssociations ? (
                        <Box display="flex" justifyContent="center" p={4}>
                          <CircularProgress size={32} />
                        </Box>
                      ) : fabrics.length === 0 ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          <Typography variant="body2" fontWeight={500}>
                            No fabrics found in the system.
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Create fabrics first to assign policies to them.
                          </Typography>
                        </Alert>
                      ) : (
                        <Box>
                          {/* Action Buttons */}
                          <Stack direction="row" spacing={2} mb={3}>
                            <Button
                              variant="contained"
                              startIcon={<PublishedWithChanges />}
                              onClick={() => handleApplyToSelectedFabrics(policy.id)}
                              disabled={selectedCount === 0 || isBulkApplying}
                              sx={{ borderRadius: 2, textTransform: "none" }}
                            >
                              Assign Policy to {selectedCount || ''} Selected Fabric{selectedCount !== 1 ? 's' : ''}
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<Sync />}
                              onClick={() => handleSyncProductsToFabrics(policy.id)}
                              disabled={selectedCount === 0 || isBulkApplying}
                              sx={{ borderRadius: 2, textTransform: "none" }}
                            >
                              Sync Products to Fabrics
                            </Button>
                          </Stack>

                          <Alert severity="info" icon={<Description />} sx={{ mb: 2, borderRadius: 2 }}>
                            <Typography variant="body2" fontWeight={500}>
                              How to use:
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              1. <strong>Select fabrics</strong> using checkboxes (any status)<br />
                              2. <strong>Assign Policy</strong> - Updates fabric's shipping & returns field<br />
                              3. <strong>Sync Products</strong> - Updates products to match their fabric's policy
                            </Typography>
                          </Alert>

                          {/* Fabric Stats Summary */}
                          <Stack direction="row" spacing={1.5} mb={2.5}>
                            <Chip 
                              label={`${fabrics.filter(f => f.policyStatus === 'current').length} Using this`}
                              color="success"
                              size="small"
                              variant="outlined"
                              icon={<CheckCircle />}
                              sx={{ fontWeight: 600 }}
                            />
                            <Chip 
                              label={`${fabrics.filter(f => f.policyStatus === 'different').length} Different`}
                              color="warning"
                              size="small"
                              variant="outlined"
                              icon={<Warning />}
                              sx={{ fontWeight: 600 }}
                            />
                            <Chip 
                              label={`${fabrics.filter(f => f.policyStatus === 'none').length} No policy`}
                              color="error"
                              size="small"
                              variant="outlined"
                              icon={<ErrorIcon />}
                              sx={{ fontWeight: 600 }}
                            />
                          </Stack>

                          {/* Fabric List - Grouped by Status */}
                          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                            {/* Header */}
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              sx={{ 
                                p: 2, 
                                bgcolor: "action.hover",
                                borderBottom: 1,
                                borderColor: "divider",
                              }}
                            >
                              <Checkbox
                                size="small"
                                checked={fabrics.length > 0 && selectedCount === fabrics.length}
                                indeterminate={selectedCount > 0 && selectedCount < fabrics.length}
                                onChange={() => handleToggleAllFabrics(policy.id)}
                              />
                              <Typography variant="caption" fontWeight={700} sx={{ flex: 1, ml: 1, textTransform: "uppercase", letterSpacing: 1 }}>
                                Fabric Name
                              </Typography>
                              <Typography variant="caption" fontWeight={700} sx={{ width: 170, textTransform: "uppercase", letterSpacing: 1 }}>
                                Status
                              </Typography>
                              <Typography variant="caption" fontWeight={700} sx={{ width: 100, textAlign: "center", textTransform: "uppercase", letterSpacing: 1 }}>
                                Products
                              </Typography>
                            </Box>

                            {/* Fabric Rows - Sorted by status (current, none, different) */}
                            {[...fabrics]
                              .sort((a, b) => {
                                const statusOrder = { current: 0, none: 1, different: 2 };
                                return statusOrder[a.policyStatus] - statusOrder[b.policyStatus];
                              })
                              .map((fabric, index) => {
                              const isSelected = (selectedFabrics[policy.id] || []).includes(fabric.id);
                              const isSynced = fabric.syncPercentage === 100;
                              const hasProducts = fabric.totalProducts > 0;

                              // Status badge configuration
                              const statusConfig = {
                                current: { 
                                  label: "Using this policy", 
                                  color: "success",
                                  icon: <CheckCircle fontSize="small" />
                                },
                                different: { 
                                  label: "Different policy", 
                                  color: "warning",
                                  icon: <Warning fontSize="small" />
                                },
                                none: { 
                                  label: "No policy", 
                                  color: "error",
                                  icon: <ErrorIcon fontSize="small" />
                                },
                              };

                              const status = statusConfig[fabric.policyStatus];

                              return (
                                <Box
                                  key={fabric.id}
                                  display="flex"
                                  alignItems="center"
                                  sx={{
                                    p: 2,
                                    borderBottom: index < fabrics.length - 1 ? 1 : 0,
                                    borderColor: "divider",
                                    bgcolor: isSelected ? "action.selected" : "transparent",
                                    "&:hover": { bgcolor: isSelected ? "action.selected" : "action.hover" },
                                    transition: "background-color 0.2s",
                                  }}
                                >
                                  <Checkbox
                                    size="small"
                                    checked={isSelected}
                                    onChange={() => handleToggleFabric(policy.id, fabric.id)}
                                  />
                                  <Typography variant="body2" fontWeight={500} sx={{ flex: 1, ml: 1 }}>
                                    {fabric.name}
                                  </Typography>
                                  
                                  {/* Policy Status Badge - Uniform Size */}
                                  <Box sx={{ width: 170, display: "flex", justifyContent: "flex-start" }}>
                                    <Chip
                                      label={status.label}
                                      size="small"
                                      color={status.color}
                                      icon={status.icon}
                                      sx={{ 
                                        fontWeight: 600, 
                                        fontSize: '0.7rem',
                                        width: 155,
                                        justifyContent: "center",
                                      }}
                                    />
                                  </Box>

                                  {/* Product Count - Simple Display */}
                                  <Box sx={{ width: 100, textAlign: "center" }}>
                                    {!hasProducts ? (
                                      <Typography variant="body2" color="text.disabled" fontWeight={500}>
                                        —
                                      </Typography>
                                    ) : fabric.policyStatus === 'none' ? (
                                      <Tooltip title="Assign policy to this fabric first" arrow>
                                        <Typography variant="body2" color="error.main" fontWeight={600}>
                                          —
                                        </Typography>
                                      </Tooltip>
                                    ) : (
                                      <Tooltip 
                                        title={`${fabric.syncedProducts} products synced out of ${fabric.totalProducts} total`} 
                                        arrow
                                      >
                                        <Typography 
                                          variant="body2" 
                                          fontWeight={600}
                                          sx={{ 
                                            color: isSynced ? "success.main" : fabric.syncPercentage > 50 ? "warning.main" : "error.main",
                                            cursor: "help",
                                          }}
                                        >
                                          {fabric.syncedProducts}/{fabric.totalProducts}
                                        </Typography>
                                      </Tooltip>
                                    )}
                                  </Box>
                                </Box>
                              );
                            })}
                          </Paper>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            {editingPolicy ? "Edit Policy" : "Create New Policy"}
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              label="Policy Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Standard Shipping & Returns"
              required
              autoFocus
            />
            <TextField
              label="Policy Content"
              fullWidth
              multiline
              rows={10}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter your shipping & returns policy..."
              required
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>Set as default policy</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Auto-applies to all new fabrics
                  </Typography>
                </Box>
              }
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
          >
            {editingPolicy ? "Update Policy" : "Create Policy"}
          </Button>
        </DialogActions>
      </Dialog>
    </List>
  );
};
