'use client';

// app/hippo/papers/new/page.tsx — Create New Paper
import React from 'react';
import { PaperForm } from '@/components/admin/PaperForm';

export default function HippoNewPaperPage() {
  return <PaperForm isNew={true} />;
}
