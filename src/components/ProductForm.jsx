import React, { useState, useRef, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Avatar,
  IconButton,
  CircularProgress,
  Stack,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { supabase, PRODUCTS_TABLE, PRODUCT_IMAGES_BUCKET } from '../supabaseClient';

const DEFAULT_CATEGORY_OPTIONS = ['Face Cream', 'Face Wash', 'Serum', 'Shampoo', 'Soap'];

const EMPTY_FORM = {
  category: '',
  name: '',
  price: '',
  description: '',
  prep_time_days: '',
  ingredients: '',
  main_photo_url: '',
  gallery_urls: [],
};

/**
 * Uploads a single file to the product-images bucket and returns its public URL.
 * Files are namespaced by folder (main/ or gallery/) and given a unique name so
 * two admins uploading "photo.jpg" at the same time never collide.
 */
async function uploadImageToBucket(file, folder) {
  const fileExt = file.name.split('.').pop();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
  const filePath = `${folder}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export default function ProductForm({ onProductAdded }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [categoryOptions, setCategoryOptions] = useState(DEFAULT_CATEGORY_OPTIONS);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState(null);

  const mainPhotoInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFieldChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity });

  const fetchCategoryOptions = async () => {
    setCategoryLoading(true);
    setCategoryError(null);

    try {
      const { data, error } = await supabase
        .from(PRODUCTS_TABLE)
        .select('category', { distinct: true })
        .order('category', { ascending: true });

      if (error) throw error;

      const categories = Array.isArray(data)
        ? [...new Set(data.map((row) => row.category).filter(Boolean))]
        : [];

      if (categories.length > 0) {
        setCategoryOptions(categories);
      } else {
        setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
      }
    } catch (err) {
      setCategoryError(err.message);
      setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryOptions();
  }, []);

  // --- Image upload handlers -------------------------------------------------

  const handleMainPhotoSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingMain(true);
    try {
      const publicUrl = await uploadImageToBucket(file, 'main');
      setFormData((prev) => ({ ...prev, main_photo_url: publicUrl }));
      showToast('Main photo uploaded.');
    } catch (err) {
      showToast(`Main photo upload failed: ${err.message}`, 'error');
    } finally {
      setUploadingMain(false);
      // reset so selecting the same file again still fires onChange
      if (mainPhotoInputRef.current) mainPhotoInputRef.current.value = '';
    }
  };

  const handleGallerySelect = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadingGallery(true);
    try {
      const uploadedUrls = await Promise.all(
        files.map((file) => uploadImageToBucket(file, 'gallery'))
      );
      setFormData((prev) => ({
        ...prev,
        gallery_urls: [...prev.gallery_urls, ...uploadedUrls],
      }));
      showToast(
        `${uploadedUrls.length} gallery image${uploadedUrls.length > 1 ? 's' : ''} uploaded.`
      );
    } catch (err) {
      showToast(`Gallery upload failed: ${err.message}`, 'error');
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const removeGalleryImage = (urlToRemove) => {
    setFormData((prev) => ({
      ...prev,
      gallery_urls: prev.gallery_urls.filter((url) => url !== urlToRemove),
    }));
  };

  // --- Form submission ---------------------------------------------------

  const isFormValid =
    formData.name.trim() !== '' &&
    formData.category !== '' &&
    formData.price !== '' &&
    !Number.isNaN(Number(formData.price));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isFormValid) {
      showToast('Name, category, and a valid price are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        category: formData.category,
        name: formData.name.trim(),
        price: Number(formData.price),
        description: formData.description.trim(),
        main_photo_url: formData.main_photo_url || null,
        gallery_urls: formData.gallery_urls,
        prep_time_days: formData.prep_time_days ? Number(formData.prep_time_days) : null,
        ingredients: formData.ingredients.trim(),
      };

      const { error: insertError } = await supabase.from(PRODUCTS_TABLE).insert([payload]);
      if (insertError) throw insertError;

      showToast(`"${payload.name}" added to inventory.`);
      setFormData(EMPTY_FORM);
      await fetchCategoryOptions();
      onProductAdded?.();
    } catch (err) {
      showToast(`Could not save product: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const busy = uploadingMain || uploadingGallery || submitting;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Add New Product
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Fill in the product details and upload photos, then save to inventory.
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2.5}>
          {/* Category + Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              required
              fullWidth
              label="Category"
              value={formData.category}
              onChange={handleFieldChange('category')}
              helperText={categoryError || (categoryLoading ? 'Loading categories...' : '')}
              error={Boolean(categoryError)}
              disabled={categoryLoading && categoryOptions.length === 0}
            >
              {categoryOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Product Name"
              placeholder="e.g. Oatmeal Honey Soap Bar"
              value={formData.name}
              onChange={handleFieldChange('name')}
            />
          </Grid>

          {/* Price + Prep time */}
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              type="number"
              label="Price (₹)"
              inputProps={{ min: 0, step: '0.01' }}
              value={formData.price}
              onChange={handleFieldChange('price')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Prep Time (days)"
              inputProps={{ min: 0, step: 1 }}
              value={formData.prep_time_days}
              onChange={handleFieldChange('prep_time_days')}
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Description"
              placeholder="Short, customer-facing description of the product"
              value={formData.description}
              onChange={handleFieldChange('description')}
            />
          </Grid>

          {/* Ingredients */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Ingredients"
              placeholder="Comma-separated list, e.g. Coconut oil, Shea butter, Oatmeal..."
              value={formData.ingredients}
              onChange={handleFieldChange('ingredients')}
            />
          </Grid>

          {/* Main photo upload */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Main Photo
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                variant="rounded"
                src={formData.main_photo_url || undefined}
                sx={{ width: 64, height: 64, bgcolor: 'grey.100' }}
              >
                <AddPhotoAlternateOutlinedIcon color="disabled" />
              </Avatar>
              <Button
                variant="outlined"
                component="label"
                size="small"
                disabled={uploadingMain}
                startIcon={
                  uploadingMain ? <CircularProgress size={16} /> : <AddPhotoAlternateOutlinedIcon />
                }
              >
                {uploadingMain ? 'Uploading...' : formData.main_photo_url ? 'Replace' : 'Upload'}
                <input
                  ref={mainPhotoInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleMainPhotoSelect}
                />
              </Button>
            </Stack>
          </Grid>

          {/* Gallery upload */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Gallery Photos
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
              {formData.gallery_urls.map((url) => (
                <Box key={url} sx={{ position: 'relative' }}>
                  <Avatar variant="rounded" src={url} sx={{ width: 48, height: 48 }} />
                  <IconButton
                    size="small"
                    onClick={() => removeGalleryImage(url)}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      p: 0.2,
                      '&:hover': { bgcolor: 'grey.200' },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              ))}
              <Button
                variant="outlined"
                component="label"
                size="small"
                disabled={uploadingGallery}
                startIcon={
                  uploadingGallery ? <CircularProgress size={16} /> : <CollectionsOutlinedIcon />
                }
              >
                {uploadingGallery ? 'Uploading...' : 'Add Photos'}
                <input
                  ref={galleryInputRef}
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleGallerySelect}
                />
              </Button>
            </Stack>
          </Grid>

          {/* Submit */}
          <Grid item xs={12}>
            <Divider sx={{ mb: 2 }} />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={busy || !isFormValid}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {submitting ? 'Saving...' : 'Save Product'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          variant="filled"
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
