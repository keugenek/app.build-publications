import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { ArticleForm } from '@/components/ArticleForm';
import { ArticleDetailView } from '@/components/ArticleDetailView';
import { trpc } from '@/utils/trpc';
import type { Article, CreateArticleInput, ProductCategory } from '../../server/src/schema';

function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeTab, setActiveTab] = useState('reviews');

  // Load all articles
  const loadArticles = useCallback(async () => {
    try {
      const result = await trpc.getArticles.query();
      setArticles(result);
      setFilteredArticles(result);
    } catch (error) {
      console.error('Failed to load articles:', error);
      // Using stub data since backend returns empty array
      const stubArticles: Article[] = [
        {
          id: 1,
          product_name: 'SteelSeries Rival 3',
          category: 'mice',
          price: 29.99,
          overall_rating: 4,
          short_description: 'Affordable gaming mouse with solid performance and RGB lighting',
          detailed_review: 'The SteelSeries Rival 3 offers excellent value for budget-conscious gamers. With its TrueMove Core sensor and comfortable ergonomic design, it delivers reliable performance for both gaming and productivity tasks.',
          pros: ['Great sensor accuracy', 'Comfortable grip', 'RGB lighting', 'Affordable price'],
          cons: ['Build quality feels cheap', 'Limited customization options'],
          main_image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop',
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15')
        },
        {
          id: 2,
          product_name: 'Redragon K552 Kumara',
          category: 'keyboards',
          price: 39.99,
          overall_rating: 5,
          short_description: 'Mechanical keyboard with blue switches at an unbeatable price',
          detailed_review: 'The Redragon K552 Kumara is a tenkeyless mechanical keyboard that punches well above its weight class. Featuring genuine mechanical switches and solid build quality, it\'s perfect for gamers on a budget.',
          pros: ['Genuine mechanical switches', 'Compact tenkeyless design', 'Excellent build quality', 'Great typing experience'],
          cons: ['No RGB backlighting', 'Loud blue switches', 'No software customization'],
          main_image_url: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=300&fit=crop',
          created_at: new Date('2024-01-20'),
          updated_at: new Date('2024-01-20')
        },
        {
          id: 3,
          product_name: 'HyperX Cloud Stinger',
          category: 'headsets',
          price: 49.99,
          overall_rating: 4,
          short_description: 'Lightweight gaming headset with great sound quality',
          detailed_review: 'The HyperX Cloud Stinger delivers impressive audio quality and comfort for its price point. Perfect for long gaming sessions with its lightweight design and swivel-to-mute microphone.',
          pros: ['Excellent audio quality', 'Very comfortable', 'Lightweight design', 'Swivel-to-mute mic'],
          cons: ['Plastic build feels flimsy', 'Non-detachable cable', 'Limited bass response'],
          main_image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=300&fit=crop',
          created_at: new Date('2024-01-25'),
          updated_at: new Date('2024-01-25')
        }
      ];
      setArticles(stubArticles);
      setFilteredArticles(stubArticles);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Filter articles by category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredArticles(articles);
    } else {
      setFilteredArticles(articles.filter((article: Article) => article.category === selectedCategory));
    }
  }, [selectedCategory, articles]);

  // Handle form submission for creating articles
  const handleCreateSubmit = async (data: CreateArticleInput) => {
    setIsLoading(true);
    try {
      const response = await trpc.createArticle.mutate(data);
      setArticles((prev: Article[]) => [response, ...prev]);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission for editing articles
  const handleEditSubmit = async (data: CreateArticleInput) => {
    if (!editingArticle) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.updateArticle.mutate({
        id: editingArticle.id,
        ...data
      });
      setArticles((prev: Article[]) => 
        prev.map((article: Article) => article.id === editingArticle.id ? (response as Article) : article)
      );
      setIsEditDialogOpen(false);
      setEditingArticle(null);
    } catch (error) {
      console.error('Failed to update article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting articles
  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteArticle.mutate({ id });
      setArticles((prev: Article[]) => prev.filter((article: Article) => article.id !== id));
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };

  // Show article detail view
  const showArticleDetail = (article: Article) => {
    setSelectedArticle(article);
    setIsDetailViewOpen(true);
  };

  // Populate form with article data for editing
  const startEdit = (article: Article) => {
    setEditingArticle(article);
    setIsEditDialogOpen(true);
  };



  // Render star rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ⭐
      </span>
    ));
  };

  // Category badges with gaming-themed colors
  const getCategoryBadgeColor = (category: ProductCategory) => {
    switch (category) {
      case 'mice': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'keyboards': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'headsets': return 'bg-green-100 text-green-800 hover:bg-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎮 Budget Gaming Gear</h1>
              <p className="text-gray-600 mt-1">Reviews of affordable PC gaming peripherals</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filteredArticles.length} Reviews
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="reviews">📝 Reviews</TabsTrigger>
            <TabsTrigger value="cms">⚙️ CMS</TabsTrigger>
          </TabsList>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
              <span className="font-medium text-gray-700">Filter by category:</span>
              <div className="flex gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All Categories
                </Button>
                <Button
                  variant={selectedCategory === 'mice' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('mice')}
                  className={selectedCategory === 'mice' ? '' : 'hover:bg-red-50'}
                >
                  🖱️ Mice
                </Button>
                <Button
                  variant={selectedCategory === 'keyboards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('keyboards')}
                  className={selectedCategory === 'keyboards' ? '' : 'hover:bg-blue-50'}
                >
                  ⌨️ Keyboards
                </Button>
                <Button
                  variant={selectedCategory === 'headsets' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('headsets')}
                  className={selectedCategory === 'headsets' ? '' : 'hover:bg-green-50'}
                >
                  🎧 Headsets
                </Button>
              </div>
            </div>

            {/* Articles Grid */}
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No reviews found for this category.</p>
                <p className="text-gray-400 mt-2">Check back later for new reviews!</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((article: Article) => (
                  <Card key={article.id} className="hover:shadow-lg transition-shadow">
                    {article.main_image_url && (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                        <img
                          src={article.main_image_url}
                          alt={article.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{article.product_name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getCategoryBadgeColor(article.category)}>
                              {article.category === 'mice' ? '🖱️' : article.category === 'keyboards' ? '⌨️' : '🎧'} {article.category}
                            </Badge>
                            <span className="text-lg font-bold text-green-600">${article.price}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(article.overall_rating)}
                        <span className="text-sm text-gray-500 ml-1">({article.overall_rating}/5)</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm mb-4">
                        {article.short_description}
                      </CardDescription>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-green-700 text-sm mb-1">✅ Pros:</h4>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {article.pros.slice(0, 2).map((pro: string, index: number) => (
                              <li key={index}>• {pro}</li>
                            ))}
                            {article.pros.length > 2 && (
                              <li className="text-gray-400">+ {article.pros.length - 2} more...</li>
                            )}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-red-700 text-sm mb-1">❌ Cons:</h4>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {article.cons.slice(0, 2).map((con: string, index: number) => (
                              <li key={index}>• {con}</li>
                            ))}
                            {article.cons.length > 2 && (
                              <li className="text-gray-400">+ {article.cons.length - 2} more...</li>
                            )}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t flex justify-between items-center">
                        <p className="text-xs text-gray-400">
                          Published {article.created_at.toLocaleDateString()}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => showArticleDetail(article)}
                        >
                          Read Full Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* CMS Tab */}
          <TabsContent value="cms" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Content Management</h2>
                <p className="text-gray-600">Create, edit, and manage your peripheral reviews</p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    ➕ New Article
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Article</DialogTitle>
                    <DialogDescription>
                      Add a new peripheral review to your site
                    </DialogDescription>
                  </DialogHeader>
                  <ArticleForm 
                    onSubmit={handleCreateSubmit} 
                    onCancel={() => setIsCreateDialogOpen(false)}
                    isLoading={isLoading}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Articles Management Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Articles ({articles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {articles.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    No articles yet. Create your first review!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {articles.map((article: Article) => (
                      <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{article.product_name}</h3>
                            <Badge className={getCategoryBadgeColor(article.category)} variant="secondary">
                              {article.category}
                            </Badge>
                            <div className="flex items-center">
                              {renderStars(article.overall_rating)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{article.short_description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Created {article.created_at.toLocaleDateString()} • Updated {article.updated_at.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-green-600">${article.price}</span>
                          <Button variant="outline" size="sm" onClick={() => startEdit(article)}>
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Article</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{article.product_name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(article.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Article</DialogTitle>
                  <DialogDescription>
                    Update your peripheral review
                  </DialogDescription>
                </DialogHeader>
                {editingArticle && (
                  <ArticleForm 
                    initialData={editingArticle}
                    onSubmit={handleEditSubmit}
                    onCancel={() => {
                      setIsEditDialogOpen(false);
                      setEditingArticle(null);
                    }}
                    isLoading={isLoading}
                    isEdit={true}
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* Article Detail View Dialog */}
            <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                {selectedArticle && (
                  <ArticleDetailView 
                    article={selectedArticle}
                  />
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
