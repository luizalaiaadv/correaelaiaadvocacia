'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Facebook, Chrome } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  // Aba "Leads" oculta a pedido do cliente. A rota /dashboard continua acessivel
  // por URL; para reexibir, restaure a linha abaixo.
  // { href: '/dashboard', label: 'Leads', icon: Users },
  { href: '/dash-meta', label: 'Meta', icon: Facebook },
  { href: '/dash-google', label: 'Google', icon: Chrome },
];

/** Navegacao entre os tres paineis do cliente (leads, Meta, Google). */
export default function DashboardSwitcher() {
  const pathname = usePathname();

  return (
    <nav aria-label="Trocar de painel" className="glass-panel flex gap-1 rounded-xl p-1">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
              active ? 'bg-accent text-[#0f1020]' : 'text-white/55 hover:text-white',
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
