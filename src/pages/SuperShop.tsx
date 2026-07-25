import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { digitalProductsApi, cartApi, VpsDigitalProduct } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Video, FileText, Wrench, UserCircle, CreditCard, Search, PackageX, Landmark, Facebook } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Seo from "@/components/Seo";

const productTypes = [
  { id: 'all', label: 'All', icon: PackageX },
  { id: 'method', label: 'Methods', icon: Video },
  { id: 'account', label: 'Accounts', icon: UserCircle },
  { id: 'bank', label: 'Bank Logs', icon: Landmark },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'tool', label: 'Tools', icon: Wrench },
  { id: 'document', label: 'Documents', icon: FileText },
  { id: 'bin', label: 'BINs', icon: CreditCard },
  { id: 'subscription', label: 'Subscriptions', icon: PackageX },
  { id: 'other', label: 'Other', icon: PackageX },
];

const SuperShop = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<VpsDigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [search, setSearch] = useState("");
  const [cartItems, setCartItems] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (type !== 'all') params.type = type;
      const res = await digitalProductsApi.list(params);
      setProducts(res.products || []);
    } catch { 
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  const loadCart = useCallback(async () => {
    if (!user) return;
    try {
      const { items } = await cartApi.list();
      setCartItems(new Set((items ?? []).filter(i => i.digital_product_id).map(i => i.digital_product_id!)));
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    load();
    loadCart();
  }, [load, loadCart]);

  const addToCart = async (productId: string) => {
    if (!user) return toast.error("Please log in");
    try {
      await cartApi.add({ digital_product_id: productId });
      setCartItems(prev => new Set(prev).add(productId));
      window.dispatchEvent(new Event("cart-updated"));
      toast.success("Added to cart");
    } catch (e: any) {
      toast.error(e.message || "Failed to add to cart");
    }
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <Seo title="Super Shop — Digital Products | Zoru Shop" description="Buy methods, accounts, tools and BINs with instant delivery." path="/super-shop" />
      
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black neon-text">SUPER SHOP</h1>
            <p className="text-sm text-muted-foreground mt-1">Premium methods, tools and digital products</p>
          </div>
          
          <div className="flex gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..." 
                className="pl-9 bg-input/40"
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" value={type} onValueChange={setType} className="w-full">
          <TabsList className="bg-secondary/40 w-full justify-start overflow-x-auto h-auto p-1 scrollbar-hide">
            {productTypes.map(pt => (
              <TabsTrigger key={pt.id} value={pt.id} className="flex items-center gap-2 py-2">
                <pt.icon className="h-4 w-4" />
                {pt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass rounded-2xl h-64 animate-pulse bg-secondary/20" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="glass rounded-2xl p-20 text-center">
            <PackageX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(p => (
              <div key={p.id} className={`group glass rounded-2xl overflow-hidden border border-border/40 hover:border-primary/50 transition-all duration-300 flex flex-col ${p.type === 'bin' || p.type === 'bank' ? 'ring-2 ring-primary/20' : ''}`}>
                {/* Image / Thumbnail Section */}
                <div className="aspect-video relative overflow-hidden bg-secondary/30">
                  {p.image_url ? (
                    <img 
                      src={p.image_url} 
                      alt={p.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                      {(() => {
                        const Icon = productTypes.find(t => t.id === p.type)?.icon || PackageX;
                        return <Icon className="h-12 w-12" />;
                      })()}
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className="font-display font-black text-xl text-primary-glow bg-background/80 backdrop-blur-md px-3 py-1 rounded-xl border border-primary/30 shadow-neon-sm">
                      ${Number(p.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-secondary/60 text-muted-foreground ${p.type === 'bin' || p.type === 'bank' || p.type === 'facebook' ? 'bg-primary/20 text-primary-glow' : ''}`}>
                      {p.type}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {p.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    {p.type === 'method' && (
                      <span className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                        <Video className="h-3 w-3" /> Includes Video
                      </span>
                    )}
                    {p.stock === -1 ? (
                      <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">
                        Unlimited
                      </span>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${p.stock > 0 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                        {p.stock} in stock
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-secondary/20 border-t border-border/40">
                  {cartItems.has(p.id) ? (
                    <Button variant="secondary" className="w-full" disabled>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      In Cart
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => addToCart(p.id)} 
                      disabled={p.stock === 0}
                      className="w-full bg-gradient-primary hover:shadow-neon transition-all"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default SuperShop;
