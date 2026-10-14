import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { isAdmin } from '@/lib/admin/session'
import { MAX_UPLOAD_MB, UPLOAD_TYPES } from '@/lib/admin/uploads'

// Photos and PDFs go from the admin's browser straight to Vercel Blob, since Vercel only
// accepts small request bodies. This route hands out a short-lived permission for one
// upload, and only to a logged-in admin.

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await isAdmin())) throw new Error('Log in again to upload files.')
        if (!pathname.startsWith('patterns/')) throw new Error('Files go under patterns/.')
        return {
          allowedContentTypes: [...UPLOAD_TYPES.image, ...UPLOAD_TYPES.pdf],
          maximumSizeInBytes: MAX_UPLOAD_MB * 1024 * 1024,
          addRandomSuffix: true,
        }
      },
    })
    return Response.json(result)
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 })
  }
}
