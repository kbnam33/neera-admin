import { useEffect, useMemo, useState } from "react";
import { supabaseAdminClient } from "../supabase";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export const ProductReorderDialog = ({ open, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabaseAdminClient
          .from("products")
          .select("id, name, sort_order, created_at")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });
        if (error) throw error;
        setItems(data || []);
        setChanged(false);
      } catch (e) {
        console.error("Failed to load products for reorder:", e);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [open]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const next = Array.from(items);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setItems(next);
    setChanged(true);
  };

  const handleSave = async () => {
    if (!changed) return onClose?.(false);
    setIsSaving(true);
    try {
      const updates = items.map((p, i) => ({ id: p.id, sort_order: i + 1 }));
      const { error } = await supabaseAdminClient
        .from("products")
        .upsert(updates, { onConflict: "id" });
      if (error) throw error;
      onClose?.(true);
    } catch (e) {
      console.error("Failed to save order:", e);
      onClose?.(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose?.(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Reorder Products</DialogTitle>
      <DialogContent dividers sx={{ maxHeight: "70vh" }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Drag items to change the display order.
            </Typography>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="products">
                {(provided) => (
                  <List
                    dense
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    sx={{
                      width: "100%",
                      bgcolor: "background.paper",
                    }}
                  >
                    {items.map((p, index) => (
                      <Draggable key={p.id} draggableId={String(p.id)} index={index}>
                        {(provided) => (
                          <ListItem
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 1,
                              mb: 1,
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <DragIndicatorIcon color="disabled" />
                            </ListItemIcon>
                            <ListItemText primary={p.name} />
                          </ListItem>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </List>
                )}
              </Droppable>
            </DragDropContext>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose?.(false)} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? "Saving..." : "Save order"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


