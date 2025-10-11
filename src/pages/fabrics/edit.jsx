import { Edit, ListButton, RefreshButton } from "@refinedev/mui";
import { Box, TextField, Button, Typography, Paper, IconButton, Grid, Modal, Backdrop, Fade } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";
import { supabaseClient } from "../../supabase";
import { v4 as uuidv4 } from "uuid";
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export const FabricEdit = () => {
  const { id: fabricId } = useParams();

  const {
    saveButtonProps,
    refineCore: { queryResult },
    control,
    register,
    formState: { errors },
    reset,
  } = useForm();

  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const handleOpenPreview = (url) => setPreviewImage(url);
  const handleClosePreview = () => setPreviewImage("");

  const fabricData = queryResult?.data?.data;
  useEffect(() => {
    if (fabricData) {
      reset({ ...fabricData, images: fabricData.images || [] });
    }
  }, [fabricData, reset]);

  const { fields, append, remove, move } = useFieldArray({ control, name: "images" });
  const images = useWatch({ control, name: "images" });

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !fabricId) return;
    setIsUploading(true);
    const fileName = `${fabricId}/${uuidv4()}-${file.name}`;
    try {
      await supabaseClient.storage.from("fabric-images").upload(fileName, file);
      const { data: { publicUrl } } = supabaseClient.storage.from("fabric-images").getPublicUrl(fileName);
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

  return (
    <>
      <Edit
          saveButtonProps={{ ...saveButtonProps, children: "Save Changes", variant: "outlined", color: "secondary", startIcon: <SaveIcon /> }}
          title={<Typography variant="h5">Edit Fabric</Typography>}
          breadcrumb={null}
          headerButtons={
            <Box>
              <ListButton size="small" sx={{ mr: 1 }} />
              <RefreshButton size="small" />
            </Box>
          }
      >
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                  <Grid item xs={12}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>Name</Typography>
                      <TextField {...register("name", { required: "This field is required" })} error={!!errors.name} helperText={errors.name?.message} margin="none" fullWidth name="name" variant="outlined" InputLabelProps={{ shrink: true }} />
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
                              sx={(theme) => ({
                                position: 'relative', width: 100, height: 100,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: '8px', overflow: 'hidden', cursor: 'grab',
                              })}
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
                              {index === 0 && ( <Typography sx={(theme) => ({ position: 'absolute', top: 0, left: 0, background: theme.palette.primary.main, color: theme.palette.primary.contrastText, padding: '2px 6px', fontSize: '0.7rem', borderBottomRightRadius: '4px', zIndex: 1 })}>Main</Typography> )}
                              <img src={images?.[index]} alt={`fabric-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
      </Edit>
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