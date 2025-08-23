import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Confetti } from '@/components/Confetti';
import { trpc } from '@/utils/trpc';
import type { BirthdayMessage, CreateBirthdayMessageInput, GalleryImage } from '../../server/src/schema';

function App() {
  const [messages, setMessages] = useState<BirthdayMessage[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Load birthday messages and gallery images
  useEffect(() => {
    const loadData = async () => {
      try {
        const [messagesData, imagesData] = await Promise.all([
          trpc.getBirthdayMessages.query(),
          trpc.getGalleryImages.query()
        ]);
        setMessages(messagesData);
        setGalleryImages(imagesData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const newMessage: CreateBirthdayMessageInput = {
        recipient_name: recipientName,
        message: message
      };
      
      const result = await trpc.createBirthdayMessage.mutate(newMessage);
      setMessages(prev => [...prev, result]);
      setRecipientName('');
      setMessage('');
      setShowConfetti(true);
      
      // Stop confetti after 5 seconds
      setTimeout(() => setShowConfetti(false), 5000);
    } catch (error) {
      console.error('Failed to submit message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
      <Confetti active={showConfetti} />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-4">
            🎉 Happy Birthday! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Share your birthday wishes with our special celebrant
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Message Form Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Send Birthday Wishes</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Birthday Message
                  </label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your birthday message here..."
                    rows={4}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Wishes 🎈'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Messages Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Birthday Wishes</CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No birthday messages yet. Be the first to send wishes!
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-purple-600">{msg.recipient_name}</h3>
                        <span className="text-xs text-gray-500">
                          {msg.created_at.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-700">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gallery Section */}
        <Card className="mt-12 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Birthday Celebration Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            {galleryImages.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div 
                    key={i} 
                    className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center"
                  >
                    <span className="text-gray-500">🎂 Photo {i}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {galleryImages
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((image) => (
                    <div key={image.id} className="aspect-square overflow-hidden rounded-lg">
                      <img 
                        src={image.url} 
                        alt={image.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                }
              </div>
            )}
          </CardContent>
        </Card>

        <footer className="mt-12 text-center text-gray-600">
          <p>Made with ❤️ for a special birthday celebration</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
