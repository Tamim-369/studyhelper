'use client';

import MainLayout from '@/components/layout/MainLayout';
import GoogleDriveOnlyUpload from '@/components/upload/GoogleDriveOnlyUpload';

export default function UploadPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <GoogleDriveOnlyUpload />
      </div>
    </MainLayout>
  );
}
