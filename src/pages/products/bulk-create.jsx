import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  Stack,
  Chip,
  Alert,
  Divider,
  FormControlLabel,
  Checkbox,
  Collapse,
  LinearProgress,
} from "@mui/material";
import { Create, useAutocomplete } from "@refinedev/mui";
import { Add, Delete, Save, ContentCopy, Image, Collections } from "@mui/icons-material";
import { useCreate, useNotification } from "@refinedev/core";
import { supabaseAdminClient } from "../../supabase";
import { BulkProductImageManager } from "../../components/BulkProductImageManager";

export const ProductBulkCreate = () => {
  const navigate = useNavigate();
  const { mutateAsync } = useCreate();
  const { open: openNotification } = useNotification();

  // Shared fields
  const [selectedFabric, setSelectedFabric] = useState(null);
  const [sharedPrice, setSharedPrice] = useState("");
  const [applySharedFields, setApplySharedFields] = useState(true);
  const [showSharedFields, setShowSharedFields] = useState(false);
  const [sharedDescription, setSharedDescription] = useState("");
  const [sharedCareInstructions, setSharedCareInstructions] = useState("");
  const [sharedShippingReturns, setSharedShippingReturns] = useState("");

  // Product rows
  const [products, setProducts] = useState([
    { id: 1, name: "", short_description: "", images: [] },
    { id: 2, name: "", short_description: "", images: [] },
    { id: 3, name: "", short_description: "", images: [] },
  ]);

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [currentProductForImages, setCurrentProductForImages] = useState(null);

  // Collect all images from all products except the current one
  const getExcludedImages = () => {
    const allImages = [];
    products.forEach(product => {
      if (product.id !== currentProductForImages && product.images && product.images.length > 0) {
        allImages.push(...product.images);
      }
    });
    return allImages;
  };

  const { autocompleteProps } = useAutocomplete({
    resource: "fabrics",
  });

  // Load fabric defaults when fabric changes
  useEffect(() => {
    if (selectedFabric && applySharedFields) {
      loadFabricDefaults(selectedFabric);
    }
  }, [selectedFabric]);

  const loadFabricDefaults = async (fabric) => {
    try {
      const { data, error } = await supabaseAdminClient
        .from("fabrics")
        .select("description, care_instructions, shipping_returns, default_price")
        .eq("id", fabric.id)
        .single();

      if (error || !data) return;

      if (data.description) setSharedDescription(data.description);
      if (data.care_instructions) setSharedCareInstructions(data.care_instructions);
      if (data.shipping_returns) setSharedShippingReturns(data.shipping_returns);
      if (data.default_price) setSharedPrice(data.default_price.toString());
    } catch (err) {
      console.error("Error loading fabric defaults:", err);
    }
  };

  const addProduct = () => {
    const newId = Math.max(...products.map((p) => p.id), 0) + 1;
    setProducts([...products, { id: newId, name: "", short_description: "", images: [] }]);
  };

  const removeProduct = (id) => {
    if (products.length <= 1) return; // Keep at least one
    setProducts(products.filter((p) => p.id !== id));
    // Clear errors for this product
    const newErrors = { ...errors };
    delete newErrors[`name_${id}`];
    delete newErrors[`short_description_${id}`];
    setErrors(newErrors);
  };

  const updateProduct = (id, field, value) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
    // Clear error for this field
    const errorKey = `${field}_${id}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const handleOpenImageManager = (productId) => {
    const product = products.find(p => p.id === productId);
    setCurrentProductForImages(productId);
    setImagePickerOpen(true);
  };

  const handleSaveImages = (selectedUrls) => {
    if (currentProductForImages !== null) {
      updateProduct(currentProductForImages, "images", selectedUrls);
    }
    setImagePickerOpen(false);
    setCurrentProductForImages(null);
  };

  const getCurrentProductImages = () => {
    if (currentProductForImages === null) return [];
    const product = products.find(p => p.id === currentProductForImages);
    return product?.images || [];
  };

  const duplicateProduct = (id) => {
    const productToDuplicate = products.find((p) => p.id === id);
    if (!productToDuplicate) return;
    
    const newId = Math.max(...products.map((p) => p.id), 0) + 1;
    const duplicated = {
      id: newId,
      name: productToDuplicate.name + " (Copy)",
      short_description: productToDuplicate.short_description,
      images: [...productToDuplicate.images], // Copy images array
    };
    
    const index = products.findIndex((p) => p.id === id);
    const newProducts = [...products];
    newProducts.splice(index + 1, 0, duplicated);
    setProducts(newProducts);
  };

  const validateProducts = () => {
    const newErrors = {};
    let isValid = true;

    // Check fabric
    if (!selectedFabric) {
      newErrors.fabric = "Fabric is required";
      isValid = false;
    }

    // Check each product
    products.forEach((product) => {
      if (!product.name || product.name.trim() === "") {
        newErrors[`name_${product.id}`] = "Product name is required";
        isValid = false;
      }
      if (!product.short_description || product.short_description.trim() === "") {
        newErrors[`short_description_${product.id}`] = "Short description is required";
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateProducts()) {
      return;
    }

    setIsSaving(true);
    setSavingProgress(0);

    try {
      const createdProducts = [];
      const totalProducts = products.length;
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const productData = {
          name: product.name.trim(),
          short_description: product.short_description.trim(),
          fabric_type: selectedFabric.name,
          description: sharedDescription || "",
          care_instructions: sharedCareInstructions || "",
          shipping_returns: sharedShippingReturns || "",
          price: sharedPrice ? parseFloat(sharedPrice) : null,
          images: product.images || [],
        };

        // Suppress individual success notifications
        await mutateAsync({
          resource: "products",
          values: productData,
          successNotification: false, // Disable individual notifications
          errorNotification: (error) => ({
            message: `Failed to create "${productData.name}"`,
            description: error?.message || "An error occurred",
            type: "error",
          }),
        });

        createdProducts.push(productData.name);
        setSavingProgress(((i + 1) / totalProducts) * 100);
      }

      // Show single consolidated success notification
      openNotification?.({
        type: "success",
        message: "Bulk Creation Successful",
        description: `Successfully created ${createdProducts.length} product${createdProducts.length > 1 ? 's' : ''}`,
      });

      navigate("/products");
    } catch (error) {
      console.error("Error creating products:", error);
      openNotification?.({
        type: "error",
        message: "Bulk Creation Failed",
        description: "Failed to create some products. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filledProducts = products.filter(
    (p) => p.name.trim() !== "" || p.short_description.trim() !== ""
  );

  return (
    <Create
      title={<Typography variant="h5">Bulk Add Products</Typography>}
      breadcrumb={null}
      footerButtons={() => (
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={() => navigate("/products")}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving || products.length === 0}
            startIcon={<Save />}
          >
            {isSaving 
              ? `Saving... ${Math.round(savingProgress)}%` 
              : `Save ${products.length} Product${products.length > 1 ? 's' : ''}`}
          </Button>
        </Stack>
      )}
    >
      <Stack spacing={3}>
        {/* Saving Progress */}
        {isSaving && (
          <Paper sx={{ p: 2, bgcolor: "success.50" }}>
            <Typography variant="body2" gutterBottom fontWeight={500}>
              Creating products... {Math.round(savingProgress)}%
            </Typography>
            <LinearProgress variant="determinate" value={savingProgress} />
          </Paper>
        )}

        {/* Summary */}
        <Paper sx={{ p: 2, bgcolor: "primary.50", borderLeft: 4, borderColor: "primary.main" }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Typography variant="body1" fontWeight={500}>
              Ready to create:
            </Typography>
            <Chip label={`${products.length} products`} color="primary" />
            {filledProducts.length > 0 && filledProducts.length < products.length && (
              <Chip label={`${filledProducts.length} filled`} color="secondary" size="small" />
            )}
          </Stack>
        </Paper>

        {/* Shared Settings */}
        <Paper sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Shared Settings (Apply to All)</Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={applySharedFields}
                    onChange={(e) => setApplySharedFields(e.target.checked)}
                  />
                }
                label="Auto-apply fabric defaults"
              />
            </Box>

            {/* Fabric Selection - Required */}
            <Box>
              <Autocomplete
                {...autocompleteProps}
                value={selectedFabric}
                onChange={(_, newValue) => setSelectedFabric(newValue)}
                getOptionLabel={(option) => option.name || ""}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Fabric *"
                    error={!!errors.fabric}
                    helperText={errors.fabric || "Select the fabric for all products"}
                    required
                  />
                )}
              />
            </Box>

            {/* Price - Optional Shared */}
            <TextField
              label="Price (₹)"
              type="number"
              value={sharedPrice}
              onChange={(e) => setSharedPrice(e.target.value)}
              helperText="Optional: Set same price for all products"
              inputProps={{ step: "0.01", min: "0" }}
            />

            {/* Toggle for additional shared fields */}
            <Button
              variant="text"
              onClick={() => setShowSharedFields(!showSharedFields)}
              size="small"
            >
              {showSharedFields ? "Hide" : "Show"} Additional Shared Fields
            </Button>

            <Collapse in={showSharedFields}>
              <Stack spacing={2}>
                <Divider />
                <TextField
                  label="Description"
                  multiline
                  rows={3}
                  value={sharedDescription}
                  onChange={(e) => setSharedDescription(e.target.value)}
                  helperText="Will be applied to all products"
                />
                <TextField
                  label="Care Instructions"
                  multiline
                  rows={2}
                  value={sharedCareInstructions}
                  onChange={(e) => setSharedCareInstructions(e.target.value)}
                />
                <TextField
                  label="Shipping & Returns"
                  multiline
                  rows={2}
                  value={sharedShippingReturns}
                  onChange={(e) => setSharedShippingReturns(e.target.value)}
                />
              </Stack>
            </Collapse>
          </Stack>
        </Paper>

        {/* Products Table */}
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Product Details</Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addProduct}
              size="small"
            >
              Add Row
            </Button>
          </Box>

          {!selectedFabric && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Please select a fabric first to start adding products.
            </Alert>
          )}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.100" }}>
                  <TableCell width="5%" align="center">
                    <Typography variant="caption" fontWeight={600}>
                      #
                    </Typography>
                  </TableCell>
                  <TableCell width="30%">
                    <Typography variant="caption" fontWeight={600}>
                      Product Name *
                    </Typography>
                  </TableCell>
                  <TableCell width="35%">
                    <Typography variant="caption" fontWeight={600}>
                      Short Description *
                    </Typography>
                  </TableCell>
                  <TableCell width="15%" align="center">
                    <Typography variant="caption" fontWeight={600}>
                      Images
                    </Typography>
                  </TableCell>
                  <TableCell width="15%" align="center">
                    <Typography variant="caption" fontWeight={600}>
                      Actions
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow
                    key={product.id}
                    sx={{
                      "&:hover": { bgcolor: "action.hover" },
                      bgcolor:
                        product.name.trim() !== "" && product.short_description.trim() !== ""
                          ? "success.50"
                          : "inherit",
                    }}
                  >
                    <TableCell align="center">
                      <Chip label={index + 1} size="small" />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g., Blue Floral Mul Mul Saree"
                        value={product.name}
                        onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                        error={!!errors[`name_${product.id}`]}
                        helperText={errors[`name_${product.id}`]}
                        disabled={!selectedFabric}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g., Elegant blue floral pattern perfect for summer"
                        value={product.short_description}
                        onChange={(e) =>
                          updateProduct(product.id, "short_description", e.target.value)
                        }
                        error={!!errors[`short_description_${product.id}`]}
                        helperText={errors[`short_description_${product.id}`]}
                        disabled={!selectedFabric}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant={product.images.length > 0 ? "contained" : "outlined"}
                        color={product.images.length > 0 ? "success" : "primary"}
                        startIcon={product.images.length > 0 ? <Collections /> : <Image />}
                        onClick={() => handleOpenImageManager(product.id)}
                        disabled={!selectedFabric}
                        sx={{ minWidth: '120px' }}
                      >
                        {product.images.length > 0
                          ? `${product.images.length} Image${product.images.length > 1 ? 's' : ''}`
                          : 'Add Images'}
                      </Button>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <IconButton
                          size="small"
                          onClick={() => duplicateProduct(product.id)}
                          title="Duplicate this row"
                          disabled={!selectedFabric}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => removeProduct(product.id)}
                          disabled={products.length <= 1 || !selectedFabric}
                          color="error"
                          title="Remove this row"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box mt={2} display="flex" justifyContent="center">
            <Button
              variant="text"
              startIcon={<Add />}
              onClick={addProduct}
              disabled={!selectedFabric}
            >
              Add Another Product
            </Button>
          </Box>
        </Paper>

        {/* Help Text */}
        <Alert severity="info">
          <Typography variant="body2" fontWeight={500} gutterBottom>
            Tips for bulk adding:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
            <li>Select the fabric once - it applies to all products</li>
            <li>Set shared fields (price, description) if all products share them</li>
            <li>Fill in unique names and short descriptions for each product</li>
            <li>Click "Add Images" to open the image manager - upload or select from existing</li>
            <li>Drag and drop to reorder images - first image will be the main display image</li>
            <li>Use the duplicate button to copy a row (including images) and modify it</li>
            <li>Rows with complete info turn green</li>
          </Typography>
        </Alert>
      </Stack>

      {/* Image Manager Dialog */}
      <BulkProductImageManager
        open={imagePickerOpen}
        onClose={() => {
          setImagePickerOpen(false);
          setCurrentProductForImages(null);
        }}
        onSave={handleSaveImages}
        initialImages={getCurrentProductImages()}
        excludeImages={getExcludedImages()}
      />
    </Create>
  );
};

