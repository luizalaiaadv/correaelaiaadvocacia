'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import imgLogo from '@/public/logo.webp';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');

  useEffect(() => {
    const sectionIds = [
      'inicio',
      'servicos',
      'sobre',
      'depoimentos',
      'faq',
      'localizacao',
    ];

    let positions: { id: string; top: number }[] = [];

    const cachePositions = () => {
      positions = sectionIds
        .map((id) => {
          const el = document.getElementById(id);
          if (!el) return null;
          return { id, top: el.getBoundingClientRect().top + window.scrollY };
        })
        .filter(Boolean) as { id: string; top: number }[];
    };

    cachePositions();

    const ro = new ResizeObserver(cachePositions);
    ro.observe(document.body);
    window.addEventListener('resize', cachePositions, { passive: true });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      const trigger = window.scrollY + 90;
      let current = positions[0]?.id ?? 'inicio';
      for (const { id, top } of positions) {
        if (trigger >= top) current = id;
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', cachePositions);
    };
  }, []);

  const navLinks = [
    { name: 'Início', href: '#inicio', id: 'inicio' },
    { name: 'Serviços', href: '#servicos', id: 'servicos' },
    { name: 'Sobre', href: '#sobre', id: 'sobre' },
    { name: 'Depoimentos', href: '#depoimentos', id: 'depoimentos' },
    { name: 'FAQ', href: '#faq', id: 'faq' },
    { name: 'Localização', href: '#localizacao', id: 'localizacao' },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4',
        isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-sm py-3'
          : 'bg-white/40 backdrop-blur-md shadow-sm py-3',
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center">
            <Image
              src={imgLogo}
              alt="Correa & Laia Advocacia"
              priority
              style={{ width: '96px', height: 'auto' }}
            />
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-all duration-300 hover:text-primary relative py-1',
                activeSection === link.id ? 'text-primary' : 'text-brand',
              )}
            >
              {link.name}
              {activeSection === link.id && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button
          id="button-menu"
          aria-label="Button menu"
          className="md:hidden text-brand"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'relative font-medium transition-colors py-2 pl-4',
                    activeSection === link.id
                      ? 'text-primary bg-primary/5'
                      : 'text-brand',
                  )}
                >
                  {activeSection === link.id && (
                    <motion.div
                      layoutId="activeNavMobile"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
