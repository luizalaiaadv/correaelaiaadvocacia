/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { Navbar } from './components/navbar';
import { Hero } from './components/hero';

// Componentes abaixo do fold carregados sob demanda (reduz JS inicial)
const ContactBar = lazy(() => import('./components/contactbar').then(m => ({ default: m.ContactBar })));
const StatsSection = lazy(() => import('./components/statssection').then(m => ({ default: m.StatsSection })));
const ServicesSection = lazy(() => import('./components/servicesection').then(m => ({ default: m.ServicesSection })));
const Differentials = lazy(() => import('./components/differentials').then(m => ({ default: m.Differentials })));
const AboutSection = lazy(() => import('./components/aboutsection').then(m => ({ default: m.AboutSection })));
const HowItWorks = lazy(() => import('./components/howitworks').then(m => ({ default: m.HowItWorks })));
const Testimonials = lazy(() => import('./components/testimonials').then(m => ({ default: m.Testimonials })));
const GallerySection = lazy(() => import('./components/gallerysection').then(m => ({ default: m.GallerySection })));
const PricingSection = lazy(() => import('./components/pricingsection').then(m => ({ default: m.PricingSection })));
const FaqSection = lazy(() => import('./components/faqsection').then(m => ({ default: m.FaqSection })));
const LocationSection = lazy(() => import('./components/locationsection').then(m => ({ default: m.LocationSection })));
const Footer = lazy(() => import('./components/footer').then(m => ({ default: m.Footer })));

export default function App() {
  return (
    <div className="min-h-screen selection:bg-primary/30 selection:text-brand">
      <Navbar />
      <main>
        <Hero />
        <Suspense fallback={null}>
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
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
