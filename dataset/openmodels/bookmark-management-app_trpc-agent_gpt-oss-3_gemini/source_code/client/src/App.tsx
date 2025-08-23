import React, { useState } from 'react';
import { BookmarkForm } from '@/components/BookmarkForm';
import { BookmarkList } from '@/components/BookmarkList';

function App() {
  // Placeholder user ID; in a real app, retrieve from auth context
  
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBookmarkCreated = () => {
    // Increment key to force re-mount of BookmarkList, triggering a reload
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Bookmark Manager</h1>
      <BookmarkForm onCreated={handleBookmarkCreated} />
      {/* Force re-mount of BookmarkList when a new bookmark is added */}
      <BookmarkList key={refreshKey} />
    </div>
  );
}

export default App;
