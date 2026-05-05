class GameScene extends Phaser.Scene {
    constructor() {
        // 이 Scene의 고유 이름(Key)을 설정합니다.
        super('GameScene');
    }

    // 전역 변수 대신 클래스 속성으로 선언하면 관리가 쉽습니다.
    isGameOver = false;
    isPaused = false;

    // 게임변수
    pauseBtn;
    darkOverLay;
    mobs;
    groundHeight = 80;
    acceleration = 4; // 드래그 가속도 (던지는 힘에 영향을 줌)
    // score 관련 변수들
    score = 0;
    scoreText;
    //성의 체력 관련 변수
    healthBar;
    castleHP = 100;
    hpText;

    create() {
       this.scene.launch('UIScene');
       this.isGameOver=false;
       this.isPaused=false;
       this.score=0;
       this.castleHP=100;


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

        this.hpText = this.add.text(90, 20, 'Castle HP: 100', {
            fontSize: '32px',
            fill: '#ff0000',
            fontStyle: 'bold'
        });
        this.hpText.setDepth(10); // UI 요소보다 위에 표시
        // 체력 바를 그릴 그래픽 객체 생성
        this.healthBar = this.add.graphics();
        this.drawHealthBar(this.healthBar, this.castleHP, 90, 50 ); // 위치 (20, 60)
        this.healthBar.setDepth(10); // UI 요소보다 위에 표시
        // 버튼 클릭 이벤트
        


        this.scoreText = this.add.text(config.width - 20, 20, 'Score: 0', {
            fontSize: '32px',
            fill: '#000000',
            fontStyle: 'bold'
        }).setOrigin(1, 0); // 기준점을 우측 상단으로 설정하여 글자가 왼쪽으로 늘어나게 함
        this.scoreText.setDepth(8);

        

        //배경그림
        const bg = this.add.image(config.width/2, config.height/2, 'background1').setDisplaySize(config.width, config.height);
        bg.setDepth(0); // 배경은 가장 뒤에 위치하도록 설정

        // 1. 바닥(Ground)을 정적 그룹으로 생성
        const platforms = this.physics.add.staticGroup(); 
        const ground = this.add.rectangle(config.width / 2, config.height - this.groundHeight / 2, config.width, this.groundHeight, 0x666666).setAlpha(0);;
        platforms.add(ground); // 이제 .add()가 작동합니다.

        this.mobs = this.physics.add.group();

        // 3. 충돌 시 낙차 계산
        this.physics.add.collider(this.mobs, platforms, (mob, ground) => {
            const dropDistance = mob.y - mob.highestY; // 떨어진 거리 계산
            
            if (dropDistance > 400 && mob.y > mob.staryY ) { //400 픽셀 이상 높이에서 떨어졌다면
                this.updateScore(1); // 점수 업데이트
                //mob.destroy();
                this.fadeOutAndDestroy(this, mob);
            } else {
                mob.y = mob.startY? mob.startY : mob.y; // 낙차가 충분하지 않으면 원래 위치로 복귀
                mob.isThrown = false;
                mob.highestY = mob.y; // 높이 초기화
                mob.body.setVelocityX(-mob.speed);
            }
        });

        // 2초마다 몹 생성
        this.spawnEvent = this.time.addEvent({
            delay: 2000,
            callback: this.spawnMob,
            callbackScope: this,
            loop: true
        });

        // 입력 이벤트 설정
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (this.isGameOver || this.isPaused) return;
            gameObject.staryY = gameObject.y; // 드래그 시작 시의 y 위치 저장

            gameObject.isDragging = true; // 드래그 중임을 표시하는 속성
            gameObject.x = dragX;
            gameObject.y = dragY;
            gameObject.body.setVelocity(0, 0); // 잡고 있을 때는 물리 정지
        });

        this.input.on('dragend', (pointer, gameObject) => {
            if (this.isGameOver || this.isPaused) return;
            // 던지는 속도 계산 (마우스 이동 속도 반영)
            const dragVelocity = pointer.velocity;
            gameObject.body.setVelocity(dragVelocity.x * this.acceleration, dragVelocity.y *this.acceleration);
            
            // '던져짐' 상태 체크를 위한 속성 부여
            gameObject.isThrown = true;
            gameObject.isDragging = false; // 드래그 종료
        });
    }

    spawnMob() {
        //몹 생성
        const mob = this.mobs.create(  config.width , config.height -this.groundHeight*2, 'mob1');
        mob.setInteractive({ draggable: true });
        
        // 1. 바닥과의 마찰력을 0으로 설정
        mob.setFriction(0);
        // 2. 아주 살짝 튕기게 설정 (바닥에 껌처럼 붙는 것 방지)
        mob.setBounce(0.1);
        // 3. 화면 끝에 부딪혀도 멈추지 않게 설정
        if (mob.body) {
            mob.setCollideWorldBounds(false);
            mob.body.onWorldBounds = true;
        }
        // 몹의 히트박스(바닥 접촉면) 아래쪽에 여백을 랜덤하게 줌
        //const offsetX = Phaser.Math.Between(-20, 20);
        const offsetY = Phaser.Math.Between(-15, 15);
        mob.body.setOffset(0, offsetY);

        mob.speed = 100 +Math.random() * 30; // 이동 속도에 약간의 랜덤 요소 추가
        mob.isThrown = false;
        mob.isDragging  = false;
        mob.highestY = mob.y;
    }


    update(time, delta) { // time은 게임 시작 후 경과된 전체 시간(ms)
        if (this.isGameOver || this.isPaused) return;

        this.mobs.getChildren().forEach(mob => {
            mob.setDepth(mob.y);
            // 던져진 동안 몹이 올라간 가장 높은 지점(y값은 작을수록 높음) 기록
            if (mob.isThrown && mob.y < mob.highestY) {
                mob.highestY = mob.y;
            }
            // 왼쪽 벽 막기
            if (mob.x < 0) {
                mob.x = 0;
                mob.body.setVelocityX(0);
            }
            // 오른쪽 벽 막기
            if (mob.x > config.width) {
                mob.x = config.width;
                mob.body.setVelocityX(0);
            }
            // 바닥 막기 
            if (mob.y > config.height - this.groundHeight) {
                mob.y = config.height - this.groundHeight;
                mob.setBounce(0.1);
                mob.body.setVelocityY(0);
            }

            // 드래그 중인 몹은 로직에서 제외
            if (mob.isDragging || mob.isThrown) return;
            
            if (mob.x < 100) {
                // --- [성벽 도달 상태] ---
                mob.body.setVelocityX(0); // 이동 정지
                if (!mob.isAttacking) {
                    mob.isAttacking = true;
                    
                }

                // 공격 쿨타임 체크 (1초마다)
                if (!mob.lastAttackTime || time > mob.lastAttackTime + 1000) {
                    mob.lastAttackTime = time;
                    this.takeDamage(4);

                    // 뒤로 물러나는 애니메이션
                    this.tweens.add({
                        targets: mob,
                        x: 60,          // 100에서 120으로 살짝 밀려남
                        duration: 150,
                        yoyo: true,      // 다시 100으로 돌아옴
                        ease: 'Back.easeOut',
                        onComplete: () => {
                            if (mob.active) mob.x = 80+Math.random()*20 ; // 위치 재고정
                        }
                    });
                }
            } else if (!mob.isThrown) {
                // --- [이동 상태] ---
                // 던져진 상태가 아니고 성벽 밖이라면 왼쪽으로 이동
                mob.isAttacking = false;
                mob.body.setVelocityX(-mob.speed);
            }
        });
    }

    updateScore(points) {
        this.score += points;
        this.scoreText.setText('Score: ' + this.score);
        
        // 점수가 오를 때 살짝 커졌다 작아지는 효과 (선택 사항)
        //scoreText.setScale(1.2);
        //setTimeout(() => scoreText.setScale(1), 100);
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
    }

    // 대미지 함수 수정
    takeDamage = (amount) => {
        if (this.isGameOver) return; // 게임 오버 상태에서는 대미지 무시
        this.castleHP -= amount;
        if (this.castleHP < 0) this.castleHP = 0;
        
        // 텍스트와 체력 바를 동시에 업데이트
        this.hpText.setText('Castle HP: ' + this.castleHP);
        this.drawHealthBar(this.healthBar, this.castleHP);

        if (this.castleHP <= 0) {
            this.gameOver(); 
        }
    }
    fadeOutAndDestroy = (scene, target) => {
        // 1. 물리 엔진 비활성화 (사라지는 동안 충돌하거나 움직이지 않게 함)
        target.body.enable = false;
        this.mobBloodEffect(target); // 피 효과 추가
        // 2. 트윈 애니메이션 시작
        scene.tweens.add({
            targets: target,
            alpha: 0,          // 투명도를 0으로
            duration: 500,     // 0.5초 동안
            ease: 'Power2',
            onComplete: () => {
                target.destroy(); // 애니메이션이 끝나면 완전히 제거
            }
        });
    };
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

    // GameScene 내부의 gameOver 함수
    gameOver() {
        this.isGameOver = true;
        this.physics.pause(); // 게임 로직만 멈춤

        // UIScene을 GameScene 위에 띄움 (데이터 전달 가능)
        this.events.emit('showGameOver', { score: this.score }); // UIScene에 신호 보냄
    }

    // 일시정지 버튼을 눌렀을 때
    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.physics.pause();
            if (this.spawnEvent) this.spawnEvent.paused = true;
            this.events.emit('showPause'); // UIScene에 신호 보냄
        } else {
            this.physics.resume();
            if (this.spawnEvent) this.spawnEvent.paused =false;
            this.events.emit('hidePause');
        }
    }

    // 게임오버 시
    handleGameOver() {
        this.physics.pause();
        this.events.emit('showGameOver', { score: this.score });
    }
}
