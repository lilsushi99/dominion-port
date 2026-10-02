// app/page.tsx — Home Page (Dominion's Portfolio)
import { getProfile, getCategories, getItems } from '@/lib/api';
import { IntroLetter } from '@/components/IntroLetter';
import { ContactLinks } from '@/components/ContactLinks';
import { HomeWorkSection } from '@/components/HomeWorkSection';
import { Footer } from '@/components/Footer';

export const revalidate = 0; // Fresh database reads

export default async function HomePage() {
  const profile = await getProfile();
  const categories = await getCategories();
  const items = await getItems();

  return (
    <main className="min-h-screen flex flex-col">
      <div className="w-full max-w-[655px] mx-auto px-6 sm:px-0 pt-[72px] sm:pt-[170px] pb-[80px] flex-1 flex flex-col justify-between">
        <div>
          {/* Introduction Letter */}
          <IntroLetter
            introHtml={profile.intro_html}
            signOff={profile.sign_off}
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
    </main>
  );
}
