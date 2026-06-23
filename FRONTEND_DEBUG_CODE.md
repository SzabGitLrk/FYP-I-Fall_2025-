# Frontend Debug Code to Add

## Add this to AccountSettings.tsx for detailed logging

Replace the `handleImageChange` function with this version that has extensive logging:

```typescript
const handleImageChange = async (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  const file = event.target.files?.[0];
  console.log('=== STEP 1: File Selected ===');
  console.log('File:', file ? {
    name: file.name,
    size: file.size,
    type: file.mimetype,
    lastModified: new Date(file.lastModified).toISOString(),
  } : 'NO FILE');

  if (file) {
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('File too large:', file.size, '> 5MB');
      setSaveError('Image size must be less than 5MB');
      return;
    }

    // Show preview immediately
    console.log('=== STEP 2: Creating Preview ===');
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      console.log('Preview created, length:', preview.length);
      setProfileImage(preview);
    };
    reader.readAsDataURL(file);

    // Upload to server
    console.log('=== STEP 3: Uploading to Server ===');
    console.log('Uploading file:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    
    try {
      const data = await uploadImage(file);
      console.log('=== STEP 4: Upload Success ===');
      console.log('Response from server:', data);
      console.log('Image URL:', data.imageUrl);
      
      setUploadedImageUrl(data.imageUrl);
      setSaveError(null);
    } catch (err) {
      console.log('=== STEP 4: Upload Failed ===');
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to upload image. Please check your connection and try again.';
      setSaveError(errorMessage);
      console.error('Error uploading image:', {
        error: err,
        errorMessage: errorMessage,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        errorStack: err instanceof Error ? err.stack : 'N/A',
      });
      // Keep preview visible even if upload fails
    }
  }
};
```

---

## Add this to handleSave for detailed logging

Replace the `handleSave` function with this version:

```typescript
const handleSave = async () => {
  console.log('=== SAVE CLICKED ===');
  
  if (!name) {
    console.error('Name is empty');
    setNameError(true);
    return;
  }

  setSaveError(null);
  setIsSaving(true);

  try {
    // Use the uploaded image URL, not the preview
    const imageToSave = uploadedImageUrl || profileImage || undefined;
    
    console.log('=== STEP 1: Prepare Save Data ===');
    console.log('Data to save:', {
      name,
      image: imageToSave ? imageToSave.substring(0, 100) + '...' : 'NO IMAGE',
      uploadedImageUrl: uploadedImageUrl ? uploadedImageUrl.substring(0, 100) + '...' : null,
      profileImage: profileImage ? 'base64 preview' : null,
    });

    updateUser(
      { user: { name, image: imageToSave } },
      {
        onSuccess: () => {
          console.log('=== STEP 2: Save Success ===');
          console.log('User updated successfully');
          
          setInitialName(name);
          setInitialProfileImage(uploadedImageUrl);
          setIsChanged(false);
          setProfileImage(uploadedImageUrl);
          setIsSaving(false);
          
          console.log('=== STEP 3: Navigating ===');
          navigate('/dashboard');
        },
        onError: (error) => {
          console.log('=== STEP 2: Save Failed ===');
          const errorMsg =
            error instanceof Error
              ? error.message
              : 'Failed to save profile. Please try again.';
          setSaveError(errorMsg);
          setIsSaving(false);
          console.error('Failed to update user:', {
            error,
            errorMessage: errorMsg,
          });
        },
      },
    );
  } catch (err) {
    console.error('=== STEP 2: Unexpected Error ===');
    setSaveError(
      err instanceof Error ? err.message : 'An error occurred during save.',
    );
    setIsSaving(false);
    console.error('Save error:', err);
  }
};
```

---

## Add this to imageService.ts for detailed logging

Update the uploadImage function:

```typescript
export const uploadImage = async (
  file: File,
): Promise<{ imageUrl: string }> => {
  try {
    console.log('[imageService] === Starting Image Upload ===');
    
    const formData = new FormData();
    formData.append('file', file);

    console.log('[imageService] FormData prepared:', {
      hasFile: formData.has('file'),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    console.log('[imageService] Making POST request to /images/upload');
    const response = await apiClient.post<ApiResponse<{ imageUrl: string }>>(
      '/images/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    console.log('[imageService] === Response Received ===');
    console.log('[imageService] Status:', response.status);
    console.log('[imageService] Data:', response.data);

    return handleApiCall(Promise.resolve(response));
  } catch (error) {
    console.error('[imageService] === Upload Failed ===');
    console.error('[imageService] Error object:', error);
    console.error('[imageService] Error details:', {
      message: (error as any)?.message,
      response: (error as any)?.response?.status,
      responseData: (error as any)?.response?.data,
      stack: (error as any)?.stack,
    });
    throw error;
  }
};
```

---

## How to Use These Logs

1. **Replace** the functions in the actual files
2. **Restart frontend** (Ctrl+C, then npm run dev)
3. **Open browser F12** (Developer Tools)
4. **Go to Console tab**
5. **Try uploading an image**
6. **Look for the === STEP X === markers**
7. **Copy the full console output**
8. **Share the output to identify where it fails**

---

## What Each Step Should Show

### If Working Correctly:

```
=== STEP 1: File Selected ===
File: {name: "photo.jpg", size: 250000, type: "image/jpeg"}

=== STEP 2: Creating Preview ===
Preview created, length: 332444

=== STEP 3: Uploading to Server ===
Uploading file: {name: "photo.jpg", size: 250000, type: "image/jpeg"}
[imageService] === Starting Image Upload ===
[imageService] FormData prepared...
[imageService] Making POST request...
[imageService] === Response Received ===
[imageService] Status: 200
[imageService] Data: {statusCode: 200, success: true, data: {imageUrl: "http://localhost:3002/uploads/..."}}

=== STEP 4: Upload Success ===
Response from server: {imageUrl: "http://localhost:3002/uploads/..."}
Image URL: http://localhost:3002/uploads/uuid-filename.jpg

=== SAVE CLICKED ===
=== STEP 1: Prepare Save Data ===
Data to save: {name: "...", image: "http://localhost:3002/uploads/..."}

=== STEP 2: Save Success ===
User updated successfully

=== STEP 3: Navigating ===
```

### If Error Appears:

The logs will show EXACTLY where the flow stops, e.g.:

```
=== STEP 3: Uploading to Server ===
[imageService] === Upload Failed ===
[imageService] Error details: {
  message: "401 Unauthorized",
  response: 401,
  responseData: {message: "Unauthorized"}
}
```

This tells you: **JWT token is missing or invalid**

---

## Common Debug Scenarios

### Scenario 1: Stops at "File Selected"
```
=== STEP 1: File Selected ===
File: NO FILE
```
**Cause:** File input not working
**Fix:** Check file input element, browser security, or file dialog blocked

---

### Scenario 2: Stops at "Creating Preview"
```
=== STEP 2: Creating Preview ===
(no log)
```
**Cause:** FileReader failed
**Fix:** Check file permissions, browser security

---

### Scenario 3: Stops at "Uploading to Server"
```
=== STEP 3: Uploading to Server ===
[imageService] === Upload Failed ===
[imageService] Error details: {message: "401 Unauthorized"}
```
**Cause:** JWT token missing or expired
**Fix:** Re-login, check token in localStorage

---

### Scenario 4: Stops at "Upload Failed" with 500
```
=== STEP 4: Upload Failed ===
Error uploading image: {error: {...}, errorMessage: "...error..."}
```
**Cause:** Backend error
**Fix:** Check backend terminal for [ImageController] or [ImageService] error logs

---

## Quick Reference: Where to Look

| Symptom | Where to Check |
|---------|----------------|
| No file selected | File input element |
| No preview | FileReader (browser console error) |
| Network error | Browser Network tab (F12) |
| 401 error | JWT token (localStorage → appStorage) |
| 400 error | Backend request validation |
| 500 error | Backend terminal logs |
| Image not saved | Database (check user.image field) |
| Image not showing | Image URL accessible? (copy URL to browser) |
