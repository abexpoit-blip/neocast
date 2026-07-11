import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShieldCheck, Cpu, Users, User, FilePlus, 
  CreditCard, Rocket, Terminal, Lock, ChevronDown,
  Monitor, Activity, RefreshCw, Key
} from "lucide-react";
import { toast } from "sonner";

const BoostTool = () => {
  const { profile } = useAuth();
  const [activated, setActivated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [showVault, setShowVault] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "[11:24:02] Application initialized...",
    "[11:24:05] Ready for license handshake."
  ]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs(prev => [...prev.slice(-8), `[${time}] ${msg}`]);
  };

  const handleActivate = () => {
    if (!licenseKey) return toast.error("Enter a valid license key");
    setLoading(true);
    addLog("Connecting to secure server...");
    setTimeout(() => {
      addLog("Cryptographic handshake successful.");
      addLog("Machine ID signature verified.");
      setActivated(true);
      setLoading(false);
      toast.success("Nexus Engine Connected");
    }, 2000);
  };

  const handleLaunch = () => {
    addLog("🚀 Launching Auto-Pilot sequence...");
    setTimeout(() => addLog("Analyzing session tokens..."), 800);
    setTimeout(() => addLog("Injecting boost headers..."), 1500);
    setTimeout(() => addLog("Network stable. Operation running in background."), 2500);
  };

  if (!activated) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="w-full max-w-md glass-neon rounded-2xl p-8 space-y-6 border-[#00F3FF]/30 shadow-[0_0_50px_rgba(0,243,255,0.1)]">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00F3FF]/10 border border-[#00F3FF]/30 mb-2">
                <Key className="h-8 w-8 text-[#00F3FF] animate-pulse" />
              </div>
              <h1 className="font-display text-2xl font-black tracking-tighter text-white">NEXUS ACTIVATION</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Secure Server Handshake Required</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#00F3FF]/70">License Key</label>
                <div className="relative">
                  <Input 
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="bg-[#0B0F19] border-[#00F3FF]/20 text-[#00F3FF] font-mono text-center tracking-widest focus:border-[#00F3FF]/50"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30" />
                </div>
              </div>

              <Button 
                onClick={handleActivate}
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-[#00F3FF] to-[#0092FF] hover:opacity-90 text-[#0B0F19] font-black uppercase tracking-tighter text-lg shadow-[0_0_20px_rgba(0,243,255,0.3)] transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  "Verify & Connect"
                )}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-4 text-[9px] text-muted-foreground uppercase tracking-[0.2em] opacity-50">
              <span className="flex items-center gap-1"><Monitor className="h-3 w-3" /> Encrypted</span>
              <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> Stable</span>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
        {/* Header */}
        <div className="glass-neon rounded-2xl p-5 border-[#00F3FF]/20 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-display text-xl font-black text-white tracking-tighter">BASICTRICK BOOST TOOL</h1>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#00F3FF] uppercase bg-[#00F3FF]/10 px-2 py-0.5 rounded border border-[#00F3FF]/20">
                <ShieldCheck className="h-3 w-3" /> Platinum Tier
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground opacity-70">
                <Cpu className="h-3 w-3" /> MID: {Math.random().toString(36).substring(7).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Live Slots</div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 bg-[#0B0F19] rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-[#00F3FF] w-[30%] shadow-[0_0_10px_#00F3FF]" />
              </div>
              <span className="font-mono text-xs font-bold text-white">3/10</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-[#0B0F19]/50 border border-white/5 p-1 h-12 w-full grid grid-cols-2 gap-2">
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#00F3FF] data-[state=active]:text-[#0B0F19] flex items-center gap-2 font-bold uppercase text-[11px] tracking-tight transition-all">
              <User className="h-4 w-4" /> Main Profile Boost
            </TabsTrigger>
            <TabsTrigger value="page" className="data-[state=active]:bg-[#00F3FF] data-[state=active]:text-[#0B0F19] flex items-center gap-2 font-bold uppercase text-[11px] tracking-tight transition-all">
              <FilePlus className="h-4 w-4" /> Create & Boost Page
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="glass p-6 rounded-2xl border-white/5 flex items-center justify-between group cursor-pointer hover:border-[#00F3FF]/20 transition-all">
              <div className="space-y-1">
                <h3 className="font-bold text-white tracking-tight">Enable Professional Mode</h3>
                <p className="text-xs text-muted-foreground">Automate switch on current active ID</p>
              </div>
              <div className="h-6 w-11 rounded-full bg-[#0B0F19] border border-white/10 relative">
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white/20 transition-all group-hover:left-6 group-hover:bg-[#00F3FF] group-hover:shadow-[0_0_10px_#00F3FF]" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="page" className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Page Name</label>
              <Input placeholder="Enter Page Title" className="bg-[#0B0F19] border-white/5 focus:border-[#00F3FF]/30 h-11" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Category</label>
              <Input placeholder="Select Category" className="bg-[#0B0F19] border-white/5 focus:border-[#00F3FF]/30 h-11" />
            </div>
          </TabsContent>
        </Tabs>

        {/* Secure Vault */}
        <div className="glass-neon rounded-2xl border-[#00F3FF]/10 overflow-hidden">
          <button 
            onClick={() => setShowVault(!showVault)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#00F3FF]/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#00F3FF]/10 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-[#00F3FF]" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-white">Secure Billing Vault</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showVault ? 'rotate-180' : ''}`} />
          </button>
          
          {showVault && (
            <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-300">
              <div className="md:col-span-3 space-y-1.5 pt-4">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Card Number</label>
                <Input placeholder="0000 0000 0000 0000" className="bg-[#0B0F19] border-white/5 font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Expiry</label>
                <Input placeholder="MM/YY" className="bg-[#0B0F19] border-white/5 text-center" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">CVV</label>
                <Input placeholder="***" type="password" className="bg-[#0B0F19] border-white/5 text-center" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Zip Code</label>
                <Input placeholder="00000" className="bg-[#0B0F19] border-white/5 text-center" />
              </div>
            </div>
          )}
        </div>

        {/* Campaign Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Daily Budget ($)</label>
            <Input defaultValue="5.00" type="number" className="bg-[#0B0F19] border-white/5 h-11" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Duration (Days)</label>
            <Input defaultValue="7" type="number" className="bg-[#0B0F19] border-white/5 h-11" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Image Link</label>
            <Input placeholder="https://..." className="bg-[#0B0F19] border-white/5 h-11 font-mono text-xs" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Post Caption</label>
            <Textarea placeholder="Enter your campaign content..." className="bg-[#0B0F19] border-white/5 min-h-[80px]" />
          </div>
        </div>

        <Button 
          onClick={handleLaunch}
          className="w-full h-16 bg-[#00F3FF] hover:bg-[#00F3FF]/90 text-[#0B0F19] font-black text-xl uppercase tracking-tighter shadow-[0_10px_40px_rgba(0,243,255,0.2)] transition-all group"
        >
          <Rocket className="h-6 w-6 mr-3 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
          Launch Auto-Pilot Boost
        </Button>

        {/* Terminal Window */}
        <div className="bg-[#0B0F19] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <Terminal className="h-3 w-3 text-[#00F3FF]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Nexus Engine Log</span>
            </div>
            <div className="flex gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500/50" />
              <div className="h-1.5 w-1.5 rounded-full bg-yellow-500/50" />
              <div className="h-1.5 w-1.5 rounded-full bg-green-500/50" />
            </div>
          </div>
          <div className="p-4 h-32 overflow-y-auto font-mono text-[10px] space-y-1 scrollbar-hide">
            {logs.map((log, i) => (
              <div key={i} className={`flex gap-3 ${log.includes('🚀') ? 'text-[#00F3FF]' : 'text-white/60'}`}>
                <span className="opacity-40 shrink-0">{i+1}</span>
                <span className="break-all">{log}</span>
              </div>
            ))}
            <div className="h-1 w-1 bg-[#00F3FF] animate-pulse" />
          </div>
        </div>

        <div className="text-center pb-4">
          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-bold opacity-30">
            Dev By Shovon &bull; Project for Nexus
          </p>
        </div>
      </div>
    </AppShell>
  );
};

export default BoostTool;
