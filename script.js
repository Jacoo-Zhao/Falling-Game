// Falling Squares Game
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.score = 0;
        this.gameSpeed = 2;
        this.difficultyLevel = 1;
        this.gameTime = 0; // 游戏时间（秒）
        
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
            smoothness: 0.15 // 鼠标跟随的平滑度
        };
        
        // Falling squares
        this.squares = [];
        this.baseSpawnRate =0.05; // 基础生成率
        this.squareSpawnRate = this.baseSpawnRate;
        this.maxSquareSpeed = 2;
        this.minSquareSize = 20;
        this.maxSquareSize = 50;
        
        // 飞机轨迹效果
        this.trail = [];
        this.maxTrailLength = 10;
        
        // 敌方飞机
        this.enemyPlane = {
            x: this.canvas.width / 4,
            y: 50,
            width: 35,
            height: 25,
            speed: 2,
            color: '#ff6b6b',
            isActive: false,
            trail: [],
            angle: 0, // 朝向角度
            targetAngle: 0 // 目标角度
        };
        
        // Input handling
        this.keys = {};
        this.setupEventListeners();
        
        // Animation frame
        this.animationId = null;
        this.lastFrameTime = 0;
    }
    
    setupEventListeners() {
        // Keyboard input (保留键盘控制作为备选)
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
                
                // 限制飞机在画布范围内
                this.player.targetX = Math.max(this.player.width/2, 
                    Math.min(this.canvas.width - this.player.width/2, this.player.targetX));
                this.player.targetY = Math.max(this.player.height/2, 
                    Math.min(this.canvas.height - this.player.height/2, this.player.targetY));
            }
        });
        
        // 触摸设备支持
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isRunning) {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                this.player.targetX = touch.clientX - rect.left;
                this.player.targetY = touch.clientY - rect.top;
                
                // 限制飞机在画布范围内
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
        this.trail = []; // 重置轨迹
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 50;
        this.player.targetX = this.canvas.width / 2;
        this.player.targetY = this.canvas.height - 50;
        this.gameSpeed = 2;
        this.squareSpawnRate = this.baseSpawnRate;
        this.maxSquareSpeed = 2;
        this.lastFrameTime = performance.now();
        
        // 重置敌方飞机
        this.enemyPlane.x = this.canvas.width / 4;
        this.enemyPlane.y = 50;
        this.enemyPlane.isActive = false;
        this.enemyPlane.trail = [];
        this.enemyPlane.angle = 0;
        
        // 移除高难度视觉效果
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
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // 转换为秒
        this.lastFrameTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        // 更新游戏时间
        this.gameTime += deltaTime;
        
        // 更新难度
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
        document.getElementById('score').textContent = `${this.score} | 难度: ${this.difficultyLevel} | 时间: ${Math.floor(this.gameTime)}s`;
    }
    
    updateDifficulty() {
        // 每5秒提升一次难度
        const newDifficultyLevel = Math.floor(this.gameTime / 3) + 1;
        
        if (newDifficultyLevel !== this.difficultyLevel) {
            this.difficultyLevel = newDifficultyLevel;
            console.log(`难度提升到 ${this.difficultyLevel} 级！`);
            
            // 创建难度提升提示
            this.showDifficultyIncrease();
            
            // 特殊提示：敌方飞机出现
            if (this.difficultyLevel === 2) {
                setTimeout(() => {
                    this.showEnemyWarning();
                }, 1000);
            }
        }
        
        // 根据难度调整游戏参数
        this.squareSpawnRate = this.baseSpawnRate + (this.difficultyLevel - 1) * 0.008; // 生成率递增
        this.maxSquareSpeed = 2 + (this.difficultyLevel - 1) * 0.5; // 速度递增
        this.gameSpeed = 2 + (this.difficultyLevel - 1) * 0.3; // 基础速度递增
        
        // 2级难度后激活敌方飞机
        if (this.difficultyLevel >= 2) {
            this.enemyPlane.isActive = true;
            this.enemyPlane.speed = 2 + (this.difficultyLevel - 2) * 0.5; // 敌机速度递增
        }
        
        // 5级难度后，方块开始变小（更难躲避）
        if (this.difficultyLevel >= 5) {
            this.minSquareSize = Math.max(15, 20 - (this.difficultyLevel - 5) * 2);
            this.maxSquareSize = Math.max(25, 50 - (this.difficultyLevel - 5) * 3);
        }
    }
    
    showDifficultyIncrease() {
        // 在画面上显示难度提升提示
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
        message.textContent = `难度提升到 ${this.difficultyLevel} 级！`;
        document.body.appendChild(message);
        
        // 添加画布震动效果（高难度下）
        if (this.difficultyLevel >= 3) {
            this.canvas.classList.add('high-difficulty');
        }
        
        // 添加分数发光效果
        const scoreElement = document.querySelector('.score');
        scoreElement.classList.add('difficulty-change');
        setTimeout(() => scoreElement.classList.remove('difficulty-change'), 500);
        
        setTimeout(() => message.remove(), 2000);
    }
    
    showEnemyWarning() {
        // 敌方飞机出现警告
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
        // 记录当前位置到轨迹
        this.trail.push({ x: this.player.x, y: this.player.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // 平滑鼠标跟随
        const dx = this.player.targetX - this.player.x;
        const dy = this.player.targetY - this.player.y;
        
        this.player.x += dx * this.player.smoothness;
        this.player.y += dy * this.player.smoothness;
        
        // 键盘控制作为备选（可选）
        if (this.keys['ArrowLeft'] && this.player.x - this.player.width/2 > 0) {
            this.player.x -= this.player.speed;
            this.player.targetX = this.player.x; // 同步目标位置
        }
        if (this.keys['ArrowRight'] && this.player.x + this.player.width/2 < this.canvas.width) {
            this.player.x += this.player.speed;
            this.player.targetX = this.player.x; // 同步目标位置
        }
        if (this.keys['ArrowUp'] && this.player.y - this.player.height/2 > 0) {
            this.player.y -= this.player.speed;
            this.player.targetY = this.player.y; // 同步目标位置
        }
        if (this.keys['ArrowDown'] && this.player.y + this.player.height/2 < this.canvas.height) {
            this.player.y += this.player.speed;
            this.player.targetY = this.player.y; // 同步目标位置
        }
    }
    
    updateEnemyPlane() {
        if (!this.enemyPlane.isActive) return;
        
        // 记录敌机轨迹
        this.enemyPlane.trail.push({ x: this.enemyPlane.x, y: this.enemyPlane.y });
        if (this.enemyPlane.trail.length > 8) {
            this.enemyPlane.trail.shift();
        }
        
        // 计算到玩家的距离和角度
        const dx = this.player.x - this.enemyPlane.x;
        const dy = this.player.y - this.enemyPlane.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 计算目标角度
        this.enemyPlane.targetAngle = Math.atan2(dy, dx);
        
        // 平滑旋转朝向
        let angleDiff = this.enemyPlane.targetAngle - this.enemyPlane.angle;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        this.enemyPlane.angle += angleDiff * 0.1;
        
        // 追逐玩家但保持一定距离
        if (distance > 100) {
            // 直接追逐
            this.enemyPlane.x += Math.cos(this.enemyPlane.angle) * this.enemyPlane.speed;
            this.enemyPlane.y += Math.sin(this.enemyPlane.angle) * this.enemyPlane.speed;
        } else {
            // 保持距离，做圆周运动
            const circleSpeed = this.enemyPlane.speed * 0.7;
            const circleAngle = this.enemyPlane.angle + Math.PI / 2;
            this.enemyPlane.x += Math.cos(circleAngle) * circleSpeed;
            this.enemyPlane.y += Math.sin(circleAngle) * circleSpeed;
        }
        
        // 边界检查
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
                // 高难度下添加特殊效果
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
            
            // 旋转特殊方块
            if (square.isSpecial) {
                square.rotation += square.rotationSpeed;
            }
            
            // 高难度下的横向移动
            if (this.difficultyLevel >= 4 && square.isSpecial) {
                square.x += Math.sin(square.y * 0.01) * 2;
                // 保持在画面内
                square.x = Math.max(0, Math.min(this.canvas.width - square.width, square.x));
            }
            
            return square.y < this.canvas.height + square.height;
        });
    }
    
    checkCollisions() {
        // 检查玩家与方块的碰撞
        for (let square of this.squares) {
            if (this.rectRectCollision(this.player, square)) {
                this.gameOver();
                return;
            }
        }
        
        // 检查玩家与敌方飞机的碰撞
        if (this.enemyPlane.isActive && this.rectRectCollision(this.player, this.enemyPlane)) {
            this.gameOver();
            return;
        }
    }
    
    rectRectCollision(airplane, square) {
        // 矩形碰撞检测 (使用稍小的碰撞箱让游戏更公平)
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
        
        // 飞机发光效果
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 15;
        
        // 绘制飞机主体
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        
        // 飞机机身 (主体三角形)
        this.ctx.moveTo(x, y - height/2); // 机头
        this.ctx.lineTo(x - width/4, y + height/2); // 左下
        this.ctx.lineTo(x + width/4, y + height/2); // 右下
        this.ctx.closePath();
        this.ctx.fill();
        
        // 关闭阴影效果绘制细节
        this.ctx.shadowBlur = 0;
        
        // 飞机机翼
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        // 左机翼
        this.ctx.moveTo(x - width/4, y);
        this.ctx.lineTo(x - width/2, y + height/4);
        this.ctx.lineTo(x - width/6, y + height/4);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 右机翼
        this.ctx.beginPath();
        this.ctx.moveTo(x + width/4, y);
        this.ctx.lineTo(x + width/2, y + height/4);
        this.ctx.lineTo(x + width/6, y + height/4);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 飞机座舱（白色）
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y - height/6, width/8, height/8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 飞机喷射尾焰效果
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
        
        // 飞机轮廓线
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
        
        // 移动到飞机中心并旋转
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        
        // 敌机发光效果（红色）
        this.ctx.shadowColor = this.enemyPlane.color;
        this.ctx.shadowBlur = 12;
        
        // 绘制敌机主体（倒三角形，机头朝前）
        this.ctx.fillStyle = this.enemyPlane.color;
        this.ctx.beginPath();
        this.ctx.moveTo(width/2, 0); // 机头
        this.ctx.lineTo(-width/4, -height/2); // 左上
        this.ctx.lineTo(-width/4, height/2); // 左下
        this.ctx.closePath();
        this.ctx.fill();
        
        // 关闭阴影效果绘制细节
        this.ctx.shadowBlur = 0;
        
        // 敌机机翼
        this.ctx.fillStyle = this.enemyPlane.color;
        this.ctx.beginPath();
        // 上机翼
        this.ctx.moveTo(0, -height/4);
        this.ctx.lineTo(-width/3, -height/2);
        this.ctx.lineTo(-width/6, -height/3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 下机翼
        this.ctx.beginPath();
        this.ctx.moveTo(0, height/4);
        this.ctx.lineTo(-width/3, height/2);
        this.ctx.lineTo(-width/6, height/3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 敌机座舱（暗红色）
        this.ctx.fillStyle = '#aa0000';
        this.ctx.beginPath();
        this.ctx.ellipse(width/6, 0, width/10, height/10, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 敌机喷射尾焰（蓝色）
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
        
        // 敌机轮廓线
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
            
            // 特殊方块的额外效果
            if (square.isSpecial) {
                this.ctx.translate(square.x + square.width/2, square.y + square.height/2);
                this.ctx.rotate(square.rotation);
                this.ctx.translate(-square.width/2, -square.height/2);
                
                // 特殊方块有更强的发光效果
                this.ctx.shadowColor = square.color;
                this.ctx.shadowBlur = 20;
                
                // 特殊方块颜色更亮
                this.ctx.fillStyle = square.color;
                this.ctx.fillRect(0, 0, square.width, square.height);
                
                // 内部闪烁效果
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                const pulseSize = Math.sin(Date.now() * 0.01) * 5 + 5;
                this.ctx.fillRect(pulseSize, pulseSize, square.width - pulseSize*2, square.height - pulseSize*2);
                
                // 特殊边框
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(0, 0, square.width, square.height);
            } else {
                // 普通方块
                this.ctx.shadowColor = square.color;
                this.ctx.shadowBlur = 10;
                
                this.ctx.fillStyle = square.color;
                this.ctx.fillRect(square.x, square.y, square.width, square.height);
                
                // 普通边框
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
