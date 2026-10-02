'use client';

// app/hippo/projects/[id]/page.tsx — Edit Project Page
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProjectForm } from '@/components/admin/ProjectForm';
import { ProjectRecord } from '@/backend/src/services/projects.service';

export default function EditProjectPage() {
  const params = useParams();
  const id = params?.id as string;
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/v1/admin/projects/${id}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.data) setProject(j.data);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-[13px] text-[#86858f]">Loading project data...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center text-[13px] text-[#d92d4a]">Project not found.</div>;
  }

  return <ProjectForm initialProject={project} isNew={false} />;
}
