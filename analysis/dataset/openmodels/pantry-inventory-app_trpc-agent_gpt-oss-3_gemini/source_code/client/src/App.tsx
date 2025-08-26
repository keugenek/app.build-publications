import './App.css';
import { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import type { PantryItem, CreatePantryItemInput, UpdatePantryItemInput } from '../../server/src/schema';

function App() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  const emptyForm: CreatePantryItemInput = {
    name: '',
    quantity: 0,
    unit: 'grams',
    expiry_date: new Date()
  };

  const [formData, setFormData] = useState<CreatePantryItemInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await trpc.getPantryItems.query();
      setItems(data);
    } catch (e) {
      console.error('Failed to fetch pantry items', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'quantity') {
        return { ...prev, quantity: parseFloat(value) || 0 };
      }
      if (name === 'expiry_date') {
        return { ...prev, expiry_date: new Date(value) };
      }
      return { ...prev, [name]: value } as CreatePantryItemInput;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingId !== null) {
        // Update existing item
        const updatePayload: UpdatePantryItemInput = {
          id: editingId,
          ...formData
        };
        const updated = await trpc.updatePantryItem.mutate(updatePayload);
        setItems(prev => prev.map(item => (item.id === editingId ? updated : item)));
        setEditingId(null);
      } else {
        // Create new item
        const created = await trpc.createPantryItem.mutate(formData);
        setItems(prev => [...prev, created]);
      }
      setFormData(emptyForm);
    } catch (err) {
      console.error('Submit error', err);
    } finally {
      setFormLoading(false);
    }
  };

  const startEdit = (item: PantryItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      expiry_date: new Date(item.expiry_date)
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await trpc.deletePantryItem.mutate({ id });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.error('Delete error', e);
    }
  };

  const isExpired = (date: Date) => {
    const today = new Date();
    return date < today;
  };

  const isExpiringSoon = (date: Date) => {
    const today = new Date();
    const diff = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3; // within 3 days
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Pantry Manager</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid gap-2 md:grid-cols-5 mb-6 items-end">
        <div className="col-span-2">
          <Input
            name="name"
            placeholder="Item name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Input
            name="quantity"
            type="number"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="0"
            required
          />
        </div>
        <div>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full h-9 rounded-md border bg-transparent px-3 py-1 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {['grams', 'pieces', 'liters'].map(u => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Input
            name="expiry_date"
            type="date"
            value={formData.expiry_date.toISOString().split('T')[0]}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-span-5 md:col-span-1">
          <Button type="submit" disabled={formLoading} className="w-full">
            {formLoading ? (editingId !== null ? 'Updating...' : 'Creating...') : editingId !== null ? 'Update Item' : 'Add Item'}
          </Button>
        </div>
      </form>

      {/* List */}
      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No pantry items yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Quantity</th>
                <th className="text-left p-2">Unit</th>
                <th className="text-left p-2">Expiry</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const expiry = new Date(item.expiry_date);
                const rowClass = isExpired(expiry)
                  ? 'bg-red-100'
                  : isExpiringSoon(expiry)
                  ? 'bg-yellow-100'
                  : '';
                return (
                  <tr key={item.id} className={rowClass}>
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">{item.quantity}</td>
                    <td className="p-2 capitalize">{item.unit}</td>
                    <td className="p-2">{expiry.toLocaleDateString()}</td>
                    <td className="p-2 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
