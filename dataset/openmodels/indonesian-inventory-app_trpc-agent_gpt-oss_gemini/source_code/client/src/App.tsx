import { useState, useCallback, useEffect } from "react";
import { trpc } from "./utils/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
// Dialog components removed as unused from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Item, CreateItemInput, UpdateItemInput, Transaction, CreateTransactionInput } from "../../server/src/schema";

function App() {
  // Tab handling: 'items' or 'transactions'
  const [activeTab, setActiveTab] = useState<"items" | "transactions">("items");

  // ----- Item Management -----
  const [items, setItems] = useState<Item[]>([]);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemForm, setItemForm] = useState<CreateItemInput>({
    name: "",
    code: "",
    description: null,
    purchase_price: 0,
    sale_price: 0,
    unit: "Pcs",
    stock: 0,
  });
  const [editingItem, setEditingItem] = useState<UpdateItemInput | null>(null);

  // ----- Transaction Management -----
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionForm, setTransactionForm] = useState<CreateTransactionInput>({
    item_id: 0,
    date: new Date(),
    quantity: 0,
    note: null,
    type: "masuk",
  });

  // Load items
  const loadItems = useCallback(async () => {
    setItemLoading(true);
    try {
      const data = await trpc.getItems.query();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setItemLoading(false);
    }
  }, []);

  // Load transactions
  const loadTransactions = useCallback(async () => {
    setTransactionLoading(true);
    try {
      const data = await trpc.getTransactions.query();
      setTransactions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setTransactionLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadTransactions();
  }, [loadItems, loadTransactions]);

  // ----- Item Handlers -----
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      // Update flow
      const payload: UpdateItemInput = {
        ...editingItem,
        ...itemForm,
      } as UpdateItemInput;
      await trpc.updateItem.mutate(payload);
      setEditingItem(null);
    } else {
      await trpc.createItem.mutate(itemForm);
    }
    setItemForm({
      name: "",
      code: "",
      description: null,
      purchase_price: 0,
      sale_price: 0,
      unit: "Pcs",
      stock: 0,
    });
    loadItems();
  };

  const startEditItem = (item: Item) => {
    setEditingItem({ id: item.id });
    setItemForm({
      name: item.name,
      code: item.code,
      description: item.description,
      purchase_price: item.purchase_price,
      sale_price: item.sale_price,
      unit: item.unit,
      stock: item.stock,
    });
  };

  const handleDeleteItem = async (id: number) => {
    await trpc.deleteItem.mutate({ id });
    loadItems();
  };

  // ----- Transaction Handlers -----
  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await trpc.createTransaction.mutate(transactionForm);
    // Reset form
    setTransactionForm({
      item_id: 0,
      date: new Date(),
      quantity: 0,
      note: null,
      type: "masuk",
    });
    loadTransactions();
    loadItems(); // Stock changes
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Aplikasi Manajemen Inventaris</h1>

      {/* Tab navigation */}
      <div className="flex justify-center mb-8 space-x-4">
        <Button variant={activeTab === "items" ? "default" : "ghost"} onClick={() => setActiveTab("items")}>Daftar Barang</Button>
        <Button variant={activeTab === "transactions" ? "default" : "ghost"} onClick={() => setActiveTab("transactions")}>Transaksi</Button>
      </div>

      {activeTab === "items" && (
        <div className="space-y-8">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>{editingItem ? "Edit Barang" : "Tambah Barang Baru"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleItemSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nama Barang</Label>
                  <Input id="name" required value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="code">Kode Barang</Label>
                  <Input id="code" required value={itemForm.code} onChange={e => setItemForm({ ...itemForm, code: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Deskripsi (opsional)</Label>
                  <Input id="description" value={itemForm.description || ""} onChange={e => setItemForm({ ...itemForm, description: e.target.value || null })} />
                </div>
                <div>
                  <Label htmlFor="purchase_price">Harga Beli</Label>
                  <Input type="number" id="purchase_price" required min="0" step="0.01" value={itemForm.purchase_price} onChange={e => setItemForm({ ...itemForm, purchase_price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label htmlFor="sale_price">Harga Jual</Label>
                  <Input type="number" id="sale_price" required min="0" step="0.01" value={itemForm.sale_price} onChange={e => setItemForm({ ...itemForm, sale_price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label htmlFor="unit">Satuan</Label>
                  <Select value={itemForm.unit} onValueChange={v => setItemForm({ ...itemForm, unit: v as typeof itemForm.unit })}>
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Pilih satuan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pcs">Pcs</SelectItem>
                      <SelectItem value="Kotak">Kotak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stock">Stok Awal</Label>
                  <Input type="number" id="stock" min="0" value={itemForm.stock} onChange={e => setItemForm({ ...itemForm, stock: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="md:col-span-2 flex justify-end space-x-2">
                  {editingItem && (
                    <Button type="button" variant="outline" onClick={() => { setEditingItem(null); setItemForm({ name: "", code: "", description: null, purchase_price: 0, sale_price: 0, unit: "Pcs", stock: 0 }); }}>
                      Batal
                    </Button>
                  )}
                  <Button type="submit" disabled={itemLoading}>{itemLoading ? "Menyimpan..." : editingItem ? "Update" : "Tambah"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* List */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Semua Barang</CardTitle>
            </CardHeader>
            <CardContent>
              {itemLoading ? (
                <p className="text-center text-gray-500">Memuat data...</p>
              ) : items.length === 0 ? (
                <p className="text-center text-gray-500">Tidak ada barang.</p>
              ) : (
                <div className="grid gap-4">
                  {items.map(item => (
                    <div key={item.id} className="border rounded p-4 flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{item.name} ({item.code})</h3>
                        {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                        <p className="text-sm mt-1">Harga Beli: Rp{item.purchase_price.toLocaleString()}, Harga Jual: Rp{item.sale_price.toLocaleString()}</p>
                        <p className="text-sm">Satuan: {item.unit}, Stok: {item.stock}</p>
                      </div>
                      <div className="flex space-x-2 mt-2 md:mt-0">
                        <Button variant="outline" size="sm" onClick={() => startEditItem(item)}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item.id)}>
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="space-y-8">
          {/* Transaction Form */}
          <Card>
            <CardHeader>
              <CardTitle>Catat Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTransactionSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipe Transaksi</Label>
                  <Select value={transactionForm.type} onValueChange={v => setTransactionForm({ ...transactionForm, type: v as typeof transactionForm.type })}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masuk">Masuk</SelectItem>
                      <SelectItem value="keluar">Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Tanggal</Label>
                  <Input id="date" type="date" required value={new Date(transactionForm.date).toISOString().split('T')[0]} onChange={e => setTransactionForm({ ...transactionForm, date: new Date(e.target.value) })} />
                </div>
                <div>
                  <Label htmlFor="item_id">Barang</Label>
                  <Select value={transactionForm.item_id ? String(transactionForm.item_id) : ""} onValueChange={v => setTransactionForm({ ...transactionForm, item_id: Number(v) })}>
                    <SelectTrigger id="item_id">
                      <SelectValue placeholder="Pilih barang" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map(it => (
                        <SelectItem key={it.id} value={String(it.id)}>{it.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Jumlah</Label>
                  <Input id="quantity" type="number" required min="1" value={transactionForm.quantity} onChange={e => setTransactionForm({ ...transactionForm, quantity: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="note">Catatan (opsional)</Label>
                  <Input id="note" value={transactionForm.note || ""} onChange={e => setTransactionForm({ ...transactionForm, note: e.target.value || null })} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={transactionLoading}>{transactionLoading ? "Menyimpan..." : "Catat"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Transaction List */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionLoading ? (
                <p className="text-center text-gray-500">Memuat transaksi...</p>
              ) : transactions.length === 0 ? (
                <p className="text-center text-gray-500">Belum ada transaksi.</p>
              ) : (
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {transactions.map(tr => (
                    <div key={tr.id} className="border rounded p-3">
                      <p className="text-sm font-medium">{tr.type === "masuk" ? "Masuk" : "Keluar"} - {new Date(tr.date).toLocaleDateString()}</p>
                      <p className="text-sm">Barang: {items.find(it => it.id === tr.item_id)?.name || tr.item_id}</p>
                      <p className="text-sm">Jumlah: {tr.quantity}</p>
                      {tr.note && <p className="text-sm text-gray-600">Catatan: {tr.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default App;
