import { Create, useAutocomplete } from "@refinedev/mui";
import { 
    Box, TextField, Autocomplete, Button, Typography, Paper, IconButton, Grid, Modal, Backdrop, Fade, useTheme, 
    Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText, Stack
} from "@mui/material";
import { useForm } from "@refinedev/react-hook-form"; // <-- FIX: This is the correct hook
import { Controller, useFieldArray, useWatch } from "react-hook-form"; // <-- FIX: These come from the base library
import { supabaseClient, supabaseAdminClient } from "../../supabase";
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { v4 as uuidv4 } from "uuid";
import DeleteIcon from '@mui/icons-material/Delete';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useList } from "@refinedev/core";
import { ProductImagePicker } from "../../components/ProductImagePicker"; 

// --- Copy Product Modal ---
const CopyProductModal = ({ open, onClose, products, onSelectProduct }) => {
    const [query, setQuery] = useState("");
    const filtered = (products || []).filter((p) =>
        p.name?.toLowerCase().includes(query.toLowerCase())
    );
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Copy Content From...
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ maxHeight: '70vh' }}>
                <TextField
                    fullWidth
                    placeholder="Search products…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    sx={{ mb: 2 }}
                    size="small"
                />
                <List dense>
                    {filtered?.map((product) => (
                        <ListItemButton key={product.id} onClick={() => onSelectProduct(product.id)}>
                            <ListItemText primary={product.name} />
                        </ListItemButton>
                    ))}
                </List>
            </DialogContent>
        </Dialog>
    );
};

export const ProductCreate = () => {
  const theme = useTheme();
  const [tempFolderId] = useState(uuidv4()); 

  const {
    saveButtonProps, 
    refineCore: { onFinish }, // <-- FIX: Get onFinish from refineCore
    control,
    register,
    formState: { errors },
    setValue,
    handleSubmit,
    watch,
  } = useForm({ // <-- FIX: This is now the hook from @refinedev/react-hook-form
    refineCoreProps: {
      action: "create",
      resource: "products",
      onFinish: async (values) => {
        const { id, created_at, ...createPayload } = values;
        // Try to set a default sort_order to append at the end
        try {
          const { data, error } = await supabaseAdminClient
            .from("products")
            .select("sort_order")
            .order("sort_order", { ascending: false })
            .limit(1);
          if (!error && Array.isArray(data) && data.length > 0 && typeof data[0].sort_order === "number") {
            createPayload.sort_order = data[0].sort_order + 1;
          }
        } catch {
          // ignore if column doesn't exist
        }
        onFinish?.(createPayload);
      },
    },
    defaultValues: {
      name: "",
      short_description: "",
      description: "",
      care_instructions: "",
      shipping_returns: "",
      price: null,
      fabric_type: "",
      print_id: null,
      print_type: "",
      images: [],
    },
  });

  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyTargetField, setCopyTargetField] = useState(null); 
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  
  const { data: productsData } = useList({ 
    resource: "products",
    pagination: { mode: "off" },
    sorters: [{ field: "name", order: "asc" }],
    meta: { select: "id,name" }
  });
  const products = productsData?.data || [];

  const handleOpenPreview = (url) => setPreviewImage(url);
  const handleClosePreview = () => setPreviewImage("");

  const handleOpenCopyModal = (fieldName) => {
    setCopyTargetField(fieldName);
    setIsCopyModalOpen(true);
  };
  const handleCloseCopyModal = () => {
    setIsCopyModalOpen(false);
    setCopyTargetField(null);
  };

  const handleSelectProductToCopy = (selectedProductId) => {
    if (!copyTargetField) return;
    const productToCopy = products.find(p => p.id === selectedProductId);
    if (productToCopy) {
      setValue(copyTargetField, productToCopy[copyTargetField] || "");
    }
    handleCloseCopyModal();
  };

  const { fields, append, remove, move } = useFieldArray({ control, name: "images" });
  const images = useWatch({ control, name: "images" });
  const watchedFabricType = useWatch({ control, name: "fabric_type" });
  const { autocompleteProps } = useAutocomplete({ resource: "fabrics" });
  const { autocompleteProps: printAutocompleteProps } = useAutocomplete({ resource: "prints" });

  // Auto-update shipping returns when fabric changes
  useEffect(() => {
    const updateShippingReturns = async () => {
      if (!watchedFabricType) return;
      
      try {
        const { data: fabricData, error } = await supabaseAdminClient
          .from("fabrics")
          .select("shipping_returns")
          .eq("name", watchedFabricType)
          .single();

        if (error || !fabricData) return;

        if (fabricData.shipping_returns) {
          setValue("shipping_returns", fabricData.shipping_returns, { shouldDirty: true });
        }
      } catch (error) {
        console.error("Error auto-updating shipping returns:", error);
      }
    };

    updateShippingReturns();
  }, [watchedFabricType, setValue]);

  const isBlank = (v) => !v || String(v).trim() === "";

  const applyFabricDefaultsIfBlank = async (fabricOption) => {
    if (!fabricOption) return;
    try {
      // Prefer fetching by id if available
      const selector = fabricOption?.id != null ? { key: "id", value: fabricOption.id } : { key: "name", value: fabricOption?.name };
      if (!selector.value) return;

      let query = supabaseAdminClient
        .from("fabrics")
        .select("description, care_instructions, shipping_returns, default_price")
        .limit(1);
      query = selector.key === "id" ? query.eq("id", selector.value) : query.eq("name", selector.value);

      const { data, error } = await query.single();
      if (error || !data) return;

      const currentDescription = watch("description");
      const currentCare = watch("care_instructions");
      const currentShipping = watch("shipping_returns");
      const currentPrice = watch("price");

      if (isBlank(currentDescription) && data.description) {
        setValue("description", data.description, { shouldDirty: true });
      }
      if (isBlank(currentCare) && data.care_instructions) {
        setValue("care_instructions", data.care_instructions, { shouldDirty: true });
      }
      
      if (isBlank(currentShipping) && data.shipping_returns) {
        setValue("shipping_returns", data.shipping_returns, { shouldDirty: true });
      }
      
      if ((currentPrice == null || currentPrice === '') && typeof data.default_price === "number") {
        setValue("price", data.default_price, { shouldDirty: true });
      }
    } catch {/* noop */}
  };

  const applyFabricDefaultsForce = async () => {
    try {
      const options = autocompleteProps.options || [];
      const currentName = watch("fabric_type");
      const selected = options.find(o => o.name === currentName);
      if (!selected) return;

      const selector = selected?.id != null ? { key: "id", value: selected.id } : { key: "name", value: selected?.name };
      if (!selector.value) return;

      let query = supabaseAdminClient
        .from("fabrics")
        .select("description, care_instructions, shipping_returns, default_price")
        .limit(1);
      query = selector.key === "id" ? query.eq("id", selector.value) : query.eq("name", selector.value);

      const { data, error } = await query.single();
      if (error || !data) return;

      if (data.description != null) {
        setValue("description", data.description, { shouldDirty: true });
      }
      if (data.care_instructions != null) {
        setValue("care_instructions", data.care_instructions, { shouldDirty: true });
      }
      
      if (data.shipping_returns != null) {
        setValue("shipping_returns", data.shipping_returns, { shouldDirty: true });
      }
      
      if (typeof data.default_price === "number") {
        setValue("price", data.default_price, { shouldDirty: true });
      }
    } catch {/* noop */}
  };
  
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    const fileName = `${tempFolderId}/${uuidv4()}-${file.name}`; 
    
    try {
      await supabaseClient.storage.from("product-images").upload(fileName, file);
      const { data: { publicUrl } } = supabaseClient.storage.from("product-images").getPublicUrl(fileName);
      append(publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleSelectImagesFromPicker = (urls) => {
    if (!urls || urls.length === 0) return;
    
    const currentImages = images || [];
    const newUrls = urls.filter(url => !currentImages.includes(url));
    
    if (newUrls.length > 0) {
        newUrls.forEach((u) => append(u));
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };

  const TextFieldWithCopy = ({ fieldName, label, required = false, rows = 1 }) => (
    <Box sx={{ position: 'relative' }}>
      <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>{label}</Typography>
      <TextField 
        {...register(fieldName, { required: required ? "This field is required" : false })} 
        error={!!errors[fieldName]} 
        helperText={errors[fieldName]?.message} 
        margin="none" 
        fullWidth 
        multiline={rows > 1}
        rows={rows}
        name={fieldName} 
        variant="outlined" 
      />
      <IconButton 
          size="small" 
          onClick={() => handleOpenCopyModal(fieldName)}
          sx={{ 
            position: 'absolute', 
            top: 28,
            right: 8, 
            color: 'text.secondary' 
          }}
          title={`Copy ${label} from another product`}
        >
          <ContentCopyIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  return (
    <>
      <Create 
          title={<Typography variant="h5">Create New Product</Typography>}
          breadcrumb={null}
          saveButtonProps={saveButtonProps} // <-- FIX: Pass saveButtonProps to Create
          footerButtons={({ saveButtonProps }) => {
            return (
              <Button
                  {...saveButtonProps} 
                  variant="outlined"
                  color="secondary"
                  startIcon={<SaveIcon />}
              >
                  Save Product
              </Button>
            );
          }}
      >
        {/* FIX: Removed onSubmit prop. The saveButtonProps onClick will trigger handleSubmit. */}
        <Box component="form" id="product-create-form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                  <Grid item xs={12}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>Name</Typography>
                      <TextField {...register("name", { required: "This field is required" })} error={!!errors.name} helperText={errors.name?.message} margin="none" fullWidth name="name" variant="outlined" autoFocus />
                  </Grid>

                  <Grid item xs={12}>
                     <TextFieldWithCopy fieldName="short_description" label="Short Description (under title)" rows={2} />
                  </Grid>
                  <Grid item xs={12}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">Details & Craftsmanship</Typography>
                        <Button 
                          type="button"
                          size="small" 
                          startIcon={<AutoFixHighIcon />} 
                          variant="outlined" 
                          onClick={applyFabricDefaultsForce}
                          disabled={!watch("fabric_type")}
                          title="Apply defaults from selected fabric to product details"
                        >
                          Apply Fabric Defaults
                        </Button>
                      </Stack>
                      <TextFieldWithCopy fieldName="description" label="" rows={4} />
                  </Grid>
                  <Grid item xs={12}>
                      <TextFieldWithCopy fieldName="care_instructions" label="Care Instructions" rows={4} />
                  </Grid>
                  <Grid item xs={12}>
                     <TextFieldWithCopy fieldName="shipping_returns" label="Shipping & Returns" rows={4} />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>Price (in ₹)</Typography>
                      <TextField {...register("price", { required: "This field is required", valueAsNumber: true })} error={!!errors.price} helperText={errors.price?.message} margin="none" fullWidth type="number" name="price" variant="outlined" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>Fabric</Typography>
                      <Controller
                          control={control} name="fabric_type" rules={{ required: "This field is required" }}
                          render={({ field }) => {
                              const options = autocompleteProps.options || [];
                              const selectedOption = options.find(option => option.name === field.value) || null;
                              
                              return (
                                <Autocomplete
                                    {...autocompleteProps}
                                    options={options} 
                                    value={selectedOption} 
                                    getOptionLabel={(option) => option.name || ""}
                                    isOptionEqualToValue={(option, value) => option.name === value?.name} 
                                    onChange={async (_, newValue) => {
                                        field.onChange(newValue?.name || "");
                                        await applyFabricDefaultsIfBlank(newValue || null);
                                    }} 
                                    renderInput={(params) => ( 
                                        <TextField 
                                            {...params} 
                                            margin="none" 
                                            variant="outlined" 
                                            error={!!errors.fabric_type} 
                                            helperText={errors.fabric_type?.message} 
                                        /> 
                                    )}
                                />
                              );
                          }}
                      />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>Print Type</Typography>
                      <Controller
                          control={control} name="print_id" rules={{ required: "This field is required" }}
                          render={({ field }) => {
                              const options = printAutocompleteProps.options || [];
                              const selectedOption = options.find(option => option.id === field.value) || null;
                              
                              return (
                                <Autocomplete
                                    {...printAutocompleteProps}
                                    options={options} 
                                    value={selectedOption} 
                                    getOptionLabel={(option) => option.name || ""}
                                    isOptionEqualToValue={(option, value) => option.id === value?.id} 
                                    onChange={(_, newValue) => {
                                        // Update both print_id (primary) and print_type (legacy, synced)
                                        field.onChange(newValue?.id || null);
                                        setValue("print_type", newValue?.name || "", { shouldDirty: true });
                                    }} 
                                    renderInput={(params) => ( 
                                        <TextField 
                                            {...params} 
                                            margin="none" 
                                            variant="outlined" 
                                            error={!!errors.print_id} 
                                            helperText={errors.print_id?.message} 
                                            placeholder="Select a print type"
                                        /> 
                                    )}
                                />
                              );
                          }}
                      />
                  </Grid>
              </Grid>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Images</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>Drag and drop images to reorder. The first image is the main image.</Typography>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="images" direction="horizontal">
                  {(provided) => (
                    <Box {...provided.droppableProps} ref={provided.innerRef} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                      {fields.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided) => (
                            <Box
                              ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              sx={{
                                position: 'relative', width: 100, height: 100,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: '8px', overflow: 'hidden', cursor: 'grab',
                              }}
                            >
                              <Box 
                                className="preview-overlay" 
                                onClick={() => handleOpenPreview(images?.[index])} 
                                sx={{ 
                                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                                  backgroundColor: 'rgba(0,0,0,0.3)', 
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                  color: 'white', opacity: 1, transition: 'background-color 0.2s', 
                                  cursor: 'pointer',
                                  '&:hover': {
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                  }
                                }}
                              >
                                <ZoomInIcon />
                              </Box>
                              {index === 0 && ( <Typography sx={{ position: 'absolute', top: 0, left: 0, background: theme.palette.primary.main, color: theme.palette.primary.contrastText, padding: '2px 6px', fontSize: '0.7rem', borderBottomRightRadius: '4px', zIndex: 1 }}>Main</Typography> )}
                              <img src={images?.[index]} alt={`product-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <IconButton size="small" onClick={() => remove(index)} sx={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 1, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)'} }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </DragDropContext>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" color="secondary" component="label" disabled={isUploading}>
                  {isUploading ? "Uploading..." : "Upload Image"}
                  <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                </Button>
                <Button 
                    variant="outlined" 
                    color="primary" 
                    startIcon={<ImageSearchIcon />}
                    onClick={() => setIsImagePickerOpen(true)}
                >
                    Select from existing
                </Button>
              </Stack>
          </Paper>
        </Box>
      </Create>

      {/* Image Preview Modal */}
      <Modal
        open={!!previewImage}
        onClose={handleClosePreview}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: { backgroundColor: 'rgba(0, 0, 0, 0.2)' }
          },
        }}
      >
        <Fade in={!!previewImage}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <img src={previewImage} alt="Preview" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: '8px' }} />
          </Box>
        </Fade>
      </Modal>

      {/* Copy Product Details Modal */}
      <CopyProductModal 
        open={isCopyModalOpen} 
        onClose={handleCloseCopyModal} 
        products={products} 
        onSelectProduct={handleSelectProductToCopy} 
      />

      <ProductImagePicker
        open={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelectImages={handleSelectImagesFromPicker} // Prop renamed to plural
      />
    </>
  );
};