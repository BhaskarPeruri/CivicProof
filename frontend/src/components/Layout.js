import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useContractRead } from 'wagmi';
import { Shield, List, User, Settings, Home } from 'lucide-react';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../utils/wagmi';

function Layout({ children }) {
  const { address, isConnected } = useAccount();
  const location = useLocation();

  // Check if connected wallet is the contract owner (admin)
  const { data: owner } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'owner',
    enabled: isConnected,
  });

  const isAdmin = isConnected && owner && address && owner.toLowerCase() === address.toLowerCase();

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/projects', label: 'Projects', icon: List },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: Settings }] : []),
    ...(isConnected ? [{ path: '/authority', label: 'Authority', icon: User }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      {/* Navigation */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  CivicProof
                </h1>
                <p className="text-xs text-slate-400">Public Infrastructure Transparency</p>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Wallet Connect */}
            <div className="flex items-center gap-4">
              {isAdmin && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30">
                  Admin
                </span>
              )}
              <ConnectButton
                accountStatus="address"
                chainStatus="icon"
                showBalance={false}
              />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-slate-800">
          <div className="flex overflow-x-auto px-4 py-2 gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="text-slate-400">CivicProof</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <span>Built on Monad Testnet</span>
              <span>•</span>
              <a 
                href="https://testnet-explorer.monad.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
              >
                Explorer
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
