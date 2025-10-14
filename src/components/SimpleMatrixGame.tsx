import React, { useRef, useEffect, useState, useCallback } from 'react';
import { NeonButton } from './ui/neon-button';

interface SimpleMatrixGameProps {
  onScoreUpdate: (score: number) => void;
  isPlaying: boolean;
  onRestart?: () => void;
}

export const SimpleMatrixGame: React.FC<SimpleMatrixGameProps> = ({ onScoreUpdate, isPlaying, onRestart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const keysPressed = useRef<Set<string>>(new Set());
  
  // Game state
  const [score, setScore] = useState(0);
  const [player, setPlayer] = useState({ x: 400, y: 500 });
  const [bullets, setBullets] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [enemies, setEnemies] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [lastShot, setLastShot] = useState(0);
  const [lastEnemySpawn, setLastEnemySpawn] = useState(0);
  const [enemiesPassed, setEnemiesPassed] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Simple shoot sound
  const playShootSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Silent fail if audio not available
    }
  }, []);

  // Restart game function
  const restartGame = useCallback(() => {
    setScore(0);
    setPlayer({ x: 400, y: 500 });
    setBullets([]);
    setEnemies([]);
    setLastShot(0);
    setLastEnemySpawn(0);
    setEnemiesPassed(0);
    setGameOver(false);
    onScoreUpdate(0);
  }, [onScoreUpdate]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
      
      // Handle restart on 'R' key press when game is over
      if (e.code === 'KeyR' && gameOver) {
        restartGame();
        if (onRestart) {
          onRestart();
        }
      }
      
      e.preventDefault();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameOver, restartGame, onRestart]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!isPlaying || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = Date.now();

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 800, 600);

    // Update player position
    const newPlayer = { ...player };
    if (keysPressed.current.has('ArrowLeft') && newPlayer.x > 20) {
      newPlayer.x -= 5;
    }
    if (keysPressed.current.has('ArrowRight') && newPlayer.x < 780) {
      newPlayer.x += 5;
    }
    if (keysPressed.current.has('ArrowDown') && newPlayer.y < 580) {
      newPlayer.y += 5;
    }

    // Shooting
    if (keysPressed.current.has('Space') && now - lastShot > 200) {
      setBullets(prev => [...prev, { x: newPlayer.x, y: newPlayer.y - 20, id: now }]);
      setLastShot(now);
      playShootSound();
    }

    setPlayer(newPlayer);

    // Update bullets
    setBullets(prev => prev
      .map(bullet => ({ ...bullet, y: bullet.y - 10 }))
      .filter(bullet => bullet.y > 0)
    );

    // Spawn enemies
    if (now - lastEnemySpawn > 1000) {
      setEnemies(prev => [...prev, {
        x: Math.random() * 760 + 20,
        y: 0,
        id: now
      }]);
      setLastEnemySpawn(now);
    }

    // Update enemies
    setEnemies(prev => {
      const updated = prev.map(enemy => ({ ...enemy, y: enemy.y + 2 }));
      
      // Count enemies that reach the bottom
      const reachingBottom = updated.filter(enemy => enemy.y >= 600);
      if (reachingBottom.length > 0) {
        setEnemiesPassed(current => {
          const newCount = current + reachingBottom.length;
          // Check if game over should be triggered (5 enemies passed)
          if (newCount >= 5 && !gameOver) {
            setGameOver(true);
          }
          return newCount;
        });
      }
      
      return updated.filter(enemy => enemy.y < 600);
    });

    // Check collisions
    setBullets(prevBullets => {
      let newBullets = [...prevBullets];
      setEnemies(prevEnemies => {
        let newEnemies = [...prevEnemies];
        let newScore = score;

        newBullets.forEach((bullet, bulletIndex) => {
          newEnemies.forEach((enemy, enemyIndex) => {
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            if (Math.sqrt(dx * dx + dy * dy) < 25) {
              newBullets.splice(bulletIndex, 1);
              newEnemies.splice(enemyIndex, 1);
              newScore += 10;
            }
          });
        });

        if (newScore !== score) {
          setScore(newScore);
          onScoreUpdate(newScore);
        }

        return newEnemies;
      });
      return newBullets;
    });

    // Draw player
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(newPlayer.x - 10, newPlayer.y - 10, 20, 20);

    // Draw bullets
    ctx.fillStyle = '#00FF00';
    bullets.forEach(bullet => {
      ctx.fillRect(bullet.x - 2, bullet.y - 5, 4, 10);
    });

    // Draw enemies
    ctx.fillStyle = '#FF0000';
    enemies.forEach(enemy => {
      ctx.fillRect(enemy.x - 10, enemy.y - 10, 20, 20);
    });

    // Draw UI
    ctx.fillStyle = '#00FF00';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${score}`, 400, 30);
    ctx.fillText(`Enemies Passed: ${enemiesPassed}`, 400, 55);
    ctx.font = '14px monospace';
    ctx.fillText('Use left/right arrows to move, space to shoot', 400, 580);
    ctx.textAlign = 'left';

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, gameOver, player, bullets, enemies, score, lastShot, lastEnemySpawn, enemiesPassed, onScoreUpdate, playShootSound]);

  // Start/stop game loop
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, gameLoop]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw initial state
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 800, 600);
    
    if (gameOver) {
      ctx.fillStyle = '#FF0000';
      ctx.font = 'bold 48px "Orbitron", "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', 400, 280);
      
      ctx.font = 'bold 24px "Orbitron", "Courier New", monospace';
      ctx.fillStyle = '#FF6666';
      ctx.fillText('5 Enemies Passed!', 400, 320);
      
      ctx.fillStyle = '#FFAA00';
      ctx.fillText(`Final Score: ${score}`, 400, 350);
      
      ctx.font = '18px "Orbitron", "Courier New", monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Press R to Restart', 400, 400);
    } else if (!isPlaying) {
      ctx.fillStyle = '#00FF00';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MATRIX GAME READY', 400, 300);
      ctx.font = '16px monospace';
      ctx.fillText('Click START GAME to begin', 400, 330);
    }
  }, [isPlaying, gameOver, score]);


  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-primary bg-black"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      {gameOver && (
        <NeonButton
          onClick={() => {
            restartGame();
            if (onRestart) {
              onRestart();
            }
          }}
          variant="warning"
          size="lg"
        >
          RESTART GAME
        </NeonButton>
      )}
    </div>
  );
};