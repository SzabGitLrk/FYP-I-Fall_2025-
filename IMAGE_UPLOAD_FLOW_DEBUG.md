# Image Upload Flow - Complete Debugging Guide

## The Complete Flow

```
User selects image
    ↓
File picker triggers (only once) ✓ FIXED
    ↓
handleImageChange() called with File object
    ↓
Create base64 preview for display
    ↓
Call uploadImage(file) with raw File object
    ↓
[BACKEND] POST /api/images/upload (FormData)
    ↓
FileInterceptor extracts file
    ↓
ImageService saves to /uploads
    ↓
Returns { imageUrl: "http://localhost:3002/uploads/..." }
    ↓
Update uploadedImageUrl state
    ↓
User clicks Save
    ↓
Call updateUser() with { name, image: uploadedImageUrl }
    ↓
[BACKEND] PUT /api/users with URL
    ↓
User entity updated with image URL
    ↓
Response includes imageUrl
    ↓
Query cache updated with setQueryData
    ↓
All components re-render with new image
    ↓
Navigate to /dashboard
```

---

## Where Errors Can Occur

### 1. FRONTEND: File Upload Step
**File: `AccountSettings.tsx` - `handleImageChange()`**

**Check Points:**
- [ ] File is selected: `console.log('Uploading image to server...', file.name, file.type)`
- [ ] File size check passes: `if (file.size > maxSize)` should NOT show error
- [ ] Preview generates: `reader.readAsDataURL(file)` creates base64 preview
- [ ] uploadImage() is called with raw File: Check browser console

**Common Errors:**
- "Image size must be less than 5MB" → File too large
- No upload starts → Check if file input accept filter is blocking

---

### 2. FRONTEND → BACKEND: HTTP Request Step
**File: `imageService.ts` - `uploadImage()`**

**Check Points - Browser Network Tab (F12):**
- [ ] Request URL: Should be `/api/images/upload` (proxy) or `http://localhost:3002/images/upload`
- [ ] Request Method: Should be `POST`
- [ ] Request Headers:
  - `Authorization: Bearer <token>` ✓ Must exist
  - `Content-Type: multipart/form-data` (auto-set by axios)
- [ ] Request Body: Should be FormData with file

**Common Errors:**
- 401 Unauthorized → Missing or invalid JWT token
- 400 Bad Request → No file in FormData
- 500 Internal Server Error → Backend error (see next section)
- CORS Error → Check backend CORS config
- "We could not reach the server" → Backend not running

**Debug in Console:**
```javascript
// Add to imageService.ts
console.log('FormData prepared for upload:', {
  fieldName: 'file',
  fileName: file.name,
  fileSize: file.size,
  fileType: file.type,
});
```

---

### 3. BACKEND: File Upload Step
**File: `image.controller.ts` - `uploadImage()`**
**File: `image.service.ts` - `uploadImage()`**

**Check Points - Backend Terminal:**
```
[ImageController] Upload request received {
  file: { name: "...", size: ..., mime: "..." },
  user: "user-id"
}
[ImageService] Upload request received
[ImageService] File saved to: /path/to/uploads/uuid-filename.jpg
[ImageService] Returning URL: http://localhost:3002/uploads/uuid-filename.jpg
[ImageController] Upload successful, URL: http://localhost:3002/uploads/...
```

**Common Errors:**
- No logs appear → Server not restarted
- "[ImageService] Error saving file locally" → Permission denied on /uploads folder
- "Cannot read property 'originalname' of undefined" → FileInterceptor not working

**File Interceptor Check:**
```typescript
// image.controller.ts line 25
@UseInterceptors(FileInterceptor('file')) // Key name MUST match frontend FormData append key
async uploadImage(
  @UploadedFile() file: Express.Multer.File, // Must not be undefined
  ...
)
```

---

### 4. BACKEND: Save to Database Step
**File: `user.controller.ts` - `update()`**
**File: `user.service.ts` - `update()`**

**Check Points - Backend Terminal & Database:**
```
[UserController] Update request received:
  userId: "...",
  updateData: { name: "...", image: "http://localhost:3002/uploads/..." }

[Database] User record updated with new image URL
```

**Verify in Database:**
```sql
SELECT id, name, image FROM "user" WHERE id = 'user-id';
-- Should show the image URL like: http://localhost:3002/uploads/uuid-filename.jpg
```

---

### 5. FRONTEND: Handle Response Step
**File: `AccountSettings.tsx` - `handleSave()`**
**File: `useUser.ts` - `useUpdateUser()`**

**Check Points - Browser Console:**
```javascript
console.log('Image uploaded successfully:', data.imageUrl)
// Should show: http://localhost:3002/uploads/uuid-filename.jpg

console.log('Update user response:', updatedUser)
// Should show user object with image URL
```

**Check Query Cache:**
```javascript
// In browser console
import { useQueryClient } from '@tanstack/react-query'
const queryClient = useQueryClient()
const userData = queryClient.getQueryData(['user'])
console.log('Cached user data:', userData)
// Should have image field with URL
```

---

## Exact Error Message Causes

### "We could not reach the server right now"
**Backend Unavailable:** 
- Backend not running: `npm run start:dev` in fyndbox-backend
- Wrong port: Check if 3002 is correct
- Changes not compiled: Restart backend server

### "Failed to upload image"
**From Frontend:**
- Network error (see Network tab)
- Backend returned 500 error
- File too large
- Invalid file type

### "Failed to save profile"
**When saving user data:**
- Backend /users endpoint returned error
- updateUserDto validation failed
- Database transaction failed

### 400 Bad Request on upload
**Possible Causes:**
- No file in request body
- FileInterceptor key doesn't match FormData key
- Invalid multipart/form-data format

### 500 Internal Server Error on upload
**Check Backend Logs:**
1. File permission issue on /uploads directory
2. FileReader/fs.writeFileSync() threw error
3. Exception in try/catch block

---

## Step-by-Step Debug Procedure

### Step 1: Verify Backend is Running
```powershell
# In PowerShell
netstat -ano | findstr "3002"
# Should show: TCP 0.0.0.0:3002 LISTENING
```

### Step 2: Check Backend Terminal Logs
When you upload an image, you should see:
```
[ImageController] Upload request received...
[ImageService] Upload request received...
[ImageService] File saved to...
[ImageService] Returning URL...
```

If not, backend is not restarted with new code.

### Step 3: Check Browser Network Tab
1. Open F12 (Developer Tools)
2. Go to Network tab
3. Upload image
4. Look for POST request to `/api/images/upload`
5. Check:
   - Status code (should be 200)
   - Response body (should have imageUrl)
   - Request headers (should have Authorization)

### Step 4: Check Browser Console
Should show:
```
Uploading image to server... filename.jpg
Image uploaded successfully: http://localhost:3002/uploads/...
```

### Step 5: Verify File Saved
```powershell
# Check if file exists
dir fyndbox-backend\uploads\
# Should show uuid-filename.jpg files
```

### Step 6: Test URL Directly
```powershell
curl http://localhost:3002/uploads/uuid-filename.jpg
# Should return image binary (not 404)
```

---

## Complete Checklist Before Testing

- [ ] Backend restarted (`npm run start:dev`)
- [ ] Frontend running (`npm run dev`)
- [ ] Database running (PostgreSQL)
- [ ] `uploadedImageUrl` state is being set correctly
- [ ] `/uploads` folder exists and is writable
- [ ] JWT token is valid (not expired)
- [ ] Browser cache cleared (F12 → Application → Clear)

---

## Files to Check if Still Getting Error

1. **fyndbox-backend/src/image/image.service.ts**
   - Check: `useLocalStorage` is true (since AWS not configured)
   - Check: File path generation
   - Check: fs.writeFileSync doesn't throw error

2. **fyndbox-backend/src/main.ts**
   - Check: `useStaticAssets()` is configured for /uploads
   - Check: NestExpressApplication is used

3. **fyndbox-backend/src/image/image.controller.ts**
   - Check: `@UseInterceptors(FileInterceptor('file'))` decorator
   - Check: Error logging shows what went wrong

4. **fyndbox-frontend/src/api/imageService.ts**
   - Check: FormData key is 'file'
   - Check: File is being appended correctly

5. **fyndbox-frontend/src/components/AccountSettings/AccountSettings.tsx**
   - Check: `uploadedImageUrl` is set from response
   - Check: `handleSave` uses `uploadedImageUrl`, not preview

---

## If Absolutely Stuck

Run these commands in order:

```bash
# 1. Stop all Node processes
taskkill /F /IM node.exe

# 2. Clear npm cache
npm cache clean --force

# 3. Reinstall dependencies
cd fyndbox-backend
npm install

# 4. Rebuild
npm run build

# 5. Start fresh
npm run start:dev
```

Then test again with a fresh browser session (Incognito mode).
