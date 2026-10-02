'use client';

// app/hippo/projects/new/page.tsx — New Project Page
import React from 'react';
import { ProjectForm } from '@/components/admin/ProjectForm';

export default function NewProjectPage() {
  return <ProjectForm isNew={true} />;
}
