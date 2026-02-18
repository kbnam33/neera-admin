import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add } from "@mui/icons-material";
import { List } from "@refinedev/mui";
import { useNotification } from "@refinedev/core";
import { supabaseAdminClient } from "../../supabase";

const defaultFormData = {
  code: "",
  discount_type: "percentage",
  discount_value: "",
  min_order_amount: "0",
  max_discount_amount: "",
  usage_limit: "",
  valid_from: "",
  valid_until: "",
  is_active: true,
};

const toLocalDateTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const timezoneOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
};

const toIsoFromDateTimeInput = (value) => {
  if (!value) return null;
  return new Date(value).toISOString();
};

const formatCurrency = (value) => {
  if (value == null || value === "") return "—";
  return `Rs ${Number(value).toFixed(2)}`;
};

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

const getValidityStatus = (row) => {
  const now = Date.now();
  const validFrom = row.valid_from ? new Date(row.valid_from).getTime() : null;
  const validUntil = row.valid_until ? new Date(row.valid_until).getTime() : null;

  if (validUntil && validUntil < now) return "expired";
  if (validFrom && validFrom > now) return "upcoming";
  return "valid";
};

export const DiscountList = () => {
  const [discounts, setDiscounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [validityFilter, setValidityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const { open: openNotification } = useNotification();

  const fetchDiscounts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabaseAdminClient
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDiscounts(data || []);
    } catch (error) {
      console.error("Error fetching discounts:", error);
      openNotification?.({
        type: "error",
        message: "Failed to load discounts",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleOpenDialog = (discount = null) => {
    if (discount) {
      setEditingDiscount(discount);
      setFormData({
        code: discount.code || "",
        discount_type: discount.discount_type || "percentage",
        discount_value: discount.discount_value?.toString() ?? "",
        min_order_amount: discount.min_order_amount?.toString() ?? "0",
        max_discount_amount: discount.max_discount_amount?.toString() ?? "",
        usage_limit: discount.usage_limit?.toString() ?? "",
        valid_from: toLocalDateTimeInput(discount.valid_from),
        valid_until: toLocalDateTimeInput(discount.valid_until),
        is_active: Boolean(discount.is_active),
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        ...defaultFormData,
        valid_from: toLocalDateTimeInput(new Date().toISOString()),
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDiscount(null);
    setFormData(defaultFormData);
  };

  const validateForm = () => {
    const normalizedCode = formData.code.trim().toUpperCase();
    if (!normalizedCode) {
      return "Discount code is required.";
    }

    if (!/^[A-Z0-9]+$/.test(normalizedCode)) {
      return "Code must be uppercase alphanumeric only (A-Z, 0-9).";
    }

    const discountValue = Number(formData.discount_value);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return "Discount value must be greater than 0.";
    }

    if (formData.discount_type === "percentage" && discountValue > 100) {
      return "Percentage discount cannot exceed 100.";
    }

    const minOrderAmount = Number(formData.min_order_amount || 0);
    if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
      return "Minimum order amount cannot be negative.";
    }

    if (formData.max_discount_amount !== "") {
      const maxDiscount = Number(formData.max_discount_amount);
      if (!Number.isFinite(maxDiscount) || maxDiscount < 0) {
        return "Max discount amount cannot be negative.";
      }
    }

    if (formData.usage_limit !== "") {
      const usageLimit = Number(formData.usage_limit);
      if (!Number.isInteger(usageLimit) || usageLimit < 0) {
        return "Usage limit must be a non-negative integer.";
      }
    }

    if (formData.valid_from && formData.valid_until) {
      if (new Date(formData.valid_until).getTime() <= new Date(formData.valid_from).getTime()) {
        return "Valid until must be later than valid from.";
      }
    }

    return null;
  };

  const buildPayload = () => {
    const payload = {
      code: formData.code.trim().toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value),
      min_order_amount: Number(formData.min_order_amount || 0),
      max_discount_amount:
        formData.max_discount_amount === "" ? null : Number(formData.max_discount_amount),
      usage_limit: formData.usage_limit === "" ? null : Number(formData.usage_limit),
      valid_from: toIsoFromDateTimeInput(formData.valid_from) || new Date().toISOString(),
      valid_until: toIsoFromDateTimeInput(formData.valid_until),
      is_active: Boolean(formData.is_active),
    };

    return payload;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      openNotification?.({
        type: "error",
        message: "Validation error",
        description: validationError,
      });
      return;
    }

    const payload = buildPayload();
    setIsSaving(true);
    try {
      if (editingDiscount) {
        const { error } = await supabaseAdminClient
          .from("discount_codes")
          .update(payload)
          .eq("id", editingDiscount.id);
        if (error) throw error;

        openNotification?.({
          type: "success",
          message: "Discount updated",
          description: `Code ${payload.code} has been updated successfully.`,
        });
      } else {
        const { error } = await supabaseAdminClient.from("discount_codes").insert([payload]);
        if (error) throw error;

        openNotification?.({
          type: "success",
          message: "Discount created",
          description: `Code ${payload.code} has been created successfully.`,
        });
      }

      handleCloseDialog();
      fetchDiscounts();
    } catch (error) {
      const isDuplicateCode = error?.code === "23505";
      openNotification?.({
        type: "error",
        message: "Failed to save discount",
        description: isDuplicateCode
          ? "This code already exists. Please use a unique code."
          : error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (row) => {
    try {
      const { error } = await supabaseAdminClient
        .from("discount_codes")
        .update({ is_active: !row.is_active })
        .eq("id", row.id);
      if (error) throw error;

      openNotification?.({
        type: "success",
        message: row.is_active ? "Code deactivated" : "Code activated",
        description: `Code ${row.code} is now ${row.is_active ? "inactive" : "active"}.`,
      });
      fetchDiscounts();
    } catch (error) {
      openNotification?.({
        type: "error",
        message: "Failed to update status",
        description: error.message,
      });
    }
  };

  const filteredRows = useMemo(() => {
    return discounts.filter((row) => {
      const codeMatch = row.code?.toLowerCase().includes(search.trim().toLowerCase());

      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "active" && row.is_active) ||
        (statusFilter === "inactive" && !row.is_active);

      const validity = getValidityStatus(row);
      const validityMatch =
        validityFilter === "all" ||
        (validityFilter === "valid" && validity === "valid") ||
        (validityFilter === "expired" && validity === "expired");

      const typeMatch = typeFilter === "all" || row.discount_type === typeFilter;

      return codeMatch && statusMatch && validityMatch && typeMatch;
    });
  }, [discounts, search, statusFilter, validityFilter, typeFilter]);

  const columns = useMemo(
    () => [
      {
        field: "code",
        headerName: "Code",
        minWidth: 140,
        flex: 1,
        renderCell: ({ value }) => <Typography fontWeight={700}>{value}</Typography>,
      },
      {
        field: "discount_type",
        headerName: "Type",
        minWidth: 130,
        renderCell: ({ value }) => (
          <Chip
            size="small"
            label={value === "percentage" ? "Percentage" : "Fixed"}
            color={value === "percentage" ? "primary" : "secondary"}
            variant="outlined"
          />
        ),
      },
      {
        field: "discount_value",
        headerName: "Value",
        minWidth: 130,
        renderCell: ({ row }) => (
          <Typography>
            {row.discount_type === "percentage"
              ? `${Number(row.discount_value).toFixed(2)}%`
              : formatCurrency(row.discount_value)}
          </Typography>
        ),
      },
      {
        field: "min_order_amount",
        headerName: "Min Order",
        minWidth: 120,
        renderCell: ({ value }) => <Typography>{formatCurrency(value)}</Typography>,
      },
      {
        field: "max_discount_amount",
        headerName: "Max Discount",
        minWidth: 130,
        renderCell: ({ value }) => <Typography>{formatCurrency(value)}</Typography>,
      },
      {
        field: "is_active",
        headerName: "Status",
        minWidth: 120,
        renderCell: ({ value }) => (
          <Chip
            size="small"
            label={value ? "Active" : "Inactive"}
            color={value ? "success" : "default"}
          />
        ),
      },
      {
        field: "validity",
        headerName: "Validity",
        minWidth: 270,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack spacing={0.2}>
            <Typography variant="caption">
              From: {formatDateTime(row.valid_from)}
            </Typography>
            <Typography variant="caption">
              Until: {formatDateTime(row.valid_until)}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "usage",
        headerName: "Usage",
        minWidth: 160,
        sortable: false,
        renderCell: ({ row }) => {
          const timesUsed = Number(row.times_used || 0);
          const usageLimit = row.usage_limit;
          const remaining =
            usageLimit == null ? "Unlimited" : Math.max(Number(usageLimit) - timesUsed, 0);

          return (
            <Stack spacing={0.2}>
              <Typography variant="caption">Used: {timesUsed}</Typography>
              <Typography variant="caption">
                Remaining: {usageLimit == null ? "Unlimited" : remaining}
              </Typography>
            </Stack>
          );
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        minWidth: 220,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleOpenDialog(row)}
              sx={{ textTransform: "none" }}
            >
              Edit
            </Button>
            <Button
              size="small"
              color={row.is_active ? "warning" : "success"}
              variant="contained"
              onClick={() => handleToggleActive(row)}
              sx={{ textTransform: "none" }}
            >
              {row.is_active ? "Deactivate" : "Activate"}
            </Button>
          </Stack>
        ),
      },
    ],
    []
  );

  return (
    <List
      title={<Typography variant="h5">Discount Management</Typography>}
      headerButtons={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            size="small"
            label="Search code"
            value={search}
            onChange={(event) => setSearch(event.target.value.toUpperCase())}
            sx={{ minWidth: 180 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="discount-status-filter">Status</InputLabel>
            <Select
              labelId="discount-status-filter"
              value={statusFilter}
              label="Status"
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="discount-validity-filter">Validity</InputLabel>
            <Select
              labelId="discount-validity-filter"
              value={validityFilter}
              label="Validity"
              onChange={(event) => setValidityFilter(event.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="valid">Valid</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="discount-type-filter">Type</InputLabel>
            <Select
              labelId="discount-type-filter"
              value={typeFilter}
              label="Type"
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <MenuItem value="all">All types</MenuItem>
              <MenuItem value="percentage">Percentage</MenuItem>
              <MenuItem value="fixed">Fixed</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{ textTransform: "none" }}
            onClick={() => handleOpenDialog()}
          >
            Create Code
          </Button>
        </Stack>
      }
    >
      <Alert severity="info" sx={{ mb: 2 }}>
        Create and manage checkout discount codes. Rules here follow the same validation used by
        customer checkout.
      </Alert>
      <Paper sx={{ height: "75vh", width: "100%" }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={isLoading}
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
            sorting: { sortModel: [{ field: "created_at", sort: "desc" }] },
          }}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDiscount ? "Edit Discount Code" : "Create Discount Code"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Code"
              value={formData.code}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  code: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                }))
              }
              placeholder="FESTIVE20"
              required
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="discount-type-label">Discount Type</InputLabel>
                <Select
                  labelId="discount-type-label"
                  value={formData.discount_type}
                  label="Discount Type"
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, discount_type: event.target.value }))
                  }
                >
                  <MenuItem value="percentage">Percentage</MenuItem>
                  <MenuItem value="fixed">Fixed amount</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={formData.discount_type === "percentage" ? "Discount (%)" : "Discount (Rs)"}
                type="number"
                value={formData.discount_value}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, discount_value: event.target.value }))
                }
                required
                fullWidth
                inputProps={{ min: 0, step: "0.01" }}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Min order amount (Rs)"
                type="number"
                value={formData.min_order_amount}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, min_order_amount: event.target.value }))
                }
                fullWidth
                inputProps={{ min: 0, step: "0.01" }}
              />
              <TextField
                label="Max discount amount (optional)"
                type="number"
                value={formData.max_discount_amount}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, max_discount_amount: event.target.value }))
                }
                fullWidth
                inputProps={{ min: 0, step: "0.01" }}
              />
            </Stack>
            <TextField
              label="Usage limit (optional)"
              type="number"
              value={formData.usage_limit}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, usage_limit: event.target.value }))
              }
              fullWidth
              inputProps={{ min: 0, step: "1" }}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Valid from"
                type="datetime-local"
                value={formData.valid_from}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, valid_from: event.target.value }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Valid until (optional)"
                type="datetime-local"
                value={formData.valid_until}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, valid_until: event.target.value }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, is_active: event.target.checked }))
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
            sx={{ textTransform: "none" }}
          >
            {editingDiscount ? "Update Code" : "Create Code"}
          </Button>
        </DialogActions>
      </Dialog>
    </List>
  );
};
