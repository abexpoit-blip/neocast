import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Key, Users, ShieldAlert, Terminal, 
  Plus, Copy, Trash2, Zap, Wifi,
  Globe, Fingerprint
} from "lucide-react";
import { toast } from "sonner";

const AdminBoost = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [duration, setDuration] = useState("30");
  const [slots, setSlots] = useState("10");
  const [generatedKeys, setGeneratedKeys] = useState<{key: string, slots: string, days: string}[]>([]);

  const generateKeys = () => {
    const newKeys = Array.from({length: 5}).map(() => ({
      key: `NEXUS-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      slots: slots,
      days: duration
    }));
    setGeneratedKeys(newKeys);
    toast.success("Cryptographic keys generated");
  };

  const sessions = [
    { email: "user@example.com", hwid: "7F-8A-BC-12", slots: "3/10", activity: "Profile Boost Active" },
    { email: "dev@nexus.tech", hwid: "01-99-AF-C4", slots: "8/10", activity: "Page Creation Sequence" },
    { email: "client@shop.cc", hwid: "DD-44-E2-90", slots: "1/5", activity: "Idle (Authenticated)" },
  ];

  return (
    <AdminLayout title="Nexus Control Center">
      <div className="space-y-6">
        {/* Admin Navigation */}
        <div className="flex gap-2 p-1 bg-black/40 border border-white/5 rounded-xl w-fit">
          {['overview', 'generator', 'sessions', 'logs'].map((tab) => (
            <Button
              key={tab}
              variant="ghost"
              onClick={() => setActiveTab(tab)}
              className={`h-9 px-4 rounded-lg uppercase text-[10px] font-bold tracking-widest transition-all ${
                activeTab === tab ? 'bg-[#00F3FF]/10 text-[#00F3FF] border border-[#00F3FF]/20' : 'text-muted-foreground'
              }`}
            >
              {tab}
            </Button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in duration-500">
            {[
              { label: 'Total Licenses', value: '142', icon: Key, color: 'text-blue-400' },
              { label: 'Active Sessions', value: '24', icon: Wifi, color: 'text-[#00F3FF]' },
              { label: 'Used Slots', value: '184/500', icon: Zap, color: 'text-yellow-400' },
              { label: 'Global Uptime', value: '99.9%', icon: Globe, color: 'text-green-400' },
            ].map((stat, i) => (
              <div key={i} className="glass p-5 rounded-2xl border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">Live</span>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{stat.label}</div>
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'generator' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="glass p-6 rounded-2xl border-white/5 space-y-6 max-w-xl">
              <h3 className="font-display text-lg font-black text-white uppercase tracking-tighter">License Parameter Setup</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Duration (Days)</label>
                  <Input value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-black/40 border-white/10 h-11" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Max Slots</label>
                  <Input value={slots} onChange={(e) => setSlots(e.target.value)} className="bg-black/40 border-white/10 h-11" />
                </div>
              </div>
              <Button onClick={generateKeys} className="w-full h-12 bg-[#00F3FF] text-[#0B0F19] font-black uppercase tracking-tighter hover:opacity-90 shadow-[0_0_20px_#00F3FF44]">
                Mass Generate Cryptographic Keys
              </Button>
            </div>

            {generatedKeys.length > 0 && (
              <div className="glass rounded-2xl border-white/5 overflow-hidden animate-in fade-in duration-300">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    <tr>
                      <th className="p-4 text-left">Generated Key</th>
                      <th className="p-4 text-center">Slots</th>
                      <th className="p-4 text-center">Days</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {generatedKeys.map((k, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-[#00F3FF]">{k.key}</td>
                        <td className="p-4 text-center text-white/60">{k.slots}</td>
                        <td className="p-4 text-center text-white/60">{k.days}</td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-[#00F3FF]" onClick={() => {
                            navigator.clipboard.writeText(k.key);
                            toast.success("Key copied");
                          }}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="glass rounded-2xl border-white/5 overflow-hidden animate-in fade-in duration-500">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                <tr>
                  <th className="p-4 text-left">User / License</th>
                  <th className="p-4 text-left">Hardware Fingerprint</th>
                  <th className="p-4 text-center">WebSockets</th>
                  <th className="p-4 text-left">Active Operation</th>
                  <th className="p-4 text-right">Emergency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sessions.map((s, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-white tracking-tight">{s.email}</div>
                      <div className="text-[9px] text-muted-foreground font-mono uppercase">Validated Connection</div>
                    </td>
                    <td className="p-4 font-mono text-white/60">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="h-3.5 w-3.5 opacity-40" />
                        {s.hwid}
                      </div>
                    </td>
                    <td className="p-4 text-center font-mono text-[#00F3FF]">{s.slots}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs text-green-400">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                        {s.activity}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button size="sm" variant="destructive" className="h-8 px-3 text-[10px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-all">
                        <ShieldAlert className="h-3.5 w-3.5 mr-1.5" /> Kill Session
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-[#0B0F19] border border-white/5 rounded-2xl p-6 font-mono text-[11px] h-[400px] overflow-y-auto space-y-1 animate-in fade-in duration-500">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="flex gap-4 group">
                <span className="text-muted-foreground/30 shrink-0">{`1${i}:24:${10+i}`}</span>
                <span className="text-white/40 group-hover:text-[#00F3FF] transition-colors">{`[SYSLOG] AUTH_SERVER: Processing token validation request for UID_829${i}...`}</span>
              </div>
            ))}
            <div className="flex gap-4">
              <span className="text-muted-foreground/30 shrink-0">--:--:--</span>
              <span className="text-[#00F3FF] animate-pulse">Waiting for live data packets_</span>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBoost;
