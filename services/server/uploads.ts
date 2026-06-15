import 'server-only';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from './supabase-admin';

const UPLOAD_BUCKET = process.env.SUPABASE_UPLOAD_BUCKET || 'card-uploads';

export async function createSignedUpload(input: {
  card_id: string;
  file_name: string;
  content_type: string;
  byte_size: number;
}) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      error: 'Uploads require Supabase Storage configuration.',
      status: 501,
    };
  }

  const extension = input.file_name.split('.').pop()?.toLowerCase() || 'bin';
  const objectPath = `${input.card_id}/${randomUUID()}.${extension}`;
  const { data, error } = await admin.storage
    .from(UPLOAD_BUCKET)
    .createSignedUploadUrl(objectPath);

  if (error) throw error;

  await admin.from('uploads').insert({
    card_id: input.card_id,
    bucket: UPLOAD_BUCKET,
    object_path: objectPath,
    original_filename: input.file_name,
    content_type: input.content_type,
    byte_size: input.byte_size,
    status: 'pending',
  });

  return {
    bucket: UPLOAD_BUCKET,
    object_path: objectPath,
    token: data.token,
    signed_url: data.signedUrl,
  };
}
