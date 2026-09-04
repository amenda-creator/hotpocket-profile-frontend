import { Link, NavLink, Outlet, type NavLinkRenderProps } from 'react-router-dom';
import { UserRound, Server } from 'lucide-react';
import clsx from 'clsx';

const APP_NAME = 'Evernode Profile Hub';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              PH
            </span>
            {APP_NAME}
          </Link>

          <div className="flex items-center gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }: NavLinkRenderProps) =>
                clsx(
                  'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100',
                )
              }
            >
              <UserRound className="h-4 w-4" />
              Profile
            </NavLink>

            <NavLink
              to="/cluster"
              className={({ isActive }: NavLinkRenderProps) =>
                clsx(
                  'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100',
                )
              }
            >
              <Server className="h-4 w-4" />
              Cluster
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-100 py-6 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
