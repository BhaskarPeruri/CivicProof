import React, { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContractRead, useContractReads } from 'wagmi';
import { Building2, ChevronRight, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../utils/wagmi';

function ProjectList() {
  const [projects, setProjects] = useState([]);

  const isZeroAddress = !CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000';

  // Get total project count (disabled when contract not deployed - shows "No projects" immediately)
  const { data: projectCount, isLoading: countLoading, isError: countError } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getProjectCount',
    enabled: !isZeroAddress,
  });

  const count = projectCount !== undefined && projectCount !== null ? Number(projectCount) : 0;

  // Batch-read full project data for all projects (scheme + completed) from contract
  const contracts = useMemo(() => {
    if (count <= 0) return [];
    return Array.from({ length: count }, (_, i) => ({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getProjectCompleteData',
      args: [BigInt(i)],
    }));
  }, [count]);

  const { data: projectsData, isLoading: readsLoading } = useContractReads({
    contracts,
    allowFailure: true,
    enabled: !isZeroAddress && count > 0,
  });

  // Derive project list from contract read results
  useEffect(() => {
    if (count === 0) {
      setProjects([]);
      return;
    }
    if (!projectsData || projectsData.length === 0) return;
    const list = projectsData.map((result, i) => {
      if (result.status !== 'success' || !result.result) {
        return { id: i, scheme: `Project #${i + 1}`, completed: false };
      }
      const d = result.result;
      return {
        id: i,
        scheme: d.scheme || `Project #${i + 1}`,
        completed: !!d.completed,
      };
    });
    setProjects(list);
  }, [projectsData, count]);

  // No contract deployed - show "No projects" immediately
  if (isZeroAddress) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">No Projects Yet</h2>
        <p className="text-slate-400">Projects will appear here once the contract is deployed and projects are created.</p>
      </div>
    );
  }

  // Only show loading when actually fetching - not when there are 0 projects
  const loading = countLoading || (count > 0 && readsLoading);
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <span className="ml-3 text-slate-400">Loading projects...</span>
      </div>
    );
  }

  if (countError) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Error Loading Projects</h2>
        <p className="text-slate-400">Please check your connection and try again.</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">No Projects Yet</h2>
        <p className="text-slate-400">Projects will appear here once created by the admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Infrastructure Projects</h1>
          <p className="text-slate-400 mt-1">
            Click on a project to view full details and milestone information
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-blue-400">{projects.length}</span>
          <p className="text-sm text-slate-400">Total Projects</p>
        </div>
      </div>

      {/* Project List */}
      <div className="grid gap-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/project/${project.id}`}
            className="group bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 hover:bg-slate-800 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {project.scheme}
                  </h3>
                  <p className="text-sm text-slate-400">
                    Project ID: {project.id}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {project.completed ? (
                  <span className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full border border-green-500/30">
                    <CheckCircle className="w-4 h-4" />
                    Completed
                  </span>
                ) : (
                  <span className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full border border-yellow-500/30">
                    <Clock className="w-4 h-4" />
                    In Progress
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Transparent Verification</h3>
            <p className="text-slate-400 text-sm">
              All project details, fund releases, and milestone verifications are stored on the 
              Monad blockchain. Click any project to view complete transparency data including 
              authority signatures and IPFS proof documentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectList;
