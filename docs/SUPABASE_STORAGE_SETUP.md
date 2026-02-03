# Supabase Storage Setup Guide

## Overview
This guide explains how to set up Supabase Storage for the TiKiT content workflow system.

## Prerequisites
- Supabase project created
- Database schema deployed (from `docs/DB_SCHEMA.sql`)
- Supabase admin access

## Storage Bucket Setup

### 1. Create Storage Bucket

In your Supabase dashboard:

1. Navigate to **Storage** in the left sidebar
2. Click **New bucket**
3. Configure the bucket:
   - **Name**: `content-files`
   - **Public bucket**: ✅ Enabled (for easy file access)
   - **File size limit**: 100MB (or adjust as needed)
   - **Allowed MIME types**: Leave empty for all types

4. Click **Create bucket**

### 2. Configure Storage Policies

After creating the bucket, set up Row Level Security (RLS) policies:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content-files');

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'content-files');

-- Allow users to update their own uploads
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'content-files' AND auth.uid() = owner);

-- Allow campaign managers and directors to delete files
CREATE POLICY "Campaign managers can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-files' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('director', 'campaign_manager')
  )
);
```

### 3. Configure CORS (if needed)

If accessing from different domains, configure CORS in Supabase:

1. Go to **Settings** > **API**
2. Add allowed origins:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

## File Structure

Files are organized in the bucket as follows:

```
content-files/
├── {campaign_id}/
│   ├── {content_item_id}/
│   │   ├── v1_{timestamp}_{filename}.jpg
│   │   ├── v2_{timestamp}_{filename}.jpg
│   │   └── v3_{timestamp}_{filename}.jpg
│   └── {another_content_item_id}/
│       └── v1_{timestamp}_{filename}.mp4
└── {another_campaign_id}/
    └── ...
```

## File Type Restrictions

The upload component enforces these limits:

### Images
- **Types**: .jpg, .jpeg, .png, .gif, .webp
- **Max size**: 10MB
- **MIME types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

### Videos
- **Types**: .mp4, .mov, .avi, .webm
- **Max size**: 100MB
- **MIME types**: `video/mp4`, `video/quicktime`, `video/x-msvideo`, `video/webm`

### Documents
- **Types**: .pdf, .doc, .docx, .ppt, .pptx
- **Max size**: 25MB
- **MIME types**:
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `application/vnd.ms-powerpoint`
  - `application/vnd.openxmlformats-officedocument.presentationml.presentation`

## Testing the Setup

### 1. Verify Bucket Creation

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'content-files';
```

### 2. Test Upload from Frontend

1. Navigate to a campaign detail page
2. Click on a content item
3. Click "Upload" button
4. Select a file and upload
5. Verify file appears in Supabase Storage dashboard

### 3. Verify Policies

```sql
-- Check bucket policies
SELECT *
FROM storage.policies
WHERE bucket_id = 'content-files';
```

## Troubleshooting

### Upload Fails with "403 Forbidden"

**Problem**: RLS policies not configured correctly

**Solution**:
1. Check that user is authenticated
2. Verify policies are created (see step 2 above)
3. Ensure bucket is public or policies allow access

### File Not Accessible After Upload

**Problem**: Public access not enabled

**Solution**:
1. Make bucket public, OR
2. Use signed URLs for private files:

```typescript
const { data } = await supabase.storage
  .from('content-files')
  .createSignedUrl(filePath, 3600); // 1 hour expiry
```

### CORS Errors

**Problem**: Cross-origin requests blocked

**Solution**:
1. Add your domain to allowed origins in Supabase settings
2. Ensure proper headers in API requests

### File Size Limits

**Problem**: Large files fail to upload

**Solution**:
1. Adjust bucket file size limit in Supabase dashboard
2. Update MAX_FILE_SIZES in `ContentUploadForm.tsx`
3. Consider implementing chunked uploads for very large files

## Security Best Practices

### 1. Validate File Types Server-Side

While the frontend validates file types, always verify on the server (Supabase Functions) to prevent malicious uploads.

### 2. Scan for Malware

Consider integrating virus scanning for uploaded files:
- VirusTotal API
- ClamAV
- Cloud-based scanning services

### 3. Generate Unique Filenames

Always use unique, non-guessable filenames:
```typescript
const fileName = `v${version}_${Date.now()}_${sanitizedName}`;
```

### 4. Limit File Sizes

Enforce reasonable limits to prevent storage abuse and ensure good performance.

### 5. Clean Up Old Versions

Implement a cleanup policy for old file versions:
- Keep last N versions
- Delete versions older than X days
- Implement soft delete with retention period

## Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Monitoring

### Storage Usage

Monitor storage usage in Supabase dashboard:
- **Settings** > **Usage**
- Check storage quota and usage

### Set Up Alerts

Configure alerts for:
- Storage quota reaching 80%
- Unusual upload patterns
- Failed upload attempts

## Backup Strategy

### 1. Automated Backups

Supabase provides automatic backups, but consider:
- Regular exports to external storage (S3, Google Cloud Storage)
- Versioned backups
- Geographic redundancy

### 2. Manual Backup

To manually backup storage:

```bash
# Using Supabase CLI
supabase storage download content-files --output ./backup/
```

## Cost Optimization

### 1. Storage Costs

- Free tier: 1GB storage
- Pro tier: 100GB storage
- Additional storage: $0.021/GB/month

### 2. Bandwidth Costs

- Monitor download bandwidth
- Use CDN for frequently accessed files
- Implement caching

### 3. Cleanup Strategy

Regularly clean up:
- Unused files
- Old versions beyond retention policy
- Temporary upload failures

## Next Steps

After completing storage setup:

1. ✅ Test file upload functionality
2. ✅ Verify version history works
3. ✅ Test file preview for different types
4. 📋 Implement approval workflow (Phase 5)
5. 📋 Add feedback system (Phase 5)

## Support

For issues:
- Supabase Docs: https://supabase.com/docs/guides/storage
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: Create an issue in the repository
