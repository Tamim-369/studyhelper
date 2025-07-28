# Cloudinary Setup Guide

## 🚀 **Why Cloudinary?**

Cloudinary is perfect for your StudyHelper app because:
- ✅ **Large File Support**: Handles files up to 100MB (free) / 1GB+ (paid)
- ✅ **Global CDN**: Fast delivery worldwide
- ✅ **Simple API**: Easy integration with excellent documentation
- ✅ **No OAuth Complexity**: Just API keys, no complex authentication flows
- ✅ **Reliable**: Enterprise-grade infrastructure
- ✅ **Cost Effective**: Generous free tier, reasonable pricing

## 📋 **Setup Steps**

### 1. **Create Cloudinary Account**
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email

### 2. **Get Your Credentials**
After signing up, you'll see your dashboard with:
- **Cloud Name**: `your_cloud_name`
- **API Key**: `123456789012345`
- **API Secret**: `your_api_secret`

### 3. **Update Environment Variables**

Replace the placeholder values in your `.env.local`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### 4. **Create Upload Preset (Optional but Recommended)**
1. Go to Settings → Upload in your Cloudinary dashboard
2. Click "Add upload preset"
3. Set:
   - **Preset name**: `studyhelper_pdfs`
   - **Signing Mode**: `Signed`
   - **Resource type**: `Raw`
   - **Folder**: `studyhelper/pdfs`
4. Save the preset
5. Add to your `.env.local`:
   ```env
   CLOUDINARY_UPLOAD_PRESET=studyhelper_pdfs
   ```

### 5. **Set Environment Variables in Vercel**
In your Vercel dashboard, add these environment variables:
```
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
CLOUDINARY_UPLOAD_PRESET=studyhelper_pdfs
```

## 🔧 **Features Implemented**

### **Upload API** (`/api/upload-to-cloudinary`)
- Uploads PDF files to Cloudinary
- Organizes files by user in folders
- Saves metadata to MongoDB
- Handles file validation and size limits

### **List Books API** (`/api/books/my-cloudinary-books`)
- Lists user's uploaded books from database
- Supports pagination and search
- Returns Cloudinary URLs for access

### **Stream PDF API** (`/api/books/cloudinary-pdf/[bookId]`)
- Streams PDF content from Cloudinary
- Generates secure, time-limited URLs
- Handles authentication and access control

### **Upload Component** (`CloudinaryUpload`)
- Drag-and-drop file upload
- Progress indicators
- Books management interface
- Direct links to Cloudinary and PDF reader

## 💰 **Pricing Information**

### **Free Tier** (Perfect for getting started):
- 25 GB storage
- 25 GB monthly bandwidth
- 1,000 transformations/month
- Files up to 100MB each

### **Paid Plans** (If you need more):
- **Plus ($89/month)**: 160 GB storage, 160 GB bandwidth, files up to 1GB
- **Advanced ($224/month)**: 500 GB storage, 500 GB bandwidth, unlimited file size

## 🧪 **Testing Your Setup**

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Go to the upload page**:
   ```
   http://localhost:3000/upload
   ```

3. **Select "Cloudinary" tab**

4. **Sign in with Google** (for user authentication)

5. **Upload a PDF file** (up to 500MB)

6. **Verify the upload**:
   - Check your Cloudinary dashboard
   - See the file in `studyhelper/pdfs/[user-email]/` folder
   - Try opening the PDF in the reader

## 🔒 **Security Features**

- **User-based folders**: Files organized by user email
- **Signed URLs**: Time-limited access to files
- **Authentication required**: Only signed-in users can upload
- **Access control**: Users can only access their own files
- **File validation**: Only PDF files allowed, size limits enforced

## 🚀 **Deployment**

Your Cloudinary integration is ready for production! Just make sure to:
1. Set all environment variables in Vercel
2. Deploy your app
3. Test the upload flow in production

## 📞 **Support**

If you encounter any issues:
1. Check the Cloudinary dashboard for upload logs
2. Check your browser's network tab for API errors
3. Verify environment variables are set correctly
4. Check the server logs for detailed error messages

**Your StudyHelper now has enterprise-grade file storage with Cloudinary! 🎉**
