import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { CreateBirthdayCardInput } from '../../../server/src/schema';

interface BirthdayCardFormProps {
  onSubmit: (data: CreateBirthdayCardInput) => Promise<void>;
  isLoading?: boolean;
}

export function BirthdayCardForm({ onSubmit, isLoading = false }: BirthdayCardFormProps) {
  const [formData, setFormData] = useState<CreateBirthdayCardInput>({
    recipient_name: '',
    message: '',
    sender_name: '',
    theme: 'confetti'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      recipient_name: '',
      message: '',
      sender_name: '',
      theme: 'confetti'
    });
  };

  const getThemeEmoji = (theme: string) => {
    switch (theme) {
      case 'confetti':
        return '🎊';
      case 'balloons':
        return '🎈';
      case 'sparkles':
        return '✨';
      default:
        return '🎉';
    }
  };

  const getSampleMessage = (theme: string) => {
    switch (theme) {
      case 'confetti':
        return "🎊 Another year of amazing adventures awaits! May your special day be filled with joy, laughter, and all your favorite things. Here's to celebrating the wonderful person you are and all the incredible moments ahead!";
      case 'balloons':
        return "🎈 Wishing you a birthday as bright and colorful as a sky full of balloons! May this new year bring you happiness, success, and all the dreams your heart can hold. You deserve the very best!";
      case 'sparkles':
        return "✨ Like sparkles that light up the night, you bring magic to everyone around you! May your birthday shimmer with joy and your year ahead be filled with wonderful surprises and beautiful moments.";
      default:
        return "🎉 Happy Birthday! Wishing you a fantastic day filled with joy and celebration!";
    }
  };

  const useSampleMessage = () => {
    setFormData((prev: CreateBirthdayCardInput) => ({
      ...prev,
      message: getSampleMessage(prev.theme)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="recipient" className="text-gray-700 font-medium">
            🎂 Birthday Person
          </Label>
          <Input
            id="recipient"
            value={formData.recipient_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateBirthdayCardInput) => ({ ...prev, recipient_name: e.target.value }))
            }
            placeholder="Enter the birthday person's name"
            required
            className="border-gray-300 focus:border-pink-400 focus:ring-pink-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender" className="text-gray-700 font-medium">
            💝 Your Name
          </Label>
          <Input
            id="sender"
            value={formData.sender_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateBirthdayCardInput) => ({ ...prev, sender_name: e.target.value }))
            }
            placeholder="Enter your name"
            required
            className="border-gray-300 focus:border-pink-400 focus:ring-pink-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme" className="text-gray-700 font-medium">
          🎨 Birthday Theme
        </Label>
        <Select
          value={formData.theme}
          onValueChange={(value: 'confetti' | 'balloons' | 'sparkles') =>
            setFormData((prev: CreateBirthdayCardInput) => ({ ...prev, theme: value }))
          }
        >
          <SelectTrigger className="border-gray-300 focus:border-pink-400 focus:ring-pink-400">
            <SelectValue placeholder="Choose a theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confetti">
              🎊 Confetti - Colorful & Festive
            </SelectItem>
            <SelectItem value="balloons">
              🎈 Balloons - Bright & Cheerful
            </SelectItem>
            <SelectItem value="sparkles">
              ✨ Sparkles - Magical & Elegant
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="message" className="text-gray-700 font-medium">
            💌 Birthday Message
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={useSampleMessage}
            className="text-xs border-pink-200 text-pink-600 hover:bg-pink-50"
          >
            {getThemeEmoji(formData.theme)} Use Sample Message
          </Button>
        </div>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateBirthdayCardInput) => ({ ...prev, message: e.target.value }))
          }
          placeholder="Write a heartfelt birthday message..."
          rows={6}
          required
          className="border-gray-300 focus:border-pink-400 focus:ring-pink-400 resize-none"
        />
        <p className="text-xs text-gray-500">
          Tip: Make it personal and heartfelt! Share a favorite memory or wish them well for the year ahead.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Creating Your Card...
            </>
          ) : (
            <>
              🎉 Create Birthday Card 🎉
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
