'use client';

// app/hippo/papers/[id]/page.tsx — Edit Existing Paper
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PaperForm } from '@/components/admin/PaperForm';
import { PaperRecord } from '@/backend/src/services/papers.service';

export default function HippoEditPaperPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [paper, setPaper] = useState<PaperRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    fetch(`/api/v1/admin/papers/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return;
        if (json.data) {
          setPaper(json.data);
        } else {
          setError(json.error?.message || 'Paper not found.');
        }
      })
      .catch((err) => {
        if (mounted) setError('Failed to load paper details.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-[13px] text-[#86858f]">Loading paper details...</div>;
  }

  if (error || !paper) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-[16px] font-semibold text-[#16151c]">Paper not found</h3>
        <p className="text-[13px] text-[#86858f] mt-1">{error || 'Unable to find the requested paper.'}</p>
        <button
          onClick={() => router.push('/hippo/papers')}
          className="mt-4 px-4 py-2 bg-[#5b4be0] text-white text-[13px] font-medium rounded-lg"
        >
          Back to papers
        </button>
      </div>
    );
  }

  return <PaperForm paper={paper} isNew={false} />;
}
