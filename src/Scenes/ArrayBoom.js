class ArrayBoom extends Phaser.Scene {
    constructor() {
        super("arrayBoom");

        // Initialize a class variable "my" which is an object.
        // The object has two properties, both of which are objects
        //  - "sprite" holds bindings (pointers) to created sprites
        //  - "text"   holds bindings to created bitmap text objects
        this.my = {sprite: {}, text: {}};

        // Create a property inside "sprite" named "bullet".
        // The bullet property has a value which is an array.
        // This array will hold bindings (pointers) to bullet sprites
        this.my.sprite.bullet = [];   
        this.maxBullets = 2;           // Don't create more than this many bullets
        
        this.myScore = 0;       // record a score as a class variable

        this.fireCooldown = 0;
        this.fireDelay = 500; 

        this.myLives = 3;
        this.enemySpeed = 60;
        this.enemyHit = false;

        this.redEnemyActive = false;
        this.redEnemyHit = false;
        this.redFireCooldown = 0;
        this.redFireDelay = 2000;
        this.redEnemySpeed = 80;
        this.redBulletSpeed = 300;
        this.lastRedSpawnScore = 0;
        this.my.sprite.redBullets = [];

        // More typically want to use a global variable for score, since
        // it will be used across multiple scenes
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.image("white", "./ships/ship (1).png");
        this.load.image("cannon", "./Ship parts/cannonBall.png");
        this.load.image("GreenShip", "./ships/ship (4).png");
        this.load.image("RedShip", "./ships/ship (3).png")

        // For animation
        this.load.image("explosion3", "./Effects/explosion3.png");
        this.load.image("explosion2", "./Effects/explosion2.png");
        this.load.image("explosion1", "./Effects/explosion1.png");

        this.load.image("sea", "./Tiles/tile_73.png");

        this.load.audio("hit", "./Audio/footstep_concrete_001.ogg")

        //this.load.audio("hit", "jingles_HIT13.ogg");
        //this.load.audio("bgm", "FAVELA.mp3");

        // Load the Kenny Rocket Square bitmap font
        // This was converted from TrueType format into Phaser bitmap
        // format using the BMFont tool.
        // BMFont: https://www.angelcode.com/products/bmfont/
        // Tutorial: https://dev.to/omar4ur/how-to-create-bitmap-fonts-for-phaser-js-with-bmfont-2ndc
        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");

        // Sound asset from the Kenny Music Jingles pack
        // https://kenney.nl/assets/music-jingles
        // TODO: load sound assets here
    }

    create() {
        let my = this.my;
        const layer = this.add.layer();

        my.sprite.white = this.add.sprite(game.config.width/2, game.config.height - 40, "white");
        my.sprite.white.setScale(0.75);

        my.sprite.green = this.add.sprite(game.config.width/2, 80, "GreenShip");
        my.sprite.green.setScale(0.50);
        my.sprite.green.scorePoints = 25;

        my.sprite.red = this.add.sprite(game.config.width/2, 80, "RedShip");
        my.sprite.red.setScale(0.50);
        my.sprite.red.scorePoints = 50;
        my.sprite.red.setVisible(false);

        my.sprite.sea = this.add.image(400, 300, 'sea');
        my.sprite.sea.setScale(13);
        this.children.sendToBack(my.sprite.sea);


        // Notice that in this approach, we don't create any bullet sprites in create(),
        // and instead wait until we need them, based on the number of space bar presses

        // Create white puff animation
        this.anims.create({
            key: "boom",
            frames: [
                { key: "explosion3" },
                { key: "explosion2" },
                { key: "explosion1" },
            ],
            frameRate: 20,    // Note: case sensitive (thank you Ivy!)
            repeat: 5,
            hideOnComplete: true
        });

        //this.bgMusic  = this.sound.add("bgm");
        //this.bgMusic.play({ volume: 0.5, loop: true });
        // TODO: create sound object(s) here


        // Create key objects
        this.left = this.input.keyboard.addKey("A");
        this.right = this.input.keyboard.addKey("D");
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Set movement speeds (in pixels/tick)
        this.playerSpeed = 200;
        this.bulletSpeed = 500;

        // update HTML description
        document.getElementById('description').innerHTML = '<h2>Audio Practice</h2><br>A: left // D: right // Space: fire/emit';

        // Put score on screen
        my.text.score = this.add.bitmapText(580, 0, "rocketSquare", "Score " + this.myScore);
        my.text.lives = this.add.bitmapText(0, 0, "rocketSquare", "Lives " + this.myLives);

        // Put title on screen
        //this.add.text(10, 5, "Treasure Hunt", {
            //fontFamily: 'Times, serif',
            //fontSize: 24,
            //wordWrap: {
                //width: 60
            //}
        //});

        // TODO: create background music object
        // TODO: start playing background music

    }

    update(time, delta) {
        this.mySound = this.sound.add
        let my = this.my;
        let dt = delta / 1000;

        // Moving left
        if (this.left.isDown) {
            // Check to make sure the sprite can actually move left
            if (my.sprite.white.x > (my.sprite.white.displayWidth/2)) {
                my.sprite.white.x -= this.playerSpeed * dt;
            }
        }

        // Moving right
        if (this.right.isDown) {
            // Check to make sure the sprite can actually move right
            if (my.sprite.white.x < (game.config.width - (my.sprite.white.displayWidth/2))) {
                my.sprite.white.x += this.playerSpeed * dt;
            }
        }

        if (this.fireCooldown > 0) {
            this.fireCooldown -= delta;
        }

        // Check for bullet being fired
        if (Phaser.Input.Keyboard.JustDown(this.space)) {
            // Are we under our bullet quota?
            if (my.sprite.bullet.length < this.maxBullets && this.fireCooldown <= 0) {
                this.fireCooldown = this.fireDelay;
                my.sprite.bullet.push(this.add.sprite(
                    my.sprite.white.x, my.sprite.white.y-(my.sprite.white.displayHeight/2), "cannon").setScale(2)
                );
            }
        }

        // Remove all of the bullets which are offscreen
        // filter() goes through all of the elements of the array, and
        // only returns those which **pass** the provided test (conditional)
        // In this case, the condition is, is the y value of the bullet
        // greater than zero minus half the display height of the bullet? 
        // (i.e., is the bullet fully offscreen to the top?)
        // We store the array returned from filter() back into the bullet
        // array, overwriting it. 
        // This does have the impact of re-creating the bullet array on every 
        // update() call. 
        my.sprite.bullet = my.sprite.bullet.filter((bullet) => bullet.y > -(bullet.displayHeight/2));

        if (my.sprite.green.visible) {
            my.sprite.green.y += this.enemySpeed * dt;
            if (my.sprite.green.y > game.config.height + my.sprite.green.displayHeight) {
                this.resetEnemy();
            }
            if (!this.enemyHit && this.collides(my.sprite.green, my.sprite.white)) {
                this.enemyHit = true;
                this.loseLife();
                this.resetEnemy();
            }
        }

        if (this.redEnemyActive && my.sprite.red.visible) {
            my.sprite.red.y += this.redEnemySpeed * dt;
 
            // Reset if it reaches the bottom
            if (my.sprite.red.y > game.config.height + my.sprite.red.displayHeight) {
                this.resetRedEnemy();
            }
 
            // Collide with player
            if (!this.redEnemyHit && this.collides(my.sprite.red, my.sprite.white)) {
                this.redEnemyHit = true;
                this.loseLife();
                this.resetRedEnemy();
            }
 
            // Fire a bullet downward toward the player on a timer
            this.redFireCooldown -= delta;
            if (this.redFireCooldown <= 0) {
                this.redFireCooldown = this.redFireDelay;
                my.sprite.redBullets.push(
                    this.add.sprite(my.sprite.red.x, my.sprite.red.y + my.sprite.red.displayHeight / 2, "cannon")
                        .setScale(1.5)
                        .setTint(0xff4444)   // tint red so it's distinguishable from player bullets
                );
            }
        }
 
        for (let rb of my.sprite.redBullets) {
            rb.y += this.redBulletSpeed * dt;
        }
        my.sprite.redBullets = my.sprite.redBullets.filter(rb => rb.y < game.config.height + rb.displayHeight);
 
        for (let rb of my.sprite.redBullets) {
            if (this.collides(rb, my.sprite.white)) {
                rb.y = game.config.height + 100;
                this.loseLife();
            }
        }


        // Check for collision with the hippo
        for (let bullet of my.sprite.bullet) {
            if (this.collides(my.sprite.green, bullet)) {
                // start animation
                this.boom = this.add.sprite(my.sprite.green.x, my.sprite.green.y, "explosion3").setScale(0.25).play("boom");
                // clear out bullet -- put y offscreen, will get reaped next update
                bullet.y = -100;
                my.sprite.green.visible = false;
                my.sprite.green.x = -100;
                // Update score
                this.myScore += my.sprite.green.scorePoints;
                this.updateScore();
                // TODO: Play collision sound
                this.sound.play("hit");

                // Have new hippo appear after end of animation
                this.boom.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                    this.my.sprite.green.visible = true;
                    this.my.sprite.green.x = Math.random()*config.width;
                    this.my.sprite.green.y = 80;
                    this.enemyHit = false;
                }, this);
            }

        if (this.redEnemyActive && this.collides(my.sprite.red, bullet)) {
            this.boom = this.add.sprite(my.sprite.red.x, my.sprite.red.y, "explosion3").setScale(0.25).play("boom");
            bullet.y = -100;
            my.sprite.red.setVisible(false);
            my.sprite.red.x = -100;

            this.myScore += my.sprite.red.scorePoints;
            this.updateScore();

            this.sound.play("hit");
            
            this.boom.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                this.resetRedEnemy();
            }, this);
        }
    }

        // Make all of the bullets move
        for (let bullet of my.sprite.bullet) {
            bullet.y -= this.bulletSpeed * dt;
        }

    }

    // A center-radius AABB collision check
    collides(a, b) {
        if (Math.abs(a.x - b.x) > (a.displayWidth/2 + b.displayWidth/2)) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight/2 + b.displayHeight/2)) return false;
        return true;
    }

    updateScore() {
        let my = this.my;
        my.text.score.setText("Score " + this.myScore);

        let redThreshold = Math.floor(this.myScore / 100) * 100;
        if (redThreshold >= 100 && redThreshold > this.lastRedSpawnScore) {
            this.lastRedSpawnScore = redThreshold;
            this.spawnRedEnemy();
        }

        if (this.myScore >= 500) {
            this.showVictory();
        }
    }

    updateLives() {
        let my = this.my;
        my.text.lives.setText("Lives " + this.myLives);
    }

    resetEnemy() {
        let my = this.my;
        my.sprite.green.x = Math.random() * game.config.width;
        my.sprite.green.y = 80;
        my.sprite.green.visible = true;
        this.enemyHit = false;
    }

    loseLife() {
        this.myLives--;
        this.updateLives();
        if (this.myLives <= 0) {
            this.cameras.main.flash(500, 255, 0, 0);
            this.time.delayedCall(600, () => {
                this.left.enabled = false;
                this.right.enabled = false;
                this.space.enabled = false;
 
                this.add.text(
                    game.config.width / 2, game.config.height / 2,
                    "GAME OVER\nFinal Score: " + this.myScore + "\n\nPress R to Restart",
                    {
                        fontFamily: 'Times, serif',
                        fontSize: 40,
                        color: '#ff0000',
                        align: 'center'
                    }
                ).setOrigin(0.5);
 
                this.input.keyboard.once("keydown-R", () => {
                    this.myLives = 3;
                    this.myScore = 0;
                    this.scene.restart();
                });
            });
        }
    }

        showVictory() {
        this.left.enabled = false;
        this.right.enabled = false;
        this.space.enabled = false;
 
        this.cameras.main.flash(600, 255, 215, 0);
 
        this.time.delayedCall(700, () => {
            this.add.text(
                game.config.width / 2, game.config.height / 2,
                "YOU WIN!\nFinal Score: " + this.myScore + "\n\nPress R to Play Again",
                {
                    fontFamily: 'Times, serif',
                    fontSize: 40,
                    color: '#ffd700',
                    align: 'center'
                }
            ).setOrigin(0.5);
 
            this.input.keyboard.once("keydown-R", () => {
                this.myLives = 3;
                this.myScore = 0;
                this.scene.restart();
            });
        });
    }

    spawnRedEnemy() {
        let my = this.my;
        this.redEnemyActive = true;
        my.sprite.red.x = Math.random() * game.config.width;
        my.sprite.red.y = 80;
        my.sprite.red.setVisible(true);
        this.redEnemyHit = false;
        this.redFireCooldown = this.redFireDelay;
    }

    resetRedEnemy() {
        let my = this.my;
        for (let rb of my.sprite.redBullets) { rb.destroy(); }
        my.sprite.redBullets = [];
        my.sprite.red.setVisible(false);
        my.sprite.red.x = -100;
        this.redEnemyActive = false;
        this.redEnemyHit = false;
    }
}
         