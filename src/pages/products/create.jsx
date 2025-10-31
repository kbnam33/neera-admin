import { Create, useAutocomplete } from "@refinedev/mui";
import { 
    Box, TextField, Autocomplete, Button, Typography, Paper, IconButton, Grid, Modal, Backdrop, Fade, useTheme, 
    Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText 
} from "@mui/material";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { supabaseClient } from "../../supabase";
import { v4 as uuidv4 } from "uuid";
import DeleteIcon from '@mui/icons-material/Delete';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Import copy icon
import CloseIcon from '@mui/icons-material/Close';
import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useList } from "@refinedev/core";

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

export const ProductCreate = () => {
  const theme = useTheme();
  const {
    saveButtonProps,
    control,
    register,
    formState: { errors },
    setValue, // Import setValue from useForm
  } = useForm({
    defaultValues: {
      name: "",
      short_description: "",
      description: "",
      care_instructions: "",
      shipping_returns: "",
      price: null,
      fabric_type: "",
      images: [],
    },
  });

  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyTargetField, setCopyTargetField] = useState(null); // 'short_description', 'description', etc.
  
  const { data: productsData } = useList({ resource: "products" });
  const products = productsData?.data || [];

  const handleOpenPreview = (url) => setPreviewImage(url);
  const handleClosePreview = () => setPreviewImage("");

  // Function to open the modal and set which field we're copying to
  const handleOpenCopyModal = (fieldName) => {
    setCopyTargetField(fieldName);
    setIsCopyModalOpen(true);
  };
  const handleCloseCopyModal = () => {
    setIsCopyModalOpen(false);
    setCopyTargetField(null);
  };

  // Function to handle copying details from the selected product
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
  const { autocompleteProps } = useAutocomplete({ resource: "fabrics" });
  
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const fileName = `${uuidv4()}-${file.name}`;
    
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

  // Helper component for TextFields with Copy Button
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
            top: 28, // Adjust based on Typography height + spacing
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
          saveButtonProps={{ ...saveButtonProps, children: "Save Product", variant: "outlined", color: "secondary" }}
          title={<Typography variant="h5">Create New Product</Typography>}
          breadcrumb={null}
      >
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                      <TextFieldWithCopy fieldName="description" label="Details & Craftsmanship" rows={4} />
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
                          render={({ field }) => (
                              <Autocomplete
                                  {...autocompleteProps}
                                  getOptionLabel={(option) => option.name || ""}
                                  isOptionEqualToValue={(option, value) => option.name === value}
                                  onChange={(_, value) => field.onChange(value?.name || "")}
                                  renderInput={(params) => ( <TextField {...params} margin="none" variant="outlined" error={!!errors.fabric_type} helperText={errors.fabric_type?.message} /> )}
                              />
                          )}
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
              <Button variant="outlined" color="secondary" component="label" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload Image"}
                <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
              </Button>
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
    </>
  );
};