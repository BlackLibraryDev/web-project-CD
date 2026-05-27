class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }
    isPaused = false;
    selectedCategory = null; // 현재 선택된 카테고리
    buttons = [];// 카테고리 버튼들을 저장할 객체
    upgradeWindow = null; // 업그레이드 창 컨테이너
    costTxt = null; // 비용 텍스트 객체
    wave = {value:1, timer:10000}
    create() {
        // 씬이 생성된 고유 ID 생성 (랜덤값)
        this.saveLoadScene = this.scene.get('SaveLoadScene');
        this.saveName = this.saveLoadScene.loadGameData;
        console.log(`saveName : ${this.saveName}`);


        this.stat = this.registry.get('stat');
        this.isPaused=false;    
        this.selectedCategory = null; // 현재 선택된 카테고리
        this.buttons = []; // 카테고리 버튼들을 저장할 배열
        const { width, height } = this.cameras.main;

        // 1. 일시정지 화면 그룹
        this.pauseMenu;
        this.drawPauseMenu();

        // 2. 게임오버 화면 그룹
        this.gameOverMenu = this.add.container(0, 0).setVisible(false);
        const overBg = this.add.rectangle(width/2, height/2, width, height, 0xff0000, 0.3);
        this.endscoreText = this.add.text(width/2, height/2, 'SCORE: 0', { fontSize: '48px' , fill: '#000000'}).setOrigin(0.5);
        
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
        })
        this.gameOverMenu.add([overBg, this.endscoreText, restartBtn]);
        this.gameOverMenu.setDepth(20); // 다른 UI 요소들보다 위에 표시

        // 1. 결과창 및 업그레이드 창 컨테이너 생성 함수 호출
        this.createUpgradeWindow();
        this.createResultWindow();

        // 2. 특정 버튼을 누르거나 키보드를 눌렀을 때 창을 띄우는 이벤트
        this.input.keyboard.on('keydown-U', () => {
            return;
            const isVisible = this.upgradeWindow.visible;
            this.upgradeWindow.setVisible(!isVisible); // U키를 누를 때마다 토글
        });
        this.input.keyboard.on('keydown', (event) => {
            // 아무 키나 눌렀을 때 실행될 코드
            console.log(`눌린 키: ${event.key}, 키 코드: ${event.code}`);
            if(!this.isPaused){
                this.togglePause();
            }else if(event.code =='Escape'){
                this.togglePause();
            }
        });



        
        //점수 및 체력 초기화
        this.hpText = this.add.text(90, 20, 'Castle HP',  { 
            fontFamily: 'Arial', 
            fontSize: '24px', 
            fill: '#fa2727ff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3 // 글자 테두리
             }
        );
        // 체력 바를 그릴 그래픽 객체 생성
        this.healthBar = this.add.graphics();
        this.drawHealthBar(this.healthBar ); // 위치
        
        this.scoreText = this.add.text(config.width - 20, 20, 'Score: 0', {
            fontSize: '32px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(1, 0); // 기준점을 우측 상단으로 설정하여 글자가 왼쪽으로 늘어나게 함
        this.scoreText.setDepth(18);
        this.updateScore( this.registry.get('score') || 0);
        

        this.waveText = this.add.text(config.width / 2, 20, 'Wave 0', {
            fontSize: '48px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0).setDepth(18);
        
        this.waveBar = this.add.graphics();
        this.waveBar.setDepth(8);
        this.drawWaveBar(this.waveBar);

        
        this.manaTxt = this.add.text(config.width /2, config.height-140,``,{
            fontSize: '24px',
            fill:'#3498db ',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0).setDepth(10);
        this.manaBar = this.add.graphics();
        this.manaBar.setDepth(9);
        this.drawManaBar(this.manaBar);


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
        
        //스텟 표시용
        this.statText = this.add.text(20, 80, '', {
            fontSize: '20px',
            fill: '#000',
            padding: { x: 3, y: 3 }
        });
        this.statText.setDepth(12);



        // 3. 이벤트 리스너 (GameScene에서 보낸 신호를 받음)
        const gameScene = this.scene.get('GameScene');

        
        gameScene.events.on('waveCleared', (data) => {
            //this.upgradeWindow.setVisible(true);
            this.resultWindow.setVisible(true);
            this.showResultWindow(data);
            this.data = data;
        });
        gameScene.events.on('showPause', () => {
            this.pauseMenu.setVisible(true);
        });

        gameScene.events.on('hidePause', () => {
            this.pauseMenu.setVisible(false);
        });

        gameScene.events.on('showGameOver', (data) => {
            this.isPaused=true;
            this.endscoreText.setText(`SCORE: ${data.score.toLocaleString()}`);
            this.scene.pause('GameScene'); 
            this.gameOverMenu.setVisible(true);
        });

       

        // 점수 업데이트 이벤트 리스너
        // 'changedata-이름' 형식을 사용합니다.
        this.registry.events.off('changedata-wave');
        this.registry.events.on('changedata-wave',(parent,newValue) =>{
            this.wave = newValue
            this.timer =newValue.timer;
            this.drawWaveBar(this.waveBar); 
        });
        this.registry.events.off('changedata-score'); // 기존 리스너 제거 (중복 방지)
        this.registry.events.on('changedata-score', (parent, newValue) => {
            this.updateScore(newValue);
            this.drawStatText();
        });
        this.registry.events.off('changedata-stat');
        this.registry.events.on('changedata-stat', (parent, newValue) => {
            this.stat = newValue;
            this.drawHealthBar(this.healthBar);
            this.drawStatText();
        });
        
         // 'gold'라는 키의 데이터가 변할 때마다 showCategory를 다시 실행
        this.registry.events.off('changedata-gold');
        this.registry.events.on('changedata-gold', (parent, newValue) => {
            // 골드가 변경될 때마다 비용 텍스트 업데이트
            this.gold = newValue;
            // this.fcostTxt(newValue);
             this.drawStatText();
        }, this);
         this.registry.events.off('changedata-playerUpgrades'); // 기존 리스너 제거 (중복 방지)
        this.registry.events.on('changedata-playerUpgrades', () => {
            // 현재 열려있는 카테고리가 있다면 그 화면을 갱신
            // 모든 씬의 키(Key)와 현재 상태(Status) 출력
            //console.log(`[인스턴스:${this.instanceId}] `);
            if (this.upgradeWindow.visible) {
                this.showCategory(this.currentCategory);
            }
        }, this);

        //스킬창 표시
        this.createSkillUI();
        //게임 시작
        
        const savedData = localStorage.getItem(this.saveLoadScene.loadGameData );
        if(savedData){
            //게임시작 전 업그레이드 창 
            this.scene.get('GameScene').setBgImage('background1',true);
            this.upgradeWindow.setVisible(true);
            this.currentCategory = 'cathedral'; // 기본 카테고리 설정
            this.showCategory(this.currentCategory);
            this.drawHealthBar(this.healthBar, 50, 50 ); // 위치
            this.drawStatText();
            this.wave = this.registry.get('wave');
            this.drawWaveBar(this.waveBar);
            this.setSkillUIVisibility(false);
        }else{
            //저장된 데이터가 없으면 바로 게임 시작
            this.nextGameStart();
        }

        

        
        
        this.events.once('shutdown', () => {
            this.registry.events.off('changedata-wave');
            this.registry.events.off('changedata-score'); // 기존 리스너 제거 (중복 방지)
            this.registry.events.off('changedata-gold');
            this.registry.events.off('changedata-stat');
            this.registry.events.off('changedata-playerUpgrades'); // 기존 리스너 제거 (중복 방지)
            this.registry.events.removeAllListeners(); // 혹시 남아있을 수 있는 다른 리스너들도 모두 제거
        });

        
    }
     
    /////////////////////////////////////////////////////////////////////////////////
    nextGameStart(){
        this.upgradeWindow.setVisible(false);
        this.drawStatText();
        this.drawHealthBar(this.healthBar, 90, 50 ); // 위치
        this.setSkillUIVisibility(true);//스킬 모두 표시
        this.scene.get('GameScene').events.emit('startNextWave'); // GameScene에 다음 웨이브 시작 신호 보냄
        this.isPaused=false;
        this.skills.forEach((skill, index) => {
            if (!skill.unlock) return;
            skill.cooltime =0;

        });
    }
    updateScore(points) {
        this.scoreText.setText('Score: ' + points);
    }
    drawWaveBar(graphics){
        
        const { width, height } = this.cameras.main;
        graphics.clear();
        // 1. 배경 (검정색)
        graphics.fillStyle(0x222222);
        graphics.fillRect( width/2 -100 , 65, 200, 10);

        // 남은 시간 비율에 따라 가로 길이를 조절함 (200px * timer/100)
        graphics.fillStyle( 0xf82cff);
        const timeRatio = Phaser.Math.Clamp(this.timer/ this.wave.timer, 0, 1);
        graphics.fillRect(width/2 -100 , 65, 200 * timeRatio, 10);
        this.waveText.setText(`Wave ${this.wave.value || 1}`);
    }
    drawManaBar(graphics){
        const {width, height} = this.cameras.main;
        const barWidth = 100 +  (this.stat.maxMp >300? 300 : this.stat.maxMp ); 
        graphics.clear();
        graphics.fillStyle(0x222222);
        graphics.fillRect( width/2 -barWidth/2 ,height-120 , barWidth, 16);

        graphics.fillStyle( 0x3498db );
        const timeRatio = Phaser.Math.Clamp(this.stat.mp/ this.stat.maxMp, 0, 1);
        graphics.fillRect(width/2 -barWidth/2 ,height-120 , barWidth * timeRatio, 16);

        this.manaTxt.setText(`${ Math.floor(this.stat.mp)}/${this.stat.maxMp}`);

    }
    shakeMpBar(shakeIntensity = 8){
        // 1. 쉐이크 효과를 적용할 그래픽스 객체
        if(this.manabarshakeTween && this.manabarshakeTween.isActive()){
            return;
        }
        const graphics = this.manaBar;
        const originalX = graphics.x;
        const originalY = graphics.y;
      
        this.manabarshakeTween = this.tweens.add({
            targets: graphics,
            // 최초 목적지를 랜덤하게 잡습니다.
            x: originalX + Phaser.Math.Between(-shakeIntensity, shakeIntensity),
            y: originalY + Phaser.Math.Between(-shakeIntensity, shakeIntensity),
            duration: 40, // 💡 지진 느낌을 주려면 0.04초 정도로 아주 빠르게 꺾여야 합니다.
            yoyo: true,
            repeat: -1,
            ease: 'Linear', // 지진은 부드러운 곡선(Sine)보다 직선(Linear)이 훨씬 타격감 있습니다.
            
            // 🔄 [핵심] 한 번 왕복(Yoyo)할 때마다 다음 흔들릴 목적지를 상하좌우 무작위로 새로 고칩니다.
            onYoyo: () => {
                this.manabarshakeTween .updateTo('x', originalX + Phaser.Math.Between(-shakeIntensity, shakeIntensity));
                this.manabarshakeTween .updateTo('y', originalY + Phaser.Math.Between(-shakeIntensity, shakeIntensity));
            }
        });

        // 3. 1초 뒤 흔들림 멈춤 (지연 호출 사용)
        this.time.delayedCall(300, () => {
            this.manabarshakeTween.stop(); // 쉐이크 애니메이션 멈춤
            this.manabarshakeTween = null;
            // 그래픽스 객체 위치 초기화 (선택 사항)
            graphics.x = originalX;
            graphics.y = originalY;
        });
    }
    drawHealthBar(graphics, x=90, y =50) {
        graphics.clear();
        if(this.upgradeWindow.visible){
            x=50;
        }
        // 1. 배경 (검정색)
        graphics.fillStyle(0x000000);
        graphics.fillRect(x, y, 200, 20);

        // 2. 현재 체력 (빨간색)
        // 체력 비율에 따라 가로 길이를 조절함 (200px * hp/100)
        graphics.fillStyle(0xff0000);
        graphics.fillRect(x, y, 200 * (this.stat.hp / this.stat.maxHp), 20);
        graphics.setDepth(12);
        // 3. 텍스트 업데이트
        this.hpText.setText(`Castle HP: ${this.stat.hp}/${this.stat.maxHp}`);
        this.hpText.x = x; // 체력바와 같은 X 위치로 이동
        this.hpText.setDepth(12);
    }
    drawStatText() {
        // 기존 텍스트 하나로 다 쓰던 것을 지우고, 각각 독립된 객체로 제어합니다.
        
        const { width, height } = this.cameras.main;
        const X = -10; // 텍스트 시작 X 좌표
        const Y = 80; // 텍스트 시작 Y 좌표
        const goldAmount = this.registry.get('gold')?.toLocaleString() || 0;

        // 💡 멋진 텍스트 스타일 세팅 (그림자 및 폰트 두께 조절)
        const textStyle = { 
            fontFamily: 'Arial', 
            fontSize: '28px', 
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3 // 글자 테두리를 주면 가독성이 확 올라갑니다.
        };

        // 만약 기존에 텍스트 객체들이 생성되지 않았다면 최초 1회 생성합니다.
        if (!this.statTexts) {
            this.statTexts = {};
            
            // 💰 골드 아이콘과 텍스트 배치
            //this.add.image(X+20, Y + 30, 'icon_gold').setOrigin(0, 0.5).setScale(0.8);
             this.statTexts.gold = this.add.text(X+50, Y + 30, '', textStyle).setOrigin(0, 0.5);
            // 🛡️ 방어력 아이콘과 텍스트 배치
           // this.add.image(X+20,Y + 65, 'icon_armor').setOrigin(0, 0.5).setScale(0.8);
             this.statTexts.armor = this.add.text(X+50, Y + 65, '', textStyle).setOrigin(0, 0.5);
            // 👥 인원 아이콘과 텍스트 배치 (Y축 간격을 35px씩 띄웁니다)
            //this.add.image(X+20, Y + 100, 'icon_manpower').setOrigin(0, 0.5).setScale(0.8);
            
            this.statTexts.manPower = this.add.text(X+50, Y + 100, '', textStyle).setOrigin(0, 0.5);
            //🏹
            
            this.statTexts.archer = this.add.text(X+50, Y + 135, '', textStyle).setOrigin(0, 0.5);
            
            this.statTexts.witch = this.add.text(X+50, Y + 170, '', textStyle).setOrigin(0, 0.5);
           /*
            const dX = width/2;
            const dY = height-160;
            this.statTexts.gold = this.add.text(dX, dY, '', textStyle).setOrigin(0.5);
            this.statTexts.armor = this.add.text(X+80, Y + 30, '', textStyle).setOrigin(0.5);
            this.statTexts.manPower = this.add.text(dX-200, dY +30, '', textStyle).setOrigin(0.5);
            this.statTexts.archer = this.add.text(dX-50, dY +30, '', textStyle).setOrigin(0.5);
            this.statTexts.witch = this.add.text(dX+150, dY +30, '', textStyle).setOrigin(0.5);
             */
        }

        // 💡 실제 값만 업데이트 (컬러링 추가로 시각 효과 극대화)
        let upkeepCost = 0;
        if(this.stat.archer > 0){
            upkeepCost += this.stat.archerCost*this.stat.archer; // 궁수 1명당 유지비 골드
        }
        if(this.stat.witch > 0){
            upkeepCost += this.stat.witchCost*this.stat.witch; // 마법사 1명당 유지비 골드
        }   

        this.statTexts.gold.setText(`💰 ${goldAmount} (-💸${upkeepCost})`).setColor('#f1c40f'); // 황금색
        this.statTexts.armor.setText(`🛡️ ${this.stat.armor}`).setColor('#ff8000ff'); // 빨간색 계열
        this.statTexts.manPower.setText(`👥 ${this.stat.manPower}`).setColor('#9b59b6'); // 파란색 계열
        //this.statTexts.archer.setText(`🏹 ${this.stat.archer}`).setColor('#2ecc71'); // 초록색 계열
        //this.statTexts.witch.setText(`🪄 ${this.stat.witch}`).setColor('#3498db'); // 보라색 계열
        this.statTexts.archer.setText(`🏹 ${this.stat.archer} (-💸${this.stat.archerCost*this.stat.archer})`).setColor('#2ecc71'); // 초록색 계열
        this.statTexts.witch.setText(`🪄 ${this.stat.witch} (-💸${this.stat.witchCost*this.stat.witch})`).setColor('#3498db'); // 보라색 계열
        
        this.statTexts.armor.setDepth(22);
        this.statTexts.manPower.setDepth(22);
        this.statTexts.gold.setDepth(22);
        this.statTexts.archer.setDepth(22);
        this.statTexts.witch.setDepth(22);

        if(this.nextWaveBtn){
            this.nextWaveBtn.setText(`다음 웨이브${upkeepCost>0 ? ` (-💸${upkeepCost})` : ''}`);
        }
    }
    drawPauseMenu(){
        const { width, height } = this.cameras.main;
        this.pauseMenu = this.add.container(0, 0).setVisible(this.isPaused);
        const pauseBg = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
        const pauseText = this.add.text(width/2, height/2 -50, 'PAUSED', { fontSize: '48px', fill: '#ffffff' }).setOrigin(0.5);
        const pauseInfoText = this.add.text(width/2,height/2-10, 'Please press ⏸ icon or ESC key to continue',{ fontSize: '24px', fill: '#ffffff' }).setOrigin(0.5);
        this.pauseMenu.add([pauseBg, pauseText, pauseInfoText]);

         //전체화면버튼
        const fullscBt = this.makeButton(200,50, width/2, 430, '🖥️Fullscreen');
        fullscBt.on('pointerdown', () => {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen(); // 전체화면 끄기
                fullscBt.text.setText('🖥️Fullscreen');
            } else {
                this.scale.startFullscreen(); // 전체화면 켜기
                fullscBt.text.setText('❌Exit Full');
            }
        });

        //재시작버튼
        const restartBt = this.makeButton(200,50,width/2,500, 'Restart');
        restartBt.on('pointerdown', () => {

            this.saveLoadScene.showConfirmPopup( '정말로 재시작하겠습니까?\n(페이지를 새로고침 합니다)',
                
                () => {
                    this.restartGame();
                }
            )
            
        });

        this.pauseMenu.add( [fullscBt,restartBt] );
        
        this.pauseMenu.setDepth(200); // 다른 UI 요소들보다 위에 표시

    }
    makeButton(sizeX, sizeY, posX, posY, text) {
        // 1️⃣ 박스와 텍스트를 하나로 묶어줄 '컨테이너'를 생성합니다.
        // 💡 팁: 컨테이너의 기준 좌표를 posX, posY로 잡으면 관리하기 편합니다.
        const buttonContainer = this.add.container(posX, posY);

        // 2️⃣ 박스를 생성합니다. 
        // 💡 컨테이너 내부로 들어갈 오브젝트들은 좌표를 중심점(0, 0) 기준으로 잡아야 정중앙에 배치됩니다.
        const box = this.add.rectangle(0, 0, sizeX, sizeY, 0x444444)
            .setStrokeStyle(2, 0xffffff)
            .setOrigin(0.5);

        // 3️⃣ 텍스트를 생성합니다. (박스 한가운데 오도록 0, 0 지정)
        const txt = this.add.text(0, 0, text, {
            fontSize: '24px',
            fill: '#ffffff',
            padding: { x: 5, y: 5 }
        }).setOrigin(0.5);

        // 4️⃣ 컨테이너 바구니안에 박스와 텍스트를 차례대로 집어넣습니다.
        buttonContainer.add([box, txt]);

        // 5️⃣ 컨테이너에 직접 마우스 이벤트를 걸 수 있도록 설정합니다.
        // (자식인 box의 히트 영역을 그대로 컨테이너 크기로 가져옵니다.)
        buttonContainer.setSize(sizeX, sizeY);
        buttonContainer.setInteractive({ useHandCursor: true });

        // 6️⃣ 🌟 딱 '하나'의 컨테이너 객체만 리턴합니다!
        // 외부에서 쉽게 텍스트나 박스에 접근할 수 있도록 커스텀 프로퍼티로 묶어서 보냅니다.
        buttonContainer.box = box;
        buttonContainer.text = txt;

        return buttonContainer;
    }
    showResultWindow( data ) {
        this.setSkillUIVisibility(false);
        this.nextStageBtn.setVisible(false); // 숫자가 올라가는 동안 버튼은 숨김
        // 1. 폰트 스타일 설정 (테두리를 주어 가독성 확보)
        const labelStyle = {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '36px',
            fill: '#ffffff',
            stroke: '#111111',
            strokeThickness: 4
        };
    // 💡 [핵심 1] 이전 호출로 만들어진 텍스트들이 남아있다면 완전히 파괴(destroy)합니다.
        if (this.resultTexts) {
            this.resultTexts.forEach(textObj => {
                if (textObj && textObj.active) {
                    textObj.destroy(); 
                }
            });
        }
        // 새 텍스트 객체들을 담을 배열 초기화
        this.resultTexts = [];

        // 💡 [핵심 2] 실행 중이던 이전 타이머나 트윈이 있다면 전부 강제로 멈춥니다.
        // (결과창이 뜨는 도중에 게임이 재시작되거나 다시 호출되었을 때 꼬이는 걸 방지)
        this.tweens.killTweensOf(this.resultWindow);

        // 2. 각 항목의 텍스트 객체를 빈 상태('')로 생성하여 resultWindow에 장착
        // 세로 위치(Y)를 40px 간격으로 나란히 배치합니다.
        const Ypos =-140;
        const txtMobs = this.add.text(0, Ypos -40,'', labelStyle).setOrigin(0.5);
        const txtConv = this.add.text(0, Ypos + 20, '', labelStyle).setOrigin(0.5);

        const txtGold = this.add.text(0, Ypos + 100, '', labelStyle).setOrigin(0.5);
        const txtFee1 = this.add.text(0, Ypos + 160, '', labelStyle).setOrigin(0.5);
        const txtFee2 = this.add.text(0, Ypos + 210, '', labelStyle).setOrigin(0.5);
        const txtDeath = this.add.text(0, Ypos + 260, '', labelStyle).setOrigin(0.5);

        const txtTotal = this.add.text(0, Ypos + 330, '', { ...labelStyle, fontSize: '40px', fill: '#ffcc00' }).setOrigin(0.5);
        this.resultWindow.add([txtMobs, txtConv, txtGold, txtFee1, txtFee2, txtDeath, txtTotal]);
        // 💡 바구니에 저장해두어 다음 호출 때 지울 수 있게 합니다.
        this.resultTexts.push(txtMobs, txtConv, txtGold, txtFee1, txtFee2, txtDeath, txtTotal);

        // 3. ⏱️ 시간차(Delay)를 두고 텍스트를 하나씩 채워나가는 연출
        console.log('Result Data:', data); // 전달된 데이터 확인 (디버깅용)

        // 0.4초 뒤: 쓰러트린 적 표시
        this.time.delayedCall(400 , () => {
            txtMobs.setText(`⚔️ 쓰러트린 적 : ${data.mobNumber} 마리`);
            // 가벼운 사운드 효과를 원하시면 여기에 추가: this.sound.play('tick');
        });

        this.time.delayedCall(700 , () => {
            txtConv.setText(`👥 개종시킨 적 : ${data.earnManpower} 마리`);
            // 가벼운 사운드 효과를 원하시면 여기에 추가: this.sound.play('tick');
        });

        // 0.8초 뒤: 획득한 골드 표시
        this.time.delayedCall(1200 , () => {
            txtGold.setText(`💰 획득한 골드 : +${data.earnGold.toLocaleString()} G`);
        });

        // 1.2초 뒤: 유지비 표시
        this.time.delayedCall(1600, () => {
            txtFee1.setText(`💸 유지비 (🏹) : -${(data.archerCost*data.archer).toLocaleString()} G (${data.archer}x${data.archerCost})`).setColor('#ff4d4d');
        });
        this.time.delayedCall(2000 , () => {
            txtFee2.setText(`💸 유지비 (🪄) : -${(data.witchCost*data.witch).toLocaleString()} G (${data.witch}x${data.witchCost})`).setColor('#ff4d4d');
        });
        //게리슨 사망자 표시
        this.time.delayedCall(2600 , () =>{
            txtDeath.setText(`💀 주둔군 손실 : 🏹${(data.archerDeath).toLocaleString()} 명, 🪄${(data.witchDeath).toLocaleString()} 명`).setColor('#ff4d4d');
        
        });


        // 1.8초 뒤: 최종 금액 표시 (중요하므로 살짝 타이밍을 더 끌고 숫자가 올라가는 연출 추가!)
        this.time.delayedCall(3200 , () => {
            // 단순히 글자가 뜨는 게 아니라 숫자가 0부터 총 금액까지 차오르는 연출(Tween)
            const scoreCounter = { value: 0 };
            this.tweens.add({
                targets: scoreCounter,
                value: data.earnGold - (data.archerCost*data.archer) - (data.witchCost*data.witch), // 최종 금액
                duration:  1200,// 1200ms 동안 숫자가 드르륵 올라감
                ease: 'Power1',
                onUpdate: () => {
                    txtTotal.setText(`👑 총 금액 : ${Math.floor(scoreCounter.value).toLocaleString()} G`);
                    
                },
                onComplete: () => {
                    // 숫자가 다 올라갔을 때 글씨가 살짝 커졌다가 돌아오는 강조 이펙트
                    if(scoreCounter.value<0){ //scoreCounter.value or this.gold
                        //음수인 경우 적자계산
                        this.time.delayedCall(500, () =>{
                            this.garrisonLose ='archer';
                                this.garrisonLoseEvent = this.time.addEvent({
                                    delay: 300,
                                    callback: () => {
                                        //
                                        if(this.garrisonLose=='archer'){
                                            data.archerDeath++;
                                            scoreCounter.value += data.archerCost;
                                            this.gold += data.archerCost;
                                            this.stat.archer --;

                                            this.garrisonLose ='witch';

                                        }else if(this.garrisonLose =='witch'){
                                            data.witchDeath++;
                                            scoreCounter.value += data.witchCost;
                                            this.gold += data.witchCost;
                                            this.stat.witch --;

                                            this.garrisonLose = 'archer';
                                        }

                                        this.registry.set('gold', this.gold);
            txtFee1.setText(`💸 유지비 (🏹) : -${(data.archerCost*data.archer).toLocaleString()} G (${data.archer}x${data.archerCost})`).setColor('#ff4d4d');
            txtFee2.setText(`💸 유지비 (🪄) : -${(data.witchCost*data.witch).toLocaleString()} G (${data.witch}x${data.witchCost})`).setColor('#ff4d4d');
            txtDeath.setText(`💀 주둔군 손실 : 🏹${(data.archerDeath).toLocaleString()} 명, 🪄${(data.witchDeath).toLocaleString()} 명`).setColor('#ff4d4d');
            txtTotal.setText(`👑 총 금액 : ${Math.floor(scoreCounter.value).toLocaleString()} G`);

                                        if( scoreCounter.value >=0){ //this.gold
                                            //다음스테이지
                                            this.garrisonLoseEvent.remove();
                                            this.nextStageBtn.setVisible(true);

                                            this.tweens.add({
                                                targets: txtTotal,
                                                scale: 1.3,
                                                duration: 400,
                                                yoyo: true,
                                                ease: 'Quad.easeInOut'
                                            });
                                        }
                                        
                                    },
                                    loop: true
                                });

                        });

                    }else{
                        //다음 스테이지
                         this.nextStageBtn.setVisible(true); 

                        this.tweens.add({
                            targets: txtTotal,
                            scale: 1.3,
                            duration: 400,
                            yoyo: true,
                            ease: 'Quad.easeInOut'
                        });
                    }

                   

                }
            });
        });
    }


    createResultWindow(){
        //스테이지 완료 후 정산 페이지
        const { width, height } = this.cameras.main;
        this.resultWindow = this.add.container(width / 2, height / 2).setVisible(false);
        const bg = this.add.rectangle(0, 0, width, height, 0x222222, 0.9);//.setStrokeStyle(2, 0xffffff);
        this.resultWindow.add(bg);

         // 점수 텍스트
         this.resultScoreText = this.add.text(0, -50, '', { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);
         this.resultWindow.add(this.resultScoreText);
        

         // 다음 스테이지 버튼
        this.nextStageBtn = this.makeButton(200,60,0,280,'Continue');
        this.nextStageBtn.on('pointerdown', () => {
            if(this.gold<0){
                //음수인 경우 게임진행 불가
                /*
                this.data.archerDeath++;
                 this.data.earnGold += this.data.archerCost;
                this.gold += this.data.archerCost;
                this.stat.archer --;

                this.data.witchDeath++;
                this.data.earnGold += this.data.witchCost;
                this.gold += this.data.witchCost;
                this.stat.witch --;
                this.registry.set('gold', this.gold);
                this.showResultWindow( this.data, 0);//즉시갱신
                */

            }else{
                 this.resultWindow.setVisible(false);
                this.upgradeWindow.setVisible(true);
                this.saveButton.setText('💾저장하기');
                this.drawHealthBar(this.healthBar, 60, 50 ); // 위치
            }
            
         });
         this.nextStageBtn.setVisible(false);
         this.resultWindow.add(this.nextStageBtn);


         this.resultWindow.setDepth(30); // 다른 UI 요소들보다 위에 표시
         this.resultWindow.setVisible(false);
    }

    createUpgradeWindow() {
        const { width, height } = this.cameras.main;

        // 1. 메인 컨테이너
        this.upgradeWindow = this.add.container(width / 2, height / 2).setVisible(false);
        
        // 배경판
        const bg = this.add.rectangle(0, 0, width, height, 0x222222, 0.9);//.setStrokeStyle(2, 0xffffff);
        this.upgradeWindow.add(bg);
        bg.setDepth(0); // 배경이 제일 뒤에 있도록

        const bg2 = this.add.rectangle(-width/2+150, 0, 250, height, 0x222222, 0.9);
        this.upgradeWindow.add(bg2);

        // 2. 내용이 표시될 서브 컨테이너 (여기에 리스트를 그립니다)
        this.contentArea = this.add.container(0, -120); 
        this.upgradeWindow.add(this.contentArea);


        // 1. 데이터 정의

        const title = this.add.text(0, -240, '업그레이드', { fontSize: '36px', fill: '#ffffff', padding:{x:3,y:3} }).setOrigin(0.5);
        this.upgradeWindow.add(title);

        //this.costTxt = this.add.text(0, 220, `Cost : ${0}`, { fontSize: '28px', fill: '#ff0', padding:{x:3,y:3} }).setOrigin(0.5);
        //this.upgradeWindow.add(this.costTxt);    
        //this.fcostTxt(this.registry.get('gold') || 0); // 초기 비용 텍스트 설정
        const nextBg = this.add.rectangle(width/2-220 , 280, 320,  60,  0x444444).setStrokeStyle(2, 0xffffff)
                .setInteractive({ useHandCursor: true }).setOrigin(0.5)
        this.nextWaveBtn = this.add.text(width/2-220, 280, '다음 웨이브', {
            fontSize: '28px',
            fill: '#ffffff',
            padding: { x: 30, y: 20 }
        })
        .setOrigin(0.5)
        nextBg.on('pointerdown', () => {
            this.nextGameStart();
        });
        this.upgradeWindow.add([nextBg, this.nextWaveBtn]);

        //저장버튼
        const saveBg = this.add.rectangle(-width/2 +150 , 280, 200,  60,  0x444444).setStrokeStyle(2, 0xffffff)
                .setInteractive({ useHandCursor: true }).setOrigin(0.5);
        this.saveButton = this.add.text(-width/2 +150 , 280, '💾저장하기', {
            fontSize: '28px',
            fill: '#ffffff',
            padding: { x: 30, y: 20 }
        })
        .setOrigin(0.5);
        saveBg.on('pointerdown', (pointer, localX, localY, event) => {
            this.saveLoadScene.saveWindowVisible(true,'savedata');
            return;
            
        // 2. 객체를 문자열(JSON)로 변환하여 브라우저에 저장합니다.
        // 'projectCD_data'는 우리 게임만의 고유한 저장소 이름입니다.
        localStorage.setItem('projectCD_data', JSON.stringify(gameData));

            if (pointer && pointer.event) pointer.event.preventDefault();
            // 💡 함수를 호출하면서 문구와 실행할 로직을 던져줍니다.
            this.showConfirmPopup(
                '게임 진행 상황이 저장됩니다.\n계속하시겠습니까?', 
                () => {
                    this.scene.get('GameScene').saveGame();
                    this.saveButton.setText('저장완료!');
                }
            );
        });
        this.upgradeWindow.add([saveBg, this.saveButton]);

        // 2. 카테고리 이름들만 배열로 추출
        // 결과: ['지휘소', '성당', '궁수양성소', '마술사의 샘']
        // 레지스트리에서 최신 업그레이드 정보 가져오기
        const allUpgrades = this.registry.get('playerUpgrades');
        const categories = Object.keys(allUpgrades);
        const categoryNames = {
            'stronghold':'🏰건축소',
            'cathedral' :'⛪대성당',
            'barracks' : '🏹훈련소',
            'magichall' : '🪄마술사의 샘'
        }

        // 3. 추출된 이름을 바탕으로 버튼 생성
       categories.forEach((name, index) => {
             if(this.selectedCategory === null) {
                this.selectedCategory = name;
                this.showCategory(name); // 첫 번째 카테고리 자동 선택
            }

            const xPos = -200 + (index * 150); // 150px 간격으로 배치
            const yPos = -190;

            // 1. 배경 사각형 (모두 동일한 120x40 사이즈)
            const bg = this.add.rectangle(xPos, yPos, 140, 50, this.selectedCategory === name ? 0x5555ff : 0x444444).setStrokeStyle(2, 0xffffff)
                .setInteractive({ useHandCursor: true });
                this.buttons.push(bg); // 버튼을 배열에 저장
            // 2. 버튼 텍스트 (사각형 중앙에 배치)
            const txt = this.add.text(xPos, yPos, categoryNames[name], { 
                fontSize: '18px', 
                color: '#ffffff' ,
                padding:{x:3,y:3}
            }).setOrigin(0.5); // 중심점을 중앙으로 설정

            // 버튼 클릭 이벤트는 배경(bg)에 겁니다.
            bg.on('pointerdown', () => {
                this.selectedCategory = name; // 선택된 카테고리 업데이트
                 // 모든 버튼의 배경색을 기본으로 초기화
                 for(let btn of this.buttons) {
                    if (btn instanceof Phaser.GameObjects.Rectangle) {
                        btn.setFillStyle(0x444444);
                    }
                };
                
                // 클릭된 버튼의 배경색을 강조 색으로 변경
                    bg.setFillStyle(0x5555ff);
                    this.showCategory(name);
                });

            this.upgradeWindow.add([bg, txt]);
            
        });
        this.upgradeWindow.setDepth(11); // hp바와 pause사이
    }
    
    showCategory(categoryName) {
        const { width, height } = this.cameras.main;
        const X = -400; // 텍스트 시작 X 좌표
        const Y = 80; // 텍스트 시작 Y 좌표

        // 1. 기존 리스트 싹 비우기 (중요!)
        this.contentArea.removeAll(true);

        // 2. 레지스트리에서 데이터 가져오기
        const allUpgrades = this.registry.get('playerUpgrades');
        const categoryItems = allUpgrades[categoryName];

        if (!categoryItems) return; // 데이터가 없으면 중단

        categoryItems.forEach((item, index) => {
            //console.log(`업그레이드 항목:`, item.name);

            // y 좌표를 index를 활용해 아래로 나열 (간격 50px)
            const yPos = index * 80;

            // 항목 이름 및 레벨 텍스트
            let itemDisplayName = item.name;
            
            if(item.unlock){
                itemDisplayName = item.level < 0 ?  item.name : (item.maxLevel > 1 ? `${item.name}(Lv.${item.level}/${item.maxLevel})` : item.name);
            }else{
                itemDisplayName = `${item.name}(해금필요)`;
            }
            
            
            if(item.manPower){
                itemDisplayName = `${item.name}(현재 ${this.stat[item.tag]}명)`;
            }
            const itemText = this.add.text(X + 100, yPos, itemDisplayName, {
                fontSize: '32px',
                padding: { x: 3, y: 3 }
            });
            const itemInfo = this.add.text(X +100, yPos+35,`${item.info}`,{
                fontSize: '20px',
                padding: { x: 3, y: 3 }
            });

            // 강화 버튼
            let btnName = '';
            let btnColor='#ff0';
            
            if( item.manPower){
                //고용인 경우
                 btnName = '고용';
                btnColor='#ff0';
            }else if(item.maxLevel>1){
                if(item.level < item.maxLevel ){
                    btnName = '강화';
                    btnColor='#ff0';
                }else{
                    btnName = '최대';
                    btnColor = '#888';
                }
            }else{
                if(item.unlock){
                    btnName = '해금됨';
                    btnColor = '#888';
                
                }else{
                    //해금
                    btnName = '해금';
                    btnColor='#ff0';
                }
            }
            
             const bg = this.add.rectangle(width/2-120, yPos+25, 160, 60, 0x444444).setStrokeStyle(2, 0xffffff)
                .setInteractive({ useHandCursor: true });
                
            
            const upBtn = this.add.text(width/2-120, yPos+25, item.level <item.maxLevel ? `${btnName}(💰${item.cost.toLocaleString()})` : `${btnName}`, { 
                fontSize: '24px', 
                color:  btnColor,
                padding: { x: 8, y: 8 },
                align: 'center'
            }).setOrigin(0.5);

            bg.on('pointerdown', () => {
                if(item.level < item.maxLevel){
                    //console.log(`${item.name} 강화 클릭!`);
                    // 여기에 강화 로직 처리 (이벤트 emit 등)
                    
                    //console.log(`${item.name} 버튼 클릭! 현재 레벨: ${item.level}, 최대 레벨: ${item.maxLevel}`);
                    this.scene.get('GameScene').events.emit('attempt-upgrade', categoryName,item.tag);
                    this.showCategory(categoryName); // 리스트 새로고침
                }
            });

            // 컨테이너에 추가
            this.contentArea.add([itemText, itemInfo, bg, upBtn]);
        });
    }

    // 일시정지 버튼을 눌렀을 때
    togglePause() {
        if(this.upgradeWindow.visible){return}//업그레이드 중에는 일시정지 토글 안되게

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

    //스킬표시 UI
    /**
     * 💡 모든 스킬 상자 UI의 가시성을 한 번에 조절하는 함수
     * @param {boolean} isVisible - true면 보이고, false면 숨겨집니다.
     */
    setSkillUIVisibility(isVisible) {
        if (!this.skillUIComponents) return;
        //this.manaBar.setVisible(isVisible);
        //this.manaTxt.setVisible(isVisible);

        Object.keys(this.skillUIComponents).forEach(tag => {
            const comp = this.skillUIComponents[tag];
            
            if (comp) {
                // 1. 기본 바탕 불투명 상자 숨김/보임
                if (comp.baseBox) comp.baseBox.setVisible(isVisible);
                
                // 2. 쿨타임 회전 그림자 레이어 숨김/보임
                if (comp.coolShadow) comp.coolShadow.setVisible(isVisible);
                
                // 3. 중앙 스킬 텍스트 글씨 숨김/보임
                if (comp.text) comp.text.setVisible(isVisible);

                // 💡 [핵심] 삐져나감을 막아주던 사각형 마스크 틀 자체도 함께 숨겨야 잔상이 안 남습니다!
                if (comp.maskGraphics) comp.maskGraphics.setVisible(isVisible);
            }
        });

        // 스킬 상자 자체를 숨길 때는 오작동 방지를 위해 현재 장전(토글)된 상태를 풀어줍니다.
        if (!isVisible) {
            this.deactivateAllSkills();
        }
    }
    clearSkillUI() {
        if (!this.skillUIComponents) return;

        // 보관함에 들어있는 모든 스킬의 그래픽스와 텍스트를 순회하며 완전히 파괴합니다.
        Object.keys(this.skillUIComponents).forEach(tag => {
            const comp = this.skillUIComponents[tag];
            if (comp) {
                if (comp.baseBox) comp.baseBox.destroy();       // 바탕 상자 제거 (이벤트도 자동 해제됨)
                if (comp.coolShadow) comp.coolShadow.destroy(); // 쿨타임 그림자 제거
                if (comp.maskGraphics) comp.maskGraphics.destroy(); // 사각형 마스크 제거
                if (comp.text) comp.text.destroy();             // 텍스트 객체 제거
            }
        });

        // 바구니 자체를 완전히 빈 객체로 초기화합니다.
        this.skillUIComponents = {};
        this.activeSkillTag = null; // 장전 상태도 초기화
    }
    createSkillUI() {
        this.clearSkillUI();
        const { width, height } = this.cameras.main;
        const size = 80; // 사각형 상자 크기 (60x60)
        const size2 = 96;

        // 1. 데이터 베이스 참조 (스킬 리스트)
        this.skills = this.registry.get('skills');

        //activeSkillBt 시전 박스
        this.activeSkillBox = this.add.container(0,0);
        const activeskbox = this.add.graphics();
        activeskbox.fillStyle(0x0076d7, 1).fillRect( -size2 / 2, -size2 / 2, size2, size2);
        this.activeSkillBox.add( activeskbox);


        // 현재 활성화(토글 ON)된 스킬의 tag를 기억할 변수
        this.activeSkillTag = null; 
        const activatedSkills = this.skills.filter(item => item.unlock)  //배열 아이템 중 특정 변수값이 true 인 경우 getMatching('unlock',true);
        //console.log(activatedSkills);
        const spacing = 100; // 아이콘 간격
        const startX = width/2 - (activatedSkills.length/2)*spacing + spacing/2; // 스킬 바 시작 X 위치
        const startY = height-50;

        this.skillUIComponents = {};

        activatedSkills.forEach((skill, index) => {
            if (!skill.unlock) return;

            const x = startX + (index * spacing);
            const y = startY;
            

            // 1. 🔲 기본 바탕 상자 (언제나 불투명한 은은한 흑색)
            const baseBox = this.add.graphics();
            baseBox.fillStyle(0x222222, 1);
            baseBox.fillRect(x - size / 2, y - size / 2, size, size);
            baseBox.lineStyle(2, 0xaaaaaa, 1);
            baseBox.strokeRect(x - size / 2, y - size / 2, size, size);
            

            // 3. 🍕 [핵심] 시계방향 피자 조각 모양을 연출할 마스크 그래픽스 생성
            const maskGraphics = this.add.graphics();
            maskGraphics.fillStyle(0xffffff, 1);
            // 💡 상자 크기와 완벽하게 일치하는 사각형을 마스크 베이스로 삼습니다.
            maskGraphics.fillRect(x - size / 2, y - size / 2, size, size);
            
            const coolShadow = this.add.graphics();
            const mask = maskGraphics.createGeometryMask();
            coolShadow.setMask(mask);
            
            

            // 4. 🖱️ 마우스 터치 히트 영역 지정 (바탕 상자 기준)
            const hitArea = new Phaser.Geom.Rectangle(x - size / 2, y - size / 2, size, size);
            baseBox.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

            // 5. 전면 글자 배치
            const fontStyle = {
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: '28px',
                fill: '#aaaaaa',
                align: 'center'
            };
            const labelText = this.add.text(x, y, `${skill.name}\n${skill.mp}MP`, fontStyle).setOrigin(0.5);

            // 6. 모든 데이터를 바구니에 저장
            this.skillUIComponents[skill.tag] = {
                baseBox: baseBox,
                coolShadow: coolShadow,
                maskGraphics: maskGraphics,
                text: labelText,
                skillData: skill,
                size: size,
                startX: x,
                startY: y,
                // 💡 [핵심 추가] 현재 UI의 시각적 상태를 기록해 둡니다. (기본값 'normal')
                uiState: 'normal'
            };

            // 7. 클릭(토글) 이벤트
            baseBox.on('pointerdown', () => {
                if (skill.cooltime > 0) return;

                if (this.activeSkillTag === skill.tag) {
                    this.deactivateAllSkills();
                } else {
                    this.deactivateAllSkills();
                    this.activeSkillTag = skill.tag;
                    
                    // 토글 ON: 테두리를 황금색으로 변경
                    baseBox.clear();
                    baseBox.fillStyle(0x332a00, 1);
                    baseBox.fillRect(x - size / 2, y - size / 2, size, size);
                    baseBox.lineStyle(4, 0x0076d7, 1);
                    baseBox.strokeRect(x - size / 2, y - size / 2, size, size);
                    
                    labelText.setFill('#0076d7');
                    labelText.setScale(1.1);
                }
            });
            
        });
       
    }
    /**
     * 모든 스킬의 불빛을 끄고 초기 비활성화 색상으로 되돌리는 함수
     */
    deactivateAllSkills() {
        this.activeSkillTag = null;
        if (!this.skillUIComponents) return;

        Object.keys(this.skillUIComponents).forEach(tag => {
            const comp = this.skillUIComponents[tag];
            
            comp.baseBox.clear();
            comp.baseBox.fillStyle(0x222222, 1);
            comp.baseBox.fillRect(comp.startX - comp.size / 2, comp.startY - comp.size / 2, comp.size, comp.size);
            comp.baseBox.lineStyle(2, 0xaaaaaa, 1);
            comp.baseBox.strokeRect(comp.startX - comp.size / 2, comp.startY - comp.size / 2, comp.size, comp.size);
            
            comp.text.setFill('#aaaaaa');
            comp.text.setScale(1.0);
        });
    }
    update(time, delta) {
        if(!this.wave || this.waveBar ==null){
            return;
        }
        if(this.isPaused){
            return;
        }
        if (this.timer > 0) {
            // delta는 이전 프레임에서 지난 시간(ms)입니다. (보통 1프레임당 약 16.6ms)
            this.timer -= delta; 

            if (this.timer <= 0) {
                this.timer = 0;
            }
            this.drawWaveBar(this.waveBar)
        }
        
        if(this.stat.witch>0){
            this.manaBar.setVisible(true);
            this.manaTxt.setVisible(true);
            this.stat.maxMp = this.stat.witch*10;
            if(this.stat.mp > this.stat.maxMp) this.stat.mp = this.stat.maxMp;

            if(this.stat.mp < this.stat.maxMp){
                this.stat.mp += delta * this.stat.witch*0.001;
                if(this.stat.mp>this.stat.maxMp) this.stat.mp = this.stat.maxMp;
                //마나 창
            }
            this.drawManaBar( this.manaBar);
        }else{
            this.manaBar.setVisible(false);
            this.manaTxt.setVisible(false);
        }
        if(this.activeSkillTag!=null){
            this.activeSkillBox.setVisible(true);
        }else{
            this.activeSkillBox.setVisible(false);
        }
       
        if (!this.skillUIComponents) return;
    
            const firstKey = Object.keys(this.skillUIComponents)[0];
            if (firstKey && !this.skillUIComponents[firstKey].baseBox.visible) return;

            const gameScene = this.scene.get('GameScene');
            const currentMp = gameScene.stat ? gameScene.stat.mp : 0; 

            this.skills.forEach(skill => {
                const comp = this.skillUIComponents[skill.tag];
                if (!comp) return;
                
                if(skill.tag == this.activeSkillTag){
                    //지금 스킬이 액티브 스킬박스와 같다면?
                    //console.log(comp.startX, comp.startY);
                    this.activeSkillBox.x = comp.startX;
                    this.activeSkillBox.y = comp.startY;
                }

                // 1️⃣ [쿨타임 상태]
                if (skill.cooltime > 0) {
                    const coolSpeed = skill.mp>0? (1 + this.stat.witch * 0.1 ) : 1 ; //witch의 스킬인 경우
                    skill.cooltime -= delta * coolSpeed;
                    comp.uiState = 'cooldown'; // 상태 변경

                    const remainingSec = (skill.cooltime / (1000 * coolSpeed)).toFixed(1)
                    const displaySec = remainingSec > 0 ? remainingSec : '0.0';
                    comp.text.setText(`${displaySec}s\nCOOL`);
                    comp.text.setFill('#ff4d4d');

                    const progress = skill.cooltime / skill.maxCooltime; 
                    comp.coolShadow.clear();
                    comp.coolShadow.fillStyle(0x000000, 0.6); 

                    // 12시 방향 시작 (-90도)
                    const startAngle = Phaser.Math.DegToRad(-90);

                    // 🌟 더하기(+) 대신 빼기(-)를 사용해 반시계 방향으로 각도를 도출합니다.
                    const endAngle = startAngle - Phaser.Math.DegToRad(360 * progress);

                    comp.coolShadow.clear();
                    comp.coolShadow.fillStyle(0x000000, 0.6); 

                    // 🌟 마지막 인자(Anticlockwise)를 false에서 true로 변경합니다.
                    comp.coolShadow.slice(comp.startX, comp.startY, comp.size * 1.5, startAngle, endAngle, true);
                    comp.coolShadow.fillPath();

                    comp.baseBox.lineStyle(2, 0xff4d4d, 0.8);
                    comp.baseBox.strokeRect(comp.startX - comp.size / 2, comp.startY - comp.size / 2, comp.size, comp.size);

                    if (this.activeSkillTag === skill.tag) {
                        //this.activeSkillTag = null;
                    }
                } 
                // 2️⃣ [대기 상태] 쿨타임이 아닐 때
                else {
                   // if (this.activeSkillTag === skill.tag) return;

                    // ❌ [마나 부족] 
                    if (currentMp < skill.mp) {
                        // 💡 이미 'low-mp' 상태라면 굳이 매 프레임 다시 그리지 않고 통과합니다.
                        
                        if (comp.uiState === 'low-mp') return;
                        comp.coolShadow.clear(); // 남아있을지 모를 쿨타임 잔상 완벽 소거
                        comp.uiState = 'low-mp'; // 상태 확정
                        comp.text.setText(`${skill.name}\n${skill.mp}MP`);
                        
                        comp.baseBox.clear();
                        comp.baseBox.fillStyle(0x111111, 1); // 어두운 흑색 바탕
                        comp.baseBox.fillRect(comp.startX - comp.size / 2, comp.startY - comp.size / 2, comp.size, comp.size);
                        comp.baseBox.lineStyle(2, 0x555555, 1); // 어두운 회색 테두리
                        comp.baseBox.strokeRect(comp.startX - comp.size / 2, comp.startY - comp.size / 2, comp.size, comp.size);

                        comp.text.setFill('#ff4d4d');
                    } 
                    // ⭕ [사용 가능] 마나가 충분할 때
                    else {
                        // 💡 이미 원래 상태('normal')라면 연산을 생략하여 최초 로딩 시 흰색으로 튀는 버그를 차단합니다.
                        if (comp.uiState === 'normal') return;
                        
                        comp.uiState = 'normal'; // 상태 복구

                        comp.text.setText(`${skill.name}\n${skill.mp}MP`);
                        comp.text.setFill('#aaaaaa'); // 명확하게 원래 회색 지정

                        // 🎨 대기 상태의 원래 스킬 상자 (0x222222) 새로 그리기
                        comp.coolShadow.clear(); // 남아있을지 모를 쿨타임 잔상 완벽 소거
                        comp.baseBox.clear();
                        comp.baseBox.fillStyle(0x222222, 1); 
                        comp.baseBox.fillRect(comp.startX - comp.size / 2, comp.startY - comp.size / 2, comp.size, comp.size);
                        comp.baseBox.lineStyle(2, 0xaaaaaa, 1); 
                        comp.baseBox.strokeRect(comp.startX - comp.size / 2, comp.startY - comp.size / 2, comp.size, comp.size);
                    }
                }
            });
        
    }
    

    // 4. 다시 시작 로직 함수
    restartGame() {
        // 완전 재시작 
        /*
        // 2. 💡 모든 씬을 완전히 종료(stop)하고 메인 화면으로 보내거나 GameScene을 처음부터 다시 켭니다.
        // 씬을 완전히 내렸다가(stop) 다시 시작하면 내부 이벤트 리스너들도 깨끗하게 청소됩니다.
        this.scene.stop('UIScene');
        this.scene.stop('GameScene');
        this.cameras.main.off(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE);
        // 3. 메인 메뉴 씬으로 완전히 돌아가서 처음부터 다시 시작하게 만듭니다.
        this.scene.start('MainMenuScene');
            */
        window.location.reload();
    }


}