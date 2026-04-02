import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Target,
  Network,
  Menu,
  X,
  Sun,
  Moon,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/intents', label: 'Intents', icon: Target },
  { path: '/knowledge-graph', label: 'Knowledge Graph', icon: Network },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { sidebarOpen, toggleSidebar, darkMode, toggleDarkMode } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background flex">
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        className={`hidden lg:flex flex-col bg-background-secondary border-r border-border-subtle fixed h-full z-30 transition-all duration-300`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Target className="text-accent" size={20} />
              <span className="font-bold text-text">PM Suite</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-background-tertiary text-text-secondary"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:bg-background-tertiary hover:text-text'
                }`}
              >
                <item.icon size={18} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-border-subtle">
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-background-tertiary hover:text-text transition-colors"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {sidebarOpen && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </div>
      </motion.aside>

      <div className={`flex-1 flex flex-col min-h-screen ${sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[72px]'}`}>
        <header className="sticky top-0 z-20 bg-background-secondary/80 backdrop-blur-xl border-b border-border-subtle">
          <div className="flex items-center justify-between px-4 lg:px-6 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-background-tertiary text-text-secondary"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-sm font-medium text-text-secondary capitalize">
                {location.pathname === '/' ? 'Dashboard' : location.pathname.split('/').filter(Boolean).join(' / ')}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-md hover:bg-background-tertiary text-text-secondary">
                <Settings size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="fixed inset-y-0 left-0 w-[260px] bg-background-secondary z-50 lg:hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Target className="text-accent" size={20} />
                <span className="font-bold text-text">PM Suite</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-md hover:bg-background-tertiary text-text-secondary"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 px-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:bg-background-tertiary hover:text-text'
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
