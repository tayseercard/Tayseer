'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Lock,
  Moon,
  Info,
  HelpCircle,
  Trash2,
  Globe2,
  Shield,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import SettingsHeader from '@/components/admin/settings/SettingsHeader'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/useLanguage'
import ProfileSettings from '@/components/admin/settings/ProfileSettings'
import PasswordSettings from '@/components/admin/settings/PasswordSettings'
import LanguageSettings from '@/components/admin/settings/LanguageSettings'
import RolesSettings from '@/components/admin/settings/RolesSettings'

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [activeModal, setActiveModal] = useState<
    'profile' | 'password' | 'language' | 'roles' | null
  >(null)

  const supabase = createClientComponentClient()
  const router = useRouter()
  const { t, lang } = useLanguage()

  // ✅ Refresh on language change
  useEffect(() => {
    router.refresh()
  }, [lang, router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div
      className={`min-h-screen bg-[var(--bg)] flex flex-col items-center transition-all duration-300 ${
        lang === 'ar' ? 'rtl' : 'ltr'
      }`}
    >
      {/* === HEADER === */}
      <div className="w-full max-w-6xl px-4 md:px-8 py-8">
        <SettingsHeader
          title={t.settings}
          subtitle={t.managePref}
          user={{
            name: 'Djamil',
            email: 'djamil@tayseer.dz',
            role: 'Admin',
            avatarUrl: '/icon-192-2.png',
          }}
          onLogout={handleLogout}
        />
      </div>

      {/* === CONTENT GRID === */}
      <div className="w-full max-w-6xl px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* === ACCOUNT SETTINGS === */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 font-medium text-gray-700">
            {t.accountSettings || 'Account Settings'}
          </div>
          <div className="divide-y divide-gray-100">
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
            <SettingRow
              icon={<Shield />}
              label={t.roles}
              onClick={() => setActiveModal('roles')}
            />
          </div>
        </div>

        {/* === APP PREFERENCES === */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 font-medium text-gray-700">
            {t.preferences || 'Preferences'}
          </div>
          <div className="divide-y divide-gray-100">
            <SettingRow
              icon={<Moon />}
              label={t.darkMode}
              toggle
              toggleValue={darkMode}
              onToggle={() => setDarkMode(!darkMode)}
            />
            <SettingRow
              icon={<Info />}
              label={t.aboutApp || 'About application'}
            />
            <SettingRow
              icon={<HelpCircle />}
              label={t.help || 'Help & FAQ'}
            />
            <SettingRow
              icon={<Trash2 className="text-rose-500" />}
              label={t.deactivate || 'Deactivate my account'}
              labelClass="text-rose-600 font-medium"
            />
          </div>
        </div>

        {/* === LOGOUT PANEL === */}
        <div className="md:col-span-2 flex justify-center mt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-rose-50 text-rose-600 px-5 py-2 rounded-lg hover:bg-rose-100 border border-rose-200"
          >
            <LogOut className="w-4 h-4" /> {t.logout || 'Log out'}
          </button>
        </div>
      </div>

      {/* === MOBILE (Compact Card View) === */}
      <div className="sm:hidden w-full max-w-md px-4 mb-10 space-y-4">
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
          <SettingRow
            icon={<Shield />}
            label={t.roles}
            onClick={() => setActiveModal('roles')}
          />
          <SettingRow
            icon={<Moon />}
            label={t.darkMode}
            toggle
            toggleValue={darkMode}
            onToggle={() => setDarkMode(!darkMode)}
          />
          <SettingRow
            icon={<Trash2 className="text-rose-500" />}
            label={t.deactivate || 'Deactivate my account'}
            labelClass="text-rose-600 font-medium"
          />
        </div>
      </div>

      {/* === MODALS === */}
      {activeModal && (
        <SettingsModal onClose={() => setActiveModal(null)}>
          {activeModal === 'profile' && <ProfileSettings t={t} />}
          {activeModal === 'password' && <PasswordSettings t={t} />}
          {activeModal === 'language' && (
            <LanguageSettings
              onLanguageChanged={() => {
                setActiveModal(null)
                router.refresh()
              }}
            />
          )}
          {activeModal === 'roles' && <RolesSettings t={t} />}
        </SettingsModal>
      )}
    </div>
  )
}

/* ------------------- Setting Row ------------------- */
function SettingRow({
  icon,
  label,
  right,
  toggle,
  toggleValue,
  onToggle,
  onClick,
  labelClass,
}: {
  icon: React.ReactNode
  label: string
  right?: string
  toggle?: boolean
  toggleValue?: boolean
  onToggle?: () => void
  onClick?: () => void
  labelClass?: string
}) {
  return (
    <div
      onClick={!toggle ? onClick : undefined}
      className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="text-gray-600">{icon}</div>
        <span className={`text-sm ${labelClass ?? 'text-gray-800'}`}>
          {label}
        </span>
      </div>

      {toggle ? (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={toggleValue}
            onChange={onToggle}
          />
          <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-[var(--c-accent)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:rounded-full after:transition-all peer-checked:after:translate-x-5"></div>
        </label>
      ) : right ? (
        <span className="text-sm text-gray-500">{right}</span>
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-400" />
      )}
    </div>
  )
}

/* ------------------- Modal Wrapper ------------------- */
/* ------------------- Modal Wrapper ------------------- */
function SettingsModal({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  // detect screen width
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/40 backdrop-blur-sm
        flex items-center justify-center
        animate-fade-in
      "
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`
          relative bg-white shadow-xl border border-gray-100
          ${isMobile
            ? 'w-full h-full rounded-none animate-slide-up flex flex-col'
            : 'w-full max-w-3xl rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto'
          }
        `}
      >
        {/* === Header Bar === */}
        <div
          className={`
            flex items-center justify-between
            ${isMobile
              ? 'px-4 py-3 border-b sticky top-0 bg-white z-10'
              : 'mb-4'
            }
          `}
        >
          <h2
            className={`${
              isMobile
                ? 'text-base font-semibold text-gray-800'
                : 'text-lg font-semibold text-gray-800'
            }`}
          >
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* === Modal Content === */}
        <div
          className={`flex-1 ${
            isMobile ? 'overflow-y-auto px-4 pb-6' : ''
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

