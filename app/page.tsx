// app/page.tsx — Home Page (Dominion's Portfolio)
import { getProfile, getCategories, getItems, getPaperCategories, getAllPapers } from '@/lib/api';
import { IntroLetter } from '@/components/IntroLetter';
import { ContactLinks } from '@/components/ContactLinks';
import { HomeWorkSection } from '@/components/HomeWorkSection';
import { FloatingWorkButton } from '@/components/FloatingWorkButton';
import { Footer } from '@/components/Footer';

export const revalidate = 0; // Fresh database reads

export default async function HomePage() {
  const profile = await getProfile();
  const categories = await getCategories();
  const paperCategories = await getPaperCategories();
  const allPapers = await getAllPapers();
  const items = await getItems();

  return (
    <main className="min-h-screen flex flex-col relative">
      <div className="w-full max-w-[655px] mx-auto px-6 sm:px-0 pt-[72px] sm:pt-[130px] pb-[80px] flex-1 flex flex-col justify-between">
        <div>
          {/* Introduction Letter with Profile Avatar & Theme Toggle */}
          <IntroLetter
            introHtml={profile.intro_html}
            signOff={profile.sign_off}
            profileImages={profile.profile_images}
          />

          {/* Contact Links */}
          <ContactLinks links={profile.contact_links as any} />

          {/* Category Switcher & Work List */}
          <HomeWorkSection
            categories={categories}
            initialItems={items}
            listHeading={profile.list_heading}
          />
        </div>

        {/* Dynamic Footer with Castiel & Temporary Admin Link */}
        <Footer
          year={profile.footer.year}
          copyrightText={profile.footer.copyright_text}
          designedByText={profile.footer.designed_by_text}
          designerName={profile.footer.designer_name}
          designerUrl={profile.footer.designer_url}
        />
      </div>

      {/* Organic Paint-Splash Floating "See What I Built" Button */}
      <FloatingWorkButton />
    </main>
  );
}
