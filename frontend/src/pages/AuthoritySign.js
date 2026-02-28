import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction, useSignTypedData } from 'wagmi';
import { 
  User, 
  FileSignature, 
  CheckCircle, 
  Loader2,
  AlertCircle,
  ExternalLink,
  Shield
} from 'lucide-react';
import { CONTRACT_ABI, CONTRACT_ADDRESS, EIP712_DOMAIN, EIP712_TYPES } from '../utils/wagmi';
import { formatEther } from 'viem';
import toast from 'react-hot-toast';

function AuthoritySign() {
  const { address, isConnected } = useAccount();
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [projects, setProjects] = useState([]);
  const [projectData, setProjectData] = useState(null);

  // Get project count
  const { data: projectCount } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getProjectCount',
  });

  // Fetch project data when selected
  const { data: projectFullData } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getProjectCompleteData',
    args: selectedProject ? [BigInt(selectedProject)] : undefined,
    enabled: !!selectedProject,
  });

  useEffect(() => {
    if (projectCount) {
      const count = Number(projectCount);
      const projectList = [];
      for (let i = 0; i < count; i++) {
        projectList.push({ id: i, name: `Project #${i + 1}` });
      }
      setProjects(projectList);
    }
  }, [projectCount]);

  useEffect(() => {
    if (projectFullData) {
      setProjectData({
        scheme: projectFullData.scheme,
        milestones: projectFullData.milestones,
        authorities: projectFullData.authorities,
      });
    }
  }, [projectFullData]);

  // Get nonce for the authority
  const { data: nonce } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'nonces',
    args: selectedProject && address ? [BigInt(selectedProject), address] : undefined,
    enabled: !!selectedProject && !!address,
  });

  // Sign typed data
  const { signTypedData, data: signature } = useSignTypedData({
    domain: EIP712_DOMAIN,
    types: EIP712_TYPES,
    primaryType: 'SignMilestone',
    message: selectedProject && selectedMilestone && projectData ? {
      projectId: BigInt(selectedProject),
      milestoneId: BigInt(selectedMilestone),
      proofCID: projectData.milestones[Number(selectedMilestone)]?.proofCID || '',
      nonce: nonce || 0n,
    } : undefined,
  });

  // Submit signature to contract
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'submitMilestoneSignature',
    args: selectedProject && selectedMilestone && signature && projectData ? [
      BigInt(selectedProject),
      BigInt(selectedMilestone),
      projectData.milestones[Number(selectedMilestone)]?.proofCID || '',
      nonce || 0n,
      signature,
    ] : undefined,
    enabled: !!selectedProject && !!selectedMilestone && !!signature,
  });

  const { write, data: txData } = useContractWrite(config);
  const { isLoading, isSuccess } = useWaitForTransaction({ hash: txData?.hash });

  // Check if user is an authority for the selected project
  const isAuthority = projectData && address && projectData.authorities.some(
    auth => auth.wallet.toLowerCase() === address.toLowerCase()
  );

  // Check if user has already signed (would need a contract call to check hasSigned mapping)

  const handleSign = async () => {
    if (!isAuthority) {
      toast.error('You are not an authorized signer for this project');
      return;
    }

    if (!projectData.milestones[Number(selectedMilestone)]?.proofCID) {
      toast.error('No proof has been uploaded for this milestone yet');
      return;
    }

    try {
      toast.loading('Please sign the message in your wallet...');
      signTypedData();
    } catch (error) {
      console.error('Signing error:', error);
      toast.error('Failed to sign');
    }
  };

  const handleSubmit = () => {
    if (write) {
      write();
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success('Milestone signature submitted successfully!');
    }
  }, [isSuccess]);

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Connect Wallet</h2>
        <p className="text-slate-400">Please connect your wallet to sign milestones.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Authority Portal</h1>
          <p className="text-slate-400 mt-1">Sign milestones to verify project completion</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">Authority</span>
        </div>
      </div>

      {/* Selection */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Select Project *</label>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSelectedMilestone('');
              }}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Select Milestone *</label>
            <select
              value={selectedMilestone}
              onChange={(e) => setSelectedMilestone(e.target.value)}
              disabled={!selectedProject || !projectData}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">Select a milestone</option>
              {projectData?.milestones.map((milestone, index) => (
                <option key={index} value={index}>
                  Milestone #{index + 1} - {formatEther(milestone.amountReleased)} MON
                  {milestone.verified ? ' (Verified)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Milestone Details */}
        {selectedProject && selectedMilestone && projectData && (
          <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Milestone Details</h3>
            
            {(() => {
              const milestone = projectData.milestones[Number(selectedMilestone)];
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Amount Released</p>
                      <p className="text-white font-medium">{formatEther(milestone.amountReleased)} MON</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Amount Utilized</p>
                      <p className="text-white font-medium">{formatEther(milestone.amountUtilized)} MON</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Signatures</p>
                      <p className="text-white font-medium">
                        {milestone.signatureCount.toString()} / {projectData.authorities.length}
                      </p>
                    </div>
                  </div>

                  {milestone.proofCID ? (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Proof Document</p>
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${milestone.proofCID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on IPFS
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">No proof document uploaded yet</span>
                    </div>
                  )}

                  {milestone.verified && (
                    <div className="flex items-center gap-2 text-green-400 bg-green-500/10 p-3 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span>This milestone has been fully verified</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Authority Status */}
        {selectedProject && (
          <div className={`p-4 rounded-lg ${isAuthority ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            <div className="flex items-center gap-3">
              {isAuthority ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-green-400 font-medium">You are an authorized signer</p>
                    <p className="text-sm text-green-400/70">Your wallet is registered as an authority for this project</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-red-400 font-medium">Not an authorized signer</p>
                    <p className="text-sm text-red-400/70">Your wallet is not registered as an authority for this project</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Sign Button */}
        {selectedProject && selectedMilestone && isAuthority && (
          <div className="space-y-4">
            {!signature ? (
              <button
                onClick={handleSign}
                disabled={!projectData?.milestones[Number(selectedMilestone)]?.proofCID}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-medium transition-all disabled:opacity-50"
              >
                <FileSignature className="w-5 h-5" />
                Sign Milestone
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!write || isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Signature to Blockchain
                  </>
                )}
              </button>
            )}

            {signature && (
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <p className="text-xs text-slate-500 mb-2">Signature Generated:</p>
                <p className="text-xs text-slate-400 font-mono break-all">{signature}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileSignature className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">EIP-712 Signature</h3>
            <p className="text-slate-400 text-sm">
              Milestone signatures use EIP-712 typed data signing for security and clarity. 
              When you sign, you're cryptographically verifying that the milestone proof is 
              accurate and the funds have been properly utilized. All signatures are recorded 
              on the Monad blockchain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthoritySign;
