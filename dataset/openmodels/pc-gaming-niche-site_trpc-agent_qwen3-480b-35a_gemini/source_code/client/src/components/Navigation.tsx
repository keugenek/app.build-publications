import { Button } from '@/components/ui/button';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  return (
    <nav className="flex flex-wrap gap-2 mb-8">
      <Button
        variant={activeTab === 'home' ? 'default' : 'outline'}
        onClick={() => setActiveTab('home')}
        className="flex-1 min-w-[100px]"
      >
        Home
      </Button>
      <Button
        variant={activeTab === 'categories' ? 'default' : 'outline'}
        onClick={() => setActiveTab('categories')}
        className="flex-1 min-w-[100px]"
      >
        Categories
      </Button>
      <Button
        variant={activeTab === 'reviews' ? 'default' : 'outline'}
        onClick={() => setActiveTab('reviews')}
        className="flex-1 min-w-[100px]"
      >
        All Reviews
      </Button>
      <Button
        variant={activeTab === 'admin' ? 'default' : 'outline'}
        onClick={() => setActiveTab('admin')}
        className="flex-1 min-w-[100px]"
      >
        Admin Panel
      </Button>
    </nav>
  );
}
