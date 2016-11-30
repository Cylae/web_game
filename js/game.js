var game = new Phaser.Game(320,505,Phaser.AUTO,'game'); // Déclaration de Phaser
game.States = {}; 

game.States.boot = function(){
	this.preload = function(){
		if(!game.device.desktop){//If ecran d'ordinateur
			this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
			this.scale.forcePortrait = true;
			this.scale.refresh();
		}
		game.load.image('loading','assets/preloader.gif');
	};
	this.create = function(){
		game.state.start('preload'); // Chargement des fichiers
	};
}

game.States.preload = function(){
	this.preload = function(){
		var preloadSprite = game.add.sprite(35,game.height/2,'loading'); //Pre-chargement du sprite
		game.load.setPreloadSprite(preloadSprite);
		game.load.image('background','assets/background.png'); // Image de fond
    	game.load.image('ground','assets/ground.png'); // Image du sol
    	game.load.image('title','assets/title.png'); // Image du titre
    	game.load.spritesheet('bird','assets/bird.png',34,24,3); // Image de l'oiseau
    	game.load.image('btn','assets/start-button.png');  // Image du bouton démarrer
    	game.load.spritesheet('pipe','assets/pipes.png',54,320,2); // Image des "cheminées"
    	game.load.bitmapFont('flappy_font', 'assets/fonts/flappyfont/flappyfont.png', 'assets/fonts/flappyfont/flappyfont.fnt');
    	game.load.audio('fly_sound', 'assets/flap.wav');// Son "flap"
    	game.load.audio('score_sound', 'assets/score.wav');// Son tableau de scores
    	game.load.audio('hit_pipe_sound', 'assets/pipe-hit.wav'); //Son "hit" d'une pipe
    	game.load.audio('hit_ground_sound', 'assets/ouch.wav'); //Son "died"

    	game.load.image('ready_text','assets/get-ready.png');
    	game.load.image('play_tip','assets/instructions.png');
    	game.load.image('game_over','assets/gameover.png');
    	game.load.image('score_board','assets/scoreboard.png');
	}
	this.create = function(){
		game.state.start('menu');
	}
}

game.States.menu = function(){
	this.create = function(){
		game.add.tileSprite(0,0,game.width,game.height,'background').autoScroll(-10,0); //
		game.add.tileSprite(0,game.height-112,game.width,112,'ground').autoScroll(-100,0); //
		var titleGroup = game.add.group(); //
		titleGroup.create(0,0,'title'); //
		var bird = titleGroup.create(190, 10, 'bird'); //
		bird.animations.add('fly'); //
		bird.animations.play('fly',12,true); //
		titleGroup.x = 35;
		titleGroup.y = 100;
		game.add.tween(titleGroup).to({ y:120 },1000,null,true,0,Number.MAX_VALUE,true); //
		var btn = game.add.button(game.width/2,game.height/2,'btn',function(){//
			game.state.start('play');
		});
		btn.anchor.setTo(0.5,0.5);
	}
}

game.States.play = function(){
	this.create = function(){
		this.bg = game.add.tileSprite(0,0,game.width,game.height,'background');//
		this.pipeGroup = game.add.group();
		this.pipeGroup.enableBody = true;
		this.ground = game.add.tileSprite(0,game.height-112,game.width,112,'ground'); //
		this.bird = game.add.sprite(50,150,'bird'); //
		this.bird.animations.add('fly');
		this.bird.animations.play('fly',12,true);
		this.bird.anchor.setTo(0.5, 0.5);
		game.physics.enable(this.bird,Phaser.Physics.ARCADE); //Etablissement de la physique sur l'oiseau
		this.bird.body.gravity.y = 0; //Gravité de l'oiseau de base à 0
		game.physics.enable(this.ground,Phaser.Physics.ARCADE);//Etablissement de la physique du le sol
		this.soundFly = game.add.sound('fly_sound');
		this.soundScore = game.add.sound('score_sound');
		this.soundHitPipe = game.add.sound('hit_pipe_sound');
		this.soundHitGround = game.add.sound('hit_ground_sound');
		this.scoreText = game.add.bitmapText(game.world.centerX-20, 30, 'flappy_font', '0', 36);

		this.readyText = game.add.image(game.width/2, 40, 'ready_text'); //Affichage image "get ready"
		this.playTip = game.add.image(game.width/2,300,'play_tip'); //Affichage du l'aide au début de la partie
		this.readyText.anchor.setTo(0.5, 0);
		this.playTip.anchor.setTo(0.5, 0);

		this.hasStarted = false; 
		game.time.events.loop(900, this.generatePipes, this);
		game.time.events.stop(false);
		game.input.onDown.addOnce(this.statrGame, this);
	};
	this.update = function(){
		if(!this.hasStarted) return; 
		game.physics.arcade.collide(this.bird,this.ground, this.hitGround, null, this); //Vérification de la collision
		game.physics.arcade.overlap(this.bird, this.pipeGroup, this.hitPipe, null, this); //Vérification de chevauchement
		if(this.bird.angle < 90) this.bird.angle += 2.5; //
		this.pipeGroup.forEachExists(this.checkScore,this); //
	}

	this.statrGame = function(){
		this.gameSpeed = 600; //Définition de la vitesse de défilement
		this.gameIsOver = false;
		this.hasHitGround = false;
		this.hasStarted = true;
		this.score = 0;
		this.bg.autoScroll(-(this.gameSpeed/10),0);
		this.ground.autoScroll(-this.gameSpeed,0);
		this.bird.body.gravity.y = 1000; // Définition de la gravité (1000 mode normal - 1150 plus difficile)
		this.readyText.destroy();
		this.playTip.destroy();
		game.input.onDown.add(this.fly, this);
        var spaceKey = game.input.keyboard.addKey(
                Phaser.Keyboard.SPACEBAR);
        spaceKey.onDown.add(this.fly, this);
		game.time.events.start();
	}

	this.stopGame = function(){
		this.bg.stopScroll();
		this.ground.stopScroll();
		this.pipeGroup.forEachExists(function(pipe){
			pipe.body.velocity.x = 0;
		}, this);
		this.bird.animations.stop('fly', 0);
		game.input.onDown.remove(this.fly,this);
		game.time.events.stop(true);
	}

	this.fly = function(){
		this.bird.body.velocity.y = -350;
		game.add.tween(this.bird).to({angle:-30}, 100, null, true, 0, 0, false); //La tete monde lorsque l'oiseau monte
		this.soundFly.play();
	}

	this.hitPipe = function(){
		if(this.gameIsOver) return;
		this.soundHitPipe.play();
		this.gameOver();
	}
	this.hitGround = function(){
		if(this.hasHitGround) return; // Si l'oiseau touche le sol
		this.hasHitGround = true;
		this.soundHitGround.play();
		this.gameOver(true);
	}
	this.gameOver = function(show_text){
		this.gameIsOver = true;
		this.stopGame();
		if(show_text) this.showGameOverText();
	};

	this.showGameOverText = function(){
		this.scoreText.destroy();
		game.bestScore = game.bestScore || 0;
		if(this.score > game.bestScore) game.bestScore = this.score; // Si le score actuel est meilleur que le meilleur, mise à jour du meilleur score
		this.gameOverGroup = game.add.group(); //
		var gameOverText = this.gameOverGroup.create(game.width/2,0,'game_over'); //Ecran Game Over
		var scoreboard = this.gameOverGroup.create(game.width/2,70,'score_board'); //Ecran des scores
		var currentScoreText = game.add.bitmapText(game.width/2 + 60, 105, 'flappy_font', this.score+'', 20, this.gameOverGroup); //Application de la police "bitmap"
		var bestScoreText = game.add.bitmapText(game.width/2 + 60, 153, 'flappy_font', game.bestScore+'', 20, this.gameOverGroup); //Application de la police "bitmap"
		var replayBtn = game.add.button(game.width/2, 210, 'btn', function(){//Bouton "replay"
			game.state.start('play');
		}, this, null, null, null, null, this.gameOverGroup);
		gameOverText.anchor.setTo(0.5, 0);
		scoreboard.anchor.setTo(0.5, 0);
		replayBtn.anchor.setTo(0.5, 0);
		this.gameOverGroup.y = 30;
	}

	this.generatePipes = function(gap){ //Generation des cheminées
		gap = gap || 150; //Définition de l'espacement
		var position = (505 - 320 - gap) + Math.floor((505 - 112 - 30 - gap - 505 + 320 + gap) * Math.random());
		var topPipeY = position-360;
		var bottomPipeY = position+gap;

		if(this.resetPipe(topPipeY,bottomPipeY)) return;

		var topPipe = game.add.sprite(game.width, topPipeY, 'pipe', 0, this.pipeGroup);
		var bottomPipe = game.add.sprite(game.width, bottomPipeY, 'pipe', 1, this.pipeGroup);
		this.pipeGroup.setAll('checkWorldBounds',true);
		this.pipeGroup.setAll('outOfBoundsKill',true);
		this.pipeGroup.setAll('body.velocity.x', -this.gameSpeed);
	}

	this.resetPipe = function(topPipeY,bottomPipeY){//Reset des pipes
		var i = 0;
		this.pipeGroup.forEachDead(function(pipe){
			if(pipe.y<=0){ //Pipe du haut
				pipe.reset(game.width, topPipeY);
				pipe.hasScored = false;
			}else{
				pipe.reset(game.width, bottomPipeY);
			}
			pipe.body.velocity.x = -this.gameSpeed;
			i++;
		}, this);
		return i == 2; //
	}

	this.checkScore = function(pipe){
		if(!pipe.hasScored && pipe.y<=0 && pipe.x<=this.bird.x-17-54){
			pipe.hasScored = true;
			this.scoreText.text = ++this.score;
			this.soundScore.play();
			return true;
		}
		return false;
	}
}

//
game.state.add('boot',game.States.boot);
game.state.add('preload',game.States.preload);
game.state.add('menu',game.States.menu);
game.state.add('play',game.States.play);
game.state.start('boot');
