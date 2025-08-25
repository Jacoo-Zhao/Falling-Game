// Falling Squares Game
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.score = 0;
        this.gameSpeed = 2;
        this.difficultyLevel = 1;
        this.gameTime = 0; // Game time (seconds)
        
        // Player airplane
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 40,
            height: 30,
            speed: 8,
            color: '#4ecdc4',
            targetX: this.canvas.width / 2,
            targetY: this.canvas.height - 50,
            smoothness: 0.3 // Mouse following smoothness
        };
        
        // Falling squares
        this.squares = [];
        this.baseSpawnRate =0.05; // Base spawn rate
        this.squareSpawnRate = this.baseSpawnRate;
        this.maxSquareSpeed = 2;
        this.minSquareSize = 20;
        this.maxSquareSize = 50;
        
        // Airplane trail effect
        this.trail = [];
        this.maxTrailLength = 10;
        
        // Enemy plane
        this.enemyPlane = {
            x: this.canvas.width / 4,
            y: 50,
            width: 35,
            height: 25,
            speed: 2,
            color: '#ff6b6b',
            isActive: false,
            trail: [],
            angle: 0, // Facing angle
            targetAngle: 0 // Target angle
        };
        
        // Input handling
        this.keys = {};
        this.setupEventListeners();
        
        // Animation frame
        this.animationId = null;
        this.lastFrameTime = 0;
    }
    
    setupEventListeners() {
        // Keyboard input (keep keyboard control as backup)
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Prevent arrow keys from scrolling
        document.addEventListener('keydown', (e) => {
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        // Mouse movement tracking
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isRunning) {
                const rect = this.canvas.getBoundingClientRect();
                this.player.targetX = e.clientX - rect.left;
                this.player.targetY = e.clientY - rect.top;
                
                // Limit airplane within canvas bounds
                this.player.targetX = Math.max(this.player.width/2, 
                    Math.min(this.canvas.width - this.player.width/2, this.player.targetX));
                this.player.targetY = Math.max(this.player.height/2, 
                    Math.min(this.canvas.height - this.player.height/2, this.player.targetY));
            }
        });
        
        // Touch device support
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isRunning) {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                this.player.targetX = touch.clientX - rect.left;
                this.player.targetY = touch.clientY - rect.top;
                
                // Limit airplane within canvas bounds
                this.player.targetX = Math.max(this.player.width/2, 
                    Math.min(this.canvas.width - this.player.width/2, this.player.targetX));
                this.player.targetY = Math.max(this.player.height/2, 
                    Math.min(this.canvas.height - this.player.height/2, this.player.targetY));
            }
        });
    }
    
    start() {
        this.isRunning = true;
        this.score = 0;
        this.gameTime = 0;
        this.difficultyLevel = 1;
        this.squares = [];
        this.trail = []; // Reset trail
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 50;
        this.player.targetX = this.canvas.width / 2;
        this.player.targetY = this.canvas.height - 50;
        this.gameSpeed = 2;
        this.squareSpawnRate = this.baseSpawnRate;
        this.maxSquareSpeed = 4;
        this.lastFrameTime = performance.now();
        
        // Reset enemy plane
        this.enemyPlane.x = this.canvas.width / 4;
        this.enemyPlane.y = 50;
        this.enemyPlane.isActive = false;
        this.enemyPlane.trail = [];
        this.enemyPlane.angle = 0;
        
        // Remove high difficulty visual effects
        this.canvas.classList.remove('high-difficulty');
        
        // Hide start button, show restart button
        document.getElementById('startButton').style.display = 'none';
        document.getElementById('restartButton').style.display = 'inline-block';
        document.getElementById('gameOverScreen').style.display = 'none';
        
        this.gameLoop();
    }
    
    restart() {
        this.stop();
        this.start();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        // Update game time
        this.gameTime += deltaTime;
        
        // Update difficulty
        this.updateDifficulty();
        
        // Update player position
        this.updatePlayer();
        
        // Update enemy plane
        this.updateEnemyPlane();
        
        // Spawn new squares
        this.spawnSquares();
        
        // Update squares
        this.updateSquares();
        
        // Check collisions
        this.checkCollisions();
        
        // Update score
        this.score += 1;
        
        // Update score display
        document.getElementById('score').textContent = `${this.score} | Difficulty: ${this.difficultyLevel} | Time: ${Math.floor(this.gameTime)}s`;
    }
    
    updateDifficulty() {
        // Increase difficulty every 5 seconds
        const newDifficultyLevel = Math.floor(this.gameTime / 3) + 1;
        
        if (newDifficultyLevel !== this.difficultyLevel) {
            this.difficultyLevel = newDifficultyLevel;
            console.log(`Difficulty increased to level ${this.difficultyLevel}!`);
            
            // Create difficulty increase notification
            this.showDifficultyIncrease();
            
            // Special notification: Enemy plane appears
            if (this.difficultyLevel === 2) {
                setTimeout(() => {
                    this.showEnemyWarning();
                }, 1000);
            }
        }
        
        // Adjust game parameters based on difficulty
        this.squareSpawnRate = this.baseSpawnRate + (this.difficultyLevel - 1) * 0.008; // Spawn rate increases
        this.maxSquareSpeed = 2 + (this.difficultyLevel - 1) * 0.5; // Speed increases
        this.gameSpeed = 2 + (this.difficultyLevel - 1) * 0.3; // Base speed increases
        
        // Activate enemy plane after difficulty level 2
        if (this.difficultyLevel >= 2) {
            this.enemyPlane.isActive = true;
            this.enemyPlane.speed = 2 + (this.difficultyLevel - 2) * 0.5; // Enemy plane speed increases
        }
        
        // After difficulty level 5, squares become smaller (harder to avoid)
        if (this.difficultyLevel >= 5) {
            this.minSquareSize = Math.max(15, 20 - (this.difficultyLevel - 5) * 2);
            this.maxSquareSize = Math.max(25, 50 - (this.difficultyLevel - 5) * 3);
        }
    }
    
    showDifficultyIncrease() {
        // Display difficulty increase notification on screen
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            font-size: 1.5rem;
            font-weight: bold;
            z-index: 1000;
            animation: pulseAlert 1s ease-in-out;
            border: 2px solid #ff6b6b;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
        `;
        message.textContent = `Difficulty increased to level ${this.difficultyLevel}!`;
        document.body.appendChild(message);
        
        // Add canvas shake effect (at high difficulty)
        if (this.difficultyLevel >= 3) {
            this.canvas.classList.add('high-difficulty');
        }
        
        // Add score glow effect
        const scoreElement = document.querySelector('.score');
        scoreElement.classList.add('difficulty-change');
        setTimeout(() => scoreElement.classList.remove('difficulty-change'), 500);
        
        setTimeout(() => message.remove(), 2000);
    }
    
    showEnemyWarning() {
        // Enemy plane appearance warning
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 100, 100, 0.95);
            color: white;
            padding: 1.5rem 3rem;
            border-radius: 15px;
            font-size: 1.8rem;
            font-weight: bold;
            z-index: 1001;
            animation: pulseAlert 1.5s ease-in-out;
            border: 3px solid #ff3333;
            box-shadow: 0 0 30px rgba(255, 51, 51, 0.8);
            text-align: center;
        `;
        warning.innerHTML = `
            ⚠️ WARNING ⚠️<br>
            <span style="font-size: 1.2rem;">ENEMY FIGHTER INCOMING!</span>
        `;
        document.body.appendChild(warning);
        
        setTimeout(() => warning.remove(), 3000);
    }
    
    updatePlayer() {
        // Record current position to trail
        this.trail.push({ x: this.player.x, y: this.player.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Smooth mouse following
        const dx = this.player.targetX - this.player.x;
        const dy = this.player.targetY - this.player.y;
        
        this.player.x += dx * this.player.smoothness;
        this.player.y += dy * this.player.smoothness;
        
        // Keyboard control as backup (optional)
        if (this.keys['ArrowLeft'] && this.player.x - this.player.width/2 > 0) {
            this.player.x -= this.player.speed;
            this.player.targetX = this.player.x; // Sync target position
        }
        if (this.keys['ArrowRight'] && this.player.x + this.player.width/2 < this.canvas.width) {
            this.player.x += this.player.speed;
            this.player.targetX = this.player.x; // Sync target position
        }
        if (this.keys['ArrowUp'] && this.player.y - this.player.height/2 > 0) {
            this.player.y -= this.player.speed;
            this.player.targetY = this.player.y; // Sync target position
        }
        if (this.keys['ArrowDown'] && this.player.y + this.player.height/2 < this.canvas.height) {
            this.player.y += this.player.speed;
            this.player.targetY = this.player.y; // Sync target position
        }
    }
    
    updateEnemyPlane() {
        if (!this.enemyPlane.isActive) return;
        
        // Record enemy plane trail
        this.enemyPlane.trail.push({ x: this.enemyPlane.x, y: this.enemyPlane.y });
        if (this.enemyPlane.trail.length > 8) {
            this.enemyPlane.trail.shift();
        }
        
        // Calculate distance and angle to player
        const dx = this.player.x - this.enemyPlane.x;
        const dy = this.player.y - this.enemyPlane.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate target angle
        this.enemyPlane.targetAngle = Math.atan2(dy, dx);
        
        // Smooth rotation towards target
        let angleDiff = this.enemyPlane.targetAngle - this.enemyPlane.angle;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        this.enemyPlane.angle += angleDiff * 0.1;
        
        // Chase player but maintain certain distance
        if (distance > 100) {
            // Direct chase
            this.enemyPlane.x += Math.cos(this.enemyPlane.angle) * this.enemyPlane.speed;
            this.enemyPlane.y += Math.sin(this.enemyPlane.angle) * this.enemyPlane.speed;
        } else {
            // Maintain distance, circular movement
            const circleSpeed = this.enemyPlane.speed * 0.7;
            const circleAngle = this.enemyPlane.angle + Math.PI / 2;
            this.enemyPlane.x += Math.cos(circleAngle) * circleSpeed;
            this.enemyPlane.y += Math.sin(circleAngle) * circleSpeed;
        }
        
        // Boundary check
        this.enemyPlane.x = Math.max(this.enemyPlane.width/2, 
            Math.min(this.canvas.width - this.enemyPlane.width/2, this.enemyPlane.x));
        this.enemyPlane.y = Math.max(this.enemyPlane.height/2, 
            Math.min(this.canvas.height - this.enemyPlane.height/2, this.enemyPlane.y));
    }
    
    spawnSquares() {
        if (Math.random() < this.squareSpawnRate) {
            const sizeRange = this.maxSquareSize - this.minSquareSize;
            const size = this.minSquareSize + Math.random() * sizeRange;
            const square = {
                x: Math.random() * (this.canvas.width - size),
                y: -size,
                width: size,
                height: size,
                speed: this.gameSpeed + Math.random() * this.maxSquareSpeed,
                color: this.getRandomColor(),
                // Add special effects at high difficulty
                isSpecial: this.difficultyLevel >= 3 && Math.random() < 0.1,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            };
            this.squares.push(square);
        }
    }
    
    updateSquares() {
        // Move squares down and remove those that are off-screen
        this.squares = this.squares.filter(square => {
            square.y += square.speed;
            
            // Rotate special squares
            if (square.isSpecial) {
                square.rotation += square.rotationSpeed;
            }
            
            // Horizontal movement at high difficulty
            if (this.difficultyLevel >= 4 && square.isSpecial) {
                square.x += Math.sin(square.y * 0.01) * 2;
                // Keep within screen bounds
                square.x = Math.max(0, Math.min(this.canvas.width - square.width, square.x));
            }
            
            return square.y < this.canvas.height + square.height;
        });
    }
    
    checkCollisions() {
        // Check collision between player and squares
        for (let square of this.squares) {
            if (this.rectRectCollision(this.player, square)) {
                this.gameOver();
                return;
            }
        }
        
        // Check collision between player and enemy plane
        if (this.enemyPlane.isActive && this.rectRectCollision(this.player, this.enemyPlane)) {
            this.gameOver();
            return;
        }
    }
    
    rectRectCollision(airplane, square) {
        // Rectangle collision detection (use slightly smaller collision box for fairness)
        const airplaneLeft = airplane.x - airplane.width/2 + 5;
        const airplaneRight = airplane.x + airplane.width/2 - 5;
        const airplaneTop = airplane.y - airplane.height/2 + 5;
        const airplaneBottom = airplane.y + airplane.height/2 - 5;
        
        const squareLeft = square.x;
        const squareRight = square.x + square.width;
        const squareTop = square.y;
        const squareBottom = square.y + square.height;
        
        return !(airplaneRight < squareLeft || 
                airplaneLeft > squareRight || 
                airplaneBottom < squareTop || 
                airplaneTop > squareBottom);
    }
    
    gameOver() {
        this.stop();
        
        // Show game over screen
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').style.display = 'block';
        
        // Reset buttons
        document.getElementById('startButton').style.display = 'inline-block';
        document.getElementById('restartButton').style.display = 'none';
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw airplane trail
        this.drawTrail();
        
        // Draw enemy airplane trail
        this.drawEnemyTrail();
        
        // Draw player airplane
        this.drawPlayer();
        
        // Draw enemy airplane
        this.drawEnemyPlane();
        
        // Draw squares
        this.drawSquares();
        
        // Draw particle effects
        this.drawParticles();
    }
    
    drawPlayer() {
        this.ctx.save();
        
        const x = this.player.x;
        const y = this.player.y;
        const width = this.player.width;
        const height = this.player.height;
        
        // Airplane glow effect
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 15;
        
        // Draw airplane body
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        
        // Airplane fuselage (main triangle)
        this.ctx.moveTo(x, y - height/2); // Nose
        this.ctx.lineTo(x - width/4, y + height/2); // Bottom left
        this.ctx.lineTo(x + width/4, y + height/2); // Bottom right
        this.ctx.closePath();
        this.ctx.fill();
        
        // Turn off shadow effect for drawing details
        this.ctx.shadowBlur = 0;
        
        // Airplane wings
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        // Left wing
        this.ctx.moveTo(x - width/4, y);
        this.ctx.lineTo(x - width/2, y + height/4);
        this.ctx.lineTo(x - width/6, y + height/4);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Right wing
        this.ctx.beginPath();
        this.ctx.moveTo(x + width/4, y);
        this.ctx.lineTo(x + width/2, y + height/4);
        this.ctx.lineTo(x + width/6, y + height/4);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Airplane cockpit (white)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y - height/6, width/8, height/8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Airplane jet flame effect
        const flameLength = 15 + Math.sin(Date.now() * 0.02) * 5;
        const gradient = this.ctx.createLinearGradient(x, y + height/2, x, y + height/2 + flameLength);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.5, '#ffa500');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(x - width/8, y + height/2);
        this.ctx.lineTo(x, y + height/2 + flameLength);
        this.ctx.lineTo(x + width/8, y + height/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Airplane outline
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - height/2);
        this.ctx.lineTo(x - width/4, y + height/2);
        this.ctx.lineTo(x + width/4, y + height/2);
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawTrail() {
        if (this.trail.length < 2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = this.player.color;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        
        for (let i = 1; i < this.trail.length; i++) {
            const opacity = (i / this.trail.length) * 0.5;
            this.ctx.globalAlpha = opacity;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.trail[i-1].x, this.trail[i-1].y);
            this.ctx.lineTo(this.trail[i].x, this.trail[i].y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawEnemyTrail() {
        if (!this.enemyPlane.isActive || this.enemyPlane.trail.length < 2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = this.enemyPlane.color;
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        
        for (let i = 1; i < this.enemyPlane.trail.length; i++) {
            const opacity = (i / this.enemyPlane.trail.length) * 0.4;
            this.ctx.globalAlpha = opacity;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.enemyPlane.trail[i-1].x, this.enemyPlane.trail[i-1].y);
            this.ctx.lineTo(this.enemyPlane.trail[i].x, this.enemyPlane.trail[i].y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawEnemyPlane() {
        if (!this.enemyPlane.isActive) return;
        
        this.ctx.save();
        
        const x = this.enemyPlane.x;
        const y = this.enemyPlane.y;
        const width = this.enemyPlane.width;
        const height = this.enemyPlane.height;
        const angle = this.enemyPlane.angle;
        
        // Move to plane center and rotate
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        
        // Enemy plane glow effect (red)
        this.ctx.shadowColor = this.enemyPlane.color;
        this.ctx.shadowBlur = 12;
        
        // Draw enemy plane body (inverted triangle, nose forward)
        this.ctx.fillStyle = this.enemyPlane.color;
        this.ctx.beginPath();
        this.ctx.moveTo(width/2, 0); // Nose
        this.ctx.lineTo(-width/4, -height/2); // Top left
        this.ctx.lineTo(-width/4, height/2); // Bottom left
        this.ctx.closePath();
        this.ctx.fill();
        
        // Turn off shadow effect for drawing details
        this.ctx.shadowBlur = 0;
        
        // Enemy plane wings
        this.ctx.fillStyle = this.enemyPlane.color;
        this.ctx.beginPath();
        // Top wing
        this.ctx.moveTo(0, -height/4);
        this.ctx.lineTo(-width/3, -height/2);
        this.ctx.lineTo(-width/6, -height/3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Bottom wing
        this.ctx.beginPath();
        this.ctx.moveTo(0, height/4);
        this.ctx.lineTo(-width/3, height/2);
        this.ctx.lineTo(-width/6, height/3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Enemy plane cockpit (dark red)
        this.ctx.fillStyle = '#aa0000';
        this.ctx.beginPath();
        this.ctx.ellipse(width/6, 0, width/10, height/10, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Enemy plane jet flame (blue)
        const flameLength = 12 + Math.sin(Date.now() * 0.025) * 4;
        const gradient = this.ctx.createLinearGradient(-width/4, 0, -width/4 - flameLength, 0);
        gradient.addColorStop(0, '#0088ff');
        gradient.addColorStop(0.5, '#0044aa');
        gradient.addColorStop(1, 'rgba(0, 68, 170, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(-width/4, -height/8);
        this.ctx.lineTo(-width/4 - flameLength, 0);
        this.ctx.lineTo(-width/4, height/8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Enemy plane outline
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(width/2, 0);
        this.ctx.lineTo(-width/4, -height/2);
        this.ctx.lineTo(-width/4, height/2);
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawSquares() {
        this.squares.forEach(square => {
            this.ctx.save();
            
            // Additional effects for special squares
            if (square.isSpecial) {
                this.ctx.translate(square.x + square.width/2, square.y + square.height/2);
                this.ctx.rotate(square.rotation);
                this.ctx.translate(-square.width/2, -square.height/2);
                
                // Special squares have stronger glow effect
                this.ctx.shadowColor = square.color;
                this.ctx.shadowBlur = 20;
                
                // Special squares have brighter colors
                this.ctx.fillStyle = square.color;
                this.ctx.fillRect(0, 0, square.width, square.height);
                
                // Internal flashing effect
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                const pulseSize = Math.sin(Date.now() * 0.01) * 5 + 5;
                this.ctx.fillRect(pulseSize, pulseSize, square.width - pulseSize*2, square.height - pulseSize*2);
                
                // Special border
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(0, 0, square.width, square.height);
            } else {
                // Normal squares
                this.ctx.shadowColor = square.color;
                this.ctx.shadowBlur = 10;
                
                this.ctx.fillStyle = square.color;
                this.ctx.fillRect(square.x, square.y, square.width, square.height);
                
                // Normal border
                this.ctx.shadowBlur = 0;
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(square.x, square.y, square.width, square.height);
            }
            
            this.ctx.restore();
        });
    }
    
    drawParticles() {
        // Simple star field effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const x = (Date.now() * 0.1 + i * 50) % this.canvas.width;
            const y = (i * 37) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }
    
    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// Initialize game
const game = new Game();

// Global functions for buttons
function startGame() {
    game.start();
}

function restartGame() {
    game.restart();
}
