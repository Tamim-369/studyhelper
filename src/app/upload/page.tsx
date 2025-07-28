'use client';

import MainLayout from '@/components/layout/MainLayout';
import GoogleDriveUpload from '@/components/upload/GoogleDriveUpload';

export default function UploadPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Upload PDF to Google Drive
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upload PDF files to your Google Drive and access them with AI-powered features
          </p>
        </div>

        <GoogleDriveUpload />
      </div>
    </MainLayout>
  );
}
