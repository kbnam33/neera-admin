import { Create } from "@refinedev/mui";
import { Box, TextField, Button, Typography, Paper, IconButton, Grid, Modal, Backdrop, Fade } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form"; // <-- IMPORT CHANGED
import { useWatch } from "react-hook-form"; // <-- Kept for useWatch
import { supabaseClient } from "../../supabase";
import { v4 as uuidv4 } from "uuid";
import DeleteIcon from '@mui/icons-material/Delete';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import SaveIcon from '@mui/icons-material/Save';
import { useState } from "react";

export const FabricCreate = () => {
  const {
    saveButtonProps,
    refineCore: { onFinish }, // Get onFinish from refineCore
    control,
    register,
    formState: { errors },
    setValue,
    handleSubmit, // Get handleSubmit
  } = useForm({
    // Use Refine's useForm hook
    refineCoreProps: {
      action: "create",
      resource: "fabrics",
    },
    defaultValues: {
      name: "",
      image_url: "", // Field name matches DB
    },
  });

  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const handleOpenPreview = (url) => setPreviewImage(url);
  const handleClosePreview = () => setPreviewImage("");

  // Watch the single image_url field
  const watchedImageUrl = useWatch({ control, name: "image_url" });

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const fileName = `${uuidv4()}-${file.name}`;

    try {
      await supabaseClient.storage.from("fabric-images").upload(fileName, file);
      const { data: { publicUrl } } = supabaseClient.storage.from("fabric-images").getPublicUrl(fileName);
      setValue("image_url", publicUrl, { shouldDirty: true }); // Set the single image_url value
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  // FIX: Handle save manually to strip 'created_at' or 'id'
  const handleSave = (values) => {
    const { id, created_at, ...createPayload } = values;
    onFinish?.(createPayload);
  };

  return (
    <>
      <Create
          title={<Typography variant="h5">Create New Fabric</Typography>}
          breadcrumb={null}
          // FIX: Use footerButtons to override default save button
          footerButtons={() => {
            // Destructure onClick *out* of saveButtonProps to prevent default action
            const { onClick, ...restSaveButtonProps } = saveButtonProps;

            return (
              <Button
                  {...restSaveButtonProps} // Spread props like 'disabled'
                  type="submit"
                  form="fabric-create-form" // Link to form ID
                  variant="outlined"
                  color="secondary"
                  startIcon={<SaveIcon />}
              >
                  Save Fabric
              </Button>
            );
          }}
      >
        {/* FIX: Use a form tag with onSubmit and ID */}
        <Box component="form" id="fabric-create-form" onSubmit={handleSubmit(handleSave)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                  <Grid item xs={12}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>Name</Typography>
                      <TextField {...register("name", { required: "This field is required" })} error={!!errors.name} helperText={errors.name?.message} margin="none" fullWidth name="name" variant="outlined" autoFocus />
                  </Grid>
              </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Image</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  {watchedImageUrl && (
                      <Box sx={(theme) => ({
                          position: 'relative', width: 100, height: 100,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '8px', overflow: 'hidden',
                          '&:hover .preview-overlay': { opacity: 1 }
                      })}>
                          <Box className="preview-overlay" onClick={() => handleOpenPreview(watchedImageUrl)} sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer' }}>
                            <ZoomInIcon />
                          </Box>
                          <img src={watchedImageUrl} alt="fabric" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <IconButton size="small" onClick={() => setValue("image_url", "", { shouldDirty: true })} sx={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                              <DeleteIcon fontSize="small" />
                          </IconButton>
                      </Box>
                  )}
              </Box>
              <Button variant="outlined" color="secondary" component="label" disabled={isUploading}>
                {isUploading ? "Uploading..." : (watchedImageUrl ? "Replace Image" : "Upload Image")}
                <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
              </Button>
          </Paper>
        </Box>
      </Create>
      <Modal
        open={!!previewImage}
        onClose={handleClosePreview}
        closeAfterTransition
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
        <Fade in={!!previewImage}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <img src={previewImage} alt="Preview" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: '8px' }} />
          </Box>
        </Fade>
      </Modal>
    </>
  );
};