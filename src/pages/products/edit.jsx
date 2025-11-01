import { Edit, useAutocomplete, ListButton, RefreshButton, DeleteButton } from "@refinedev/mui";
import { 
    Box, TextField, Autocomplete, Button, Typography, Paper, IconButton, Grid, Modal, Backdrop, Fade, Stack,
    Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText 
} from "@mui/material";
import { useForm } from "@refinedev/react-hook-form"; // Refine's hook for integration
import { Controller, useFieldArray, useWatch } from "react-hook-form"; // Import Controller etc. from base library
import { supabaseClient } from "../../supabase";
import { v4 as uuidv4 } from "uuid";
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save'; 
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useList, useResource } from "@refinedev/core"; 

// --- Copy Product Modal ---
const CopyProductModal = ({ open, onClose, products, onSelectProduct }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Copy Content From...
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <List dense>
                    {products?.map((product) => (
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
    refineCore: { queryResult, onFinish }, 
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
       },
  });

  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyTargetField, setCopyTargetField] = useState(null); 

  const { data: productsData } = useList({ resource: "products" });
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
      // Use setValue to update the form state and mark it as dirty
      setValue(copyTargetField, productToCopy[copyTargetField] || "", { shouldDirty: true }); 
    }
    handleCloseCopyModal();
  };

  const productData = queryResult?.data?.data; 
  const isFormLoading = queryResult?.isLoading; 

  useEffect(() => {
    if (productData && !isDirty) { 
        // Ensure all fields, especially new ones, are in the defaultValues
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

  const { fields, append, remove, move } = useFieldArray({ control, name: "images" });
  const watchedImages = useWatch({ control, name: "images" }); 
  const { autocompleteProps } = useAutocomplete({ resource: "fabrics" });

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

  const onDragEnd = (result) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };

  // *** THIS IS THE FIX ***
  // This function takes all form data, removes 'id' and 'created_at',
  // and then sends only the clean data to be saved.
  const handleSave = (values) => {
    const { id, created_at, ...updatePayload } = values; 
    onFinish?.(updatePayload); // Pass the cleaned payload
  };
  // *** END OF FIX ***
  
  return (
    <>
      <Edit 
          title={<Typography variant="h5">Edit Product</Typography>}
          breadcrumb={null}
          headerButtons={
            <Box>
              <ListButton size="small" sx={{ mr: 1 }} />
              <RefreshButton size="small" />
            </Box>
          }
          isLoading={isFormLoading} 
          // *** THIS IS THE FIX ***
          // The footerButtons now correctly wire the "Save Changes" button
          // to use the 'handleSubmit(handleSave)' function defined above.
          footerButtons={({ deleteButtonProps }) => ( 
            <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ p: 2 }}>
                <DeleteButton {...deleteButtonProps} variant="outlined" color="error" />
                <Button 
                    {...saveButtonProps} // Use saveButtonProps from useForm
                    type="submit" 
                    form="product-edit-form" // This ID must match the form's ID
                    variant="outlined"         
                    color="secondary"          
                    startIcon={<SaveIcon />}     
                >
                    Save Changes 
                </Button> 
            </Stack>
          )}
      >
        {isFormLoading ? (
            <Typography>Loading product data...</Typography> 
        ) : (
            // *** THIS IS THE FIX ***
            // The <Box> is now a <form> with the matching ID and onSubmit handler
            <Box component="form" id="product-edit-form" onSubmit={handleSubmit(handleSave)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {/* --- Name --- */}
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

                   {/* --- Description Fields --- */}
                   <Grid item xs={12}>
                     <TextFieldWithCopy control={control} errors={errors} fieldName="short_description" label="Short Description (under title)" rows={2} handleOpenCopyModal={handleOpenCopyModal} />
                  </Grid>
                  <Grid item xs={12}>
                      <TextFieldWithCopy control={control} errors={errors} fieldName="description" label="Details & Craftsmanship" rows={4} handleOpenCopyModal={handleOpenCopyModal} />
                  </Grid>
                  <Grid item xs={12}>
                      <TextFieldWithCopy control={control} errors={errors} fieldName="care_instructions" label="Care Instructions" rows={4} handleOpenCopyModal={handleOpenCopyModal} />
                  </Grid>
                  <Grid item xs={12}>
                     <TextFieldWithCopy control={control} errors={errors} fieldName="shipping_returns" label="Shipping & Returns" rows={4} handleOpenCopyModal={handleOpenCopyModal} />
                  </Grid>
                 
                  {/* --- Price --- */}
                  <Grid item xs={12} sm={6}>
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
                  </Grid>
                   {/* --- Fabric --- */}
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
                                      onChange={(_, newValue) => field.onChange(newValue?.name || "")} 
                                      renderInput={(params) => ( <TextField {...params} margin="none" variant="outlined" error={!!errors.fabric_type} helperText={errors.fabric_type?.message} InputLabelProps={{ shrink: true }} /> )}
                                  />
                              );
                          }}
                      />
                  </Grid>
              </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
                 {/* ... Image upload and drag/drop section ... */}
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
                <Button variant="outlined" color="secondary" component="label" disabled={isUploading}>
                    {isUploading ? "Uploading..." : "Upload Image"}
                    <input type="file" hidden accept="image/*" onChange={handleImageUpload}/>
                </Button>
            </Paper>
            </Box>
        )}
      </Edit>

      {/* Image Preview Modal */}
      <Modal /* ... */ 
        open={Boolean(previewImage)} 
        onClose={handleClosePreview}
        // ... rest of modal props
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
    </>
  );
};