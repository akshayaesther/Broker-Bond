import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Users, KanbanSquare, Globe, LogOut, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = [
  { path: '/', label: 'nav.dashboard', icon: LayoutDashboard },
  { path: '/candidates', label: 'nav.candidates', icon: Users },
  { path: '/pipeline', label: 'nav.pipeline', icon: KanbanSquare },
  { path: '/network', label: 'nav.network', icon: Globe },
];

const Layout = ({ children }) => {
  const { logout, broker } = useContext(AuthContext);
  const { t } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-cream">
      {menuOpen && <button aria-label={t('common.closeMenu')} onClick={() => setMenuOpen(false)} className="fixed inset-0 bg-charcoal/50 z-30 md:hidden" />}
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-charcoal text-white flex flex-col flex-shrink-0 shadow-xl transform transition-transform duration-150 md:relative md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold font-heading text-sm shadow-md">BB</div>
            <div>
              <h1 className="text-xl font-bold font-heading text-white leading-none">Broker-Bond</h1>
              <p className="text-[10px] text-white/40 tracking-widest uppercase mt-0.5">{t('common.productType')}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-white/60 group-hover:text-white'} />
                <span className="font-medium text-sm">{t(item.label)}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60"></span>}
              </Link>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="p-4 border-t border-white/10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-white/50">{t('common.language')}</span>
            <LanguageSwitcher dark />
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-primary/30 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {broker?.name?.charAt(0) || 'B'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{broker?.name}</p>
              <p className="text-white/40 text-xs truncate">{t('common.broker')}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-white/40 hover:text-red-400 transition-colors rounded-lg hover:bg-white/10"
              title={t('nav.logout')}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5 md:hidden">
            <button aria-label={menuOpen ? t('common.closeMenu') : t('common.openMenu')} onClick={() => setMenuOpen(current => !current)} className="p-2 rounded-lg bg-charcoal text-white shadow-sm">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="font-heading font-bold text-charcoal">Broker-Bond</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
