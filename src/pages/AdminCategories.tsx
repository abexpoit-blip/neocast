import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  icon?: string;
  display_order: number;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [isAdding, setIsAdding] = useState(false);

  const load = async () => {
    try {
      const res = await api.get<{ categories: Category[] }>("/admin/categories");
      setCategories(res.categories ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (id?: string) => {
    try {
      if (id) {
        await api.patch(`/admin/categories/${id}`, editForm);
        toast.success("Category updated");
      } else {
        await api.post("/admin/categories", editForm);
        toast.success("Category created");
        setIsAdding(false);
      }
      setEditingId(null);
      setEditForm({});
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete category? This won't delete items, but they will become uncategorized.")) return;
    try {
      await api.del(`/admin/categories/${id}`);
      toast.success("Deleted");
      load();
    } catch { /* ignore */ }
  };

  return (
    <AdminLayout title="Manage Categories">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary-glow" />
            <h2 className="font-display text-xl tracking-tight">Product Categories</h2>
          </div>
          <Button onClick={() => setIsAdding(true)} disabled={isAdding} className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" /> New Category
          </Button>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isAdding && (
                <TableRow className="bg-primary/5">
                  <TableCell>
                    <Input 
                      value={editForm.name || ""} 
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Category name"
                      className="bg-input/60 h-8 text-xs"
                      autoFocus
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={editForm.icon || ""} 
                      onChange={e => setEditForm({ ...editForm, icon: e.target.value })}
                      placeholder="Icon name"
                      className="bg-input/60 h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      value={editForm.display_order || 0} 
                      onChange={e => setEditForm({ ...editForm, display_order: parseInt(e.target.value) })}
                      className="bg-input/60 h-8 w-20 text-xs"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => save()} className="text-success"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setIsAdding(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {editingId === c.id ? (
                      <Input 
                        value={editForm.name || ""} 
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        className="bg-input/60 h-8 text-xs"
                      />
                    ) : (
                      <span className="font-semibold">{c.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === c.id ? (
                      <Input 
                        value={editForm.icon || ""} 
                        onChange={e => setEditForm({ ...editForm, icon: e.target.value })}
                        className="bg-input/60 h-8 text-xs"
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">{c.icon || "—"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === c.id ? (
                      <Input 
                        type="number"
                        value={editForm.display_order || 0} 
                        onChange={e => setEditForm({ ...editForm, display_order: parseInt(e.target.value) })}
                        className="bg-input/60 h-8 w-20 text-xs"
                      />
                    ) : (
                      <span className="font-mono text-xs">{c.display_order}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === c.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => save(c.id)} className="text-success"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setEditingId(null)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => { setEditingId(c.id); setEditForm(c); }} className="text-muted-foreground hover:text-primary-glow transition">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive transition">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && categories.length === 0 && !isAdding && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                    No categories found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;