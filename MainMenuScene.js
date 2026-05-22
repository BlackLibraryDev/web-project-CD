// src/scenes/MainMenuScene.js
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    preload() {
        // 배경 이미지와 버튼 이미지 로드
        this.load.image('menu_bg', 'assets/menu_background.png');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        // GameScene이나 UIScene의 create() 단계에 배치
        const fsButton = this.add.text(150, height-40, '🖥️ FULLSCREEN', {
            fontFamily: 'Arial',
            fontSize: '24px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);

        // 버튼을 누르면 켜져있을 땐 꺼지고, 꺼져있을 땐 켜집니다.
        fsButton.on('pointerdown', () => {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen(); // 전체화면 끄기
                fsButton.setText('🖥️ FULLSCREEN');
            } else {
                this.scale.startFullscreen(); // 전체화면 켜기
                fsButton.setText('❌ EXIT FULL');
            }
        });

        // 배경 배치
        const bg = this.add.image(width / 2, height / 2, 'menu_bg');
        bg.setDisplaySize(width, height);

        // 글자 자체를 돋보이게 하는 스타일 (블록 없는 미니멀 스타일)
        const titleStyle = {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '74px',
            fill: '#ffffff',
            stroke: '#111111',
            strokeThickness: 6
        };

        
        this.castle = this.add.image(width *0.7, height -200, 'castle1').setScale(1.5);

        const platforms = this.physics.add.staticGroup(); 
        this.ground = this.add.rectangle(width / 2, height-50, width, 100, 0xffffff,0.2).setOrigin(0.5);
        platforms.add(this.ground); // 이제 .add()가 작동합니다.
        this.mobs = this.physics.add.group();
        //0.5초마다 몹이 생성됨
        this.mainmenuSpawn = this.time.addEvent({
            delay: 700,
            callback: () => {
                const mob = this.physics.add.sprite(width * 0.7 + Phaser.Math.Between(-200, 200), -50 -Phaser.Math.Between(0, 100), 'mobsprite1');
                mob.setVelocityX(0); // 왼쪽으로 이동
                mob.anims.play('mob1_walk', true);
                mob.setCollideWorldBounds(true);
                mob.body.setSize(mob.width * 0.6, mob.height * 0.8).setOffset(mob.width * 0.2, mob.height * 0.2);
                this.physics.add.collider(mob, platforms); // 몹과 플랫폼 충돌 처리
                this.mobs.add(mob);
            },
            loop: true
        });
        this.physics.add.collider(this.mobs, platforms, (mob, ground) => {
            console.log('몹이 땅에 닿았습니다!');
            this.fadeOutAndDestroy(this, mob);
        });


        // 타이틀 텍스트
        this.add.text(width *0.1, height * 0.2, 'Defend your Castle', titleStyle).setDepth(2);
        const savedData = localStorage.getItem('projectCD_data');

        // 텍스트 버튼 생성
        const startButton = this.add.text(width *0.1, height * 0.6, '[ GAME START ]', {
            fontFamily: 'Arial',
            fontSize: '36px',
            fill: '#ffcc00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0).setInteractive({ useHandCursor: true });

        const newGameButton = this.add.text(width *0.1, height * 0.7, '[ NEW GAME ]', {
            fontFamily: 'Arial',
            fontSize: '36px',
            fill: '#ffcc00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0).setInteractive({ useHandCursor: true });

        // 마우스 올렸을 때 효과
        startButton.on('pointerover', () => startButton.setColor('#ffffff').setScale(1.1));
        startButton.on('pointerout', () => startButton.setColor('#ffcc00').setScale(1.0));

        newGameButton.on('pointerover', () => newGameButton.setColor('#ffffff').setScale(1.1));
        newGameButton.on('pointerout', () => newGameButton.setColor('#ffcc00').setScale(1.0));

        if(savedData){
            startButton.text = '[ CONTINUE ]';
        }
        // 클릭 시 인게임(GameScene)으로 전환
        startButton.on('pointerdown', () => {
            this.mainmenuSpawn.remove(); // 몹 생성 타이머 제거

            this.scene.start('GameScene');
        });
        // 클릭 시 인게임(GameScene)으로 전환
        newGameButton.on('pointerdown', () => {
            
            
            if (savedData) {
                if (confirm('저장된 데이터가 있습니다. 새로 시작하시겠습니까?')) {
                    this.mainmenuSpawn.remove(); // 몹 생성 타이머 제거
                    localStorage.removeItem('projectCD_data'); // 기존 데이터 삭제
                    this.scene.start('GameScene');
                } else {
                    
                }
            } else {
                this.mainmenuSpawn.remove(); // 몹 생성 타이머 제거
                localStorage.removeItem('projectCD_data'); // 기존 데이터 삭제
                this.scene.start('GameScene');
            }
            
        });



        // html에서 설정한 전역 변수 가져오기 (없을 경우를 대비해 기본값 세팅)
        const currentVersion = window.GAME_VERSION || "알 수 없는 버전";

        // 화면 우측 하단 구석에 조그맣게 버전 표시
        const versionTxt = this.add.text(
            width - 10, 
            height - 10, 
            `project CD / BlackLibrary, 2026 - Build ${currentVersion}`, 
            {
                fontFamily: 'Arial',
                fontSize: '14px',
                fill: '#ffffff',
                align: 'right'
            }
        );
        versionTxt.setDepth(99);
        versionTxt.setOrigin(1, 1); 
        //versionTxt.setAlpha(0.9); // 너무 밝으면 방해되니 살짝 투명하게
    }

    fadeOutAndDestroy(scene, mob) {
        if(mob.body){
            mob.body.enable = false;
            mob.anims.stop(); // 애니메이션도 멈춤
        }
        this.mobBloodEffect(mob); // 피 효과 추가

        scene.tweens.add({
            targets: mob,
            alpha: 0,
            duration: 500,
            onComplete: () => mob.destroy()
        }); 
    }
    mobBloodEffect(mob){
        const blood = this.add.ellipse(mob.x, mob.y+mob.height/3, 60,20, 0xff0000).setAlpha(0.8);
        this.tweens.add({
            targets: blood,
            alpha: 0,
            scale: 2,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => blood.destroy()
        });
    }
}