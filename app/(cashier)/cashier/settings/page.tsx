'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Moon,
  Info,
  HelpCircle,
  Trash2,
  ChevronRight,
  Globe2,
  X,
} from 'lucide-react';
import SettingsHeader from '@/components/cashier/settings/SettingsHeader';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/useLanguage';
import ProfileSettings from '@/components/cashier/settings/ProfileSettings';
import PasswordSettings from '@/components/cashier/settings/PasswordSettings';
import LanguageSettings from '@/components/cashier/settings/LanguageSettings';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'profile' | 'password' | 'language' | null
  >(null);

  const supabase = createClientComponentClient();
  const router = useRouter();
  const { t, lang } = useLanguage();

  // ⭐ REAL USER DATA
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('User');
  const [userRole, setUserRole] = useState<string>('cashier');
  const [cashierName, setCashierName] = useState<string>('Cashiers');

  useEffect(() => {
    router.refresh();
  }, [lang, router]);

  // ⭐ Load real cashier info
  useEffect(() => {
    (async () => {
      const s = await supabase.auth.getSession();
      const session = s.data.session;

      if (!session) return;

      // Email from auth
      setUserEmail(session.user.email ?? '');

      // Role & cashier from me_effective_role
      const { data: roleData } = await supabase
        .from('me_effective_role')
        .select('role, full_name')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleData) {
        setUserRole(roleData.role);
        setCashierName(roleData.full_name || 'Cashier');
      }

      // If you store firstname/lastname in user_metadata
      const metadataName =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name;
      if (metadataName) setUserName(metadataName);
    })();
  }, []);

  async function handleLogout(e?: React.MouseEvent) {
    e?.preventDefault();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Logout error ignored:', err);
    } finally {
      router.refresh();
      router.replace('/auth/login');
    }
  }

  return (
    <div
      className={`min-h-screen bg-[var(--bg)] flex flex-col items-center px-4 py-6 transition-all duration-300 ${lang === 'ar' ? 'rtl' : 'ltr'
        }`}
    >
      <div className="w-full max-w-md space-y-6">
        {/* === Header === */}
        <SettingsHeader
          title={t.settings}
          subtitle={cashierName}
          user={{
            name: userName,
            email: userEmail || '-',
            role: userRole.replace('_', ' '),
            avatarUrl: '/icon-192-2.png',
          }}
          onLogout={handleLogout}
        />

        {/* === Account Section === */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          <SettingRow
            icon={<User />}
            label={t.profile}
            onClick={() => setActiveModal('profile')}
          />
          <SettingRow
            icon={<Lock />}
            label={t.password}
            onClick={() => setActiveModal('password')}
          />
          <SettingRow
            icon={<Globe2 />}
            label={t.language}
            right={
              lang === 'fr'
                ? 'Français'
                : lang === 'ar'
                  ? 'العربية 🇩🇿'
                  : 'English 🇬🇧'
            }
            onClick={() => setActiveModal('language')}
          />

        </div>

        {/* === App Info === */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          <SettingRow icon={<Info />} label={t.aboutApp || 'About application'} />
          <SettingRow icon={<HelpCircle className="w-5 h-5" />} label={t.help || 'Help / FAQ'} />
        </div>

        {/* === Logout Section === */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-50 divide-y divide-red-50 overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-red-50 transition cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl text-red-500 group-hover:bg-red-100 transition-colors">
                <Trash2 className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-red-600">Se déconnecter</span>
            </div>
            <ChevronRight className="w-4 h-4 text-red-200 group-hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* === Modals === */}
      {activeModal && (
        <SettingsModal onClose={() => setActiveModal(null)}>
          {activeModal === 'profile' && <ProfileSettings t={t} />}
          {activeModal === 'password' && <PasswordSettings t={t} />}
          {activeModal === 'language' && (
            <LanguageSettings
              onLanguageChanged={() => {
                setActiveModal(null);
                router.refresh();
              }}
            />
          )}
        </SettingsModal>
      )}
    </div>
  );
}

/* ---------------- Setting Row ---------------- */
function SettingRow({
  icon,
  label,
  right,
  toggle,
  toggleValue,
  onToggle,
  onClick,
  labelClass,
}: any) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="text-gray-600">{icon}</div>
        <span className={`text-sm ${labelClass ?? 'text-gray-800'}`}>{label}</span>
      </div>

      {toggle ? (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={toggleValue}
            onChange={onToggle}
          />
          <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-[var(--c-accent)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:rounded-full after:transition-all peer-checked:after:translate-x-4"></div>
        </label>
      ) : right ? (
        <span className="text-sm text-gray-500">{right}</span>
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-400" />
      )}
    </div>
  );
}

/* ---------------- Modal Wrapper ---------------- */
function SettingsModal({ children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl p-5 shadow-lg border border-gray-100 animate-slide-up">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold text-gray-800">Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
