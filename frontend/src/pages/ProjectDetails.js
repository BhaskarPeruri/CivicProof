import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContractRead } from 'wagmi';
import { 
  Building2, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Users, 
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle,
  Wallet,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../utils/wagmi';
import { formatEther } from 'viem';

function ProjectDetails() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch project complete data
  const { data: projectData, isError, isLoading } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getProjectCompleteData',
    args: [BigInt(projectId)],
    enabled: !!projectId,
  });

  useEffect(() => {
    if (projectData) {
      setProject({
        scheme: projectData.scheme,
        projectDocumentCID: projectData.projectDocumentCID,
        sanctionedAmount: projectData.sanctionedAmount,
        totalReleased: projectData.totalReleased,
        totalUtilized: projectData.totalUtilized,
        completed: projectData.completed,
        createdAt: Number(projectData.createdAt) * 1000,
        authorities: projectData.authorities,
        milestones: projectData.milestones,
      });
      setLoading(false);
    }
  }, [projectData]);

  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format address
  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!project) return 0;
    if (project.sanctionedAmount === 0n) return 0;
    return Math.min(100, Number((project.totalUtilized * 100n) / project.sanctionedAmount));
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <span className="ml-3 text-slate-400">Loading project details...</span>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Project Not Found</h2>
        <p className="text-slate-400 mb-6">The project you're looking for doesn't exist.</p>
        <Link 
          to="/projects"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Projects
        </Link>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link 
        to="/projects"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Projects
      </Link>

      {/* Project Header */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{project.scheme}</h1>
              <p className="text-slate-400">Project ID: {projectId}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {project.completed ? (
              <span className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                <CheckCircle className="w-5 h-5" />
                Completed
              </span>
            ) : (
              <span className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
                <Clock className="w-5 h-5" />
                In Progress
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-slate-400">Sanctioned Amount</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatEther(project.sanctionedAmount)} MON
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-slate-400">Total Released</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatEther(project.totalReleased)} MON
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-slate-400">Total Utilized</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatEther(project.totalUtilized)} MON
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400">Project Progress</span>
          <span className="text-white font-semibold">{progress}%</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-slate-400 mt-2">
          {formatEther(project.totalUtilized)} of {formatEther(project.sanctionedAmount)} MON utilized
        </p>
      </div>

      {/* Project Document */}
      {project.projectDocumentCID && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Project Document</h3>
          </div>
          <a
            href={`https://gateway.pinata.cloud/ipfs/${project.projectDocumentCID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors border border-blue-500/30"
          >
            <ExternalLink className="w-4 h-4" />
            View Document on IPFS
          </a>
        </div>
      )}

      {/* Authorities */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Verifying Authorities</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.authorities.map((authority, index) => (
            <div 
              key={index}
              className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
            >
              <p className="font-medium text-white">{authority.name}</p>
              <p className="text-sm text-slate-400">{authority.designation}</p>
              <p className="text-xs text-slate-500 font-mono mt-1">
                {formatAddress(authority.wallet)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Milestones</h3>
        </div>
        
        {project.milestones.length === 0 ? (
          <p className="text-slate-400">No milestones released yet.</p>
        ) : (
          <div className="space-y-4">
            {project.milestones.map((milestone, index) => (
              <div 
                key={index}
                className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-white">Milestone #{index + 1}</span>
                  {milestone.verified ? (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-500">Released</p>
                    <p className="text-sm text-white">{formatEther(milestone.amountReleased)} MON</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Utilized</p>
                    <p className="text-sm text-white">{formatEther(milestone.amountUtilized)} MON</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Signatures</p>
                    <p className="text-sm text-white">{milestone.signatureCount.toString()} / {project.authorities.length}</p>
                  </div>
                </div>

                {milestone.proofCID && (
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${milestone.proofCID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Proof
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Created Date */}
      <div className="text-center text-slate-500 text-sm">
        Project created on {formatDate(project.createdAt)}
      </div>
    </div>
  );
}

export default ProjectDetails;
