import { Edit, useAutocomplete, ListButton, RefreshButton, DeleteButton } from "@refinedev/mui";
import { 
    Box, TextField, Autocomplete, Button, Typography, Paper, IconButton, Grid, Modal, Backdrop, Fade, Stack,
    Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText 
} from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";
import { Controller, useFieldArray, useWatch } from "react-hook-form";
import { supabaseClient, supabaseAdminClient } from "../../supabase";
import { v4 as uuidv4 } from "uuid";
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save'; 
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useList, useResource } from "@refinedev/core"; 
import { ProductImagePicker } from "../../components/ProductImagePicker"; // <-- IMPORT NEW COMPONENT

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

// Helper component for TextFields with Copy Button
const TextFieldWithCopy = ({ control, errors, fieldName, label, required = false, rows = 1, handleOpenCopyModal }) => (
     <Box sx={{ position: 'relative' }}>
        <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>{label}</Typography>
        <Controller
            name={fieldName}
            control={control}
            rules={{ required: required ? "This field is required" : false }}
            render={({ field }) => (
                <TextField 
                    {...field}
                    error={!!errors[fieldName]} 
                    helperText={errors[fieldName]?.message} 
                    margin="none" 
                    fullWidth 
                    multiline={rows > 1}
                    rows={rows}
                    variant="outlined" 
                    InputLabelProps={{ shrink: true }} 
                    value={field.value || ''} 
                />
            )}
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


export const ProductEdit = () => {
  const { id: productId } = useParams();
  const { resource } = useResource(); 

  const {
    saveButtonProps, 
    queryResult, 
    refineCore: { onFinish }, // <-- FIX: Use refineCore.onFinish here
    control,
    formState: { errors, isDirty }, 
    reset, 
    handleSubmit,
    setValue,
    watch, 
  } = useForm({ 
       refineCoreProps: {
            action: "edit", 
            id: productId,
            resource: resource?.name, 
            onFinish: (values) => {
              const { id, created_at, ...updatePayload } = values; 
              onFinish?.(updatePayload);
            },
       },
  });

  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyTargetField, setCopyTargetField] = useState(null); 
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false); // <-- Added state for new modal

  const { data: productsData } = useList({ 
    resource: "products",
    pagination: { mode: "off" },
    sorters: [{ field: "name", order: "asc" }],
    meta: { select: "id,name" }
  });
  const products = productsData?.data || [];
  
  const handleOpenPreview = (url) => setPreviewImage(url || ""); 
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
    const currentProductId = parseInt(productId, 10); 
    const productToCopy = products.find(p => p.id === selectedProductId);
    if (productToCopy && productToCopy.id !== currentProductId) {
      setValue(copyTargetField, productToCopy[copyTargetField] || "", { shouldDirty: true }); 
    }
    handleCloseCopyModal();
  };

  const productData = queryResult?.data?.data; 
  const isFormLoading = queryResult?.isLoading; 

  useEffect(() => {
    if (productData && !isDirty) { 
        const defaultValues = { 
            ...productData, 
            name: productData.name || "",
            short_description: productData.short_description || "",
            description: productData.description || "",
            care_instructions: productData.care_instructions || "",
            shipping_returns: productData.shipping_returns || "",
            price: productData.price ?? null, 
            fabric_type: productData.fabric_type || "",
            images: productData.images || [] 
        };
        reset(defaultValues); 
    }
  }, [productData, reset, isDirty]); 

  // Field array for images
  const { fields, append, remove, move, replace } = useFieldArray({ control, name: "images" });
  const watchedImages = useWatch({ control, name: "images" });
  const watchedFabricType = useWatch({ control, name: "fabric_type" }); 

  // Keep field array in sync with loaded product images
  useEffect(() => {
    if (Array.isArray(productData?.images)) {
      replace(productData.images);
    }
  }, [productData?.images, replace]);

  // Auto-update shipping returns when fabric changes
  useEffect(() => {
    const updateShippingReturns = async () => {
      if (!watchedFabricType || !productData) return; // Don't run on initial load
      
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
  }, [watchedFabricType, productData, setValue]);
 
  const { autocompleteProps } = useAutocomplete({ resource: "fabrics" });

  const isBlank = (v) => !v || String(v).trim() === "";

  const applyFabricDefaultsIfBlank = async (fabricOption) => {
    if (!fabricOption) return;
    try {
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
    if (!file || !productId) return;
    setIsUploading(true);

    const fileName = `${productId}/${uuidv4()}-${file.name}`; 
    
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
    
    const currentImages = watchedImages || []; 
    const newUrls = urls.filter(url => !currentImages.includes(url)); 
    
    if (newUrls.length > 0) {
        newUrls.forEach((u) => append(u));
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };
  
  return (
    <>
      <Edit 
          title={<Typography variant="h5">Edit Product</Typography>}
          breadcrumb={null}
          saveButtonProps={saveButtonProps} // <-- FIX: Pass saveButtonProps to Edit
          headerButtons={
            <Box>
              <ListButton size="small" sx={{ mr: 1 }} />
              <RefreshButton size="small" />
            </Box>
          }
          isLoading={isFormLoading} 
          footerButtons={({ deleteButtonProps, saveButtonProps }) => { 
            return (
                <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ p: 2 }}>
                    <DeleteButton {...deleteButtonProps} variant="outlined" color="error" />
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
            <Typography>Loading product data...</Typography> 
        ) : (
            <Box component="form" id="product-edit-form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>Name</Typography>
                       <Controller
                            name="name"
                            control={control}
                            rules={{ required: "This field is required" }}
                            render={({ field }) => (
                                <TextField 
                                    {...field}
                                    value={field.value || ''} 
                                    error={!!errors.name} 
                                    helperText={errors.name?.message} 
                                    margin="none" 
                                    fullWidth 
                                    variant="outlined" 
                                    InputLabelProps={{ shrink: true }} 
                                />
                            )}
                        />
                  </Grid>

                   <Grid item xs={12}>
                     <TextFieldWithCopy control={control} errors={errors} fieldName="short_description" label="Short Description (under title)" rows={2} handleOpenCopyModal={handleOpenCopyModal} />
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
                      <TextFieldWithCopy control={control} errors={errors} fieldName="description" label="" rows={4} handleOpenCopyModal={handleOpenCopyModal} />
                  </Grid>
                  <Grid item xs={12}>
                      <TextFieldWithCopy control={control} errors={errors} fieldName="care_instructions" label="Care Instructions" rows={4} handleOpenCopyModal={handleOpenCopyModal} />
                  </Grid>
                  <Grid item xs={12}>
                     <TextFieldWithCopy control={control} errors={errors} fieldName="shipping_returns" label="Shipping & Returns" rows={4} handleOpenCopyModal={handleOpenCopyModal} />
                  </Grid>
                 
                  {/* FIX: Added copy icon wrapper to Price field */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ position: 'relative' }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>Price (in ₹)</Typography>
                      <Controller
                            name="price"
                            control={control}
                            rules={{ required: "This field is required", valueAsNumber: true }}
                            render={({ field }) => (
                                <TextField 
                                    {...field}
                                    value={field.value ?? ''} 
                                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} 
                                    error={!!errors.price} 
                                    helperText={errors.price?.message} 
                                    margin="none" 
                                    fullWidth 
                                    type="number"
                                    variant="outlined" 
                                    InputLabelProps={{ shrink: true }} 
                                />
                            )}
                        />
                      <IconButton 
                          size="small" 
                          onClick={() => handleOpenCopyModal("price")}
                          sx={{ 
                            position: 'absolute', 
                            top: 28,
                            right: 8, 
                            color: 'text.secondary' 
                          }}
                          title={`Copy Price from another product`}
                        >
                          <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
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
                                      renderInput={(params) => ( <TextField {...params} margin="none" variant="outlined" error={!!errors.fabric_type} helperText={errors.fabric_type?.message} InputLabelProps={{ shrink: true }} /> )}
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
                        {fields && fields.map((field, index) => (
                            <Draggable key={field.id} draggableId={field.id} index={index}>
                            {(provided) => (
                                <Box
                                ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                sx={(theme) => ({
                                    position: 'relative', width: 100, height: 100,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: '8px', overflow: 'hidden', cursor: 'grab',
                                })}
                                >
                                <Box 
                                    className="preview-overlay" 
                                    onClick={() => handleOpenPreview(watchedImages?.[index])} 
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
                                {index === 0 && ( <Typography sx={(theme) => ({ position: 'absolute', top: 0, left: 0, background: theme.palette.primary.main, color: theme.palette.primary.contrastText, padding: '2px 6px', fontSize: '0.7rem', borderBottomRightRadius: '4px', zIndex: 1 })}>Main</Typography> )}
                                <img src={watchedImages?.[index]} alt={`product-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                      <input type="file" hidden accept="image/*" onChange={handleImageUpload}/>
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
        )}
      </Edit>

      {/* Image Preview Modal */}
      <Modal 
        open={Boolean(previewImage)} 
        onClose={handleClosePreview}
         slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            }
          },
        }}
      >
        <Fade in={Boolean(previewImage)}> 
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            {previewImage && <img src={previewImage} alt="Preview" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: '8px' }} />}
          </Box>
        </Fade>
      </Modal>

      {/* Copy Product Details Modal */}
      <CopyProductModal 
        open={isCopyModalOpen} 
        onClose={handleCloseCopyModal} 
        products={products.filter(p => p.id !== parseInt(productId))} 
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