const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade', // 이 부분이 반드시 있어야 합니다!
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let mobs;

function preload() {
    // 임시 이미지를 위해 색상 박스 사용 (실제 게임에선 이미지 로드)
    this.load.image('mob', 'https://labs.phaser.io/assets/sprites/slime.png');
}

// 게임변수
let mainScene
let physics;
let isPaused = false;
let pauseBtn;
let isGameOver = false; 
let darkOverLay;
// score 관련 변수들
let score = 0;
let scoreText;
//성의 체력 관련 변수
let healthBar;
let castleHP = 100;
let hpText;

function create() {
    mainScene = this; // Scene의 컨텍스트를 전역 변수로 저장
    physics = this.physics; // physics 객체를 전역 변수로 저장

    darkOverLay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
    darkOverLay.setDepth(9);
    darkOverLay.setVisible(false); // 처음에는 보이지 않게 설정

    // 일시정지 버튼 생성 (텍스트 형태)
    pauseBtn = this.add.text(20, 20, '⏸', {
        fontSize: '24px',
        fill: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 15, y: 15 }
    })
    .setInteractive({ useHandCursor: true }) // 클릭 가능하게 설정
    .setScrollFactor(0); // 카메라가 움직여도 고정되게 함
    pauseBtn.on('pointerdown', () => {
        togglePause();
    });
    pauseBtn.setDepth(10); 

    hpText = this.add.text(90, 20, 'Castle HP: 100', {
        fontSize: '32px',
        fill: '#ff0000',
        fontStyle: 'bold'
    });
    // 체력 바를 그릴 그래픽 객체 생성
    healthBar = this.add.graphics();
    drawHealthBar(healthBar, 90, 50, castleHP); // 위치 (20, 60)
    // 버튼 클릭 이벤트
    


    scoreText = this.add.text(780, 20, 'Score: 0', {
        fontSize: '32px',
        fill: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(1, 0); // 기준점을 우측 상단으로 설정하여 글자가 왼쪽으로 늘어나게 함
    scoreText.setDepth(8);

    


    // 1. 바닥(Ground)을 정적 그룹으로 생성
    const platforms = this.physics.add.staticGroup(); 
    const ground = this.add.rectangle(400, 580, 800, 40, 0x666666);
    platforms.add(ground); // 이제 .add()가 작동합니다.

    mobs = this.physics.add.group();

    // 3. 충돌 시 낙차 계산
    this.physics.add.collider(mobs, platforms, (mob, ground) => {
        const dropDistance = mob.y - mob.highestY; // 떨어진 거리 계산
        
        if (dropDistance > 300) { // 300 픽셀 이상 높이에서 떨어졌다면
            updateScore(1); // 점수 업데이트
            mob.destroy();
        } else {
            mob.isThrown = false;
            mob.highestY = mob.y; // 높이 초기화
            mob.body.setVelocityX(-100);
        }
    });

    // 2초마다 몹 생성
    spawnEvent = this.time.addEvent({
        delay: 2000,
        callback: spawnMob,
        callbackScope: this,
        loop: true
    });

    // 입력 이벤트 설정
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        if (isGameOver || isPaused) return;
        gameObject.x = dragX;
        gameObject.y = dragY;
        gameObject.body.setVelocity(0, 0); // 잡고 있을 때는 물리 정지
    });

    this.input.on('dragend', (pointer, gameObject) => {
        if (isGameOver || isPaused) return;
        // 던지는 속도 계산 (마우스 이동 속도 반영)
        const dragVelocity = pointer.velocity;
        gameObject.body.setVelocity(dragVelocity.x, dragVelocity.y);
        
        // '던져짐' 상태 체크를 위한 속성 부여
        gameObject.isThrown = true;
    });
}

function spawnMob() {
    const mob = mobs.create(800, 500, 'mob');
    mob.setInteractive({ draggable: true });
    
    // 1. 바닥과의 마찰력을 0으로 설정
    mob.setFriction(0);
    // 2. 아주 살짝 튕기게 설정 (바닥에 껌처럼 붙는 것 방지)
    mob.setBounce(0.1);
    // 3. 화면 끝에 부딪혀도 멈추지 않게 설정
    mob.setCollideWorldBounds(true);

    mob.body.setVelocityX(-70); // 왼쪽으로 이동
    mob.isThrown = false;
    mob.highestY = mob.y;
}


function update(time, delta) { // time은 게임 시작 후 경과된 전체 시간(ms)
    if (isGameOver || isPaused) return;

    mobs.getChildren().forEach(mob => {

        // 던져진 동안 몹이 올라간 가장 높은 지점(y값은 작을수록 높음) 기록
        if (mob.isThrown && mob.y < mob.highestY) {
            mob.highestY = mob.y;
        }
        // 드래그 중인 몹은 로직에서 제외
        if (mob.isDragging) return;

        if (mob.x < 100) {
            // --- [성벽 도달 상태] ---
            mob.body.setVelocityX(0); // 이동 정지
            if (!mob.isAttacking) {
                mob.isAttacking = true;
                
            }

            // 공격 쿨타임 체크 (1초마다)
            if (!mob.lastAttackTime || time > mob.lastAttackTime + 1000) {
                mob.lastAttackTime = time;
                takeDamage(4);

                // 뒤로 물러나는 애니메이션
                this.tweens.add({
                    targets: mob,
                    x: 80,          // 100에서 120으로 살짝 밀려남
                    duration: 100,
                    yoyo: true,      // 다시 100으로 돌아옴
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        if (mob.active) mob.x = 100; // 위치 재고정
                    }
                });
            }
        } else if (!mob.isThrown) {
            // --- [이동 상태] ---
            // 던져진 상태가 아니고 성벽 밖이라면 왼쪽으로 이동
            mob.isAttacking = false;
            mob.body.setVelocityX(-100);
        }
    });
}

function updateScore(points) {
    score += points;
    scoreText.setText('Score: ' + score);
    
    // 점수가 오를 때 살짝 커졌다 작아지는 효과 (선택 사항)
    //scoreText.setScale(1.2);
    //setTimeout(() => scoreText.setScale(1), 100);
}
function drawHealthBar(graphics, x, y, hp) {
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
const takeDamage = (amount) => {
    if (isGameOver) return; // 게임 오버 상태에서는 대미지 무시
    castleHP -= amount;
    if (castleHP < 0) castleHP = 0;
    
    // 텍스트와 체력 바를 동시에 업데이트
    hpText.setText('Castle HP: ' + castleHP);
    drawHealthBar(healthBar, 20, 60, castleHP);

    if (castleHP <= 0) {
        gameOver(); 
    }
}

const togglePause = () => {
    if (isGameOver) return; // 게임 오버 상태에선 작동 안 함

    isPaused = !isPaused; // 상태 반전
    darkOverLay.setVisible(isPaused); // 어두운 오버레이 표시
    if (isPaused) {
        // 1. 물리 엔진 정지
        physics.pause();
        // 2. 몹 생성 타이머 정지
        if (spawnEvent) spawnEvent.paused = true;
        // 3. 모든 애니메이션(Tween) 정지
        mainScene.tweens.pauseAll();
        
        pauseBtn.setText('▶');
        pauseBtn.setStyle({ fill: '#ff0000' }); // 강조 색상
    } else {
        // 1. 물리 엔진 재개
        physics.resume();
        // 2. 몹 생성 타이머 재개
        if (spawnEvent) spawnEvent.paused = false;
        // 3. 애니메이션 재개
        mainScene.tweens.resumeAll();

        pauseBtn.setText('⏸');
        pauseBtn.setStyle({ fill: '#ffffff' });
    }
};

const gameOver = () => {
    isGameOver = true;
    physics.pause();
    darkOverLay.setVisible(true); // 어두운 오버레이 표시
    // 2. 몹 생성 타이머 정지 (spawnEvent는 create에서 만든 타이머 객체)
    if (spawnEvent) spawnEvent.remove();

    // 3. 화면 중앙에 게임 오버 텍스트 표시
    let screenCenter = { 
        x: mainScene.cameras.main.width / 2, 
        y: mainScene.cameras.main.height / 2 
    };
    mainScene.add.text(screenCenter.x, screenCenter.y - 50, 'GAME OVER', {
        fontSize: '64px',
        fill: '#ff0000',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // 4. 다시 시작 버튼 생성
    const restartBtn = mainScene.add.text(screenCenter.x, screenCenter.y + 50, 'Click to Restart', {
        fontSize: '32px',
        fill: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive();

    // 5. 버튼 클릭 시 장면 재시작
    restartBtn.on('pointerdown', () => {
        isGameOver = false;
        score = 0; // 점수 초기화
        castleHP = 100; // 체력 초기화
        mainScene.scene.restart();
    });
}