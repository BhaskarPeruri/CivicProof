import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { 
  Shield, 
  Plus, 
  Upload, 
  DollarSign, 
  TrendingUp, 
  Loader2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { CONTRACT_ABI, CONTRACT_ADDRESS, API_URL } from '../utils/wagmi';
import { parseEther, formatEther } from 'viem';
import toast from 'react-hot-toast';
import axios from 'axios';

function AdminDashboard() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('create');
  const [projects, setProjects] = useState([]);

  // Check if connected wallet is the contract owner
  const isZeroAddress = !CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000';
  const { data: owner, isLoading: ownerLoading, isError: ownerError } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'owner',
    enabled: isConnected && !isZeroAddress,
  });

  const isAdmin = isConnected && owner && address && owner.toLowerCase() === address.toLowerCase();

  // Get project count
  const { data: projectCount } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getProjectCount',
  });

  // Fetch projects
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

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Connect Wallet</h2>
        <p className="text-slate-400">Please connect your wallet to access the admin dashboard.</p>
      </div>
    );
  }

  if (isZeroAddress) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Contract Not Configured</h2>
        <p className="text-slate-400 mb-4">Set the deployed contract address in your frontend .env file.</p>
        <p className="text-sm text-slate-500">
          Deploy the contract: <code className="bg-slate-800 px-2 py-1 rounded">cd contracts && forge script script/DeployCivicProof.s.sol</code><br />
          Then add to <code className="bg-slate-800 px-2 py-1 rounded">frontend/.env</code>:<br />
          <code className="bg-slate-800 px-2 py-1 rounded mt-2 inline-block">REACT_APP_CONTRACT_ADDRESS=0xYourDeployedAddress</code>
        </p>
      </div>
    );
  }

  if (ownerLoading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
        <h2 className="text-xl font-semibold text-white mb-2">Checking access...</h2>
        <p className="text-slate-400">Verifying contract owner.</p>
      </div>
    );
  }

  if (ownerError || (owner === undefined && !ownerLoading)) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Could Not Load Contract</h2>
        <p className="text-slate-400 mb-4">Ensure you are on Monad Testnet and the contract is deployed at the address in .env.</p>
        <p className="text-sm text-slate-500">
          Contract address: {CONTRACT_ADDRESS}<br />
          Your address: {address}
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
        <p className="text-slate-400">Only the contract owner can access the admin dashboard.</p>
        <p className="text-sm text-slate-500 mt-2">
          Your address: {address}<br />
          Owner address: {owner}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage infrastructure projects and fund releases</p>
        </div>
        <span className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 font-medium">
          Admin Access
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        {[
          { id: 'create', label: 'Create Project', icon: Plus },
          { id: 'funds', label: 'Release Funds', icon: DollarSign },
          { id: 'utilization', label: 'Update Utilization', icon: TrendingUp },
          { id: 'proof', label: 'Upload Proof', icon: Upload },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        {activeTab === 'create' && <CreateProjectForm />}
        {activeTab === 'funds' && <ReleaseFundsForm projects={projects} />}
        {activeTab === 'utilization' && <UpdateUtilizationForm projects={projects} />}
        {activeTab === 'proof' && <UploadProofForm projects={projects} />}
      </div>
    </div>
  );
}

// Create Project Form
function CreateProjectForm() {
  const [scheme, setScheme] = useState('');
  const [sanctionedAmount, setSanctionedAmount] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [authorities, setAuthorities] = useState([{ name: '', designation: '', wallet: '' }]);
  const [uploading, setUploading] = useState(false);
  const [projectDocumentCID, setProjectDocumentCID] = useState(null);
  const [pendingContractWrite, setPendingContractWrite] = useState(false);
  const createToastIdRef = React.useRef(null);

  const addAuthority = () => {
    setAuthorities([...authorities, { name: '', designation: '', wallet: '' }]);
  };

  const removeAuthority = (index) => {
    setAuthorities(authorities.filter((_, i) => i !== index));
  };

  const updateAuthority = (index, field, value) => {
    const newAuthorities = [...authorities];
    newAuthorities[index][field] = value;
    setAuthorities(newAuthorities);
  };

  const isValid = scheme && sanctionedAmount && authorities.every(a => a.name && a.wallet);
  const names = authorities.map(a => a.name);
  const designations = authorities.map(a => a.designation);
  const wallets = authorities.map(a => a.wallet);

  // Prepare contract write - enabled when we have CID and form is valid
  const { config, status: prepareStatus, error: prepareError } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'createProject',
    args: isValid && projectDocumentCID !== null ? [
      scheme,
      projectDocumentCID,
      parseEther(sanctionedAmount),
      names,
      designations,
      wallets,
    ] : undefined,
    enabled: pendingContractWrite && isValid && projectDocumentCID !== null,
  });

  const { write, data, error: writeError } = useContractWrite(config);
  const { isLoading } = useWaitForTransaction({ hash: data?.hash });

  // Show write error (e.g. user rejected transaction)
  useEffect(() => {
    if (writeError) {
      toast.error(writeError.message || 'Transaction failed', { id: createToastIdRef.current });
    }
  }, [writeError]);

  // Trigger write when config is ready after upload
  useEffect(() => {
    if (pendingContractWrite && prepareStatus === 'success' && write) {
      write();
      setPendingContractWrite(false);
    }
  }, [pendingContractWrite, prepareStatus, write]);

  // Show prepare error (e.g. contract revert, invalid args)
  useEffect(() => {
    if (pendingContractWrite && prepareStatus === 'error' && prepareError) {
      toast.error(prepareError.message || 'Failed to prepare transaction', { id: createToastIdRef.current });
      setPendingContractWrite(false);
    }
  }, [pendingContractWrite, prepareStatus, prepareError]);

  // Upload document to IPFS
  const uploadDocument = async () => {
    if (!documentFile) return '';
    const formData = new FormData();
    formData.append('document', documentFile);
    const response = await axios.post(`${API_URL}/upload`, formData);
    return response.data.ipfsHash;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!scheme || !sanctionedAmount || authorities.some(a => !a.name || !a.wallet)) {
      toast.error('Please fill all required fields');
      return;
    }

    if (authorities.some(a => a.wallet && !/^0x[a-fA-F0-9]{40}$/.test(a.wallet))) {
      toast.error('Please enter valid Ethereum addresses for authorities');
      return;
    }

    try {
      setUploading(true);

      let cid = '';
      if (documentFile) {
        const toastId = toast.loading('Uploading document to IPFS...');
        try {
          cid = await uploadDocument();
          toast.success('Document uploaded!', { id: toastId });
        } catch (uploadErr) {
          const errMsg = uploadErr.response?.data?.message || uploadErr.response?.data?.error || uploadErr.message;
          toast.error(errMsg || 'Document upload failed. Check backend is running and PINATA_JWT is set.', { id: toastId });
          throw uploadErr;
        }
      }

      setProjectDocumentCID(cid);
      setPendingContractWrite(true);
      createToastIdRef.current = toast.loading('Creating project on blockchain...');
    } catch (error) {
      console.error('Error:', error);
      const msg = error?.response?.data?.message || error?.message || error?.shortMessage;
      toast.error(msg || 'Failed to create project');
    } finally {
      setUploading(false);
    }
  };

  // Reset form after successful transaction
  useEffect(() => {
    if (data?.hash && !isLoading) {
      setScheme('');
      setSanctionedAmount('');
      setDocumentFile(null);
      setAuthorities([{ name: '', designation: '', wallet: '' }]);
      setProjectDocumentCID(null);
      toast.success('Project created!', { id: createToastIdRef.current });
    }
  }, [data?.hash, isLoading]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Create New Project</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Project Name/Scheme *</label>
          <input
            type="text"
            value={scheme}
            onChange={(e) => setScheme(e.target.value)}
            placeholder="e.g., NH-44 Highway Expansion"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm text-slate-400 mb-2">Sanctioned Amount (MON) *</label>
          <input
            type="number"
            value={sanctionedAmount}
            onChange={(e) => setSanctionedAmount(e.target.value)}
            placeholder="e.g., 1000"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Project Document</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setDocumentFile(e.target.files[0])}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm text-slate-400">Verifying Authorities *</label>
          <button
            type="button"
            onClick={addAuthority}
            className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
          >
            <Plus className="w-4 h-4" />
            Add Authority
          </button>
        </div>
        
        <div className="space-y-4">
          {authorities.map((authority, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <input
                type="text"
                value={authority.name}
                onChange={(e) => updateAuthority(index, 'name', e.target.value)}
                placeholder="Name"
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <input
                type="text"
                value={authority.designation}
                onChange={(e) => updateAuthority(index, 'designation', e.target.value)}
                placeholder="Designation"
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={authority.wallet}
                  onChange={(e) => updateAuthority(index, 'wallet', e.target.value)}
                  placeholder="Wallet Address"
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                {authorities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAuthority(index)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={uploading || isLoading || pendingContractWrite}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-medium transition-all disabled:opacity-50"
      >
        {uploading || isLoading || pendingContractWrite ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            Create Project
          </>
        )}
      </button>
    </form>
  );
}

// Release Funds Form
function ReleaseFundsForm({ projects }) {
  const [selectedProject, setSelectedProject] = useState('');
  const [amount, setAmount] = useState('');

  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'releaseFunds',
    args: selectedProject && amount ? [BigInt(selectedProject), parseEther(amount)] : undefined,
    enabled: !!selectedProject && !!amount,
  });

  const { write, data } = useContractWrite(config);
  const { isLoading } = useWaitForTransaction({ hash: data?.hash });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (write) {
      write();
      toast.success('Funds released!');
      setAmount('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Release Funds</h3>
      
      <div>
        <label className="block text-sm text-slate-400 mb-2">Select Project *</label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Amount to Release (MON) *</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 100"
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={!write || isLoading}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-medium transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Releasing...
          </>
        ) : (
          <>
            <DollarSign className="w-5 h-5" />
            Release Funds
          </>
        )}
      </button>
    </form>
  );
}

// Update Utilization Form
function UpdateUtilizationForm({ projects }) {
  const [selectedProject, setSelectedProject] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [amount, setAmount] = useState('');

  // Fetch project data to get valid milestones when project is selected
  const { data: projectData } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getProjectCompleteData',
    args: selectedProject !== '' ? [BigInt(selectedProject)] : undefined,
    enabled: !!selectedProject,
  });

  const milestones = projectData?.milestones ?? [];
  const hasMilestones = milestones.length > 0;

  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'updateUtilization',
    args: selectedProject && milestoneId !== '' && amount ? 
      [BigInt(selectedProject), BigInt(milestoneId), parseEther(amount)] : undefined,
    enabled: !!selectedProject && milestoneId !== '' && !!amount && hasMilestones,
  });

  const { write, data } = useContractWrite(config);
  const { isLoading } = useWaitForTransaction({ hash: data?.hash });

  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
    setMilestoneId('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (write) {
      write();
      toast.success('Utilization updated!');
      setAmount('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Update Utilization</h3>
      
      <div>
        <label className="block text-sm text-slate-400 mb-2">Select Project *</label>
        <select
          value={selectedProject}
          onChange={handleProjectChange}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Milestone *</label>
        <select
          value={milestoneId}
          onChange={(e) => setMilestoneId(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          disabled={!hasMilestones}
        >
          <option value="">
            {!selectedProject ? 'Select a project first' : !hasMilestones ? 'No milestones (release funds first)' : 'Select milestone'}
          </option>
          {milestones.map((m, idx) => (
            <option key={idx} value={idx}>
              Milestone {idx}: Released {formatEther(m.amountReleased)} MON · Utilized {formatEther(m.amountUtilized)} MON
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Amount Utilized (MON) *</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 50"
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={!write || isLoading}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-medium transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Updating...
          </>
        ) : (
          <>
            <TrendingUp className="w-5 h-5" />
            Update Utilization
          </>
        )}
      </button>
    </form>
  );
}

// Upload Proof Form
function UploadProofForm({ projects }) {
  const [selectedProject, setSelectedProject] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch project data to get valid milestones when project is selected
  const { data: projectData } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getProjectCompleteData',
    args: selectedProject !== '' ? [BigInt(selectedProject)] : undefined,
    enabled: !!selectedProject,
  });

  const milestones = projectData?.milestones ?? [];
  const hasMilestones = milestones.length > 0;

  // Use mode: 'recklesslyUnprepared' so we can pass CID dynamically after IPFS upload
  const { writeAsync: writeProof, data } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'uploadMilestoneProof',
    mode: 'recklesslyUnprepared',
  });
  const { isLoading } = useWaitForTransaction({ hash: data?.hash });

  const uploadProof = async () => {
    if (!proofFile) return '';
    
    const formData = new FormData();
    formData.append('document', proofFile);
    
    const response = await axios.post(`${API_URL}/upload`, formData);
    
    return response.data.ipfsHash;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!proofFile) {
      toast.error('Please select a proof file');
      return;
    }
    if (!selectedProject || milestoneId === '') {
      toast.error('Please select project and milestone');
      return;
    }

    try {
      setUploading(true);
      const toastId = toast.loading('Uploading proof to IPFS...');
      const cid = await uploadProof();
      toast.loading('Linking proof to blockchain...', { id: toastId });
      
      await writeProof({
        args: [BigInt(selectedProject), BigInt(milestoneId), cid],
      });
      
      toast.success('Proof linked to milestone!', { id: toastId });
      setProofFile(null);
      setMilestoneId('');
    } catch (error) {
      console.error('Upload proof error:', error);
      if (error?.response?.data) console.error('API response:', error.response.data);
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error;
      const msg = serverMsg || error?.shortMessage || error?.message || 'Failed to upload proof';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
    setMilestoneId('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Upload Milestone Proof</h3>
      
      <div>
        <label className="block text-sm text-slate-400 mb-2">Select Project *</label>
        <select
          value={selectedProject}
          onChange={handleProjectChange}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Milestone *</label>
        <select
          value={milestoneId}
          onChange={(e) => setMilestoneId(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          disabled={!hasMilestones}
        >
          <option value="">
            {!selectedProject ? 'Select a project first' : !hasMilestones ? 'No milestones (release funds first)' : 'Select milestone'}
          </option>
          {milestones.map((m, idx) => (
            <option key={idx} value={idx}>
              Milestone {idx}: Released {formatEther(m.amountReleased)} MON · Utilized {formatEther(m.amountUtilized)} MON
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Proof Document *</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setProofFile(e.target.files[0])}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
        />
        <p className="text-xs text-slate-500 mt-2">
          Upload invoices, receipts, progress photos, or any verification documents
        </p>
      </div>

      <button
        type="submit"
        disabled={uploading || isLoading}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-medium transition-all disabled:opacity-50"
      >
        {uploading || isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Upload Proof
          </>
        )}
      </button>
    </form>
  );
}

export default AdminDashboard;
