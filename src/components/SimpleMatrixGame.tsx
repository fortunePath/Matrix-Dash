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
  const [enemies, setEnemies] = useState<Array<{ x: number; y: number; id: number; type?: number }>>([]);
  const [bonuses, setBonuses] = useState<Array<{ x: number; y: number; id: number; type: number }>>([]);
  const [lastShot, setLastShot] = useState(0);
  const [lastEnemySpawn, setLastEnemySpawn] = useState(0);
  const [lastBonusSpawn, setLastBonusSpawn] = useState(0);
  const [enemiesPassed, setEnemiesPassed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<'neo' | 'morpheus' | 'trinity'>('neo');
  const [showCharacterSelect, setShowCharacterSelect] = useState(true);
  const [floatingTexts, setFloatingTexts] = useState<Array<{ x: number; y: number; text: string; id: number; life: number }>>([]);

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

  // Draw character preview
  const drawCharacterPreview = useCallback((ctx: CanvasRenderingContext2D, character: 'neo' | 'morpheus' | 'trinity', x: number, y: number, scale = 1) => {
    const px = x;
    const py = y;
    
    if (character === 'neo') {
      // Neo - pale skin, dark hair, black suit
      ctx.fillStyle = '#FFDBAC';
      ctx.fillRect(px - 6*scale, py - 18*scale, 12*scale, 10*scale);
      ctx.fillStyle = '#2F1B14';
      ctx.fillRect(px - 6*scale, py - 18*scale, 12*scale, 4*scale);
      ctx.fillStyle = '#000000';
      ctx.fillRect(px - 5*scale, py - 15*scale, 10*scale, 4*scale);
      ctx.fillStyle = '#333333';
      ctx.fillRect(px - 4*scale, py - 14*scale, 3*scale, 2*scale);
      ctx.fillRect(px + 1*scale, py - 14*scale, 3*scale, 2*scale);
    } else if (character === 'morpheus') {
      // Morpheus - darker skin, bald, distinctive sunglasses
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(px - 6*scale, py - 18*scale, 12*scale, 10*scale);
      ctx.fillStyle = '#000000';
      ctx.fillRect(px - 6*scale, py - 15*scale, 12*scale, 5*scale);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(px - 5*scale, py - 14*scale, 4*scale, 3*scale);
      ctx.fillRect(px + 1*scale, py - 14*scale, 4*scale, 3*scale);
    } else {
      // Trinity - pale skin, black hair
      ctx.fillStyle = '#FFDBAC';
      ctx.fillRect(px - 6*scale, py - 18*scale, 12*scale, 10*scale);
      ctx.fillStyle = '#000000';
      ctx.fillRect(px - 7*scale, py - 18*scale, 14*scale, 6*scale);
      ctx.fillStyle = '#000000';
      ctx.fillRect(px - 5*scale, py - 15*scale, 10*scale, 4*scale);
      ctx.fillStyle = '#333333';
      ctx.fillRect(px - 4*scale, py - 14*scale, 3*scale, 2*scale);
      ctx.fillRect(px + 1*scale, py - 14*scale, 3*scale, 2*scale);
    }
    
    // Body (black suit) - same for all
    ctx.fillStyle = '#000000';
    ctx.fillRect(px - 8*scale, py - 8*scale, 16*scale, 12*scale);
    
    // Arms
    ctx.fillStyle = '#000000';
    ctx.fillRect(px - 12*scale, py - 6*scale, 6*scale, 10*scale);
    ctx.fillRect(px + 6*scale, py - 6*scale, 6*scale, 10*scale);
    
    // Hands
    const handColor = character === 'morpheus' ? '#8B4513' : '#FFDBAC';
    ctx.fillStyle = handColor;
    ctx.fillRect(px - 12*scale, py + 4*scale, 4*scale, 4*scale);
    ctx.fillRect(px + 8*scale, py + 4*scale, 4*scale, 4*scale);
    
    // Legs
    ctx.fillStyle = '#000000';
    ctx.fillRect(px - 6*scale, py + 4*scale, 5*scale, 12*scale);
    ctx.fillRect(px + 1*scale, py + 4*scale, 5*scale, 12*scale);
    
    // Shoes
    ctx.fillStyle = '#000000';
    ctx.fillRect(px - 7*scale, py + 16*scale, 6*scale, 3*scale);
    ctx.fillRect(px + 1*scale, py + 16*scale, 6*scale, 3*scale);
    
    // Gun
    ctx.fillStyle = '#666666';
    ctx.fillRect(px + 10*scale, py + 2*scale, 8*scale, 3*scale);
    ctx.fillRect(px + 8*scale, py + 1*scale, 4*scale, 5*scale);
    
    // White shirt collar
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(px - 2*scale, py - 8*scale, 4*scale, 2*scale);
  }, []);

  // Restart game function
  const restartGame = useCallback(() => {
    setScore(0);
    setPlayer({ x: 400, y: 500 });
    setBullets([]);
    setEnemies([]);
    setBonuses([]);
    setFloatingTexts([]);
    setLastShot(0);
    setLastEnemySpawn(0);
    setLastBonusSpawn(0);
    setEnemiesPassed(0);
    setGameOver(false);
    setShowCharacterSelect(true);
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
      
      // Handle character selection
      if (showCharacterSelect) {
        if (e.code === 'Space') {
          setShowCharacterSelect(false);
        } else if (e.code === 'ArrowLeft') {
          if (selectedCharacter === 'morpheus') setSelectedCharacter('neo');
          else if (selectedCharacter === 'trinity') setSelectedCharacter('morpheus');
        } else if (e.code === 'ArrowRight') {
          if (selectedCharacter === 'neo') setSelectedCharacter('morpheus');
          else if (selectedCharacter === 'morpheus') setSelectedCharacter('trinity');
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
  }, [gameOver, restartGame, onRestart, showCharacterSelect, selectedCharacter]);

  // Handle canvas clicks for character selection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleCanvasClick = (e: MouseEvent) => {
      if (!showCharacterSelect) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      // Check which character was clicked (character areas: 150-250, 350-450, 550-650)
      if (x >= 150 && x <= 250 && y >= 180 && y <= 360) {
        setSelectedCharacter('neo');
        setShowCharacterSelect(false);
      } else if (x >= 350 && x <= 450 && y >= 180 && y <= 360) {
        setSelectedCharacter('morpheus');
        setShowCharacterSelect(false);
      } else if (x >= 550 && x <= 650 && y >= 180 && y <= 360) {
        setSelectedCharacter('trinity');
        setShowCharacterSelect(false);
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [showCharacterSelect]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!isPlaying || gameOver || showCharacterSelect) return;

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
        id: now,
        type: Math.floor(Math.random() * 4) // Random enemy type (0-3)
      }]);
      setLastEnemySpawn(now);
    }

    // Spawn bonuses (much less frequently)
    if (now - lastBonusSpawn > 8000) {
      setBonuses(prev => [...prev, {
        x: Math.random() * 760 + 20,
        y: 0,
        id: now,
        type: Math.floor(Math.random() * 3) // Random bonus type (0-2)
      }]);
      setLastBonusSpawn(now);
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

    // Update bonuses (same speed as enemies)
    setBonuses(prev => prev
      .map(bonus => ({ ...bonus, y: bonus.y + 2 }))
      .filter(bonus => bonus.y < 600)
    );

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

    // Check bonus collisions with player
    setBonuses(prevBonuses => {
      let newBonuses = [...prevBonuses];
      let bonusScore = 0;
      let collectedBonuses: Array<{ x: number; y: number; score: number }> = [];

      newBonuses.forEach((bonus, bonusIndex) => {
        const dx = newPlayer.x - bonus.x;
        const dy = newPlayer.y - bonus.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
          // Bonus collected
          let score = 0;
          if (bonus.type === 0) score = 50; // Green pill
          else if (bonus.type === 1) score = 100; // Red pill
          else score = 25; // Matrix code
          
          bonusScore += score;
          collectedBonuses.push({ x: bonus.x, y: bonus.y, score });
          newBonuses.splice(bonusIndex, 1);
        }
      });

      if (bonusScore > 0) {
        setScore(prevScore => {
          const newScore = prevScore + bonusScore;
          onScoreUpdate(newScore);
          return newScore;
        });
        
        // Add floating text for each collected bonus
        setFloatingTexts(prev => [
          ...prev,
          ...collectedBonuses.map(bonus => ({
            x: bonus.x,
            y: bonus.y,
            text: `+${bonus.score}`,
            id: now + Math.random(),
            life: 60 // frames to live
          }))
        ]);
      }

      return newBonuses;
    });

    // Update floating texts
    setFloatingTexts(prev => prev
      .map(text => ({ ...text, y: text.y - 2, life: text.life - 1 }))
      .filter(text => text.life > 0)
    );

    // Draw selected character
    const px = newPlayer.x;
    const py = newPlayer.y;
    
    if (selectedCharacter === 'neo') {
      // Neo - pale skin, dark hair, black suit
      ctx.fillStyle = '#FFDBAC'; // Pale skin
      ctx.fillRect(px - 6, py - 18, 12, 10);
      // Dark hair
      ctx.fillStyle = '#2F1B14';
      ctx.fillRect(px - 6, py - 18, 12, 4);
      // Sunglasses
      ctx.fillStyle = '#000000';
      ctx.fillRect(px - 5, py - 15, 10, 4);
      ctx.fillStyle = '#333333';
      ctx.fillRect(px - 4, py - 14, 3, 2);
      ctx.fillRect(px + 1, py - 14, 3, 2);
    } else if (selectedCharacter === 'morpheus') {
      // Morpheus - darker skin, bald, distinctive sunglasses
      ctx.fillStyle = '#8B4513'; // Darker skin
      ctx.fillRect(px - 6, py - 18, 12, 10);
      // Sunglasses (distinctive shape)
      ctx.fillStyle = '#000000';
      ctx.fillRect(px - 6, py - 15, 12, 5);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(px - 5, py - 14, 4, 3);
      ctx.fillRect(px + 1, py - 14, 4, 3);
    } else {
      // Trinity - pale skin, black hair
      ctx.fillStyle = '#FFDBAC'; // Pale skin
      ctx.fillRect(px - 6, py - 18, 12, 10);
      // Black hair (longer)
      ctx.fillStyle = '#000000';
      ctx.fillRect(px - 7, py - 18, 14, 6);
      // Sunglasses
      ctx.fillStyle = '#000000';
      ctx.fillRect(px - 5, py - 15, 10, 4);
      ctx.fillStyle = '#333333';
      ctx.fillRect(px - 4, py - 14, 3, 2);
      ctx.fillRect(px + 1, py - 14, 3, 2);
    }
    
    // Body (black suit) - same for all
    ctx.fillStyle = '#000000';
    ctx.fillRect(px - 8, py - 8, 16, 12);
    
    // Arms (black suit sleeves)
    ctx.fillStyle = '#000000';
    ctx.fillRect(px - 12, py - 6, 6, 10);
    ctx.fillRect(px + 6, py - 6, 6, 10);
    
    // Hands
    const handColor = selectedCharacter === 'morpheus' ? '#8B4513' : '#FFDBAC';
    ctx.fillStyle = handColor;
    ctx.fillRect(px - 12, py + 4, 4, 4);
    ctx.fillRect(px + 8, py + 4, 4, 4);
    
    // Legs (black pants)
    ctx.fillStyle = '#000000';
    ctx.fillRect(px - 6, py + 4, 5, 12);
    ctx.fillRect(px + 1, py + 4, 5, 12);
    
    // Shoes
    ctx.fillStyle = '#000000';
    ctx.fillRect(px - 7, py + 16, 6, 3);
    ctx.fillRect(px + 1, py + 16, 6, 3);
    
    // Gun (held in right hand)
    ctx.fillStyle = '#666666';
    ctx.fillRect(px + 10, py + 2, 8, 3);
    ctx.fillRect(px + 8, py + 1, 4, 5);
    
    // White shirt collar
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(px - 2, py - 8, 4, 2);

    // Draw bullets
    ctx.fillStyle = '#00FF00';
    bullets.forEach(bullet => {
      ctx.fillRect(bullet.x - 2, bullet.y - 5, 4, 10);
    });

    // Draw enemies (space invaders - larger)
    enemies.forEach(enemy => {
      const ex = enemy.x;
      const ey = enemy.y;
      const type = enemy.type || 0;
      
      if (type === 0) {
        // Classic red invader (larger)
        ctx.fillStyle = '#FF0000';
        // Body
        ctx.fillRect(ex - 12, ey - 9, 24, 12);
        // Arms
        ctx.fillRect(ex - 15, ey - 3, 6, 9);
        ctx.fillRect(ex + 9, ey - 3, 6, 9);
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(ex - 6, ey - 6, 3, 3);
        ctx.fillRect(ex + 3, ey - 6, 3, 3);
      } else if (type === 1) {
        // Purple squid invader (larger)
        ctx.fillStyle = '#8A2BE2';
        // Head
        ctx.fillRect(ex - 9, ey - 12, 18, 9);
        // Body
        ctx.fillRect(ex - 6, ey - 3, 12, 6);
        // Tentacles
        ctx.fillRect(ex - 12, ey + 3, 3, 9);
        ctx.fillRect(ex - 6, ey + 3, 3, 6);
        ctx.fillRect(ex + 3, ey + 3, 3, 6);
        ctx.fillRect(ex + 9, ey + 3, 3, 9);
        // Eyes
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(ex - 4, ey - 9, 3, 3);
        ctx.fillRect(ex + 1, ey - 9, 3, 3);
      } else if (type === 2) {
        // Green diamond invader (larger)
        ctx.fillStyle = '#00FF00';
        // Diamond shape
        ctx.fillRect(ex - 3, ey - 12, 6, 3);
        ctx.fillRect(ex - 6, ey - 9, 12, 3);
        ctx.fillRect(ex - 9, ey - 6, 18, 3);
        ctx.fillRect(ex - 6, ey - 3, 12, 3);
        ctx.fillRect(ex - 3, ey, 6, 3);
        // Side spikes
        ctx.fillRect(ex - 12, ey - 3, 3, 6);
        ctx.fillRect(ex + 9, ey - 3, 3, 6);
        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(ex - 4, ey - 6, 2, 2);
        ctx.fillRect(ex + 2, ey - 6, 2, 2);
      } else {
        // Orange crab invader (larger)
        ctx.fillStyle = '#FF8800';
        // Main body
        ctx.fillRect(ex - 9, ey - 6, 18, 9);
        // Claws
        ctx.fillRect(ex - 15, ey - 9, 6, 6);
        ctx.fillRect(ex + 9, ey - 9, 6, 6);
        // Legs
        ctx.fillRect(ex - 12, ey + 3, 3, 6);
        ctx.fillRect(ex - 3, ey + 3, 3, 6);
        ctx.fillRect(ex + 0, ey + 3, 3, 6);
        ctx.fillRect(ex + 9, ey + 3, 3, 6);
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(ex - 6, ey - 3, 3, 3);
        ctx.fillRect(ex + 3, ey - 3, 3, 3);
      }
    });

    // Draw bonuses (same size as enemies)
    bonuses.forEach(bonus => {
      const bx = bonus.x;
      const by = bonus.y;
      
      if (bonus.type === 0) {
        // Green pill (larger)
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(bx - 6, by - 12, 12, 24);
        ctx.fillStyle = '#00AA00';
        ctx.fillRect(bx - 3, by - 9, 6, 18);
        // Shine effect
        ctx.fillStyle = '#88FF88';
        ctx.fillRect(bx - 1, by - 6, 2, 12);
      } else if (bonus.type === 1) {
        // Red pill (larger)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(bx - 6, by - 12, 12, 24);
        ctx.fillStyle = '#AA0000';
        ctx.fillRect(bx - 3, by - 9, 6, 18);
        // Shine effect
        ctx.fillStyle = '#FF8888';
        ctx.fillRect(bx - 1, by - 6, 2, 12);
      } else {
        // Matrix code symbol (larger)
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ﾁ', bx, by);
        ctx.textAlign = 'left';
      }
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

    // Draw floating score texts
    floatingTexts.forEach(text => {
      const alpha = text.life / 60; // Fade out over time
      ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(text.text, text.x, text.y);
      ctx.textAlign = 'left';
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, gameOver, player, bullets, enemies, bonuses, floatingTexts, score, lastShot, lastEnemySpawn, lastBonusSpawn, enemiesPassed, selectedCharacter, onScoreUpdate, playShootSound]);

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
    } else if (showCharacterSelect) {
      // Character selection screen within canvas
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 32px "Orbitron", "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CHOOSE YOUR CHARACTER', 400, 80);
      
      // Draw character previews
      drawCharacterPreview(ctx, 'neo', 200, 250, 1.2);
      drawCharacterPreview(ctx, 'morpheus', 400, 250, 1.2);
      drawCharacterPreview(ctx, 'trinity', 600, 250, 1.2);
      
      // Character names
      ctx.font = 'bold 20px "Orbitron", "Courier New", monospace';
      ctx.fillStyle = selectedCharacter === 'neo' ? '#FFFF00' : '#00FF00';
      ctx.fillText('NEO', 200, 350);
      
      ctx.fillStyle = selectedCharacter === 'morpheus' ? '#FFFF00' : '#00FF00';
      ctx.fillText('MORPHEUS', 400, 350);
      
      ctx.fillStyle = selectedCharacter === 'trinity' ? '#FFFF00' : '#00FF00';
      ctx.fillText('TRINITY', 600, 350);
      
      // Instructions
      ctx.font = '16px "Orbitron", "Courier New", monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Click on a character to select', 400, 450);
      ctx.fillText('Press SPACE to start game', 400, 480);
      
      // Selection highlight
      if (selectedCharacter === 'neo') {
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 3;
        ctx.strokeRect(150, 180, 100, 180);
      } else if (selectedCharacter === 'morpheus') {
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 3;
        ctx.strokeRect(350, 180, 100, 180);
      } else {
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 3;
        ctx.strokeRect(550, 180, 100, 180);
      }
    } else if (!isPlaying) {
      ctx.fillStyle = '#00FF00';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MATRIX GAME READY', 400, 300);
      ctx.font = '16px monospace';
      ctx.fillText('Click START GAME to begin', 400, 330);
    }
  }, [isPlaying, gameOver, score, showCharacterSelect, selectedCharacter, drawCharacterPreview]);


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