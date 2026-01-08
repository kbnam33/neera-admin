import { 
    Box, Button, Typography, Paper, IconButton, Grid, Stack,
    Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText, InputAdornment, TextField,
    DialogActions, useTheme // Added DialogActions and useTheme
} from "@mui/material";
import { supabaseClient, supabaseAdminClient } from "../supabase";
import CloseIcon from '@mui/icons-material/Close';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Added for selection
import RefreshIcon from '@mui/icons-material/Refresh';
import { useState, useEffect, useMemo, useCallback } from "react";

// Shared cache with image gallery for better performance
let pickerUsedImagesCache = null;
let pickerCacheTimestamp = null;
const PICKER_CACHE_DURATION = 30000; // 30 seconds

// Helper function to list all files from the root of a bucket
const fetchRootFiles = async (bucketName, { limit = 100, offset = 0 } = {}) => {
    const { data, error } = await supabaseClient.storage
        .from(bucketName)
        .list(null, {
            limit,
            offset,
            sortBy: { column: 'name', order: 'asc' },
        });

    if (error) {
        console.error(`Error listing root files from ${bucketName}:`, error);
        return [];
    }
    
    // Filter out any folders (which have id=null) and .emptyFolderPlaceholder
    const rootFiles = data.filter(item => item.id !== null && item.name !== '.emptyFolderPlaceholder');
    
    return rootFiles.map(file => {
        const { data: { publicUrl } } = supabaseClient.storage.from(bucketName).getPublicUrl(file.name);
        return { name: file.name, url: publicUrl };
    });
};

export const ProductImagePicker = ({ open, onClose, onSelectImages, excludeImages = [] }) => { // Added excludeImages prop
    const theme = useTheme();
    const [products, setProducts] = useState([]);
    const [rootImages, setRootImages] = useState([]);
    const [rootOffset, setRootOffset] = useState(0);
    const [hasMoreRoot, setHasMoreRoot] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filter, setFilter] = useState("");
    const [view, setView] = useState('list'); // 'list' or 'images'
    const [selectedItem, setSelectedItem] = useState(null); // Can be a product object or 'root'
    
    // --- New state for multi-selection ---
    const [selectedUrls, setSelectedUrls] = useState([]);

    // --- Windowing state for image grid ---
    const PAGE_SIZE = 60;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    
    // --- State for lazy loading all unorganized images ---
    const [allRootImages, setAllRootImages] = useState([]);
    const [isLoadingAllRoot, setIsLoadingAllRoot] = useState(false);

    // Fetch ALL unorganized images with lazy loading
    const fetchAllUnorganizedImages = useCallback(async (forceRefresh = false) => {
        setIsLoadingAllRoot(true);
        try {
            // Check cache first
            const now = Date.now();
            let allUsedImages;
            
            if (!forceRefresh && pickerUsedImagesCache && pickerCacheTimestamp && (now - pickerCacheTimestamp < PICKER_CACHE_DURATION)) {
                allUsedImages = pickerUsedImagesCache;
            } else {
                // Fetch only images field from products for better performance
                const { data: productsData, error: productsError } = await supabaseAdminClient
                    .from('products')
                    .select('images');
                
                if (productsError) throw productsError;
                
                // Create a Set of all images used by any product
                allUsedImages = new Set();
                if (productsData) {
                    productsData.forEach(product => {
                        if (product.images && Array.isArray(product.images)) {
                            product.images.forEach(url => allUsedImages.add(url));
                        }
                    });
                }
                
                // Update cache
                pickerUsedImagesCache = allUsedImages;
                pickerCacheTimestamp = now;
            }

            // Add excludeImages to the set of used images
            const excludeSet = new Set(allUsedImages);
            excludeImages.forEach(url => excludeSet.add(url));

            // Fetch ALL root files in batches
            let allFiles = [];
            let offset = 0;
            const batchSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const batch = await fetchRootFiles('product-images', { limit: batchSize, offset });
                if (batch.length > 0) {
                    allFiles = [...allFiles, ...batch];
                    offset += batchSize;
                    hasMore = batch.length === batchSize;
                } else {
                    hasMore = false;
                }
            }

            // Filter to get only unorganized images
            const unorganizedImages = allFiles.filter(file => !excludeSet.has(file.url));

            return unorganizedImages;

        } catch (error) {
            console.error("Error fetching all unorganized images:", error);
            return [];
        } finally {
            setIsLoadingAllRoot(false);
        }
    }, [excludeImages]);

    // Extract fetchData as a callable function - returns the unorganized images data (optimized with cache)
    const fetchData = useCallback(async (updateCurrentView = false, forceRefresh = false) => {
        if (updateCurrentView) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        
        try {
            // Fetch products with names for display
            const { data: productsWithNames, error: namesError } = await supabaseAdminClient
                .from('products')
                .select('id, name, images')
                .order('name', { ascending: true });
            
            if (namesError) throw namesError;
            
            // Fetch ALL unorganized images (with excludeImages filtering)
            const allUnorganized = await fetchAllUnorganizedImages(forceRefresh);

            setProducts((productsWithNames || []).filter(p => p.images && p.images.length > 0));
            setAllRootImages(allUnorganized);
            setRootImages(allUnorganized.slice(0, 100)); // Initial view
            setRootOffset(100);
            setHasMoreRoot(allUnorganized.length > 100);

            // Update selectedItem if we're viewing Unorganized Images and refresh was requested
            if (updateCurrentView) {
                setSelectedItem(prev => {
                    if (prev?.id === 'root') {
                        return { id: 'root', name: 'Unorganized Images', images: allUnorganized };
                    }
                    return prev;
                });
            }

            return allUnorganized;

        } catch (error) {
            console.error("Error fetching data for picker:", error);
            alert("Failed to load products and images.");
            return [];
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [fetchAllUnorganizedImages]);

    useEffect(() => {
        if (!open) {
            // Reset state when modal is closed
            setView('list');
            setSelectedItem(null);
            setFilter("");
            setSelectedUrls([]); // Clear selection
            setVisibleCount(PAGE_SIZE);
            setRootOffset(0);
            setHasMoreRoot(true);
            return;
        }

        // Clear cache when dialog opens to ensure fresh data
        pickerUsedImagesCache = null;
        pickerCacheTimestamp = null;
        
        fetchData(false, true); // Force refresh to get latest data
    }, [open, fetchData]);

    // When switching to images view or changing selected item, reset window
    useEffect(() => {
        if (view === 'images') {
            setVisibleCount(PAGE_SIZE);
        }
    }, [view, selectedItem]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => 
            p.name.toLowerCase().includes(filter.toLowerCase())
        );
    }, [products, filter]);

    const handleSelectProduct = (product) => {
        setSelectedItem(product);
        setView('images');
    };

    const handleSelectRoot = async () => {
        // Use allRootImages which already has all unorganized images
        setSelectedItem({ id: 'root', name: 'Unorganized Images', images: allRootImages });
        setView('images');
    };

    const handleBack = () => {
        setView('list');
        setSelectedItem(null);
        setFilter("");
        setSelectedUrls([]); // Clear selection when going back
    };

    // --- New handler to toggle selection ---
    const handleToggleSelect = (url) => {
        setSelectedUrls(prev => 
            prev.includes(url) 
                ? prev.filter(u => u !== url) // Deselect
                : [...prev, url] // Select
        );
    };

    // --- New handler for the "Add" button ---
    const handleDone = () => {
        onSelectImages(selectedUrls); // Pass array of URLs
        onClose();
    };

    const maybeLoadMoreRoot = async () => {
        if (selectedItem?.id !== 'root') return;
        if (!hasMoreRoot) return;
        
        // If we've revealed more than we have, load next batch from allRootImages
        if (visibleCount > rootImages.length - 20) {
            const nextBatch = allRootImages.slice(rootOffset, rootOffset + 100);
            
            if (nextBatch.length > 0) {
                setRootImages(prev => [...prev, ...nextBatch]);
                setRootOffset(prev => prev + nextBatch.length);
                setSelectedItem(prev => prev?.id === 'root' ? { ...prev, images: [...prev.images, ...nextBatch] } : prev);
            }
            
            // Check if we've loaded everything
            if (rootOffset + nextBatch.length >= allRootImages.length) {
                setHasMoreRoot(false);
            }
        }
    };

    const handleScroll = async (event) => {
        const target = event.currentTarget;
        const threshold = 200; // px from bottom
        if (target.scrollHeight - target.scrollTop - target.clientHeight < threshold) {
            // reveal next window
            setVisibleCount(prev => prev + PAGE_SIZE);
            await maybeLoadMoreRoot();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box display="flex" alignItems="center">
                    {view === 'images' && (
                        <IconButton onClick={handleBack} size="small" sx={{ mr: 1 }}>
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    <Typography variant="h6">
                        {view === 'list' ? "Select from Existing" : `Select from "${selectedItem?.name || ''}"`}
                    </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    {/* --- Show count when in image view --- */}
                    {view === 'images' && selectedUrls.length > 0 && (
                        <Typography variant="body1" color="text.secondary">
                            {selectedUrls.length} selected
                        </Typography>
                    )}
                    {/* Refresh button */}
                    <IconButton 
                        onClick={() => {
                            // Invalidate cache on refresh
                            pickerUsedImagesCache = null;
                            pickerCacheTimestamp = null;
                            fetchData(true, true);
                        }}
                        size="small"
                        disabled={isLoading || isRefreshing}
                        title="Refresh images"
                    >
                        <RefreshIcon />
                    </IconButton>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers sx={{ minHeight: '60vh', bgcolor: 'background.default' }} onScroll={handleScroll}>
                {isLoading || isLoadingAllRoot ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography gutterBottom>Loading images...</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {isLoadingAllRoot ? 'Fetching all unorganized images...' : 'Loading...'}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* --- View 1: Product & Root List --- */}
                        {view === 'list' && (
                            <Box>
                                <TextField
                                    fullWidth
                                    placeholder="Filter by product name..."
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    margin="dense"
                                    sx={{ mb: 2, bgcolor: 'white' }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <ImageSearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <List dense component={Paper} elevation={0}>
                                    {allRootImages.length > 0 && (
                                        <ListItemButton onClick={handleSelectRoot} disabled={isRefreshing}>
                                            <ListItemText 
                                                primary="Unorganized Images" 
                                                secondary={isRefreshing || isLoadingAllRoot ? 'Loading...' : `${allRootImages.length} image(s) available`} 
                                            />
                                        </ListItemButton>
                                    )}
                                    {filteredProducts.length === 0 && allRootImages.length === 0 ? (
                                        <ListItemText primary="No products with images found." sx={{ textAlign: 'center', color: 'text.secondary' }} />
                                    ) : (
                                        filteredProducts.map((product) => (
                                            <ListItemButton key={product.id} onClick={() => handleSelectProduct(product)}>
                                                <ListItemText 
                                                    primary={product.name} 
                                                    secondary={`${product.images.length} image(s) available`} 
                                                />
                                            </ListItemButton>
                                        ))
                                    )}
                                </List>
                            </Box>
                        )}

                        {/* --- View 2: Image Grid --- */}
                        {view === 'images' && selectedItem && (
                            <Grid container spacing={1.5}>
                                {selectedItem.images.slice(0, visibleCount).map((img, index) => {
                                    const imgUrl = typeof img === 'string' ? img : img.url;
                                    const imgName = typeof img === 'string' ? `Image ${index+1}` : img.name;
                                    const isSelected = selectedUrls.includes(imgUrl);

                                    return (
                                    <Grid item xs={4} sm={3} md={3} key={index}>
                                        <Paper 
                                            onClick={() => handleToggleSelect(imgUrl)}
                                            elevation={0}
                                            sx={{ 
                                                position: 'relative', 
                                                width: '100%', 
                                                paddingTop: '100%', // Square
                                                cursor: 'pointer', 
                                                overflow: 'hidden', 
                                                borderRadius: '8px',
                                                border: '2px solid',
                                                borderColor: isSelected ? theme.palette.primary.main : 'transparent',
                                                transition: 'border-color 0.2s',
                                            }}
                                        >
                                            <img 
                                                src={imgUrl} 
                                                loading="lazy"
                                                decoding="async"
                                                alt={imgName}
                                                style={{ 
                                                    position: 'absolute', 
                                                    top: 0, left: 0, 
                                                    width: '100%', height: '100%', 
                                                    objectFit: 'cover',
                                                    opacity: isSelected ? 0.7 : 1, // Dim if selected
                                                    transition: 'opacity 0.2s',
                                                }} 
                                            />
                                            {isSelected && (
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    color: 'white',
                                                    backgroundColor: theme.palette.primary.main,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}>
                                                    <CheckCircleIcon sx={{ fontSize: 24 }} />
                                                </Box>
                                            )}
                                        </Paper>
                                    </Grid>
                                )})}
                            </Grid>
                        )}
                    </>
                )}
            </DialogContent>

            {/* --- New Actions Footer --- */}
            {view === 'images' && (
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button 
                        onClick={handleDone} 
                        variant="contained" 
                        disabled={selectedUrls.length === 0}
                    >
                        Add {selectedUrls.length > 0 ? selectedUrls.length : ''} Image(s)
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};