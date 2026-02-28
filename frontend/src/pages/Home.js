import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, Users, ArrowRight, Building2 } from 'lucide-react';

function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-6">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-blue-300">Powered by Monad Blockchain</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Transparent Public Infrastructure
          <span className="block mt-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Verification Platform
          </span>
        </h1>
        
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
          CivicProof brings transparency to government infrastructure projects through 
          blockchain-based milestone verification and fund tracking.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/projects"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-medium hover:from-blue-500 hover:to-cyan-500 transition-all transform hover:-translate-y-0.5"
          >
            <FileText className="w-5 h-5" />
            View Projects
          </Link>
          <Link 
            to="/admin"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-all border border-slate-700"
          >
            <Shield className="w-5 h-5" />
            Admin Portal
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <h2 className="text-2xl font-bold text-center text-white mb-8">
          How CivicProof Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Building2,
              title: 'Project Creation',
              description: 'Admin creates infrastructure projects with sanctioned budgets and assigns verifying authorities.',
              color: 'blue',
            },
            {
              icon: FileText,
              title: 'Milestone Tracking',
              description: 'Funds are released in milestones with proof documentation uploaded to IPFS.',
              color: 'cyan',
            },
            {
              icon: Users,
              title: 'Authority Verification',
              description: 'Assigned authorities cryptographically sign to verify each milestone completion.',
              color: 'green',
            },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all"
              >
                <div className={`w-12 h-12 bg-${feature.color}-500/20 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Process Steps */}
      <section className="bg-slate-800/30 border border-slate-700 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-center text-white mb-8">
          Verification Process
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Create', desc: 'Project with budget & authorities' },
            { step: '2', title: 'Release', desc: 'Funds for each milestone' },
            { step: '3', title: 'Upload', desc: 'Proof documentation to IPFS' },
            { step: '4', title: 'Verify', desc: 'Authorities sign milestone' },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-white">{item.step}</span>
              </div>
              <h4 className="font-semibold text-white mb-1">{item.title}</h4>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Projects', value: 'On-Chain' },
          { label: 'Verification', value: 'EIP-712' },
          { label: 'Storage', value: 'IPFS' },
          { label: 'Network', value: 'Monad' },
        ].map((stat, index) => (
          <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-lg font-bold text-blue-400">{stat.value}</p>
            <p className="text-sm text-slate-400">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="text-center py-8">
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to explore public infrastructure projects?
          </h2>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">
            View all active projects, track fund utilization, and verify milestone completions.
          </p>
          <Link 
            to="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
          >
            Browse Projects
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
