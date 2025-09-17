import React, { useState, useMemo } from 'react';
import { Copy, Check, Search, ExternalLink, AlertCircle, Link2, Plus, X, QrCode, Download } from 'lucide-react';
import QRCode from 'qrcode';

const clinicsData = [
  { name: "Copperfield", path: "copperfield", status: "paused" },
  { name: "Greeley", path: "greeley", status: "paused" },
  { name: "Downtown Denver at Market Station", path: "denvermarketstation", status: "paused" },
  { name: "Gadsden", path: "gadsden", status: "active" },
  { name: "Katy", path: "katy", status: "paused" },
  { name: "Cy-Fair", path: "cyfair", status: "paused" },
  { name: "Goodlettsville", path: "goodlettsville", status: "active" },
  { name: "Logan Circle on 14th Street", path: "logancircleon14thstreet", status: "paused" },
  { name: "Landmark", path: "landmark", status: "active" },
  { name: "Capitol Hill", path: "capitolhill", status: "active" },
  { name: "Glen Ellyn", path: "glenellyn", status: "active" },
  { name: "Mt. Prospect", path: "mtprospect", status: "active" },
  { name: "Danville VA", path: "danvilleva", status: "active" },
  { name: "Polaris", path: "polaris", status: "active" },
  { name: "Atascocita", path: "atascocita", status: "paused" },
  { name: "Arvada - Wheat Ridge", path: "arvadawheatridge", status: "paused" },
  { name: "Walnut Creek", path: "walnutcreek", status: "paused" },
  { name: "Wasilla", path: "wasilla", status: "active" },
  { name: "Smyrna", path: "smyrna", status: "active" },
  { name: "Council Bluffs", path: "councilbluffs", status: "active" },
  { name: "Spring Hill", path: "springhill", status: "active" },
  { name: "Bellingham", path: "bellingham", status: "active" },
  { name: "Madison-Fitchburg", path: "madisonfitchburg", status: "paused" },
  { name: "East Towne Madison", path: "easttownemadison", status: "paused" },
  { name: "Gammon & Watts", path: "gammonwatts", status: "paused" },
  { name: "Green Bay West", path: "greenbaywest", status: "paused" },
  { name: "Parma", path: "parma", status: "paused" },
  { name: "Nashville, TN", path: "nashvilletn", status: "active" },
  { name: "Salisbury", path: "salisbury", status: "paused" },
  { name: "Cypress", path: "cypress", status: "paused" },
  { name: "Napa", path: "napa", status: "paused" },
  { name: "Warminster", path: "warminster", status: "paused" },
  { name: "Fuquay Varina", path: "fuquayvarina", status: "active" },
  { name: "Santa Maria", path: "santamaria", status: "active" },
  { name: "Morton Ranch", path: "mortonranch", status: "paused" },
  { name: "Arvada North", path: "arvadanorth", status: "paused" },
  { name: "Bloomington IN", path: "bloomingtonin", status: "paused" },
  { name: "Bowling Green", path: "bowlinggreen", status: "paused" },
  { name: "Brentwood", path: "brentwood", status: "active" },
  { name: "East Nashville", path: "eastnashville", status: "active" },
  { name: "South Anchorage", path: "southanchorage", status: "active" },
  { name: "Cool Springs", path: "coolsprings", status: "active" },
  { name: "Clarksville IN", path: "clarksvillein", status: "active" },
  { name: "West Caldwell", path: "westcaldwell", status: "paused" },
  { name: "Bellevue", path: "bellevue", status: "active" },
  { name: "Hendersonville", path: "hendersonville", status: "active" },
  { name: "Hermitage", path: "hermitage", status: "active" },
  { name: "Lee Branch", path: "leebranch", status: "active" },
  { name: "Trussville", path: "trussville", status: "active" },
  { name: "Oxford", path: "oxford", status: "active" },
  { name: "Cinco Ranch", path: "cincoranch", status: "paused" },
  { name: "Murfreesboro", path: "murfreesboro", status: "active" },
  { name: "Mountain Brook", path: "mountainbrook", status: "active" },
  { name: "L Street Marketplace", path: "lstreetmarketplace", status: "active" },
  { name: "Middleburg Heights", path: "middleburgheights", status: "paused" },
  { name: "Evansville West", path: "evansvillewest", status: "paused" },
  { name: "Lorain", path: "lorain", status: "paused" },
  { name: "Spartanburg East", path: "spartanburgeast", status: "paused" },
  { name: "Sterling", path: "sterling", status: "paused" },
  { name: "Burke", path: "burke", status: "active" },
  { name: "Robal Village", path: "robalvillage", status: "active" },
  { name: "Hilltop", path: "hilltop", status: "paused" },
  { name: "West End", path: "westend", status: "active" },
  { name: "Bradlee Center", path: "bradleecenter", status: "paused" },
  { name: "Danville", path: "danville", status: "paused" },
  { name: "Fairview Park", path: "fairviewpark", status: "paused" },
  { name: "Mentor", path: "mentor", status: "paused" },
  { name: "Westgate West", path: "westgatewest", status: "paused" },
  { name: "The Plant", path: "theplant", status: "paused" },
  { name: "Plaza de San Jose", path: "plazadesanjose", status: "paused" },
  { name: "Pinole", path: "pinole", status: "paused" },
  { name: "Livermore", path: "livermore", status: "paused" },
  { name: "Gilroy", path: "gilroy", status: "paused" },
  { name: "Camden Park", path: "camdenpark", status: "paused" },
  { name: "Brokaw Plaza", path: "brokawplaza", status: "paused" },
  { name: "Almaden Ranch", path: "almadenranch", status: "paused" },
  { name: "McCarthy Ranch", path: "mccarthyranch", status: "paused" },
  { name: "Greenville", path: "greenville", status: "paused" },
  { name: "McBee Station", path: "mcbeestation", status: "paused" },
  { name: "Anderson", path: "anderson", status: "paused" },
  { name: "Clemson", path: "clemson", status: "paused" },
  { name: "Wall Township", path: "walltownship", status: "active" },
  { name: "Spartanburg", path: "spartanburg", status: "paused" },
  { name: "Regency Centre", path: "regencycentre", status: "active" },
  { name: "Lynchburg", path: "lynchburg", status: "active" },
  { name: "Holly Springs", path: "hollysprings", status: "active" },
  { name: "Springhurst", path: "springhurst", status: "paused" },
  { name: "Granbury", path: "granbury", status: "paused" },
  { name: "The Point", path: "thepoint", status: "paused" },
  { name: "Pelham", path: "pelham", status: "paused" },
  { name: "Greer", path: "greer", status: "paused" },
  { name: "Arnold", path: "arnold", status: "paused" },
  { name: "Belle Isle", path: "belleisle", status: "paused" },
  { name: "Lexington NC", path: "lexingtonnc", status: "paused" },
  { name: "Statesville", path: "statesville", status: "paused" },
  { name: "New Bern", path: "newbern", status: "paused" },
  { name: "Logan", path: "logan", status: "active" },
  { name: "Federal Way", path: "federalway", status: "active" },
  { name: "University Place", path: "universityplace", status: "active" },
  { name: "Fort Collins South", path: "fortcollinssouth", status: "active" },
  { name: "Lynnwood", path: "lynnwood", status: "active" },
  { name: "Tumwater", path: "tumwater", status: "active" },
  { name: "Renton", path: "renton", status: "active" },
  { name: "Bellevue Kelsey Creek", path: "bellevuekelseycreek", status: "active" },
  { name: "Bothell", path: "bothell", status: "removed" },
  { name: "Fort Collins", path: "fortcollins", status: "active" },
  { name: "Loveland", path: "loveland", status: "active" },
  { name: "Chesterfield", path: "chesterfield", status: "active" },
  { name: "Cottleville", path: "cottleville", status: "active" },
  { name: "Creve Coeur", path: "crevecoeur", status: "active" },
  { name: "Des Peres", path: "desperes", status: "active" },
  { name: "O'Fallon", path: "ofallon", status: "active" },
  { name: "Central West End", path: "centralwestend", status: "active" },
  { name: "The Joint Chiropractic - Gadsden", path: "default", status: "active" },
  { name: "Seattle", path: "pnw", status: "active" },
  { name: "Nashville, TN", path: "nashville2", status: "active" },
  { name: "Test Clinic", path: "test", status: "active" },
  { name: "Robinson Township", path: "robinsontownship", status: "active" },
  { name: "Pleasanton", path: "pleasanton", status: "active" },
  { name: "Admin Portal", path: "admin", status: "active" },
  { name: "Yorba Linda", path: "yorbalinda", status: "paused" },
  { name: "Test", path: "testing", status: "active" },
  { name: "Kingwood", path: "kingwood", status: "paused" },
  { name: "Powdersville", path: "powdersville", status: "paused" },
  { name: "Midtown Miami", path: "midtownmiami", status: "paused" },
  { name: "Joplin", path: "joplin", status: "paused" },
  { name: "Anderson Township", path: "andersontownship", status: "paused" }
];

const linkTypes = [
  { key: 'sms', label: 'SMS', utm: '?utm_source=SMS&utm_medium=carbon' },
  { key: 'email', label: 'Email', utm: '?utm_source=Email&utm_medium=newsletter' },
  { key: 'qr', label: 'QR Code', utm: '?utm_source=QR&utm_medium=code' },
  { key: 'social', label: 'Social Post', utm: '?utm_source=SM&utm_medium=Post' },
  { key: 'bio', label: 'Bio Link', utm: '?utm_source=SM&utm_medium=bio' },
  { key: 'general', label: 'General', utm: '' }
];

function QRButton({ text, clinicName, linkType, size = "small" }) {
  const [generating, setGenerating] = useState(false);

  const handleDownloadQR = async () => {
    try {
      setGenerating(true);
      const qrDataURL = await QRCode.toDataURL(text, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      const link = document.createElement('a');
      link.download = `${clinicName}_${linkType || 'custom'}_QR.png`;
      link.href = qrDataURL;
      link.click();
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownloadQR}
      disabled={generating}
      className={`flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 ${
        size === "small" ? "p-1.5" : "p-2"
      }`}
      title={generating ? "Generating QR..." : "Download QR Code"}
    >
      {generating ? (
        <div className={`animate-spin rounded-full border-2 border-white/20 border-t-white/60 ${
          size === "small" ? "h-3.5 w-3.5" : "h-4 w-4"
        }`} />
      ) : (
        <QrCode className={`${size === "small" ? "h-3.5 w-3.5" : "h-4 w-4"} text-white/60`} />
      )}
    </button>
  );
}

function CopyButton({ text, size = "small" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${
        size === "small" ? "p-1.5" : "p-2"
      }`}
      title={copied ? "Copied!" : "Copy link"}
    >
      {copied ? (
        <Check className={`${size === "small" ? "h-3.5 w-3.5" : "h-4 w-4"} text-emerald-400`} />
      ) : (
        <Copy className={`${size === "small" ? "h-3.5 w-3.5" : "h-4 w-4"} text-white/60`} />
      )}
    </button>
  );
}

export default function ChatLinksTable({ selectedClinic = 'all' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLinkType, setSelectedLinkType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedClinic, setExpandedClinic] = useState(null);
  const [showCustomUTM, setShowCustomUTM] = useState(false);
  const [customUTM, setCustomUTM] = useState({
    source: '',
    medium: ''
  });
  const [selectedClinicForUTM, setSelectedClinicForUTM] = useState('');

  const filteredClinics = useMemo(() => {
    // First filter by the main dashboard's clinic selection
    let filtered = clinicsData;

    // If a specific clinic is selected in the main dashboard, only show that clinic
    if (selectedClinic !== 'all') {
      // Try to match by various patterns since the dashboard might use different identifiers
      filtered = clinicsData.filter(clinic => {
        // Check if it matches the clinic name, path, or a partial match
        const clinicLower = selectedClinic.toLowerCase();
        return clinic.name.toLowerCase().includes(clinicLower) ||
               clinic.path.toLowerCase() === clinicLower ||
               clinic.path.toLowerCase().includes(clinicLower.replace(/\s+/g, ''));
      });
    }

    // Then apply the table's own filters
    return filtered.filter(clinic => {
      const matchesSearch = clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           clinic.path.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || clinic.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [selectedClinic, searchTerm, statusFilter]);

  const getLink = (clinic, linkType) => {
    const baseUrl = 'https://chiro-chat.com/l/';
    const pathWithStatus = clinic.status === 'paused' ? `${clinic.path} (paused)` :
                          clinic.status === 'removed' ? `${clinic.path} (removed)` :
                          clinic.path;
    return `${baseUrl}${pathWithStatus}${linkType.utm}`;
  };

  const activeCount = clinicsData.filter(c => c.status === 'active').length;
  const pausedCount = clinicsData.filter(c => c.status === 'paused').length;

  const generateCustomUTMString = () => {
    const params = [];
    if (customUTM.source) params.push(`utm_source=${encodeURIComponent(customUTM.source)}`);
    if (customUTM.medium) params.push(`utm_medium=${encodeURIComponent(customUTM.medium)}`);
    return params.length > 0 ? `?${params.join('&')}` : '';
  };

  const getCustomLink = () => {
    if (!selectedClinicForUTM) return '';
    const clinic = filteredClinics.find(c => c.path === selectedClinicForUTM);
    if (!clinic) return '';

    const baseUrl = 'https://chiro-chat.com/l/';
    const pathWithStatus = clinic.status === 'paused' ? `${clinic.path} (paused)` :
                          clinic.status === 'removed' ? `${clinic.path} (removed)` :
                          clinic.path;
    return `${baseUrl}${pathWithStatus}${generateCustomUTMString()}`;
  };

  return (
    <section className="mt-8">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/20 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
        {/* Header */}
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white/90 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-cyan-400" />
                AI Booking Agent Chat Links
              </h2>
              <p className="text-sm text-white/60 mt-1">
                Deploy these UTM-tagged links across different channels to track performance
              </p>
            </div>
            {selectedClinic === 'all' && (
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  {activeCount} Active
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                  {pausedCount} Paused
                </span>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="Search clinics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="removed">Removed</option>
            </select>
            <select
              value={selectedLinkType}
              onChange={(e) => setSelectedLinkType(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">All Links</option>
              {linkTypes.map(type => (
                <option key={type.key} value={type.key}>{type.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowCustomUTM(!showCustomUTM)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Custom UTM
            </button>
          </div>

          {/* Custom UTM Creator */}
          {showCustomUTM && (
            <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white/90">Create Custom UTM Link</h3>
                <button
                  onClick={() => {
                    setShowCustomUTM(false);
                    setCustomUTM({ source: '', medium: '' });
                    setSelectedClinicForUTM('');
                  }}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-white/60 mb-1">Select Clinic *</label>
                  <select
                    value={selectedClinicForUTM}
                    onChange={(e) => setSelectedClinicForUTM(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 text-sm"
                  >
                    <option value="">Choose a clinic...</option>
                    {filteredClinics.map(clinic => (
                      <option key={clinic.path} value={clinic.path}>{clinic.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">UTM Source *</label>
                  <input
                    type="text"
                    placeholder="facebook"
                    value={customUTM.source}
                    onChange={(e) => setCustomUTM(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">UTM Medium *</label>
                  <input
                    type="text"
                    placeholder="cpc"
                    value={customUTM.medium}
                    onChange={(e) => setCustomUTM(prev => ({ ...prev, medium: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 text-sm"
                  />
                </div>
              </div>

              {/* Generated Link */}
              {selectedClinicForUTM && customUTM.source && customUTM.medium && (
                <div className="p-3 rounded-lg bg-slate-900/40 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/60 mb-1">Generated Link:</div>
                      <div className="text-sm text-cyan-400 font-mono break-all pr-2">
                        {getCustomLink()}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <CopyButton text={getCustomLink()} size="regular" />
                      <QRButton
                        text={getCustomLink()}
                        clinicName={filteredClinics.find(c => c.path === selectedClinicForUTM)?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'clinic'}
                        linkType={`${customUTM.source}_${customUTM.medium}`}
                        size="regular"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-white/5">
                <th className="w-[30%] text-left px-6 py-3 text-xs font-medium text-white/70 uppercase tracking-wider">
                  Clinic
                </th>
                <th className="w-[10%] text-center px-2 py-3 text-xs font-medium text-white/70 uppercase tracking-wider">
                  Status
                </th>
                {(selectedLinkType === 'all' ? linkTypes : linkTypes.filter(t => t.key === selectedLinkType)).map(type => (
                  <th key={type.key} className={`${selectedLinkType === 'all' ? 'w-[10%]' : 'w-[30%]'} text-center px-2 py-3 text-xs font-medium text-white/70 uppercase tracking-wider`}>
                    {type.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredClinics.length > 0 ? (
                filteredClinics.map((clinic) => (
                  <tr
                    key={clinic.path}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setExpandedClinic(expandedClinic === clinic.path ? null : clinic.path)}
                  >
                    <td className="w-[30%] px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white/90 truncate">{clinic.name}</div>
                        <div className="text-xs text-white/50 mt-0.5 truncate">{clinic.path}</div>
                      </div>
                    </td>
                    <td className="w-[10%] px-2 py-4 text-center">
                      {clinic.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span className="hidden sm:inline">Active</span>
                        </span>
                      ) : clinic.status === 'removed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          <span className="hidden sm:inline">Removed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          <span className="hidden sm:inline">Paused</span>
                        </span>
                      )}
                    </td>
                    {(selectedLinkType === 'all' ? linkTypes : linkTypes.filter(t => t.key === selectedLinkType)).map(type => (
                      <td key={type.key} className={`${selectedLinkType === 'all' ? 'w-[10%]' : 'w-[30%]'} px-2 py-4`}>
                        <div className="flex justify-center gap-1">
                          <CopyButton text={getLink(clinic, type)} />
                          <QRButton
                            text={getLink(clinic, type)}
                            clinicName={clinic.name.replace(/[^a-zA-Z0-9]/g, '_')}
                            linkType={type.label.replace(/\s+/g, '_')}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={selectedLinkType === 'all' ? 8 : 3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-white/30" />
                      <p className="text-sm text-white/60">No clinics found matching your filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Expanded View for Mobile */}
        {expandedClinic && (
          <div className="lg:hidden border-t border-white/10 p-4">
            {(() => {
              const clinic = filteredClinics.find(c => c.path === expandedClinic);
              if (!clinic) return null;

              const displayTypes = selectedLinkType === 'all' ? linkTypes : linkTypes.filter(t => t.key === selectedLinkType);

              return (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-white/90">{clinic.name} Links:</div>
                  {displayTypes.map(type => (
                    <div key={type.key} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-white/80">{type.label}</span>
                      <div className="flex gap-1">
                        <CopyButton text={getLink(clinic, type)} size="regular" />
                        <QRButton
                          text={getLink(clinic, type)}
                          clinicName={clinic.name.replace(/[^a-zA-Z0-9]/g, '_')}
                          linkType={type.label.replace(/\s+/g, '_')}
                          size="regular"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Footer Info */}
        <div className="border-t border-white/10 px-6 py-4 bg-white/5">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Click any row to expand and view all links. Click the copy button to copy a link to clipboard.</span>
          </div>
        </div>
      </div>
    </section>
  );
}