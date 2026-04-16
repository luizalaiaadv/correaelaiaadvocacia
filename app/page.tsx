import { Navbar } from '@/app/components/navbar';
import { Hero } from '@/app/components/hero';
import { ContactBar } from '@/app/components/contactbar';
import { StatsSection } from '@/app/components/statssection';
import { ServicesSection } from '@/app/components/servicesection';
import { Differentials } from '@/app/components/differentials';
import { AboutSection } from '@/app/components/aboutsection';
import { HowItWorks } from '@/app/components/howitworks';
import { Testimonials } from '@/app/components/testimonials';
import { GallerySection } from '@/app/components/gallerysection';
import { PricingSection } from '@/app/components/pricingsection';
import { FaqSection } from '@/app/components/faqsection';
import { LocationSection } from '@/app/components/locationsection';
import { Footer } from '@/app/components/footer';

export default function Home() {
  return (
    <div className="min-h-screen selection:bg-primary/30 selection:text-brand">
      <Navbar />
      <main>
        <Hero />
        <ContactBar />
        <StatsSection />
        <ServicesSection />
        <Differentials />
        <AboutSection />
        <HowItWorks />
        <Testimonials />
        <GallerySection />
        <PricingSection />
        <FaqSection />
        <LocationSection />
      </main>
      <Footer />
    </div>
  );
}
