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
        this.instanceId = Math.floor(Math.random() * 1000);
        this.stat = this.registry.get('stat');
        this.isPaused=false;    
        this.selectedCategory = null; // 현재 선택된 카테고리
        this.buttons = []; // 카테고리 버튼들을 저장할 배열
        const { width, height } = this.cameras.main;

        // 1. 일시정지 화면 그룹
        this.pauseMenu = this.add.container(0, 0).setVisible(this.isPaused);
        const pauseBg = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
        const pauseText = this.add.text(width/2, height/2, 'PAUSED', { fontSize: '48px', fill: '#ffffff' }).setOrigin(0.5);
        const pauseInfoText = this.add.text(width/2,height/2+60, 'Please press ⏸ icon or ESC key to continue',{ fontSize: '24px', fill: '#ffffff' }).setOrigin(0.5);
        this.pauseMenu.add([pauseBg, pauseText, pauseInfoText]);
        this.pauseMenu.setDepth(20); // 다른 UI 요소들보다 위에 표시

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
        this.drawHealthBar(this.healthBar, 90, 50 ); // 위치
        
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
        }).setOrigin(0.5, 0); // 기준점을 중앙 상단으로 설정
        this.waveText.setDepth(18);
        
        this.waveBar = this.add.graphics();
        this.waveBar.setDepth(8);
        this.drawWaveBar(this.waveBar);

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
             this.fcostTxt(newValue);
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

        //게임 시작
        const savedData = localStorage.getItem('projectCD_data');
        if(savedData){
            this.scene.get('GameScene').setBgImage('background1',true);
            this.upgradeWindow.setVisible(true);
            this.currentCategory = 'stronghold'; // 기본 카테고리 설정
            this.showCategory(this.currentCategory);
            this.drawHealthBar(this.healthBar, 90, 50 ); // 위치
            this.drawStatText();
            this.wave = this.registry.get('wave');
            this.drawWaveBar(this.waveBar);
            
        }else{
            //저장된 데이터가 없으면 바로 게임 시작
            this.nextGameStart();
        }


        // html에서 설정한 전역 변수 가져오기 (없을 경우를 대비해 기본값 세팅)
        const currentVersion = window.GAME_VERSION || "알 수 없는 버전";

        // 화면 우측 하단 구석에 조그맣게 버전 표시
        const versionTxt = this.add.text(
            this.cameras.main.width - 10, 
            this.cameras.main.height - 10, 
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
        //versionTxt.setAlpha(0.5); // 너무 밝으면 방해되니 살짝 투명하게
        // 우측 하단 기준점(Origin) 정렬
        
        this.events.once('shutdown', () => {
            this.registry.events.off('changedata-wave');
            this.registry.events.off('changedata-score'); // 기존 리스너 제거 (중복 방지)
            this.registry.events.off('changedata-gold');
            this.registry.events.off('changedata-stat');
            this.registry.events.off('changedata-playerUpgrades'); // 기존 리스너 제거 (중복 방지)
            this.registry.events.removeAllListeners(); // 혹시 남아있을 수 있는 다른 리스너들도 모두 제거
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
    }
    nextGameStart(){
        this.drawStatText();
        this.upgradeWindow.setVisible(false);
        this.scene.get('GameScene').events.emit('startNextWave'); // GameScene에 다음 웨이브 시작 신호 보냄
        this.isPaused=false;
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
    drawHealthBar(graphics, x=90, y =50) {
        graphics.clear();

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
        this.hpText.setDepth(12);
    }
    drawStatText() {
        // 기존 텍스트 하나로 다 쓰던 것을 지우고, 각각 독립된 객체로 제어합니다.
        const X = -30; // 텍스트 시작 X 좌표
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
            //this.add.image(X+20,Y + 65, 'icon_armor').setOrigin(0, 0.5).setScale(0.8);
            this.statTexts.armor = this.add.text(X+50, Y + 65, '', textStyle).setOrigin(0, 0.5);

            // 👥 인원 아이콘과 텍스트 배치 (Y축 간격을 35px씩 띄웁니다)
            //this.add.image(X+20, Y + 100, 'icon_manpower').setOrigin(0, 0.5).setScale(0.8);
            this.statTexts.manPower = this.add.text(X+50, Y + 100, '', textStyle).setOrigin(0, 0.5);

            //🏹
            this.statTexts.archer = this.add.text(X+50, Y + 135, '', textStyle).setOrigin(0, 0.5);

            this.statTexts.witch = this.add.text(X+50, Y + 170, '', textStyle).setOrigin(0, 0.5);

        }

        // 💡 실제 값만 업데이트 (컬러링 추가로 시각 효과 극대화)
        let upkeepCost = 0;
        if(this.stat.archer > 0){
            upkeepCost += this.stat.archerCost*this.stat.archer; // 궁수 1명당 유지비 2골드
        }
        if(this.stat.witch > 0){
            upkeepCost += this.stat.witchCost*this.stat.witch; // 마법사 1명당 유지비 3골드
        }   

        this.statTexts.gold.setText(`💰 ${goldAmount} (-💸${upkeepCost})`).setColor('#f1c40f'); // 황금색
        this.statTexts.armor.setText(`🛡️ ${this.stat.armor}`).setColor('#ff8000ff'); // 빨간색 계열
        this.statTexts.manPower.setText(`👥 ${this.stat.manPower}`).setColor('#3498db'); // 파란색 계열
        this.statTexts.archer.setText(`🏹 ${this.stat.archer} (-💸${this.stat.archerCost})`).setColor('#2ecc71'); // 초록색 계열
        this.statTexts.witch.setText(`🪄 ${this.stat.witch} (-💸${this.stat.witchCost})`).setColor('#9b59b6'); // 보라색 계열
        this.statTexts.armor.setDepth(22);
        this.statTexts.manPower.setDepth(22);
        this.statTexts.gold.setDepth(22);
        this.statTexts.archer.setDepth(22);
        this.statTexts.witch.setDepth(22);
    }

    showResultWindow( data ) {
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
        const txtMobs = this.add.text(0, Ypos, '', labelStyle).setOrigin(0.5);
        const txtGold = this.add.text(0, Ypos + 60, '', labelStyle).setOrigin(0.5);
        const txtFee1 = this.add.text(0, Ypos + 130, '', labelStyle).setOrigin(0.5);
        const txtFee2 = this.add.text(0, Ypos + 190, '', labelStyle).setOrigin(0.5);
        const txtTotal = this.add.text(0, Ypos + 300, '', { ...labelStyle, fontSize: '40px', fill: '#ffcc00' }).setOrigin(0.5);
        this.resultWindow.add([txtMobs, txtGold, txtFee1, txtFee2,txtTotal]);
        // 💡 바구니에 저장해두어 다음 호출 때 지울 수 있게 합니다.
        this.resultTexts.push(txtMobs, txtGold, txtFee1, txtFee2, txtTotal);

        // 3. ⏱️ 시간차(Delay)를 두고 텍스트를 하나씩 채워나가는 연출
        console.log('Result Data:', data); // 전달된 데이터 확인 (디버깅용)
        // 0.4초 뒤: 쓰러트린 적 표시
        this.time.delayedCall(400, () => {
            txtMobs.setText(`⚔️ 쓰러트린 적 : ${data.mobNumber} 마리`);
            // 가벼운 사운드 효과를 원하시면 여기에 추가: this.sound.play('tick');
        });

        // 0.8초 뒤: 획득한 골드 표시
        this.time.delayedCall(1000, () => {
            txtGold.setText(`💰 획득한 골드 : +${data.earnGold.toLocaleString()} G`);
        });

        // 1.2초 뒤: 유지비 표시
        this.time.delayedCall(1400, () => {
            txtFee1.setText(`💸 유지비 (궁수) : -${(data.archerCost*data.archer).toLocaleString()} (${data.archer}x${data.archerCost}) G`).setColor('#ff4d4d');
        });
        this.time.delayedCall(1800, () => {
            txtFee2.setText(`💸 유지비 (마법사) : -${(data.witchCost*data.witch).toLocaleString()} (${data.witch}x${data.witchCost}) G`).setColor('#ff4d4d');
        });


        // 1.8초 뒤: 최종 금액 표시 (중요하므로 살짝 타이밍을 더 끌고 숫자가 올라가는 연출 추가!)
        this.time.delayedCall(2400, () => {
            // 단순히 글자가 뜨는 게 아니라 숫자가 0부터 총 금액까지 차오르는 연출(Tween)
            const scoreCounter = { value: 0 };
            
            this.tweens.add({
                targets: scoreCounter,
                value: data.earnGold - (data.archerCost*data.archer) - (data.witchCost*data.witch), // 최종 금액
                duration: 1200, // 1200ms 동안 숫자가 드르륵 올라감
                ease: 'Power1',
                onUpdate: () => {
                    txtTotal.setText(`👑 총 금액 : ${Math.floor(scoreCounter.value).toLocaleString()} G`);
                    
                },
                onComplete: () => {
                    // 숫자가 다 올라갔을 때 글씨가 살짝 커졌다가 돌아오는 강조 이펙트
                    this.nextStageBtn.setVisible(true); // 숫자가 올라가는 동안 버튼은 숨김
                    this.tweens.add({
                        targets: txtTotal,
                        scale: 1.2,
                        duration: 400,
                        yoyo: true,
                        ease: 'Quad.easeInOut'
                    });
                }
            });
        });
    }


    createResultWindow(){
        //스테이지 완료 후 정산 페이지
        const { width, height } = this.cameras.main;
        this.resultWindow = this.add.container(width / 2, height / 2).setVisible(false);
        const bg = this.add.rectangle(0, 0, width, height, 0x222222, 0.9).setStrokeStyle(2, 0xffffff);
        this.resultWindow.add(bg);

         // 점수 텍스트
         this.resultScoreText = this.add.text(0, -50, '', { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);
         this.resultWindow.add(this.resultScoreText);
        

         // 다음 스테이지 버튼
         this.nextStageBtn = this.add.text(0, 280, 'Continue', {
             fontSize: '28px',
             fill: '#ffffff',
             backgroundColor: '#333333',
             padding: { x: 30, y: 20 }
         })
         .setOrigin(0.5)
         .setInteractive({ useHandCursor: true });
         this.nextStageBtn.on('pointerdown', () => {
             this.resultWindow.setVisible(false);
             this.upgradeWindow.setVisible(true);
         });
         this.nextStageBtn.setVisible(false); // 초기에는 숨김
         this.resultWindow.add(this.nextStageBtn);


         this.resultWindow.setDepth(30); // 다른 UI 요소들보다 위에 표시
         this.resultWindow.setVisible(false);
    }

    createUpgradeWindow() {
        const { width, height } = this.cameras.main;

        // 1. 메인 컨테이너
        this.upgradeWindow = this.add.container(width / 2, height / 2).setVisible(false);
        
        // 배경판
        const bg = this.add.rectangle(0, 0, width, height, 0x222222, 0.9).setStrokeStyle(2, 0xffffff);
        this.upgradeWindow.add(bg);

        // 2. 내용이 표시될 서브 컨테이너 (여기에 리스트를 그립니다)
        this.contentArea = this.add.container(0, -120); 
        this.upgradeWindow.add(this.contentArea);

        // 1. 데이터 정의

        const title = this.add.text(0, -240, '업그레이드', { fontSize: '36px', fill: '#ffffff', padding:{x:3,y:3} }).setOrigin(0.5);
        this.upgradeWindow.add(title);

        this.costTxt = this.add.text(0, 220, `Cost : ${0}`, { fontSize: '28px', fill: '#ff0', padding:{x:3,y:3} }).setOrigin(0.5);
        this.upgradeWindow.add(this.costTxt);    
        this.fcostTxt(this.registry.get('gold') || 0); // 초기 비용 텍스트 설정

        const nextWaveBtn = this.add.text(100, 280, '다음 웨이브', {
            fontSize: '28px',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 30, y: 20 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true }); // 마우스 커서를 손모양으로 변경
        nextWaveBtn.on('pointerdown', () => {
            this.nextGameStart();
        });
        this.upgradeWindow.add(nextWaveBtn);

        //저장버튼
        this.saveButton = this.add.text(-110, 280, '저장하기', {
            fontSize: '28px',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 30, y: 20 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true }); // 마우스 커서를 손모양으로 변경
        this.saveButton.on('pointerdown', () => {
            if(confirm('게임 진행 상황이 저장됩니다. 계속하시겠습니까?')){
                this.scene.get('GameScene').saveGame();
                this.saveButton.setText('저장완료!');
            }else{
                return;
            }
            
        });
        this.upgradeWindow.add(this.saveButton);

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
    fcostTxt(newValue){
        if(this.costTxt){
            this.costTxt.setText(`Cost : ${newValue.toLocaleString()}`);
        }
    }
    showCategory(categoryName) {
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
            const itemText = this.add.text(-400, yPos, itemDisplayName, {
                fontSize: '32px',
                padding: { x: 3, y: 3 }
            });
            const itemInfo = this.add.text(-400, yPos+35,`${item.info}`,{
                fontSize: '20px',
                padding: { x: 3, y: 3 }
            });

            // 강화 버튼
            let btnName = '';
            let btnColor='#ff0';
            
            if( item.manPower){
                //고용인 경우
                 btnName = '고용';
                btnColor='rgba(0, 157, 255, 1)';
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
            
             const bg = this.add.rectangle(300+80, yPos+25, 160, 50, this.selectedCategory === name ? 0x5555ff : 0x444444).setStrokeStyle(2, 0xffffff)
                .setInteractive({ useHandCursor: true });
                
            
            const upBtn = this.add.text(300+80, yPos+25, item.level <item.maxLevel ? `${btnName}(-${item.cost.toLocaleString()})` : `${btnName}`, { 
                fontSize: '28px', 
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