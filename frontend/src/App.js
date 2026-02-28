import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { Toaster } from 'react-hot-toast';
import '@rainbow-me/rainbowkit/styles.css';
import './styles.css';
import { wagmiConfig, chains } from './utils/wagmi';

// Pages
import Home from './pages/Home';
import ProjectList from './pages/ProjectList';
import ProjectDetails from './pages/ProjectDetails';
import AdminDashboard from './pages/AdminDashboard';
import AuthoritySign from './pages/AuthoritySign';
import Layout from './components/Layout';

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider 
        chains={chains}
        theme={darkTheme({
          accentColor: '#3B82F6',
          accentColorForeground: '#ffffff',
          borderRadius: 'large',
          fontStack: 'system',
        })}
      >
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/project/:projectId" element={<ProjectDetails />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/authority" element={<AuthoritySign />} />
            </Routes>
          </Layout>
        </Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#1a1a2e',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#1a1a2e',
              },
            },
          }}
        />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App;
