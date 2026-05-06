class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }
    isPaused = false;
    create() {
        const { width, height } = this.cameras.main;

        // 1. 일시정지 화면 그룹
        this.pauseMenu = this.add.container(0, 0).setVisible(this.isPaused);
        const pauseBg = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
        const pauseText = this.add.text(width/2, height/2, 'PAUSED', { fontSize: '48px', fill: '#ffffff' }).setOrigin(0.5);
        this.pauseMenu.add([pauseBg, pauseText]);
        this.pauseMenu.setDepth(20); // 다른 UI 요소들보다 위에 표시

        // 2. 게임오버 화면 그룹
        this.gameOverMenu = this.add.container(0, 0).setVisible(false);
        const overBg = this.add.rectangle(width/2, height/2, width, height, 0xff0000, 0.3);
        this.scoreText = this.add.text(width/2, height/2, 'SCORE: 0', { fontSize: '48px' , fill: '#000000'}).setOrigin(0.5);
        
        // 1. 다시 시작 버튼 생성
        const restartBtn = this.add.text(config.width / 2, config.height / 2 + 100, 'Restart', {
            fontSize: '32px',
            fill: '#ffffff',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true }); // 마우스 커서를 손모양으로 변경

        // 2. 버튼 이벤트 설정
        restartBtn.on('pointerdown', () => {
            this.restartGame();
        });

        // 3. 컨테이너에 버튼 추가 (기존 리스트에 포함)

        this.gameOverMenu.add([overBg, this.scoreText, restartBtn]);
        this.gameOverMenu.setDepth(20); // 다른 UI 요소들보다 위에 표시



        // 3. 이벤트 리스너 (GameScene에서 보낸 신호를 받음)
        const gameScene = this.scene.get('GameScene');
        
        gameScene.events.on('showPause', () => {
            this.pauseMenu.setVisible(true);
        });

        gameScene.events.on('hidePause', () => {
            this.pauseMenu.setVisible(false);
        });

        gameScene.events.on('showGameOver', (data) => {
            this.scoreText.setText(`SCORE: ${data.score}`);
            this.scene.pause('GameScene'); 
            this.gameOverMenu.setVisible(true);
        });

        // 점수 업데이트 이벤트 리스너
        // 'changedata-이름' 형식을 사용합니다.
        this.registry.events.on('changedata-score', (parent, newValue) => {
            this.updateScore(newValue);
        });
        this.registry.events.on('changedata-castleHP', (parent, newValue) => {
            this.drawHealthBar(this.healthBar, newValue);
        });

        //점수 및 체력 초기화
        this.hpText = this.add.text(90, 20, 'Castle HP: 100', {
            fontSize: '32px',
            fill: '#ff0000',
            fontStyle: 'bold'
        });
        this.hpText.setDepth(10); // UI 요소보다 위에 표시
        // 체력 바를 그릴 그래픽 객체 생성
        this.healthBar = this.add.graphics();
        this.drawHealthBar(this.healthBar, 0, 90, 50 ); // 위치
        this.healthBar.setDepth(10); // UI 요소보다 위에 표시
           this.scoreText = this.add.text(config.width - 20, 20, 'Score: 0', {
            fontSize: '32px',
            fill: '#000000',
            fontStyle: 'bold'
        }).setOrigin(1, 0); // 기준점을 우측 상단으로 설정하여 글자가 왼쪽으로 늘어나게 함
        this.scoreText.setDepth(8);
        this.updateScore( this.registry.get('score') || 0);
        this.drawHealthBar(this.healthBar, this.registry.get('castleHP') || 100);
    

        // 일시정지 버튼 생성 (텍스트 형태)
        this.pauseBtn = this.add.text(20, 20, '⏸', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 15, y: 15 }
        })
        .setInteractive({ useHandCursor: true }) // 클릭 가능하게 설정
        .setScrollFactor(0); // 카메라가 움직여도 고정되게 함
        this.pauseBtn.on('pointerdown', () => {
            this.togglePause();
        });
        this.pauseBtn.setDepth(10); 

        
    }
    updateScore(points) {
        this.scoreText.setText('Score: ' + points);
    }
    drawHealthBar(graphics, hp, x=90, y =50) {
        graphics.clear();

        // 1. 배경 (검정색)
        graphics.fillStyle(0x000000);
        graphics.fillRect(x, y, 200, 20);

        // 2. 현재 체력 (빨간색)
        // 체력 비율에 따라 가로 길이를 조절함 (200px * hp/100)
        graphics.fillStyle(0xff0000);
        graphics.fillRect(x, y, 200 * (hp / 100), 20);

        // 3. 텍스트 업데이트
        this.hpText.setText(`Castle HP: ${hp}`);
    }
    // 일시정지 버튼을 눌렀을 때
    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseMenu.setVisible(this.isPaused);
        if (this.isPaused) {
            //this.physics.pause('GameScene');
            this.scene.pause('GameScene'); // Update 루프도 멈추게 함
            if (this.spawnEvent) this.spawnEvent.paused = true;
            this.events.emit('showPause'); // UIScene에 신호 보냄
        } else {
            //this.physics.resume('GameScene');
            this.scene.resume('GameScene');
            if (this.spawnEvent) this.spawnEvent.paused =false;
            this.events.emit('hidePause');
        }
    }

    // 4. 다시 시작 로직 함수
    restartGame() {
        // GameScene을 찾아서 처음부터 다시 시작 시킵니다.
        const gameScene = this.scene.get('GameScene');
        
        // UIScene은 숨기거나 멈추고, GameScene을 재시작합니다.
        this.gameOverMenu.setVisible(false);
        gameScene.scene.restart(); 
        
        // 만약 별도의 UI 상태가 있다면 여기서 초기화합니다.
        //console.log("게임 재시작!");
    }
}