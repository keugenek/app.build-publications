import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import type { CreateBookmarkInput } from "../../../server/src/schema";

interface BookmarkFormProps {
  onCreated?: () => void;
}

export function BookmarkForm({ onCreated }: BookmarkFormProps) {
  const [formData, setFormData] = useState<CreateBookmarkInput>({
    user_id: 0, // placeholder, should be set to current user ID in real app
    url: "",
    title: "",
    description: null,
    collection_id: null,
    tag_ids: [],
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createBookmark.mutate(formData);
      // Reset form
      setFormData({
        user_id: 0,
        url: "",
        title: "",
        description: null,
        collection_id: null,
        tag_ids: [],
      });
      if (onCreated) onCreated();
    } catch (error) {
      console.error("Failed to create bookmark:", error);
    } finally {
      setIsLoading(false);
    }
  }, [formData, onCreated]);

  // Helper to parse comma‑separated tag IDs
  const handleTagIdsChange = (value: string) => {
    const ids = value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "")
      .map((s) => Number(s))
      .filter((n) => !Number.isNaN(n));
    setFormData((prev) => ({ ...prev, tag_ids: ids }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md mb-8">
      <h2 className="text-xl font-semibold">Add New Bookmark</h2>
      <Input
        placeholder="URL"
        type="url"
        required
        value={formData.url}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, url: e.target.value }))
        }
      />
      <Input
        placeholder="Title"
        required
        value={formData.title}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, title: e.target.value }))
        }
      />
      <Input
        placeholder="Description (optional)"
        value={formData.description ?? ""}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            description: e.target.value || null,
          }))
        }
      />
      <Input
        placeholder="Collection ID (optional)"
        type="number"
        value={formData.collection_id ?? ""}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            collection_id: e.target.value ? Number(e.target.value) : null,
          }))
        }
      />
      <Input
        placeholder="Tag IDs (comma separated, optional)"
        value={formData.tag_ids?.join(", ") ?? ""}
        onChange={(e) => handleTagIdsChange(e.target.value)}
      />
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Bookmark"}
      </Button>
    </form>
  );
}
