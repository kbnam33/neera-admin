import { Create, useAutocomplete } from "@refinedev/mui";
import { Box, TextField, Autocomplete, Button, Typography, Paper, IconButton, Grid, Modal, Backdrop, Fade } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";
import { Controller, useFieldArray, useWatch } from "react-hook-form";
import { supabaseClient } from "../../supabaseClient";
import { v4 as uuidv4 } from "uuid";
import DeleteIcon from '@mui/icons-material/Delete';
import { ZoomIn } from "phosphor-react";
import { useState } from "react";

export const ProductCreate = () => {
  const {
    saveButtonProps,
    control,
    register,
    formState: { errors },
  } = useForm();

  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const handleOpenPreview = (url) => setPreviewImage(url);
  const handleClosePreview = () => setPreviewImage("");

  const { fields, append, remove } = useFieldArray({ control, name: "images" });
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

  return (
    <>
      <Create 
          title={<Typography variant="h5">Create New Product</Typography>}
          saveButtonProps={saveButtonProps}
      >
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                  <Grid item xs={12}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>Name</Typography>
                      <TextField {...register("name", { required: "This field is required" })} error={!!errors.name} helperText={errors.name?.message} margin="none" fullWidth name="name" variant="outlined" autoFocus />
                  </Grid>
                  <Grid item xs={12}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>Description</Typography>
                      <TextField {...register("description")} margin="none" fullWidth multiline rows={4} name="description" variant="outlined" />
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
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>The first image in the list will be the main product image.</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  {(images || []).map((imageUrl, index) => (
                      <Box key={index} sx={(theme) => ({ 
                          position: 'relative', width: 100, height: 100,
                          border: index === 0 ? `3px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.grey[200]}`,
                          borderRadius: '8px', overflow: 'hidden',
                          '&:hover .preview-overlay': { opacity: 1 }
                      })}>
                          <Box className="preview-overlay" onClick={() => handleOpenPreview(imageUrl)} sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer' }}>
                            <ZoomIn size={24} />
                          </Box>
                          {index === 0 && ( <Typography sx={{ position: 'absolute', top: 0, left: 0, background: 'primary.main', color: 'white', padding: '2px 6px', fontSize: '0.7rem', borderBottomRightRadius: '4px' }}>Main</Typography> )}
                          <img src={imageUrl} alt={`product-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <IconButton size="small" onClick={() => remove(index)} sx={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                              <DeleteIcon fontSize="small" />
                          </IconButton>
                      </Box>
                  ))}
              </Box>
              <Button variant="contained" component="label" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload Image"}
                <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
              </Button>
          </Paper>
        </Box>
      </Create>
      <Modal
        open={!!previewImage}
        onClose={handleClosePreview}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={!!previewImage}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <img src={previewImage} alt="Preview" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: '8px' }} />
          </Box>
        </Fade>
      </Modal>
    </>
  );
};