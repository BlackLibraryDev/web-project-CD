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
    gold =0;
    //성의 체력 관련 변수
    castleHP = 100;
    maxCastleHP = 100;
    wave = 1;
    isWaveInProgress = true;
    enit(){
        // 게임이 완전히 종료될 때 실행되는 함수입니다.
        // 여기서 리소스 정리나 이벤트 리스너 제거 등을 수행할 수 있습니다.
        console.log("GameScene이 종료되었습니다. 리소스를 정리합니다.");
    }
    create() {
        // 씬이 생성된 고유 ID 생성 (랜덤값)
        this.instanceId = Math.floor(Math.random() * 1000);

       this.isGameOver=false;
       this.isPaused=false;
       this.score=0;
       this.wave=1;
       this.isWaveInProgress=true;
       this.gold = 100000;
       this.castleHP=100;
       this.maxCastleHP=100;
        // 1. 초기 스탯 객체 생성 (레벨, 현재 수치, 강화 비용 등)
        this.upgrades = {

            '지휘소': [
                { tag:'wallType', name: '성채 건축술', unlock:true, level: 0, maxLevel: 5, value: 0, cost: 100},
                { tag:'maxCastleHp', name: '성채 방어력',unlock:true, level: 0, maxLevel: 5, value: 0, cost: 150 },
                { tag:'wallFix', name: '성채 수리', unlock:true, level: -1, maxLevel: 5, value: 0, cost: 150}
            ],
            '성당': [
                { tag:'summon', name: '개종', unlock:false, level: 0, maxLevel: 1, value: 0, cost: 150 },
                { tag:'faith', name: '신앙심 연구', unlock:true, level: 0, maxLevel: 5, value: 0, cost: 120 }
            ],
            '궁수양성소': [
                { tag:'range', name: '사거리', unlock:true, level: 0, maxLevel: 5, value: 100, cost: 120}
            ],
            '마술사의 샘': [
                { tag:'magic', name: '마법 공격력', unlock:true, level: 0, maxLevel: 5, value: 0, cost: 200 }
            ]
        };

        this.registry.set('playerUpgrades', this.upgrades);
        this.registry.set('score', this.score);
        this.registry.set('gold', this.gold);
        this.registry.set('castleHP', this.castleHP);
        this.registry.set('maxCastleHP', this.maxCastleHP);
        this.registry.set('wave', this.wave);
        
        
        // 여기서 UI를 다시 실행해주면 됩니다.
        if (!this.scene.isActive('UIScene')) {
            this.scene.launch('UIScene');
        }

        

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

                this.updateScore(10);

                //mob.destroy();
                this.fadeOutAndDestroy(this, mob);
            } else {
                mob.y = mob.startY? mob.startY : mob.y; // 낙차가 충분하지 않으면 원래 위치로 복귀
                mob.isThrown = false;
                mob.highestY = mob.y; // 높이 초기화
                mob.body.setVelocityX(-mob.speed);
            }
        });
        //웨이브 시작
        this.waveStart();

        // 입력 이벤트 설정
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (this.isGameOver || this.isPaused) return;
            if(!gameObject.canThrown) {
                // 던질 수 없는 상태라면 드래그 무시
                return;
            } 

            gameObject.staryY = gameObject.y; // 드래그 시작 시의 y 위치 저장

            gameObject.isDragging = true; // 드래그 중임을 표시하는 속성
            gameObject.x = dragX;
            gameObject.y = dragY;
            gameObject.body.setVelocity(0, 0); // 잡고 있을 때는 물리 정지
        });

        this.input.on('dragend', (pointer, gameObject) => {
            if (this.isGameOver || this.isPaused) return;
            if(!gameObject.canThrown) return; // 던질 수 없는 상태라면 드래그 무시
            // 던지는 속도 계산 (마우스 이동 속도 반영)
            const dragVelocity = pointer.velocity;
            gameObject.body.setVelocity(dragVelocity.x * this.acceleration, dragVelocity.y *this.acceleration);
            
            // '던져짐' 상태 체크를 위한 속성 부여
            gameObject.isThrown = true;
            gameObject.isDragging = false; // 드래그 종료
        });



        // 3. 이벤트 리스너 (GameScene에서 보낸 신호를 받음)
        this.events.off('wavecleared'); 

        this.events.off('startNextWave')
;        this.events.on('startNextWave', () => {
            this.wave++;
            this.timer = 10000;
            this.registry.set('wave', this.wave);
            this.waveStart(this.timer);
        });
        this.events.off('attempt-upgrade');
        this.events.on('attempt-upgrade', (category,tag) => {
            //console.log(`id :${this.instanceId}`)
            this.applyUpgrade(category, tag);
        });

        
    }
    waveStart(delayTimer = 10000) {
        console.log(`웨이브 ${this.wave} 시작!`);
        this.isPaused=false;
        this.isWaveInProgress = true;
        this.spawnTimers = {};
        // 2초마다 몹 생성
        this.spawnTimers['normal'] = this.time.addEvent({
            delay: 2000,
            callback: this.spawnMob,
            callbackScope: this,
            loop: true
        });
        this.spawnWaveTimer = this.time.addEvent({
            delay: delayTimer , // 일정 시간 후 웨이브 종료
            callback: ()=>{ 
                this.isWaveInProgress =false; 
                Object.values(this.spawnTimers).forEach(timer => {
                    if (timer) timer.remove(); // 또는 timer.destroy();
                });
                this.spawnTimers = {};
                console.log("웨이브 종료, 적들이 탈주합니다")
                        },
            callbackScope: this,
            loop:false
        });
    }
    spawnMob() {
        //몹 생성
        //const mob = this.mobs.create(  config.width , config.height -this.groundHeight*2, 'mob1');
        const mob = this.mobs.create( config.width , config.height - this.groundHeight*2, 'mobsprite1');
        mob.anims.play('mob1_walk');

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
        mob.canThrown = true; // 던질 수 있는 상태인지 여부 (추가)
        mob.isThrown = false;
        mob.isDragging  = false;
        mob.highestY = mob.y;
    }


    update(time, delta) { // time은 게임 시작 후 경과된 전체 시간(ms)
        //console.log(time);
        if (this.isGameOver || this.isPaused) return;
        
        if(this.mobs.getChildren().length <= 0 && !this.isWaveInProgress){
            this.isPaused=true;
            this.events.emit('waveCleared'); // UIScene에 웨이브 클리어 신호 보냄
            console.log("웨이브 클리어! 잠시 휴식...");
            //다음 웨이브 시작
            //this.wave++;
            //this.waveStart();
        }

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
                if(this.isWaveInProgress){
                    mob.x = config.width;
                    mob.body.setVelocityX(0);
                }
                
            }
            // 바닥 막기 
            if (mob.y > config.height - this.groundHeight) {
                mob.y = config.height - this.groundHeight;
                mob.setBounce(0.1);
                mob.body.setVelocityY(0);
            }

            // 드래그 중인 몹은 로직에서 제외
            if (mob.isDragging || mob.isThrown) return;
            
            if (mob.x < 100 && this.isWaveInProgress) {
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
                if(this.isWaveInProgress){
                    mob.body.setVelocityX(-mob.speed);
                }else{
                    //탈주 시작
                    mob.setFlipX(true); // 스프라이트 뒤집기 (오른쪽으로 이동하는 것처럼 보이게)
                    mob.body.setVelocityX(+mob.speed*2); // 탈주할 때는 속도가 더 빨라짐
                }
                
            }
            // 탈주
            if(this.isWaveInProgress==false){
                if (mob.x > config.width || mob.y > config.height) {
                    //탈주 성공
                    console.log("적이 탈주했습니다!");  
                    mob.destroy();
                }
            }
        });
    }
    // 강화 로직 함수
    // 업그레이드 실행 함수 (GameScene 내부)
    applyUpgrade(category, tag) {
        //console.log(`강화 시도: 카테고리=${category}, 태그=${tag}`);
        const item = this.upgrades[category].find(element => element.tag === tag);
        //console.log('업그레이드 아이템:', item);
        //const item = this.upgrades.find(cat => cat[0].name === category)[tag];
        //해금체크

        if(!item.unlock){
            if(this.gold < item.cost){
                //console.log("골드가 부족합니다.");
                return;
            }
        }
        // 1. 만렙 체크
        if (item.level >= item.maxLevel) {
            console.log("이미 최대 레벨입니다.");
            return;
        }

        // 2. 비용 체크 (예시: this.gold가 있다고 가정)
        if (this.gold < item.cost) {
            //console.log("골드가 부족합니다.");
            return;
        }

        // 3. 비용 차감 및 레벨업
        this.gold -= item.cost;
        this.registry.set('gold', this.gold); // 변경된 골드 레지스트리에 저장
        if(item.unlock){
            
        }else{
            item.unlock = true; // 해금 처리
            item.level =item.maxLevel;
            console.log(`${item.name}이(가) 해금되었습니다!`);
        }
        if(item.level>-1){
            
            item.level++;
            item.cost = Math.floor(item.cost * 1.5); // 다음 레벨 비용 상승
        }else{
            //-1은 무한히 가능한 기능임(수리 등)
        }
        
        

        // 4. 태그에 따른 실제 효과 적용 (이 부분이 switch 문 역할)
        
            
        switch (item.tag) {
            case 'maxCastleHp':
                this.maxCastleHP += 20; // 최대 체력 증가       
                this.registry.set('maxCastleHP', this.maxCastleHP); // 변경된 최대 체력 레지스트리에 저장
                break;
            case 'wallFix':
                //Level 0
                this.castleHP += 20; // 현재 체력 증가
                if (this.castleHP > this.maxCastleHP) this.castleHP = this.maxCastleHP; // 최대 체력 초과 방지
                this.registry.set('castleHP', this.castleHP); // 변경된 현재 체력 레지스트리에 저장
                break;
            // 다른 태그에 대한 효과도 여기에 추가 가능
        }   

        // 5. 변경된 데이터 전체를 다시 registry에 저장 (UIScene 갱신용)
        this.registry.set('playerUpgrades', this.upgrades);
    }
    ///점수추가
    updateScore(points) {
        this.score += points; // 점수 추가
        this.registry.set('score', this.score); // 공용 보관함에 업데이트된 점수 저장
    }

    // 대미지 함수 수정
    takeDamage = (amount) => {
        if (this.isGameOver) return; // 게임 오버 상태에서는 대미지 무시
        this.castleHP -= amount;
        if (this.castleHP < 0) this.castleHP = 0;
        
        this.registry.set('castleHP', this.castleHP); // 공용 보관함에 업데이트된 체력 저장
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
}
