// --- 1. BOOT SCENE ---
class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        // Load the real images from your assets folder
        this.load.image('ball', 'assets/ball.png');
        this.load.image('glove', 'assets/glove.png');
        this.load.image('heart', 'assets/heart.png'); // New Asset

        // Audio Assets (NEW)
        this.load.audio('bgm', 'assets/bgm.mp3');
        this.load.audio('bounce', 'assets/bounce.wav'); // Use .mp3 if your file is mp3
        this.load.audio('fail', 'assets/fail.wav');

        // We will keep the generated particle graphic because it works
        // perfectly for that blazing arcade trail effect!
        const particleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        particleGraphics.fillStyle(0xffffff, 0.8);
        particleGraphics.fillCircle(4, 4, 4);
        particleGraphics.generateTexture('trail', 8, 8);
    }

    create() {
        this.scene.start('MainMenuScene');
    }
}

// --- 2. MAIN MENU SCENE ---
class MainMenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MainMenuScene' }); }

    create() {
        this.cameras.main.setBackgroundColor('#000000');

        this.add.text(225, 250, 'WORLD CUP\nGOALKEEPER', {
            fontSize: '48px', fill: '#ffffff', fontFamily: 'monospace',
            fontWeight: 'bold', align: 'center'
        }).setOrigin(0.5);

        const startBtn = this.add.text(225, 500, '[ TAP TO START JOURNEY ]', {
            fontSize: '24px', fill: '#ff0055', fontFamily: 'monospace', fontWeight: 'bold'
        }).setOrigin(0.5).setInteractive();

        this.tweens.add({ targets: startBtn, alpha: 0.2, yoyo: true, repeat: -1, duration: 800 });

        startBtn.on('pointerdown', () => {
            // Reset ALL global tournament data on new run
            this.registry.set('tournamentStage', 0);
            this.registry.set('totalScore', 0);
            this.scene.start('GameplayScene');
        });
    }
}

// --- 3. CORE GAMEPLAY SCENE ---
class GameplayScene extends Phaser.Scene {
    constructor() { super({ key: 'GameplayScene' }); }

    create() {
    // Start Background Music
        this.bgMusic = this.sound.add('bgm', { volume: 0.4, loop: true });
        this.bgMusic.play();

        this.cameras.main.setBackgroundColor('#00aa44');
        // --- AUTHENTIC PITCH MARKINGS ---
        const pitch = this.add.graphics();
        pitch.lineStyle(4, 0xffffff, 0.8); // 4px thick white lines with slight transparency for a "painted grass" look

        // 1. The End Line (Spans the entire width of the screen at y = 150)
        pitch.beginPath();
        pitch.moveTo(0, 150);
        pitch.lineTo(450, 150);
        pitch.strokePath();

        // 2. The Penalty Area (18-yard box)
        pitch.strokeRect(45, 150, 360, 200);

        // 3. The Goal Area (6-yard box)
        pitch.strokeRect(135, 150, 180, 60);

        // 4. The Penalty Spot
        pitch.fillStyle(0xffffff, 0.8);
        pitch.fillCircle(225, 290, 6); // x=225 (center), y=290

        // 5. The Penalty Arc (The "D")
        // We draw a partial arc centered on the penalty spot, sticking out below the penalty box
        pitch.beginPath();
        // arc(x, y, radius, startAngle, endAngle)
        pitch.arc(225, 290, 90, Math.PI * 0.23, Math.PI * 0.77);
        pitch.strokePath();

        this.stages = [
            { name: "GROUP STAGE", opponent: "QATAR", speed: 500 },
            { name: "ROUND OF 16", opponent: "USA", speed: 650 },
            { name: "QUARTER FINAL", opponent: "FRANCE", speed: 800 },
            { name: "SEMI FINAL", opponent: "ARGENTINA", speed: 950 },
            { name: "THE FINAL", opponent: "BRAZIL", speed: 1100 }
        ];

        this.currentStageIndex = this.registry.get('tournamentStage');
        this.matchData = this.stages[this.currentStageIndex];

        // --- NEW META SYSTEMS ---
        this.globalScore = this.registry.get('totalScore');
        this.streak = 0;
        this.lives = 3;
        this.savesNeeded = 5;
        this.currentSaves = 0;
        this.baseShotSpeed = this.matchData.speed;
        this.currentShotSpeed = this.baseShotSpeed;

        this.add.text(225, 40, `${this.matchData.name}\nvs ${this.matchData.opponent}`, {
            fontSize: '20px', fill: '#ffffff', fontFamily: 'monospace', align: 'center', fontWeight: 'bold'
        }).setOrigin(0.5);

        this.hudText = this.add.text(20, 40, '', {
            fontSize: '18px', fill: '#ffffff', fontFamily: 'monospace', fontWeight: 'bold'
        });
        // Draw 3 hearts in a row (x, y, asset)
        this.heartImages = [
            this.add.image(40, 110, 'heart').setDisplaySize(24, 24),
            this.add.image(70, 110, 'heart').setDisplaySize(24, 24),
            this.add.image(100, 110, 'heart').setDisplaySize(24, 24)
        ];
        this.updateHUD();

        // Player & Ball Physics
        this.glove = this.physics.add.sprite(225, 305, 'glove');
        this.glove.setCollideWorldBounds(true);
        this.glove.setImmovable(true);
// Force the image to fit our established 50x50 hitbox
        this.glove.setDisplaySize(50, 50);

        this.input.on('pointermove', (pointer) => {
            this.glove.x = pointer.x;
            this.glove.y = Phaser.Math.Clamp(pointer.y, 100, 500);
        });

        this.ball = this.physics.add.sprite(225, 750, 'ball');
        // Force the visual image to 30x30
        this.ball.setDisplaySize(44, 44); // Visually 44x44 pixels
        // Keep the actual physics collision area as a perfect circle
        this.ball.setCircle(22); // Invisible physics radius of 22
        this.ball.setBounce(1);

        this.particles = this.add.particles(0, 0, 'trail', {
            speed: 50, scale: { start: 1, end: 0 }, blendMode: 'ADD', lifespan: 300
        });
        this.particles.startFollow(this.ball);

        this.physics.add.overlap(this.glove, this.ball, this.handleSave, null, this);
        this.time.delayedCall(1500, this.shootBall, [], this);
    }

    updateHUD() {
        // Update the text (removed the LIVES text since we have icons now)
        this.hudText.setText(
            `SCORE: ${this.globalScore}\n` +
            `STREAK: x${this.streak}\n` +
            `SAVES: ${this.currentSaves}/${this.savesNeeded}`
        );

        // Update the visual hearts
        for (let i = 0; i < 3; i++) {
            // If the heart's index is less than your current lives, show it. Otherwise, hide it.
            this.heartImages[i].setVisible(i < this.lives);
        }
    }

    spawnFloatingText(x, y, message, color) {
        const floatText = this.add.text(x, y, message, {
            fontSize: '24px', fill: color, fontFamily: 'monospace', fontWeight: 'bold'
        }).setOrigin(0.5);

        // Animate the text floating up and fading out
        this.tweens.add({
            targets: floatText, y: y - 60, alpha: 0, duration: 800,
            onComplete: () => floatText.destroy() // Clean up memory!
        });
    }

    shootBall() {
        this.ball.setPosition(225, 750);
        this.ball.setVelocity(0, 0);

        const targetX = Phaser.Math.Between(30, 420);
        const targetY = Phaser.Math.Between(130, 380);
        const angle = Phaser.Math.Angle.Between(this.ball.x, this.ball.y, targetX, targetY);

        this.physics.velocityFromRotation(angle, this.currentShotSpeed, this.ball.body.velocity);
    }

    handleSave(glove, ball) {
    // 1. Play the bounce sound immediately!
        this.sound.play('bounce', { volume: 0.8 });
        // Freeze ball
        const impactX = this.ball.x;
        const impactY = this.ball.y;
        this.ball.setVelocity(0, 0);
        this.ball.setPosition(-100, -100);
        this.cameras.main.shake(150, 0.015);

        // CALCULATE CLEAN CATCH
        const distance = Phaser.Math.Distance.Between(glove.x, glove.y, impactX, impactY);
        const isCleanCatch = distance < 25; // If ball hits near the center of the 50x50 glove

        // SCORING MATH
        this.streak += 1;
        let points = 100 * this.streak;

        if (isCleanCatch) {
            points *= 2; // Double points for a perfect center block
            this.spawnFloatingText(impactX, impactY, `PERFECT!\n+${points}`, '#ffff00'); // Yellow text
        } else {
            this.spawnFloatingText(impactX, impactY, `+${points}`, '#ffffff'); // White text
        }

        this.globalScore += points;
        this.registry.set('totalScore', this.globalScore); // Save to registry

        this.currentSaves += 1;
        this.currentShotSpeed += 30;
        this.updateHUD();

        if (this.currentSaves >= this.savesNeeded) {
        this.bgMusic.stop(); // CRITICAL: Stop the music before changing scenes
            this.scene.start('TransitionScene', { won: true });
        } else {
            this.time.delayedCall(600, this.shootBall, [], this);
        }
    }

    update() {
        if (this.ball.y < 150 && this.ball.y > 0) {
            this.ball.setVelocity(0, 0);
            this.ball.setPosition(-100, -100);
            this.cameras.main.flash(300, 255, 0, 0);
            this.cameras.main.shake(200, 0.02);

// 2. Play the fail sound!
            this.sound.play('fail', { volume: 0.7 });

            this.lives -= 1;
            this.streak = 0; // Reset streak!
            this.spawnFloatingText(225, 200, "STREAK LOST!", '#ff0055');

            this.currentShotSpeed = this.baseShotSpeed;
            this.updateHUD();

            if (this.lives <= 0) {
            // --- STOP THE MUSIC HERE RIGHT BEFORE THE SCENE CHANGES ---
            this.bgMusic.stop();
                this.scene.start('TransitionScene', { won: false });
            } else {
                this.time.delayedCall(1000, this.shootBall, [], this);
            }
        }
    }
}

// --- 4. TRANSITION SCENE (Now with Cloud Leaderboards!) ---
class TransitionScene extends Phaser.Scene {
    constructor() { super({ key: 'TransitionScene' }); }

    init(data) { this.wonMatch = data.won; }

    async create() {
        this.cameras.main.setBackgroundColor('#000000');
        let stageIndex = this.registry.get('tournamentStage');
        let finalScore = this.registry.get('totalScore');

        let titleText = "";
        let actionText = "";
        let isGameOver = false;

        if (this.wonMatch) {
            if (stageIndex === 4) {
                titleText = "WORLD CHAMPIONS!";
                actionText = "[ NEW JOURNEY ]";
                this.registry.set('tournamentStage', 0);
                isGameOver = true;
            } else {
                titleText = "MATCH WON!";
                actionText = "[ NEXT ROUND ]";
                this.registry.set('tournamentStage', stageIndex + 1);
            }
        } else {
            titleText = "KNOCKED OUT";
            actionText = "[ TRY AGAIN ]";
            isGameOver = true;
        }

        // Display Header
        this.add.text(225, 100, titleText, {
            fontSize: '36px', fill: this.wonMatch ? '#00aa44' : '#ff0055',
            fontFamily: 'monospace', fontWeight: 'bold', align: 'center'
        }).setOrigin(0.5);

        this.add.text(225, 160, `YOUR SCORE: ${finalScore}`, {
            fontSize: '24px', fill: '#ffff00', fontFamily: 'monospace', fontWeight: 'bold'
        }).setOrigin(0.5);

        // --- CLOUD LEADERBOARD LOGIC ---
        if (isGameOver && finalScore > 0) {
            // 1. Classic Arcade Prompt for Initials
            let initials = prompt("GAME OVER! Enter 3 initials for the Global Leaderboard:", "AAA");
            if (!initials) initials = "AAA";

            // 2. Show loading text
            let boardText = this.add.text(225, 300, "SAVING TO CLOUD...", {
                fontSize: '18px', fill: '#ffffff', fontFamily: 'monospace', align: 'center'
            }).setOrigin(0.5);

            // 3. Send to Supabase
            await submitScore(initials.substring(0, 3), finalScore);

            // 4. Fetch and Display Top 5
            boardText.setText("LOADING GLOBAL TOP 5...");
            const topScores = await getTopScores();

            let leaderboardDisplay = "--- GLOBAL LEADERBOARD ---\n\n";
            topScores.forEach((entry, index) => {
                leaderboardDisplay += `${index + 1}. ${entry.player_name} ..... ${entry.score}\n`;
            });

            boardText.setText(leaderboardDisplay);
        }

        // --- CONTINUE BUTTON ---
        const btn = this.add.text(225, 650, actionText, {
            fontSize: '24px', fill: '#ffffff', fontFamily: 'monospace', fontWeight: 'bold'
        }).setOrigin(0.5).setInteractive();

        this.tweens.add({ targets: btn, alpha: 0.2, yoyo: true, repeat: -1, duration: 800 });

        btn.on('pointerdown', () => {
            if (this.wonMatch && stageIndex !== 4) {
                this.scene.start('GameplayScene');
            } else {
                this.registry.set('totalScore', 0); // Reset score for new run
                this.scene.start('MainMenuScene');
            }
        });
    }
}

const config = {
    type: Phaser.AUTO, width: 450, height: 800, parent: 'game-container',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [BootScene, MainMenuScene, GameplayScene, TransitionScene]
};