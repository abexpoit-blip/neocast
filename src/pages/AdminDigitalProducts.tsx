import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { digitalProductsApi, VpsDigitalProduct, categoriesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PackageX, Plus, Trash2, Edit2, Search, Video, FileText, Wrench, UserCircle, CreditCard, Save, X, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

const AdminDigitalProducts = () => {
  const [products, setProducts] = useState<VpsDigitalProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VpsDigitalProduct | null>(null);

  const [formData, setFormData] = useState<any>({
    type: 'method',
    title: '',
    description: '',
    price: 0,
    stock: -1,
    video_url: '',
    download_url: '',
    text_content: '',
    guidelines: '',
    category_id: 'all'
  });

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        digitalProductsApi.list(),
        categoriesApi.all()
      ]);
      setProducts(pRes.products || []);
      setCategories(cRes.categories || []);
    } catch { 
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await digitalProductsApi.update(editing.id, { ...formData, category_id: formData.category_id === "all" ? null : formData.category_id });
        toast.success("Product updated");
      } else {
        await digitalProductsApi.create({ ...formData, category_id: formData.category_id === "all" ? null : formData.category_id });
        toast.success("Product created");
      }
      setOpen(false);
      setEditing(null);
      setFormData({ type: 'method', title: '', description: '', price: 0, stock: -1, video_url: '', download_url: '', text_content: '', guidelines: '' });
      load();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await digitalProductsApi.del(id);
      toast.success("Deleted");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleEdit = (p: VpsDigitalProduct) => {
    setEditing(p);
    setFormData(p);
    setOpen(true);
  };

  const filtered = products.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Super Shop Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..." 
              className="pl-9 bg-input/40"
            />
          </div>

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-neon">
                <Plus className="h-4 w-4 mr-2" />
                New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-border/40">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Product' : 'Add New Digital Product'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Category</label>
                    <Select value={formData.category_id || 'all'} onValueChange={(v: any) => setFormData({...formData, category_id: v})}>
                      <SelectTrigger className="bg-input/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Uncategorized</SelectItem>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Type</label>
                    <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                      <SelectTrigger className="bg-input/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="method">Method</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="tool">Tool</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="bin">BIN</SelectItem>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="bank">Bank Account</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Price ($)</label>
                    <Input 
                      type="number" step="0.01" value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      className="bg-input/60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Title</label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Netflix Premium Account"
                    className="bg-input/60"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Description</label>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the product..."
                    className="bg-input/60 min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Stock (-1 = unlimited)</label>
                    <Input 
                      type="number" value={formData.stock} 
                      onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                      className="bg-input/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Video URL (Optional)</label>
                    <Input 
                      value={formData.video_url} 
                      onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                      placeholder="https://..."
                      className="bg-input/60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Download URL (Optional)</label>
                  <Input 
                    value={formData.download_url} 
                    onChange={(e) => setFormData({...formData, download_url: e.target.value})}
                    placeholder="https://..."
                    className="bg-input/60"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Text Content / Data / BINs (Hidden until bought)</label>
                  <Textarea 
                    value={formData.text_content} 
                    onChange={(e) => setFormData({...formData, text_content: e.target.value})}
                    placeholder="Sensitive data to deliver..."
                    className="bg-input/60 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Thumbnail Image URL</label>
                  <Input 
                    value={formData.image_url} 
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    placeholder="https://..."
                    className="bg-input/60"
                  />
                  <p className="text-[10px] text-muted-foreground">Tip: Upload a small pixel-perfect 16:9 thumbnail for best look.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Guidelines (Optional)</label>
                  <Textarea 
                    value={formData.guidelines} 
                    onChange={(e) => setFormData({...formData, guidelines: e.target.value})}
                    placeholder="Usage instructions..."
                    className="bg-input/60"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-gradient-primary">
                    <Save className="h-4 w-4 mr-2" />
                    {editing ? 'Update' : 'Create'} Product
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Title</th>
                <th className="p-4 text-right">Price</th>
                <th className="p-4 text-center">Stock</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-secondary/20 transition">
                  <td className="p-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary-glow px-2 py-1 rounded">
                      {p.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">
                      Seller: {p.seller_username || 'Unknown'}
                    </div>
                  </td>
                  <td className="p-4 text-right font-display font-bold text-primary-glow">
                    ${Number(p.price).toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    {p.stock === -1 ? 'Unlimited' : p.stock}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-[10px] uppercase font-bold tracking-tighter px-2 py-0.5 rounded ${p.is_active ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                      {p.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(p)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteProduct(p.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted-foreground">
                    No digital products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDigitalProducts;
