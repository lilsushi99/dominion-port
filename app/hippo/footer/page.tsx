'use client';

// app/hippo/footer/page.tsx — Direct Link to Footer Configuration in CMS
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HippoFooterRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/hippo/cms');
  }, [router]);

  return null;
}
