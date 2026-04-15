/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import TagManager from 'react-gtm-module';
import { Navbar } from './components/navbar';
import { Hero } from './components/hero';
import { ContactBar } from './components/contactbar';
import { StatsSection } from './components/statssection';
import { ServicesSection } from './components/servicesection';
import { Differentials } from './components/differentials';
import { AboutSection } from './components/aboutsection';
import { HowItWorks } from './components/howitworks';
import { Testimonials } from './components/testimonials';
import { GallerySection } from './components/gallerysection';
import { PricingSection } from './components/pricingsection';
import { FaqSection } from './components/faqsection';
import { LocationSection } from './components/locationsection';
import { Footer } from './components/footer';

export default function App() {
  useEffect(() => {
    const tagManagerArgs = {
      gtmId: 'GTM-KFXXZS4M', // Substitua pelo seu ID do GTM
    };
    TagManager.initialize(tagManagerArgs);
  }, []);

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
