import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { createBirthdayCardInputSchema, addPhotoInputSchema } from './schema';

// Import handlers
import { createBirthdayCard } from './handlers/create_birthday_card';
import { getBirthdayCards } from './handlers/get_birthday_cards';
import { addPhoto } from './handlers/add_photo';
import { getPhotos } from './handlers/get_photos';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createBirthdayCard: publicProcedure
    .input(createBirthdayCardInputSchema)
    .mutation(({ input }) => createBirthdayCard(input)),
  getBirthdayCards: publicProcedure
    .query(() => getBirthdayCards()),
  addPhoto: publicProcedure
    .input(addPhotoInputSchema)
    .mutation(({ input }) => addPhoto(input)),
  getPhotos: publicProcedure
    .input(z.object({ cardId: z.number() }))
    .query(({ input }) => getPhotos(input.cardId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      // Serve birthday card files
      if (req.url === '/' || req.url === '/index.html' || req.url === '/birthday-card') {
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Happy Birthday!</title>
    <link rel="stylesheet" href="/birthday-card.css">
</head>
<body>
    <div class="container">
        <h1>🎉 Happy Birthday! 🎉</h1>
        <div class="message">
            <p>Dear Friend,</p>
            <p>Wishing you a day filled with happiness and a year filled with joy. May all your dreams and wishes come true!</p>
            <p>Hope your special day is as wonderful and amazing as you are!</p>
            <p>With love,<br>Your Friend</p>
        </div>
        
        <div class="gallery">
            <h2>Special Memories</h2>
            <div class="gallery-container">
                <img src="https://placehold.co/300x200/FF6B6B/white?text=Memory+1" alt="Birthday memory 1">
                <img src="https://placehold.co/300x200/4ECDC4/white?text=Memory+2" alt="Birthday memory 2">
                <img src="https://placehold.co/300x200/FFD166/white?text=Memory+3" alt="Birthday memory 3">
                <img src="https://placehold.co/300x200/6A0572/white?text=Memory+4" alt="Birthday memory 4">
            </div>
        </div>
        
        <div class="animation-controls">
            <button id="confettiBtn">🎊 Launch Confetti!</button>
            <button id="balloonBtn">🎈 Release Balloons!</button>
        </div>
    </div>
    
    <div id="confetti-container"></div>
    <div id="balloon-container"></div>
    
    <script src="/birthday-card.js"></script>
</body>
</html>`);
        return;
      } else if (req.url === '/birthday-card.css') {
        res.setHeader('Content-Type', 'text/css');
        res.writeHead(200);
        res.end(`* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
  min-height: 100vh;
  padding: 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  position: relative;
  overflow: hidden;
}

h1 {
  color: #ff6b6b;
  font-size: 3rem;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.message {
  background: #fff;
  padding: 25px;
  border-radius: 15px;
  margin: 25px 0;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  font-size: 1.2rem;
  line-height: 1.6;
  color: #555;
}

.message p {
  margin-bottom: 15px;
}

.message p:last-child {
  margin-bottom: 0;
}

.gallery {
  margin: 30px 0;
}

.gallery h2 {
  color: #4ecdc4;
  margin-bottom: 20px;
  font-size: 2rem;
}

.gallery-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.gallery-container img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.gallery-container img:hover {
  transform: scale(1.05);
}

.animation-controls {
  margin: 30px 0;
}

button {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 15px 30px;
  margin: 0 10px;
  border-radius: 50px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
}

button:hover {
  background: #ff5252;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.4);
}

#confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

#balloon-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999;
}

.balloon {
  position: absolute;
  width: 60px;
  height: 70px;
  border-radius: 50%;
  bottom: -100px;
  animation: floatUp 10s linear infinite;
}

.balloon:before {
  content: "";
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 50px;
  background: rgba(0, 0, 0, 0.2);
}

@keyframes floatUp {
  0% {
    bottom: -100px;
    transform: translateX(0);
  }
  50% {
    transform: translateX(100px);
  }
  100% {
    bottom: 100vh;
    transform: translateX(0);
  }
}

@media (max-width: 600px) {
  .container {
    padding: 20px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .message {
    padding: 15px;
    font-size: 1rem;
  }
  
  button {
    display: block;
    width: 80%;
    margin: 10px auto;
  }
}`);
        return;
      } else if (req.url === '/birthday-card.js') {
        res.setHeader('Content-Type', 'application/javascript');
        res.writeHead(200);
        res.end(`// Confetti function
document.getElementById('confettiBtn').addEventListener('click', () => {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    
    // Create multiple confetti bursts
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            createConfetti();
        }, i * 300);
    }
});

function createConfetti() {
    const confettiCount = 150;
    const container = document.getElementById('confetti-container');
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = getRandomColor();
        confetti.style.borderRadius = '50%';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.opacity = Math.random() + 0.5;
        confetti.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
        
        container.appendChild(confetti);
        
        // Animate confetti falling
        const animation = confetti.animate([
            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
            { transform: \`translateY(\${window.innerHeight}px) rotate(\${Math.random() * 360}deg)\`, opacity: 0 }
        ], {
            duration: 3000 + Math.random() * 2000,
            easing: 'cubic-bezier(0.1, 0.8, 0.2, 1)'
        });
        
        animation.onfinish = () => {
            confetti.remove();
        };
    }
}

// Balloon function
document.getElementById('balloonBtn').addEventListener('click', () => {
    const container = document.getElementById('balloon-container');
    container.innerHTML = '';
    
    // Create multiple balloons
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            createBalloon();
        }, i * 200);
    }
});

function createBalloon() {
    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    balloon.style.left = Math.random() * 100 + 'vw';
    balloon.style.backgroundColor = getRandomColor();
    balloon.style.width = (30 + Math.random() * 50) + 'px';
    balloon.style.height = (40 + Math.random() * 60) + 'px';
    
    document.getElementById('balloon-container').appendChild(balloon);
    
    // Remove balloon after animation completes
    setTimeout(() => {
        balloon.remove();
    }, 10000);
}

// Helper function to generate random colors
function getRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#FFD166', '#6A0572', '#118AB2', 
        '#06D6A0', '#EF476F', '#FF9E00', '#9B5DE5', '#00BBF9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Auto-trigger animations on load
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('confettiBtn').click();
    }, 1000);
});`);
        return;
      }
      
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log('TRPC server listening at port: ' + port);
}

start();