import { Edit } from "@refinedev/mui";
import { Box, TextField, Typography, Paper, Button, IconButton, Grid, Modal, Backdrop, Fade } from "@mui/material";
import { useForm, Controller, useWatch } from "@refinedev/react-hook-form";
import { supabaseClient } from "../../supabase";
import { v4 as uuidv4 } from "uuid";
import DeleteIcon from '@mui/icons-material/Delete';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { useState, useEffect } from "react";

export const FabricEdit = () => {
  const {
    saveButtonProps,
    refineCore: { onFinish, queryResult },
    register,
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm();
  
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const fabricData = queryResult?.data?.data;
  useEffect(() => {
    if (fabricData) {
      reset({ ...fabricData, featured_image_url: fabricData.featured_image_url || null });
    }
  }, [fabricData, reset]);

  const featuredImageUrl = useWatch({ control, name: "featured_image_url" });
  
  const handleOpenPreview = (url) => setPreviewImage(url);
  const handleClosePreview = () => setPreviewImage("");

  const handleSave = (values) => {
    const { id, created_at, ...payload } = values;
    onFinish(payload);
  };

  return (
    <>
      <Edit 
        saveButtonProps={{...saveButtonProps, variant: "contained", color: "primary", onClick: handleSubmit(handleSave)}}
        title={<Typography variant="h5">Edit Fabric</Typography>}
        breadcrumb={null}
      >
        <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 3 }} autoComplete="off">
          <Paper sx={{ p: 3 }}>
            <TextField
              {...register("name", { required: "This field is required" })}
              error={!!errors.name}
              helperText={errors.name?.message}
              margin="normal"
              fullWidth
              label="Name"
              name="name"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Featured Image</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Upload an image to represent this fabric.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              {featuredImageUrl && (
                <Box sx={(theme) => ({ 
                    position: 'relative', width: 100, height: 100,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '8px', overflow: 'hidden',
                })}>
                    <Box className="preview-overlay" onClick={() => handleOpenPreview(featuredImageUrl)} sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                      <ZoomInIcon />
                    </Box>
                    <img src={featuredImageUrl} alt="featured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <IconButton size="small" onClick={() => reset({ ...fabricData, featured_image_url: null })} sx={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
              )}
            </Box>
            <Button variant="outlined" color="secondary" component="label" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Image"}
              <Controller
                name="featured_image_url"
                control={control}
                render={({ field }) => (
                  <input 
                    type="file" 
                    hidden 
                    accept="image/*" 
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setIsUploading(true);
                      const fileName = `fabrics/${uuidv4()}-${file.name}`;
                      try {
                        await supabaseClient.storage.from("product-images").upload(fileName, file);
                        const { data: { publicUrl } } = supabaseClient.storage.from("product-images").getPublicUrl(fileName);
                        field.onChange(publicUrl);
                      } catch (error) {
                        console.error("Error uploading image:", error);
                        alert("Image upload failed.");
                      } finally {
                        setIsUploading(false);
                      }
                    }} 
                  />
                )}
              />
            </Button>
          </Paper>
        </Box>
      </Edit>
       <Modal
        open={!!previewImage}
        onClose={handleClosePreview}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500, sx: { backgroundColor: 'rgba(0, 0, 0, 0.2)' } } }}
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

