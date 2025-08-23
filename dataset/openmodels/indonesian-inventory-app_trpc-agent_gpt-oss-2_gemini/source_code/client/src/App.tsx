import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'; // assuming select component exists
import { trpc } from '@/utils/trpc';
import type { Item, CreateItemInput, UpdateItemInput, CreateInboundInput, CreateOutboundInput } from '../../server/src/schema';

function App() {
  const [tab, setTab] = useState<'barang' | 'masuk' | 'keluar'>('barang');
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const data = await trpc.getItems.query();
      setItems(data);
    } catch (e) {
      console.error('Gagal memuat barang', e);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Handlers for barang CRUD
  const addItem = async (input: CreateItemInput) => {
    const newItem = await trpc.createItem.mutate(input);
    setItems((prev) => [...prev, newItem]);
  };

  const editItem = async (input: UpdateItemInput) => {
    const updated = await trpc.updateItem.mutate(input);
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  };

  const removeItem = async (id: number) => {
    await trpc.deleteItem.mutate({ id });
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Handlers for inbound/outbound
  const addInbound = async (input: CreateInboundInput) => {
    await trpc.createInbound.mutate(input);
    // after inbound, reload items to refresh stok
    await loadItems();
  };

  const addOutbound = async (input: CreateOutboundInput) => {
    await trpc.createOutbound.mutate(input);
    await loadItems();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center">Manajemen Inventaris</h1>
      {/* Tab navigation */}
      <nav className="flex justify-center space-x-4 mb-4">
        <Button variant={tab === 'barang' ? 'default' : 'outline'} onClick={() => setTab('barang')}>
          Daftar Barang
        </Button>
        <Button variant={tab === 'masuk' ? 'default' : 'outline'} onClick={() => setTab('masuk')}>
          Transaksi Masuk
        </Button>
        <Button variant={tab === 'keluar' ? 'default' : 'outline'} onClick={() => setTab('keluar')}>
          Transaksi Keluar
        </Button>
      </nav>

      {tab === 'barang' && (
        <section>
          <h2 className="text-2xl font-semibold mb-2">Kelola Barang</h2>
          <ItemForm onSubmit={addItem} />
          <div className="mt-6">
            {loadingItems ? (
              <p>Memuat barang...</p>
            ) : items.length === 0 ? (
              <p className="text-gray-500">Tidak ada barang. Tambahkan barang di atas.</p>
            ) : (
              <table className="w-full table-auto border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Nama</th>
                    <th className="p-2 border">Kode</th>
                    <th className="p-2 border">Harga Beli</th>
                    <th className="p-2 border">Harga Jual</th>
                    <th className="p-2 border">Stok</th>
                    <th className="p-2 border">Satuan</th>
                    <th className="p-2 border">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="odd:bg-gray-50">
                      <td className="p-2 border">{item.nama}</td>
                      <td className="p-2 border">{item.kode}</td>
                      <td className="p-2 border">{item.harga_beli.toLocaleString('id-ID')}</td>
                      <td className="p-2 border">{item.harga_jual.toLocaleString('id-ID')}</td>
                      <td className="p-2 border text-center">{item.stok_saat_ini}</td>
                      <td className="p-2 border text-center">{item.satuan}</td>
                      <td className="p-2 border space-x-2">
                        <EditItemModal item={item} onSave={editItem} />
                        <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>
                          Hapus
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {tab === 'masuk' && (
        <section>
          <h2 className="text-2xl font-semibold mb-2">Transaksi Barang Masuk</h2>
          <InboundForm items={items} onSubmit={addInbound} />
        </section>
      )}

      {tab === 'keluar' && (
        <section>
          <h2 className="text-2xl font-semibold mb-2">Transaksi Barang Keluar</h2>
          <OutboundForm items={items} onSubmit={addOutbound} />
        </section>
      )}
    </div>
  );
}

export default App;

// ---- ItemForm component ----
interface ItemFormProps {
  onSubmit: (data: CreateItemInput) => Promise<void>;
}
function ItemForm({ onSubmit }: ItemFormProps) {
  const [form, setForm] = useState<CreateItemInput>({
    nama: '',
    kode: '',
    deskripsi: null,
    harga_beli: 0,
    harga_jual: 0,
    satuan: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'harga_beli' || name === 'harga_jual' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
      setForm({ nama: '', kode: '', deskripsi: null, harga_beli: 0, harga_jual: 0, satuan: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      <Input name="nama" placeholder="Nama Barang" value={form.nama} onChange={handleChange} required />
      <Input name="kode" placeholder="Kode Barang" value={form.kode} onChange={handleChange} required />
      <Input name="deskripsi" placeholder="Deskripsi" value={form.deskripsi || ''} onChange={handleChange} />
      <Input name="harga_beli" type="number" placeholder="Harga Beli" value={form.harga_beli} onChange={handleChange} required />
      <Input name="harga_jual" type="number" placeholder="Harga Jual" value={form.harga_jual} onChange={handleChange} required />
      <Input name="satuan" placeholder="Satuan (mis: Pcs)" value={form.satuan} onChange={handleChange} required />
      <Button type="submit" disabled={loading} className="col-span-2">
        {loading ? 'Menyimpan...' : 'Tambah Barang'}
      </Button>
    </form>
  );
}

// ---- EditItemModal component (simple inline edit) ----
interface EditItemModalProps {
  item: Item;
  onSave: (data: UpdateItemInput) => Promise<void>;
}
function EditItemModal({ item, onSave }: EditItemModalProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<UpdateItemInput>({
    id: item.id,
    nama: item.nama,
    kode: item.kode,
    deskripsi: item.deskripsi,
    harga_beli: item.harga_beli,
    harga_jual: item.harga_jual,
    satuan: item.satuan,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'harga_beli' || name === 'harga_jual' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSave = async () => {
    await onSave(form);
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit
      </Button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-medium mb-4">Edit Barang</h3>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <Input name="nama" placeholder="Nama Barang" value={form.nama || ''} onChange={handleChange} />
              <Input name="kode" placeholder="Kode Barang" value={form.kode || ''} onChange={handleChange} />
              <Input name="deskripsi" placeholder="Deskripsi" value={form.deskripsi || ''} onChange={handleChange} />
              <Input name="harga_beli" type="number" placeholder="Harga Beli" value={form.harga_beli || 0} onChange={handleChange} />
              <Input name="harga_jual" type="number" placeholder="Harga Jual" value={form.harga_jual || 0} onChange={handleChange} />
              <Input name="satuan" placeholder="Satuan" value={form.satuan || ''} onChange={handleChange} />
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ---- InboundForm component ----
interface InboundFormProps {
  items: Item[];
  onSubmit: (data: CreateInboundInput) => Promise<void>;
}
function InboundForm({ items, onSubmit }: InboundFormProps) {
  const [form, setForm] = useState<CreateInboundInput>({
    barang_id: 0,
    tanggal_masuk: new Date(),
    jumlah: 0,
    supplier: null,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'jumlah' ? parseInt(value) || 0 : name === 'barang_id' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.barang_id === 0) return;
    setLoading(true);
    try {
      await onSubmit(form);
      setForm({ barang_id: 0, tanggal_masuk: new Date(), jumlah: 0, supplier: null });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      <Select name="barang_id" value={form.barang_id.toString()} onValueChange={(v) => setForm((p) => ({ ...p, barang_id: parseInt(v) }))}>
        <SelectTrigger>
          <SelectValue placeholder="Pilih Barang" />
        </SelectTrigger>
        <SelectContent>
          {items.map((it) => (
            <SelectItem key={it.id} value={it.id.toString()}>{it.nama}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input name="tanggal_masuk" type="date" value={form.tanggal_masuk.toISOString().split('T')[0]} onChange={handleChange} required />
      <Input name="jumlah" type="number" placeholder="Jumlah" value={form.jumlah} onChange={handleChange} required />
      <Input name="supplier" placeholder="Supplier (opsional)" value={form.supplier || ''} onChange={handleChange} />
      <Button type="submit" disabled={loading} className="col-span-2">
        {loading ? 'Menyimpan...' : 'Catat Masuk'}
      </Button>
    </form>
  );
}

// ---- OutboundForm component ----
interface OutboundFormProps {
  items: Item[];
  onSubmit: (data: CreateOutboundInput) => Promise<void>;
}
function OutboundForm({ items, onSubmit }: OutboundFormProps) {
  const [form, setForm] = useState<CreateOutboundInput>({
    barang_id: 0,
    tanggal_keluar: new Date(),
    jumlah: 0,
    penerima: null,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'jumlah' ? parseInt(value) || 0 : name === 'barang_id' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.barang_id === 0) return;
    setLoading(true);
    try {
      await onSubmit(form);
      setForm({ barang_id: 0, tanggal_keluar: new Date(), jumlah: 0, penerima: null });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      <Select name="barang_id" value={form.barang_id.toString()} onValueChange={(v) => setForm((p) => ({ ...p, barang_id: parseInt(v) }))}>
        <SelectTrigger>
          <SelectValue placeholder="Pilih Barang" />
        </SelectTrigger>
        <SelectContent>
          {items.map((it) => (
            <SelectItem key={it.id} value={it.id.toString()}>{it.nama}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input name="tanggal_keluar" type="date" value={form.tanggal_keluar.toISOString().split('T')[0]} onChange={handleChange} required />
      <Input name="jumlah" type="number" placeholder="Jumlah" value={form.jumlah} onChange={handleChange} required />
      <Input name="penerima" placeholder="Penerima (opsional)" value={form.penerima || ''} onChange={handleChange} />
      <Button type="submit" disabled={loading} className="col-span-2">
        {loading ? 'Menyimpan...' : 'Catat Keluar'}
      </Button>
    </form>
  );
}
