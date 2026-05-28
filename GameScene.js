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
    groundHeight = 160;
    acceleration = 4; // 드래그 가속도 (던지는 힘에 영향을 줌)
    // score 관련 변수들
    score = 0;
    gold =0;
    //성의 체력 관련 변수
    castleX = 100;
    stat;
    wave ;
    isWaveInProgress = true;
    init(data){
        //console.log("이전 씬에서 넘어온 데이터:", data);
        // 1. 초기 스탯 객체 생성 (레벨, 현재 수치, 강화 비용 등)
        this.wave={value:0, timer:20000 };
        this.score=0;
        this.gold = 0;
        this.skills = [
            { tag: 'aimShot', name:'집중사격', maxCooltime: 2400, cooltime: 0, unlock:false, mp: 0 }, 
            { tag: 'curse', name:'저주',  maxCooltime: 3000, cooltime: 0, unlock: false, mp: 20 },
            { tag: 'forceConv', name:'현혹술',  maxCooltime: 10000, cooltime: 0, unlock: false, mp: 50 }
        ];
        this.stat ={hp:100, maxHp:100, armor:0 , unitPer:0,
            mp:0, maxMp:0,
            manPower:0, convertionTime:8000,  
            archer:0, 
            archerCost:4, 
            archerCool:1800,   
            witch:0, 
            witchCost:8,
            officer:0

        };
        this.upgrades = {
            'cathedral': [
                { tag:'conversion', name: '🙏개종', unlock:false, level: 0, maxLevel: 1, value: 0, cost: 30 , info:'적을 개종(세뇌)시켜 아군 인력으로 충원합니다'},
                { tag:'faith', name: '교리 연구', unlock:true, level: 0, maxLevel: 3, value: 1000, cost: 30 , info:'교리를 연구하여 더 빨리 적을 개종시킵니다.'}
            ],
            
            
            'barracks': [
                { tag:'archer', name: '🏹궁병 고용', unlock:true, level: -1, maxLevel: 5, value: 0, cost: 10, manPower:1, info:`👥인력으로 궁병을 고용합니다(💸-${this.stat.archerCost}) 일정시간마다 화살을 쏩니다.`},
                { tag:'archerTraining', name: '속사 훈련', unlock:true, level: 1, maxLevel: 5, value: 100, cost: 30, info:'궁병이 더 빨리 화살을 쏩니다'},
                { tag:'aimShot', name: '⚡집중사격', unlock:false, level: 0, maxLevel: 1, value: 0, cost: 20, info:'궁병들이 해당 적에게 일제 사격을 퍼붓습니다'}
            ],
            'magichall': [
                { tag:'witch', name: '🪄마녀 고용', unlock:true, level: -1, maxLevel: 5, value: 0, cost: 20, manPower:1, info:`👥인력으로 마녀를 고용합니다(💸-${this.stat.witchCost}) 다양한 마법을 사용할 수 있습니다`},
                { tag:'curse', name: '⚡저주', unlock:false, level: 0, maxLevel: 1, value: 0, cost: 25, info:`마나 ${this.skills.find(s => s.tag =='curse').mp }을 소모하여 적을 즉사시킵니다.`},
                { tag:'forceConv', name: '⚡현혹술', unlock:false, level: 0, maxLevel: 1, value: 0, cost: 30, info:`마나 ${this.skills.find(s => s.tag =='forceConv').mp }을 소모하여 적을 즉시 개종합니다.`}
                //{ tag:'magic', name: '마법 공격력', unlock:true, level: 0, maxLevel: 5, value: 0, cost: 200 , info:''}
            ],
            'stronghold': [
                { tag:'wallType', name: '🛡️축성술 연구', unlock:true, level: 0, maxLevel: 5, value: 0, cost: 30, info:'성벽의 재료를 변경하여 더 높은 방어력과 주둔군 방어력이 증가합니다.'},
                { tag:'maxCastleHp', name: '성채보강',unlock:true, level: 0, maxLevel: 5, value: 0, cost: 20, info:'성벽의 최대 내구도를 증가시킵니다'},
                { tag:'wallFix', name: '성채수리(+1)', unlock:true, level: -1, maxLevel: 9, value: 1, cost: 1, info:'성벽을 수리합니다. 수리비는 축성술의 영향을 받습니다.'},
                { tag:'wallFix_10', name: '성채수리(+10)', unlock:true, level: -1, maxLevel: 9, value: 10, cost: 10, info:'성벽을 많이 수리합니다.'}
            ]
        };

        
        this.loadGame(data);
    }
    enit(){
        // 게임이 완전히 종료될 때 실행되는 함수입니다.
        // 여기서 리소스 정리나 이벤트 리스너 제거 등을 수행할 수 있습니다.
        console.log("GameScene이 종료되었습니다. 리소스를 정리합니다.");
    }
    create() {
        // 씬이 생성된 고유 ID 생성 (랜덤값)
        this.instanceId = Math.floor(Math.random() * 1000);
        this.saveLoadScene = this.scene.get("SaveLoadScene");
        

       this.isGameOver=false;
       this.isPaused=true;
       this.isWaveInProgress=true;       
       
       
       this.spawnTimers=[];
        
        this.registry.set('playerUpgrades', this.upgrades);
        this.registry.set('score', this.score);
        this.registry.set('gold', this.gold);
        this.registry.set('stat', this.stat);
        this.registry.set('wave', this.wave);
        this.registry.set('skills', this.skills);
        
        //this.loadGame();
        
        // 여기서 UI를 다시 실행해주면 됩니다.
        
        if (!this.scene.isActive('UIScene')) {
            this.scene.launch('UIScene');
        }
        //console.log(this.scene.isActive('UIScene'));
        this.saveScene = null;
        if (this.scene.isActive('SaveLoadScene')) {
            this.saveScene = this.scene.get('SaveLoadScene');
            //console.log(`${this.saveScene} is active`);

            //this.scene.launch('SaveLoadScene');
        }

        //배경그림
        this.setBgImage('background1');

        // 1. 바닥(Ground)을 정적 그룹으로 생성
        const platforms = this.physics.add.staticGroup(); 
        this.ground = this.add.rectangle(config.width / 2, config.height - this.groundHeight / 2 +10, config.width, this.groundHeight-10, 0x666666).setAlpha(0);;
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
        

        //궁수
        this.archer = this.add.sprite(this.castleX-10, config.height - this.groundHeight-120, 'archer').setDisplaySize(128,128);
        this.archer.setDepth(2).setOrigin(0.5);
        this.archer.setVisible(false);
        this.archerText = this.add.text(this.castleX, config.height- this.groundHeight-200, `궁수 x${this.stat.archer}`, 
                {   fontSize: '28px', 
                    fill: '#2ecc71',
                    padding: { x: 3, y: 3 },
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 4
                }).setOrigin(0.5); 
        this.archerText.setVisible(false);
        this.archerText.setDepth(4);
        
        //성채 이미지
        this.drawCastleImage();

        //성당 고문실

        this.cathedral = this.add.sprite(this.castleX-50, config.height- this.groundHeight, 'cathedral').setDisplaySize(128,128); 
        
        this.cathedral.setDepth(5);
        this.cathedral.setVisible(false);
        
        

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
        if (this.castle) {
            this.castle.destroy();
        } 
        this.castle = this.add.sprite(this.castleX, config.height- this.groundHeight, 'castleSprite').setDisplaySize(144,144);
        
        const num = Phaser.Math.Clamp(this.stat.armor,0,2);
        this.castle.anims.play(`castle${num}`);
        this.castle.setDepth(3).setOrigin(0.5,0.9);
        if(num>=2){
            this.castle.setDisplaySize(192,192).setOrigin(0.5,0.9);
        }
        
        this.archer.y = this.castle.y - this.castle.height;
        this.archerText.y = this.castle.y - this.castle.height-80;
    }
    setBgImage(name, isDark =false){
        this.bg = this.add.image(config.width/2, config.height/2, `${name}${isDark?'_dark':''}`).setDisplaySize(config.width, config.height);
        this.bg.setDepth(0);
    }
    setCathedral(){
        if(this.getUpgradeItem('cathedral','conversion').unlock){
            this.cathedral.setVisible(true).setOrigin(0.5,0.9);
        }
        this.cathedralTimer = null;

        //this.cathedral.anims.play('cathedral_fire', true);
    }
    startCathedralConvertion(target){
        if(!this.getUpgradeItem('cathedral','conversion').unlock) return; // 개종이 해금되지 않았다면 실행하지 않음
        if(this.cathedralTimer) return; // 이미 진행 중이라면 중복 실행 방지

        this.createBeamEffect(this.cathedral.x+30, this.cathedral.y, this.stat.convertionTime , '0xffcc00', 60);
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
            this.data.earnManpower ++;
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
        //통계 데이터 초기화
        this.data ={
            mobNumber:0, earnScore:0, earnGold:0 , earnManpower:0,
            
            archer:this.stat.archer, 
            archerCost: this.stat.archerCost, 
            archerDeath:0,
            witch:this.stat.witch, 
            witchCost:this.stat.witchCost,
            witchDeath:0,

            garrisonLoss:''
        };
        this.stat.unitPer = 0; // 유닛 제거 확률 초기화

        //스폰타이머
        this.addSpawnTimers();
        //성당 고문실
        this.setCathedral();

        //방어 궁수 활 매커니즘
        this.archeryTimer=null;
        if(this.stat.archer>0){
            this.archerText.setVisible(true);
            this.archerText.setText(`🏹 x${this.stat.archer}`);
             
            this.archer.setVisible(true);
            console.log(`궁수 발사 간격: ${this.stat.archerCool}ms`);
            this.archeryTimer = this.time.addEvent({
                delay:  this.stat.archerCool ,
                callback: ()=>{

                    this.archerFire(null);
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
    spawnMob(mobData) {
        //몹 생성
        //const mob = this.mobs.create(  config.width , config.height -this.groundHeight*2, 'mob1');
       if(!mobData.mobNumber) mobData.mobNumber=1;

        const mob = this.mobs.create( config.width , config.height - this.groundHeight*2, `mobsprite${mobData.mobNumber}`);
        mob.anims.play(`mob${mobData.mobNumber}_walk`);

        if(mobData.isDragable !=null && mobData.isDragable == false){
             
        } else{
            mob.setInteractive({ draggable: true });  
        }

        mob.setInteractive({ useHandCursor: true });
        // 💡 몹을 클릭했을 때 실행할 이벤트 리스너 등록
        mob.on('pointerdown', (pointer) => {
            // 일반 클릭과 구별하기 위해 브라우저 기본 간섭 방지
            if (pointer.event) pointer.event.preventDefault();
            // 🎯 스킬 및 공격 판단 함수 호출 (아래 2단계에서 구현)
            this.handleMobClick(mob);
        });
        
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
        mob.fireanime = null;
        //개인변수
        mob.score = mobData.score || 1;
        mob.speed = mobData.speed || 100 +Math.random() * 30; // 이동 속도에 약간의 랜덤 요소 추가
        mob.damage = mobData.damage || 1;
        mob.hp = mobData.hp || 1;
        mob.range = mobData.range || 10;
        mob.attackTime = 1000; // 공격 간격 (ms)
        
        
        switch (mobData.mobNumber){
            case 1:
                //기본 몹
                mob.name = 'doorknocker';
                mob.speed = mobData.speed || 100 +Math.random() * 30; // 이동 속도에 약간의 랜덤 요소 추가
                mob.damage = mobData.damage || 1;
                mob.score = mobData.score || 1;
            break;
            case 2:
                //wallbreaker
                mob.name = 'wallbreaker';
                mob.speed = mobData.speed || 80 +Math.random() * 30; // 이동 속도에 약간의 랜덤 요소 추가
                mob.damage = mobData.damage || 4;
                mob.score = mobData.score || 2;
                mob.hp = mobData.hp || 2;
            break;
            case 3:
                //archer
                mob.name = 'archer';
                mob.speed = mobData.speed || 90 +Math.random() * 30; // 이동 속도에 약간의 랜덤 요소 추가
                mob.damage = mobData.damage || 1;
                mob.score = mobData.score || 2;
                mob.hp = mobData.hp || 1;
                mob.range = 500;
                mob.killUnit = 0.1; // 공격 시 때 10% 확률로 유닛 제거
                mob.fireanime = `mob${mobData.mobNumber}_fire`;
                mob.rangeWp ='arrow';
                mob.attackTime = 2100;
                mob.body.setOffset(0, Phaser.Math.Between(-15, -10)); // 히트박스 위치 조정
                
            break;
            case 10:
                //Giant
                mob.name = 'giant';
                mob.speed = mobData.speed || 210 +Math.random() * 30; // 이동 속도에 약간의 랜덤 요소 추가
                mob.damage = mobData.damage || 3;
                mob.score = mobData.score || 3;
                mob.hp = mobData.hp || 4;
                mob.range = 20;
                mob.killUnit = 0.3; // 공격 시 때 30% 확률로 유닛 제거
                mob.setScale(1.8);
                mob.y -= 96; // 크기가 커졌으니 살짝 띄워줌
                mob.body.setOffset(0, Phaser.Math.Between(0, 10)); // 히트박스 위치 조정
            break;
        }
    }
    addSpawnTimer(mobData, delayTimer =2000, count = 1){
        const spawnTimer = this.time.addEvent({
        delay: delayTimer,
            callback:() => {
                for(let i =0; i< count ; i++){
                    this.spawnMob(mobData);
                }
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
            
            if (mob.x < 200 + mob.range && this.isWaveInProgress) {
                // --- [성벽 도착 상태] ---
                mob.body.setVelocityX(0); // 이동 정지
                if (!mob.isAttacking) {
                    mob.isAttacking = true;
                    if(mob.fireanime != null){
                        mob.anims.play(mob.fireanime, true);
                    }
                }

                // 공격 쿨타임 체크 (1초마다)
                if (!mob.lastAttackTime || time > mob.lastAttackTime + mob.attackTime) {
                    mob.lastAttackTime = time;
                    if(mob.rangeWp != null){
                        //원거리무기가 있을경우
                        if(mob.rangeWp =='arrow'){
                            this.fireArrow(mob.x, mob.y, this.castle.x ,  this.castle.y-100 , mob.rangeWp);
                            const rangeCool = Phaser.Math.Clamp( (mob.x - this.castle.x)*2, 200, 1200);
                            //딜레이
                            this.time.delayedCall(rangeCool, () => {
                                this.takeDamage( mob );
                            });
                        }
                    }else{
                        //근접공격
                        this.takeDamage( mob );

                    }
                    mob.resetX = mob.x > 200 ? mob.x : 200; //최소거리
                    // 뒤로 물러나는 애니메이션
                    this.tweens.add({
                        targets: mob,
                        x: mob.x -30,          //  살짝 밀려남
                        duration: 150,
                        yoyo: true,      // 다시 100으로 돌아옴
                        ease: 'Back.easeOut',
                        onComplete: () => {
                            if (mob.active) mob.x =mob.resetX ; // 위치 재고정
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
        const uiScene = this.scene.get('UIScene');
        //console.log('업그레이드 아이템:', item);
        //const item = this.upgrades.find(cat => cat[0].name === category)[tag];
        //해금체크
        
        if(!item.unlock){
            if(this.gold < item.cost){
                this.saveLoadScene.showOkPopup('💰골드가 부족합니다');
                //console.log("골드가 부족합니다.");
                return;
            }
            
        }
        // 1. 만렙 체크
        if (item.level >= item.maxLevel) {
            this.saveLoadScene.showOkPopup('이미 최대 레벨입니다');
            //console.log("이미 최대 레벨입니다.");
            return;
        }
        if(item.manPower !=null){
            if(this.stat.manPower <=0){
                this.saveLoadScene.showOkPopup('👥인구수가 부족합니다');
                //console.log("인구수가 부족합니다.");
                return;
            }
            this.stat.manPower--; // 인구수 1 감소
                //this.registry.set('stat', this.stat); // 변경된 스탯을 레지스트리에 저장하여 UIScene 갱신
        }
        // 3. 비용 체크 (예시: this.gold가 있다고 가정)
        if (this.gold < item.cost) {
                this.saveLoadScene.showOkPopup('💰골드가 부족합니다');
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
            //스킬해금
            const unlockSk = this.skills.find(sk =>sk.tag == item.tag);
            if(unlockSk !=null && unlockSk.unlock ==false){
                unlockSk.unlock = true;
                //console.log(this.skills);
                this.registry.set('skills',this.skills);
                uiScene.createSkillUI();
            }
        }
        if(item.level>-1){
            
            item.level++;
            item.cost = Math.floor(item.cost * 1.5); // 다음 레벨 비용 상승
        }else{
            //-1은 무한히 가능한 기능임(수리 등)
        }
        
        
        // 4. 태그에 따른 실제 효과 적용 (이 부분이 switch 문 역할)
        
        switch (item.tag.split('_')[0]) {
            case 'wallType':
                this.stat.armor = item.level;
                this.getUpgradeItem('stronghold','wallFix').cost = this.stat.armor;
                this.getUpgradeItem('stronghold','wallFix_10').cost = this.stat.armor*10;
                this.drawCastleImage();
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
           

            case 'witch':
                this.stat.witch++;
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
    takeDamage = (mob) => {
        if (this.isGameOver) return; // 게임 오버 상태에서는 대미지 무시

        const damage = Phaser.Math.Clamp( mob.damage - this.stat.armor, 1,100);//최소대미지 고정
        this.stat.hp -= damage;
        if (this.stat.hp < 0) this.stat.hp = 0;

        //몹이 유닛 제거 능력이 있다면
        if(mob.killUnit !=null){
            this.stat.unitPer += mob.killUnit; // 제거 확률 누적

            const removeCount = Math.random(); //< this.stat.unitPer ? 1 : 0; // 확률적으로 제거 여부 결정
            
            //console.log( ` ${this.stat.unitPer>removeCount? '유닛제거 - ':''}${Math.floor(this.stat.unitPer*100)/100} : ${removeCount}`)
            if(this.stat.unitPer - this.stat.armor*0.04  >removeCount ){
                this.stat.unitPer = 0; // 제거가 발생하면 확률 초기화
                if(this.data.garrisonLoss =='archer'){
                    if(this.data.witch>0){
                        this.data.garrisonLoss ='witch';
                    }
                    
                }else{
                    if(this.stat.archer>0){
                        this.data.garrisonLoss = 'archer';
                    }
                    
                }

                const uiScene = this.scene.get('UIScene');

                if(this.stat.archer > 0 && this.data.garrisonLoss =='archer'){   
                    console.log(`💀🏹 궁수 사망 (${this.stat.archer}->${this.stat.archer-1})` );
                    this.stat.archer --; // 궁병 제거
                    this.data.archerDeath++; 
                    if(this.stat.archer < 0) this.stat.archer = 0; // 음수 방지
                    
                    this.archerText.setText(`🏹 x${this.stat.archer}`);
                    if(this.stat.archer <= 0){
                        this.archer.setVisible(false);
                        this.archerText.setVisible(false);
                        this.archeryTimer?.remove();
                        this.archeryTimer = null;
                    }
                    //아처 글자 커지는 효과
                    if(this.archerTextEffect && this.archerTextEffect.isActive() ){
                        this.archerTextEffect.remove();
                    }
                    this.archerText.setColor('#ff0000');
                    this.archerTextEffect = this.tweens.add({
                        targets: this.archerText,
                        scale: 1.5, 
                        duration: 200,
                        yoyo: true,
                        
                        ease: 'Cubic.easeOut',
                        onComplete: () => {
                            this.archerText.setColor('#2ecc71');
                            this.archerText.setScale(1); // 원래 크기로 복귀
                            this.archerText.clearTint();
                            this.archerTextEffect = null; // 트윈이 끝난 후 null 처리
                        }
                    });
                }

                //마법사 제거 로직도 여기에 추가 가능
                if(this.stat.witch>0 && this.data.garrisonLoss =='witch'){
                    console.log(`💀🪄 마녀 사망 (${this.stat.witch} -> ${this.stat.witch-1})`);
                    this.stat.witch--;
                    this.data.witchDeath++;
                    if(this.stat.witch<0) this.stat.witch=0;//음수방지
                    uiScene.shakeMpBar(20);
                }
                this.registry.set('stat', this.stat);
            }
        }
        
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
        target.hp =0;
        if(target.body){
            target.body.enable = false;
            target.anims.stop(); // 애니메이션도 멈춤
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
        arrow.setDepth(10);
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
    // src/scenes/GameScene.js 내부에 추가

    /**
     * 💡 하늘로 솟구치는 미니멀 빛줄기 이펙트
     * @param {number} x - 이펙트가 생성될 X 좌표
     * @param {number} y - 이펙트가 생성될 Y 좌표 (보통 몹의 위치나 바닥)
     * @param {number} duration - 빛줄기가 유지될 시간 (밀리초, 예: 1000 = 1초)
     * @param {number} color - 빛줄기 고유 색상 (예: 황금색 0xffcc00, 보라색 0x8844ff)
     * @param {number} width - 빛줄기의 두께 (기본값 20픽셀)
     */
    createBeamEffect(x, y, duration = 1000, color = 0xffcc00, maxWidth = 20) {
        const beam = this.add.graphics();
        beam.setDepth(30); // 화면 맨 앞으로 배치

        const beamHeight = y; 
        
        // 💡 애니메이션 상태를 관리할 객체
        const effectState = {
            width: maxWidth,
            alpha: 0,
            timeCounter: 0 // 🌊 삼각함수(Sin) 주기를 계산하기 위한 타임 카운터
        };

        // 🎨 출렁이는 빛줄기를 실시간으로 그리는 헬퍼 함수
        const drawBeam = () => {
            beam.clear();
            if (effectState.width <= 0) return;

            // 🌊 [핵심 연산] Math.sin을 이용해 매 프레임 두께를 미세하게 변동시킵니다.
            // timeCounter에 곱하는 숫자가 커질수록 출렁이는 속도가 빨라집니다.
            const wave = Math.sin(effectState.timeCounter * 0.05); 
            
            // 평소 두께의 85% ~ 115% 사이를 출렁거리게 만듭니다. (최대 두께 반영)
            const currentWidth = effectState.width * (1 + wave * 0.15);

            // [레이어 A] 외곽 반투명 컬러 빛
            beam.fillStyle(color, effectState.alpha * 0.4);
            beam.fillRect(x - currentWidth / 2, 0, currentWidth, beamHeight);

            // [레이어 B] 중심부 핵심 코어 빛 (코어도 비율에 맞춰 함께 출렁임)
            const coreWidth = currentWidth * 0.4;
            beam.fillStyle(0xffffff, effectState.alpha * 0.9);
            beam.fillRect(x - coreWidth / 2, 0, coreWidth, beamHeight);
        };

        // 1. ⚡ 최초 페이드 인 (0.15초 동안 빠르게 켜짐)
        this.tweens.add({
            targets: effectState,
            alpha: 1,
            duration: 150,
            ease: 'Quad.easeOut',
            onUpdate: (tween, target) => {
                target.timeCounter++; // 타임 카운터를 누적하여 파동을 만듦
                drawBeam();
            },
            onComplete: () => {
                
                // 2. ⏳ 유지 단계 트윈 (유지하는 동안에도 출렁임이 멈추지 않도록 이 단계 전용 트윈을 겁니다)
                const activeDuration = duration - 350; // 전체 시간에서 앞뒤 페이드 시간을 제외
                
                const holdTween = this.tweens.add({
                    targets: effectState,
                    timeCounter: effectState.timeCounter + (activeDuration / 16), // 시간 흐름 비례 카운터 증가
                    duration: activeDuration,
                    onUpdate: drawBeam, // 매 업데이트마다 출렁이며 그리기
                    onComplete: () => {
                        
                        // 3. 📉 소멸 단계: 중심을 향해 얇아지며 증발
                        this.tweens.add({
                            targets: effectState,
                            alpha: 0,
                            width: 0, // 기본 두께 자체를 0으로 줄임
                            duration: 200,
                            ease: 'Quad.easeIn',
                            onUpdate: (tween, target) => {
                                target.timeCounter += 2; // 사라질 때는 더 빠르게 출렁이게 카운터 가속
                                drawBeam();
                            },
                            onComplete: () => {
                                beam.destroy(); // 메모리 해제
                            }
                        });
                        
                    }
                });
                
            }
        });
    }

    archerFire(targeting =null){
        let delayCallTime = 1100;
        let archerNumber = this.stat.archer;
        const mobArray = this.mobs.getMatching('isDragging',false);
        //console.log(`드래그되지 않은 몹 수 :${mobArray.length}`); isDragging ??? 
        if(mobArray.length<=0 && targeting ==null){
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
            const artarget = targeting!=null? targeting :  Phaser.Utils.Array.GetRandom(mobArray);
            this.fireArrow(this.archer.x, this.archer.y, artarget.x ,  artarget.y);
        }
        //화살 도착 딜레이
        this.time.delayedCall(delayCallTime, () => { 
            const mobArray = this.mobs.getMatching('isDragging',false);
            for(let i =0; i< archerNumber ; i++){
                const target = targeting!=null? targeting :  Phaser.Utils.Array.GetRandom(mobArray);
                if(target==null){
                    continue;
                }else{
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
            }
        });
    }
    //스킬사용
        /**
     * 몹을 직접 클릭했을 때 실행되는 액션 마스터 함수
     * @param {Phaser.GameObjects.Sprite} mob - 클릭당한 몹 객체
     */
    handleMobClick(mob) {
        // 1. UI 씬을 가져와서 현재 토글(장전)된 스킬이 있는지 확인합니다.
        if(mob.hp<=0) return;
        const uiScene = this.scene.get('UIScene');
        const activeSkill = uiScene.activeSkillTag; 

        // 2. 만약 장전된 스킬이 있다면?
        if (activeSkill) {
            
            // 스킬 데이터 찾기
            const skill = uiScene.skills.find(s => s.tag === activeSkill);
            if(skill.cooltime>0) {uiScene.shakeMpBar(); return ;}//쿨이 돌고 있다면 무시

            // 마나(MP) 시스템이 있다면 체크 (예시)
            if (this.stat.mp < skill.mp) { uiScene.shakeMpBar(); console.log("MP가 부족합니다!"); return; }
            this.stat.mp -= skill.mp;

            // 💥 [스킬 1] 조준 사격 (AimShot) 발동
            if (activeSkill === 'aimShot') {
                console.log(`🏹 ${skill.name} 발동! ${mob.name}에게 집중사격!`);
                this.archerFire( mob);
                mob.body.setVelocity(0,0);
                //mob.currentHp -= 300; // 일반 공격보다 강력한 데미지
                //this.showDamageText(mob, 300); // 데미지 팝업 연출 (선택)
            } 
            // 💥 [스킬 2] 저주 (Curse) 발동
            else if (activeSkill === 'curse') {
                console.log(`💀 ${skill.name} 발동! ${mob.name}가 즉시 사망합니다`);
                this.fadeOutAndDestroy(this, mob);
                this.createBeamEffect(mob.x, config.height- this.groundHeight, 400, 0x9933ff, 40);
            }
            else if (activeSkill === 'forceConv') {
                console.log(`👥 ${skill.name} 발동! ${mob.name}가 개종됩니다.`);
                this.updateScore(mob.score);
                mob.destroy();
                this.data.earnManpower ++;
                this.stat.manPower++;
                this.createBeamEffect(mob.x, config.height-this.groundHeight , 1200 , '0xffcc00', 50);
            }
            // 3. ⏱️ 스킬을 성공적으로 썼으므로 쿨타임을 적용합니다.
            skill.cooltime = skill.maxCooltime;

            // 4. 📴 스킬을 사용했으니 장전 상태(토글)를 해제하여 평소 상태로 돌립니다.
            uiScene.deactivateAllSkills();

        } 
        // 3. 장전된 스킬이 없다면 (activeSkill === null)
        else {
            
            
        }
    }
    //스폰타이머
    addSpawnTimers(){
        //레벨 디자인 
        if(this.wave.value>0){
            this.addSpawnTimer({mobNumber:1},1800);
        }
        if(this.wave.value>=2){
            this.addSpawnTimer({mobNumber:2},2000);
        }
        if(this.wave.value>=4&& this.wave.value<6){
            this.addSpawnTimer({mobNumber:1},1600);
        }
        if(this.wave.value>8){
            this.addSpawnTimer({mobNumber:1},2200);
        }
        if(this.wave.value>=6 && this.wave.value<10){
            this.addSpawnTimer({mobNumber:3},2200);
        }
        if(this.wave.value>=10){
            this.addSpawnTimer({mobNumber:3},2200 , 2);
            
        }
        if(this.wave.value>=11 && this.wave.value<12){
            this.addSpawnTimer({mobNumber:10, isDragable:false , hp:3},6800);
        }
        if(this.wave.value>=12){
            this.addSpawnTimer({mobNumber:10, isDragable:false },6400);
        }
    }
    // GameScene 내부의 gameOver 함수
    gameOver() {
        this.isGameOver = true;
        this.physics.pause(); // 게임 로직만 멈춤

        // UIScene을 GameScene 위에 띄움 (데이터 전달 가능)
        this.events.emit('showGameOver', { score: this.score }); // UIScene에 신호 보냄
    }


    saveGame() {
        const now = new Date();
    
        // 2️⃣ 년, 월, 일 변수 가공 (월은 0부터 시작하므로 +1, 자릿수 맞춤)
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        // 3️⃣ 시, 분 변수 가공 (초까지 필요하다면 똑같이 추가 가능)
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        // 4️⃣ 저장용 문자열 완성 ➔ "2026.05.27 14:35" 형태
        const formattedDate = `${year}.${month}.${day} ${hours}:${minutes}`;
        // 1. 저장할 핵심 데이터들을 하나의 객체로 모읍니다.
        const gameData = {
            version:window.GAME_VERSION ,
            lastPlayTime: formattedDate ,
            stat: this.registry.get('stat') ,
            wave: this.registry.get('wave'), // 웨이브 정보도 저장
            gold: this.registry.get('gold') || 0,
            score: this.registry.get('score') || 0,
            skills:this.registry.get('skills'),
            upgrades: this.registry.get('playerUpgrades'),
            isEmpty: false
                
        };
        return gameData;
    }

    /**
     * 📂 저장된 게임 데이터를 불러오는 함수
     */
    loadGame(data) {
        // 1. 브라우저에서 저장된 데이터가 있는지 가져옵니다.
        //this.scene.get('SaveLoadScene').loadGameData(); //loadGameRawData();
        
        if (data && data.stat!=null) {
            // 2. 저장된 데이터가 있다면 문자열을 다시 원래 객체로 파싱합니다.
            //const data = JSON.parse(savedData);

            // 3. 게임 내부 변수들에 데이터를 덮어씌웁니다.
            if(data.stat.mp ==null) data.stat.mp = 0;
            if(data.stat.maxMp ==null) data.stat.maxMp = 0;
            if(data.stat.officer ==null) data.stat.officer = 0;
            data.stat.witchCost = this.stat.witchCost;
            data.stat.archerCost = this.stat.archerCost;

            if(data.skills ==null) data.skills = this.skills;
            for(let i =0 ; i< data.skills.length ; i++){
                data.skills[i].maxCooltime = this.skills[i].maxCooltime;
                data.skills[i].mp = this.skills[i].mp;
                data.skills[i].name = this.skills[i].name;
                //data.skills[i].unlock = this.skills[i].unlock;//테스트
            }

            this.stat = data.stat || this.stat; // 저장된 스탯이 있으면 덮어쓰기, 없으면 기존값 유지
            this.wave = data.wave || this.wave;
            this.gold = data.gold || this.gold;
            this.score = data.score || this.score;
            
            const categories = Object.keys(this.upgrades);
            categories.forEach((name) => {
                const arr = data.upgrades[name];
                const org = this.upgrades[name];
                if(arr ==null){
                    
                }else{
                     for(let i =0 ;i < org.length ; i++){
                        if(arr[i] ==null){
                            //업글이 없으면 추가
                            arr[i] = org[i];
                        }else{
                            arr[i].info = org[i].info;
                            arr[i].name = org[i].name;
                            //arr[i].unlock = org[i].unlock;//테스트
                            if(arr[i].unlock==false){ arr[i].level =0}
                        }
                    
                    }
                }
               
            });
            this.upgrades = data.upgrades || this.upgrades;

            this.skills = data.skills;
            

            this.registry.set('stat', this.stat);
            this.registry.set('wave', this.wave);
            this.registry.set('gold', this.gold);
            this.registry.set('score', this.score);
            this.registry.set('skills', this.skills);
            this.registry.set('playerUpgrades', this.upgrades);
            
            console.log('📂 데이터를 성공적으로 불러왔습니다!', data);
        } else {
            // 4. 저장된 데이터가 아예 없다면(처음 시작한 유저) 초기값을 설정합니다.
            
            console.log('🆕 기존 저장 데이터가 없어 초기 상태로 시작합니다.');
        }

        // 5. 불러온 데이터를 화면에 즉시 반영하기 위해 UI 텍스트를 갱신합니다.
        
    }

}
