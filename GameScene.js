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
    castleX = 100;
    stat;
    wave ;
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
       this.isPaused=true;
       this.isWaveInProgress=true;       
       this.wave={value:0, timer:20000 }
       this.score=0;
       this.gold = 0;
       this.stat ={hp:100, maxHp:100, armor:0 , 
            manPower:0, convertionTime:8000,  
            archer:0, 
            archerCost:4, 
            archerCool:1800,   
            witch:0, 
            witchCost:10
        };
       
       this.spawnTimers=[];
        // 1. 초기 스탯 객체 생성 (레벨, 현재 수치, 강화 비용 등)
        this.upgrades = {
            'cathedral': [
                { tag:'conversion', name: '개종(👥++)', unlock:false, level: 0, maxLevel: 1, value: 0, cost: 30 , info:'적을 개종(세뇌)시켜 아군 인력으로 충원합니다'},
                { tag:'faith', name: '신앙심 연구', unlock:true, level: 0, maxLevel: 3, value: 1000, cost: 10 , info:'신앙심을 연구하여 더 빨리 적을 개종시킵니다.'}
            ],
            
            
            'barracks': [
                { tag:'archer', name: '궁병 고용(👥-1)', unlock:true, level: -1, maxLevel: 5, value: 0, cost: 10, manPower:1, info:'👥인력으로 궁병을 고용합니다. 일정시간마다 활을 쏘아 적을 쓰러트립니다.'},
                { tag:'archerTraining', name: '속사 훈련', unlock:true, level: 1, maxLevel: 5, value: 100, cost: 20, info:'궁병이 더 빨리 화살을 쏩니다'}
                //{ tag:'archerRange', name: '사거리', unlock:true, level: 0, maxLevel: 5, value: 100, cost: 120, info:''}
            ],
            'magichall': [
                //{ tag:'witch', name: '마법사 고용', unlock:true, level: -1, maxLevel: 5, value: 0, cost: 12, manPower:1, info:'마법사를 고용합니다'},
                //{ tag:'magic', name: '마법 공격력', unlock:true, level: 0, maxLevel: 5, value: 0, cost: 200 , info:''}
            ],
            'stronghold': [
                { tag:'wallType', name: '축성술', unlock:true, level: 0, maxLevel: 5, value: 0, cost: 10, info:'성벽의 재료를 변경하여 더 높은 방어력을 얻습니다.'},
                { tag:'maxCastleHp', name: '성채보강',unlock:true, level: 0, maxLevel: 5, value: 0, cost: 15, info:'성벽의 최대 내구도를 증가시킵니다'},
                { tag:'wallFix', name: '성채수리(+1)', unlock:true, level: -1, maxLevel: 9, value: 1, cost: 1, info:'성벽을 수리합니다. 수리비는 축성술의 영향을 받습니다.'},
                { tag:'wallFix_10', name: '성채수리(+10)', unlock:true, level: -1, maxLevel: 9, value: 10, cost: 10, info:'성벽을 많이 수리합니다.'}
            ]
        };

        this.registry.set('playerUpgrades', this.upgrades);
        this.registry.set('score', this.score);
        this.registry.set('gold', this.gold);
        this.registry.set('stat', this.stat);
        this.registry.set('wave', this.wave);
        
        this.loadGame();
        
        // 여기서 UI를 다시 실행해주면 됩니다.
        
        if (!this.scene.isActive('UIScene')) {
            this.scene.launch('UIScene');
        }
        console.log(this.scene.isActive('UIScene'));
        

        //배경그림
        this.setBgImage('background1');

        // 1. 바닥(Ground)을 정적 그룹으로 생성
        const platforms = this.physics.add.staticGroup(); 
        this.ground = this.add.rectangle(config.width / 2, config.height - this.groundHeight / 2, config.width, this.groundHeight, 0x666666).setAlpha(0);;
        platforms.add(this.ground); // 이제 .add()가 작동합니다.

        this.mobs = this.physics.add.group();
        
        // 3. 충돌 시 낙차 계산
        this.physics.add.collider(this.mobs, platforms, (mob, ground) => {
            const dropDistance = mob.y - mob.highestY; // 떨어진 거리 계산
            
            if (dropDistance > 400 && mob.y > mob.staryY ) { //400 픽셀 이상 높이에서 떨어졌다면
                //mob.destroy();
                this.fadeOutAndDestroy(this, mob);
            } else {
                mob.y = mob.startY? mob.startY : mob.y; // 낙차가 충분하지 않으면 원래 위치로 복귀
                mob.isThrown = false;
                mob.highestY = mob.y; // 높이 초기화
                mob.body.setVelocityX(-mob.speed);
            }
            if( this.cathedralTimer==null && mob.x < this.castleX + 50){   
                //성당 개종 발동 조건: 개종이 해금되어 있고, 개종이 진행 중이지 않고, 몹이 성채 근처에 있을 때
                this.startCathedralConvertion(mob);
            }
        });
        //성채 이미지
        this.drawCastleImage();

        //궁수
        this.archer = this.add.sprite(this.castleX, config.height-200, 'archer').setDisplaySize(128,128);
        this.archer.setDepth(2);
        this.archer.setVisible(false);
        this.archerText = this.add.text(this.castleX, config.height-240, `궁수 x${this.stat.archer}`, 
                {   fontSize: '24px', 
                    fill: '#2ecc71',
                    padding: { x: 3, y: 3 },
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5); 
        this.archerText.setVisible(false);
        this.archerText.setDepth(4);

        //성당 고문실

        this.cathedral = this.add.sprite(this.castleX-50, config.height-140, 'cathedral').setDisplaySize(128,128); 
        
        this.cathedral.setDepth(5);
        this.cathedral.setVisible(false);
        
        
        //웨이브 시작
        //this.waveStart();

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

        this.events.off('startNextWave');
        this.events.on('startNextWave', () => {
            
            this.wave.value++;
            this.wave.timer += 2000; //2초 증가
            this.registry.set('wave', this.wave);
            this.waveStart(this.wave.timer);
        });
        this.events.off('attempt-upgrade');
        this.events.on('attempt-upgrade', (category,tag) => {
            //console.log(`id :${this.instanceId}`)
            this.applyUpgrade(category, tag);
        });

        
    }
    drawCastleImage(){
        this.castle = this.add.image(this.castleX, config.height-150, 'castle1').setDisplaySize(144,144);
        this.castle.setDepth(3);
    }
    setBgImage(name, isDark =false){
        
        this.bg = this.add.image(config.width/2, config.height/2, `${name}${isDark?'_dark':''}`).setDisplaySize(config.width, config.height);
        this.bg.setDepth(0);
    }
    setCathedral(){
        if(this.getUpgradeItem('cathedral','conversion').unlock){
            this.cathedral.setVisible(true);
        }
        this.cathedralTimer = null;

        //this.cathedral.anims.play('cathedral_fire', true);
    }
    startCathedralConvertion(target){
        if(!this.getUpgradeItem('cathedral','conversion').unlock) return; // 개종이 해금되지 않았다면 실행하지 않음
        if(this.cathedralTimer) return; // 이미 진행 중이라면 중복 실행 방지
        this.updateScore(target.score);
        target.destroy();

        this.cathedral.anims.play('cathedral_fire', true);
        this.cathedralTimer = this.time.addEvent({
            delay: this.stat.convertionTime, // 2초후에 개종
            callback: () => {
                // 여기에 개종 효과 로직을 추가합니다.
                this.converstionComplete();

            },
            callbackScope: this,
            loop: false // 한 번만 실행하도록 설정
        });
        return 
    }
    converstionComplete(){
        if(this.cathedralTimer!=null){
            this.stat.manPower++;
            this.registry.set('stat', this.stat); // 변경된 스탯을 레지스트리에 저장하여 UIScene 갱신
            this.cathedral.anims.play('cathedral_idle'); // 개종 애니메이션 재생 (한 번만)
            this.cathedralTimer?.remove();
            console.log(`개종 완료! ${this.stat.manPower}명`);
        }
        this.cathedralTimer = null;
        
    }

    waveStart(delayTimer ) {
        this.setBgImage('background1');
        console.log(`웨이브 ${this.wave.value} 시작!`);
        this.isPaused=false;
        this.isWaveInProgress = true;
        this.spawnTimers.forEach((element) => {
            element.remove();
        });
        this.spawnTimers = [];
        this.data ={
            mobNumber:0, earnScore:0, earnGold:0 , 
            archer:this.stat.archer, 
            archerCost: this.stat.archerCost, 
            witch:this.stat.witch, 
            witchCost:this.stat.witchCost
        };

        if(this.wave.value>0){
            this.addSpawnTimer(1,1800);
        }
        if(this.wave.value>=2){
            this.addSpawnTimer(2,2000);
        }
        if(this.wave.value>=4){
            this.addSpawnTimer(1,1600);
        }
        if(this.wave.value>=5){
            this.addSpawnTimer(1,1800);
        }
        //성당 고문실
        this.setCathedral();

        //궁수 활 매커니즘
        this.archeryTimer=null;
        if(this.stat.archer>0){
            this.archerText.setVisible(true);
            this.archerText.setText(`궁수 x${this.stat.archer}`);
             
            this.archer.setVisible(true);
            console.log(`궁수 발사 간격: ${this.stat.archerCool}ms`);
            this.archeryTimer = this.time.addEvent({
                delay:  this.stat.archerCool ,
                callback: ()=>{

                    let archerNumber = this.stat.archer;
                    const mobArray = this.mobs.getMatching('isDragging',false);
                    //console.log(`드래그되지 않은 몹 수 :${mobArray.length}`);
                    if(mobArray.length<=0){
                        return;
                    }
                    this.time.delayedCall(100, () => {
                         this.archer.anims.play('archer_fire', true);
                    });
                    const arrowNum = archerNumber> 10 ? 10 : archerNumber;
                    /*
                    let arrowNum = archerNumber> mobArray.length? mobArray.length : archerNumber;
                    arrowNum = arrowNum>10? 10 : arrowNum; // 최대 5발로 제한
                    */
                    for(let i =0; i< arrowNum ; i++){
                        const artarget = Phaser.Utils.Array.GetRandom(mobArray);
                        this.fireArrow(this.archer.x, this.archer.y, artarget.x ,  artarget.y);
                    }
                    //화살 도착 딜레이
                    this.time.delayedCall(1150, () => { 
                        for(let i =0; i< archerNumber ; i++){
                            const target = Phaser.Utils.Array.GetRandom(mobArray);
                            const range = Phaser.Math.Clamp(  (config.width - target.x)/(config.width-300) + 0.2 , 0, 2);
                            const rng = Phaser.Math.FloatBetween(0, range) ;
                            if(target){ 
                                
                                if(target.hp < rng ){
                                    //화살 피격
                                    this.fadeOutAndDestroy(this, target);
                                }else{
                                    target.hp -= rng;
                                    //console.log(`${Math.ceil( target.hp)}, ${Math.ceil(range*100)/100 }`);
                                }
                                this.mobDamageEffect(target, rng);
                                
                            }
                            
                        }
                    });
                },
                callbackScope: this,
                loop:true
            });
        }
        

        this.spawnWaveTimer = this.time.addEvent({
            delay: delayTimer , // 일정 시간 후 웨이브 종료
            callback: ()=>{ 
                this.isWaveInProgress =false; 
                this.spawnTimers.forEach((element) => {
                    element.remove();
                });
                this.spawnTimers = [];
                console.log("웨이브 종료, 적들이 탈주합니다")
                        },
            callbackScope: this,
            loop:false
            
        });
    }
    spawnMob(mobNumber=1) {
        //몹 생성
        //const mob = this.mobs.create(  config.width , config.height -this.groundHeight*2, 'mob1');
        
        const mob = this.mobs.create( config.width , config.height - this.groundHeight*2, `mobsprite${mobNumber}`);
        mob.anims.play(`mob${mobNumber}_walk`);

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
        mob.isThrown = false;
        mob.isDragging  = false;
        mob.highestY = mob.y;
        //개인변수
        mob.speed = 100 +Math.random() * 30; // 이동 속도에 약간의 랜덤 요소 추가
        mob.canThrown = true; // 던질 수 있는 상태인지 여부 (추가)
        mob.damage = 1;
        mob.hp = 1;
        
        
        switch (mobNumber){
            case 1:
                //기본 몹
                mob.speed = 100 +Math.random() * 30; // 이동 속도에 약간의 랜덤 요소 추가
                mob.canThrown =true;
                mob.damage = 1;
                mob.score = 1;
            break;
            case 2:
                //wallbreaker
                mob.speed = 80 +Math.random() * 30; // 이동 속도에 약간의 랜덤 요소 추가
                mob.canThrown =true;
                mob.damage = 5;
                mob.score = 2;
            break;
        }
    }
    addSpawnTimer(mobNumber=1, delayTimer =2000){
        const spawnTimer = this.time.addEvent({
        delay: delayTimer,
            callback:() => {
                this.spawnMob(mobNumber);
            },  
            callbackScope: this,
            loop: true
        });
        this.spawnTimers.push( spawnTimer);
    }

    update(time, delta) { // time은 게임 시작 후 경과된 전체 시간(ms)
        //console.log(time);
        if (this.isGameOver || this.isPaused) return;
        
        if(this.mobs.getChildren().length <= 0 && !this.isWaveInProgress){
            this.isPaused=true;
            this.events.emit('waveCleared', this.data); // UIScene에 웨이브 클리어 신호 보냄
            this.setBgImage('background1',true);

            //궁수,마법사 정리
            this.archeryTimer?.remove();
            this.archeryTimer = null; // 지운 후에는 항상 null로 초기화해주는 것이 좋습니       

            //성당 고문실 정리
            this.converstionComplete();

            //웨이브 클리어 후 처리 (예: 다음 웨이브 준비, 보상 지급 등)
            this.gold -= (this.stat.archerCost*this.stat.archer) + (this.stat.witchCost*this.stat.witch); // 유지비 차감
            this.registry.set('gold', this.gold); // 골드 변경 사항 레지스트리에 저장하여 UIScene 갱신


            console.log("웨이브 클리어! 잠시 휴식...");
            return;
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
                }else{
                     if (mob.x > config.width+10) {
                        mob.x = config.width+10
                        mob.body.setVelocityX(0);
                     }
                    
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
            
            if (mob.x < 200 && this.isWaveInProgress) {
                // --- [성벽 도착 상태] ---
                mob.body.setVelocityX(0); // 이동 정지
                if (!mob.isAttacking) {
                    mob.isAttacking = true;
                    
                }

                // 공격 쿨타임 체크 (1초마다)
                if (!mob.lastAttackTime || time > mob.lastAttackTime + 1000) {
                    mob.lastAttackTime = time;
                    this.takeDamage( mob.damage );

                    // 뒤로 물러나는 애니메이션
                    this.tweens.add({
                        targets: mob,
                        x: 160,          // 100에서 120으로 살짝 밀려남
                        duration: 150,
                        yoyo: true,      // 다시 100으로 돌아옴
                        ease: 'Back.easeOut',
                        onComplete: () => {
                            if (mob.active) mob.x = 200 - Math.random()*20 ; // 위치 재고정
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
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////
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
        if(item.manPower !=null){
            if(this.stat.manPower <=0){
                console.log("인구수가 부족합니다.");
                return;
            }
            this.stat.manPower--; // 인구수 1 감소
                //this.registry.set('stat', this.stat); // 변경된 스탯을 레지스트리에 저장하여 UIScene 갱신
        }
        // 3. 비용 체크 (예시: this.gold가 있다고 가정)
        if (this.gold < item.cost) {
            //console.log("골드가 부족합니다.");
            return;
        }

        // 4. 비용 차감 및 레벨업
        this.gold -= item.cost;
        if(item.unlock){
            
        }else{
            item.unlock = true; // 해금 처리
            item.level =item.maxLevel;
            console.log(`${item.name} -> 해금되었습니다!`);
        }
        if(item.level>-1){
            
            item.level++;
            item.cost = Math.floor(item.cost * 1.5); // 다음 레벨 비용 상승
        }else{
            //-1은 무한히 가능한 기능임(수리 등)
        }
        
        

        // 4. 태그에 따른 실제 효과 적용 (이 부분이 switch 문 역할)
        
        //console.log(item.tag.split('_')[0]);
        switch (item.tag.split('_')[0]) {
            case 'wallType':
                this.stat.armor = item.level;
                this.getUpgradeItem('stronghold','wallFix').cost = this.stat.armor;
                this.getUpgradeItem('stronghold','wallFix_10').cost = this.stat.armor*10;
                
                //console.log(this.castleArmor);
                break;
            case 'maxCastleHp':
                this.stat.hp += 20;
                this.stat.maxHp += 20;
                break;
            case 'wallFix':
                //console.log(item.value);
                if(this.stat.hp>= this.stat.maxHp){
                    //환불
                    this.gold += item.cost;
                    break
                }else{
                    this.stat.hp += item.value ; // 현재 체력 증가
                    if (this.stat.hp > this.stat.maxHp) this.stat.hp = this.stat.maxHp; // 최대 체력 초과 방지
                }
                break;

            case 'faith':
                this.stat.convertionTime -= item.value;
                
            break;


            case 'archer':
                this.stat.archer++;
            break;

            case 'archerTraining':
                this.stat.archerCool -= item.value;
                
            break;
            // 다른 태그에 대한 효과도 여기에 추가 가능
        }   

        // 5. 변경된 데이터 전체를 다시 registry에 저장 (UIScene 갱신용)
        
        this.registry.set('gold', this.gold); // 변경된 골드 레지스트리에 저장
        this.registry.set('stat',this.stat);
        this.registry.set('playerUpgrades', this.upgrades);
    }
    getUpgradeItem(category, tag) {
        return this.upgrades[category].find(item => item.tag === tag);
    }
    ///점수추가
    updateScore(points) {
        this.score += points; // 점수 추가
        this.registry.set('score', this.score); // 공용 보관함에 업데이트된 점수 저장
        this.gold += points; //골드추가
        this.registry.set('gold', this.gold);
        this.data.earnGold += points;
        this.data.earnScore += points;
        this.data.mobNumber++;
    }

    // 대미지 함수 수정
    takeDamage = (amount) => {
        if (this.isGameOver) return; // 게임 오버 상태에서는 대미지 무시

        const damage = Phaser.Math.Clamp( amount - this.stat.armor, 1,100);//최소대미지 고정
        
        this.stat.hp -= damage;
        if (this.stat.hp < 0) this.stat.hp = 0;
        
        this.registry.set('stat', this.stat); // 공용 보관함에 업데이트된 체력 저장
        if (this.stat.hp <= 0) {
            this.gameOver(); 
        }

        if (this.castle) {
            // 1. 깜빡임 (Tint)
            this.castle.setTint(0xff0000);
            this.time.delayedCall(100, () => this.castle.clearTint());

            // 2. 흔들림 (Tween) - 이 부분이 수정되었습니다.
            // remove() 호출 전, 변수가 존재하고 'active' 상태인지 확인합니다.
            if (this.castleShakeTween && this.castleShakeTween.isActive()) {
                this.castleShakeTween.remove();
            }

            const originalX = this.castleX;
            
            // 새로운 트윈을 할당합니다.
            this.castleShakeTween = this.tweens.add({
                targets: this.castle,
                x: originalX + 5,
                duration: 50,
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                    this.castle.x = originalX;
                    // 트윈이 끝난 후 null 처리를 해주면 더 안전합니다.
                    this.castleShakeTween = null;
                }
            });
        }
    }
    fadeOutAndDestroy = (scene, target) => {
        // 1. 물리 엔진 비활성화 (사라지는 동안 충돌하거나 움직이지 않게 함)
        if(target.body){
            target.body.enable = false;
        }
        this.updateScore(target.score);
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
    mobDamageEffect(mob, damage){
        const damageText = this.add.text(mob.x +Phaser.Math.Between(-20, 20), mob.y +Phaser.Math.Between(-20, 20), `-${Math.ceil(damage*100)}%`, { font: '32px Arial', fill: '#ff0000' }).setOrigin(0.5);
        damageText.setDepth(10);
        this.tweens.add({
            targets: damageText,
            y: damageText.y - 30, // 위로 이동
            alpha: 0,             // 투명하게
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => damageText.destroy()
        });
        this.tweens.add({
            targets: mob,
            x : mob.x +10,
            duration: 100,
            yoyo: true,
            repeat: 0,
            onComplete: () => mob.clearTint()
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
    //

    /**
     * 화살을 포물선으로 쏘는 함수
     * @param {number} startX - 출발 X 좌표 (궁수 위치)
     * @param {number} startY - 출발 Y 좌표
     * @param {number} targetX - 도착 X 좌표 (적 위치)
     * @param {number} targetY - 도착 Y 좌표
     */
    fireArrow(startX, startY, targetX, targetY) {

        //랜덤 지연
        const randomDelay = Phaser.Math.Between(0, 300); // 0~300ms 사이의 랜덤 지연
        this.time.delayedCall(randomDelay, () => {
            if(this.isGameOver || this.isPaused) return; // 게임이 끝났거나 일시정지 상태라면 화살 발사 중지    
            this._fireArrowInternal(startX, startY, targetX, targetY);
        });
    }
    _fireArrowInternal(startX, startY, targetX, targetY){
        // 1. 화살 스프라이트 생성 및 물리 적용
        const arrow = this.physics.add.sprite(startX, startY, 'arrow');
        
        // 2. 화살이 중력의 영향을 받게 합니다. (포물선의 핵심)
        // 이 수치가 높을수록 화살이 묵직하게 떨어집니다. 게임에 맞게 조절하세요.
        arrow.body.setGravityY(800); 
        targetX = targetX + Phaser.Math.Between(-50, 50); // 약간의 랜덤 오차 추가
        // 3. 목적지까지 날아갈 시간(초)을 정합니다. (예: 0.8초 동안 날아감)
        // 거리에 따라 시간을 비례하게 만들면 더 자연스럽습니다.
        const distance = Phaser.Math.Distance.Between(startX, startY, targetX , targetY + Phaser.Math.Between(-20, 20));
        const flightTime = distance / 600; // 400은 원하는 가로 속도 기준치

        // 4. 포물선 비행을 위한 가속도(Velocity) 계산
        // 가로 속도 = 거리 / 시간
        const velocityX = (targetX - startX) / flightTime*1.4;
        
        // 세로 속도 = 중력에 의해 떨어질 무게를 감안하여 위로 솟구치게 계산
        const velocityY = ((targetY - startY) - (0.5 * arrow.body.gravity.y * flightTime * flightTime)) / flightTime;

        // 5. 화살에 계산된 속도 부여
        arrow.body.setVelocity(velocityX, velocityY);

        // 6. [매우 중요] 화살이 날아가는 방향(각도)을 실시간으로 보정하기
        // 이 코드가 없으면 화살이 꼿꼿이 선 채로 날아갑니다.
        arrow.updateRotation = () => {
            if (arrow.body) {
                // 현재 이동 중인 X, Y 속도를 바탕으로 각도를 계산합니다.
                const angle = Math.atan2(arrow.body.velocity.y, arrow.body.velocity.x);
                arrow.rotation = angle;
            }
        };

        // Scene의 update 문에서 실행되도록 이벤트 리스너 등록
        this.events.on('update', arrow.updateRotation);

        // 7. 목적지 근처에 도달하거나 바닥에 닿으면 화살 제거 (메모리 관리)
        this.physics.add.collider(arrow, this.ground, () => {
            // 1. 실시간 회전 계산 이벤트를 즉시 끕니다.
            this.events.off('update', arrow.updateRotation);
            
            // 2. 💡 [핵심] 현재 꽂힌 각도를 변수에 박제(기억)해 둡니다.
            const fixedRotation = arrow.rotation;
            
            // 3. 물리 엔진을 완전히 꺼버립니다. (각도가 0으로 풀리려고 할 것입니다)
            arrow.body.enable = false; 
            
            // 4. 💡 [핵심] 풀려버린 각도를 방금 기억해 둔 각도로 강제로 다시 덮어씌웁니다!
            arrow.rotation = fixedRotation;

            // 5. 300ms 동안 각도가 풀리지 않도록 한 번 더 안전장치를 겁니다.
            arrow.updateRotation = () => {
                if (arrow && arrow.active) {
                    arrow.rotation = fixedRotation; // 삭제되기 전까지 이 각도 무조건 유지
                }
            };
            this.events.on('update', arrow.updateRotation);

            // 6. 300ms 후 파괴 및 이벤트 해제
            this.time.delayedCall(10000, () => {
                if (arrow && arrow.active) {
                    this.events.off('update', arrow.updateRotation);
                    arrow.destroy();
                }
            });
        }, null, this);
        
    }
    // GameScene 내부의 gameOver 함수
    gameOver() {
        this.isGameOver = true;
        this.physics.pause(); // 게임 로직만 멈춤

        // UIScene을 GameScene 위에 띄움 (데이터 전달 가능)
        this.events.emit('showGameOver', { score: this.score }); // UIScene에 신호 보냄
    }


    saveGame() {
        // 1. 저장할 핵심 데이터들을 하나의 객체로 모읍니다.
        const gameData = {
            stat: this.registry.get('stat') ,
            wave: this.registry.get('wave'), // 웨이브 정보도 저장
            gold: this.registry.get('gold') || 0,
            score: this.registry.get('score') || 0,
            upgrades: this.registry.get('playerUpgrades')
                
        };

        // 2. 객체를 문자열(JSON)로 변환하여 브라우저에 저장합니다.
        // 'projectCD_data'는 우리 게임만의 고유한 저장소 이름입니다.
        localStorage.setItem('projectCD_data', JSON.stringify(gameData));
        
        console.log('💾 게임이 안전하게 저장되었습니다!', gameData);
    }

    /**
     * 📂 저장된 게임 데이터를 불러오는 함수
     */
    loadGame() {
        // 1. 브라우저에서 저장된 데이터가 있는지 가져옵니다.
        const savedData = localStorage.getItem('projectCD_data');

        if (savedData) {
            // 2. 저장된 데이터가 있다면 문자열을 다시 원래 객체로 파싱합니다.
            const data = JSON.parse(savedData);

            // 3. 게임 내부 변수들에 데이터를 덮어씌웁니다.
            this.stat = data.stat || this.stat; // 저장된 스탯이 있으면 덮어쓰기, 없으면 기존값 유지
            this.wave = data.wave || this.wave;
            this.gold = data.gold || this.gold;
            this.score = data.score || this.score;
            this.upgrades = data.upgrades || this.upgrades;
            this.registry.set('stat', this.stat);
            this.registry.set('wave', this.wave);
            this.registry.set('gold', this.gold);
            this.registry.set('score', this.score);
            this.registry.set('playerUpgrades', this.upgrades);
            
            console.log('📂 데이터를 성공적으로 불러왔습니다!', data);
        } else {
            // 4. 저장된 데이터가 아예 없다면(처음 시작한 유저) 초기값을 설정합니다.
            
            console.log('🆕 기존 저장 데이터가 없어 초기 상태로 시작합니다.');
        }

        // 5. 불러온 데이터를 화면에 즉시 반영하기 위해 UI 텍스트를 갱신합니다.
        
    }

}
