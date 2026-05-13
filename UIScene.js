class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }
    isPaused = false;
    selectedCategory = null; // 현재 선택된 카테고리
    buttons = [];// 카테고리 버튼들을 저장할 객체
    upgradeWindow = null; // 업그레이드 창 컨테이너
    costTxt = null; // 비용 텍스트 객체
    create() {
        // 씬이 생성된 고유 ID 생성 (랜덤값)
        this.instanceId = Math.floor(Math.random() * 1000);

        this.selectedCategory = null; // 현재 선택된 카테고리
        this.buttons = []; // 카테고리 버튼들을 저장할 배열
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
        })
        this.gameOverMenu.add([overBg, this.scoreText, restartBtn]);
        this.gameOverMenu.setDepth(20); // 다른 UI 요소들보다 위에 표시

        // 1. 업그레이드 창 컨테이너 생성 함수 호출
        this.createUpgradeWindow();

        // 2. 특정 버튼을 누르거나 키보드를 눌렀을 때 창을 띄우는 이벤트
        this.input.keyboard.on('keydown-U', () => {
            const isVisible = this.upgradeWindow.visible;
            this.upgradeWindow.setVisible(!isVisible); // U키를 누를 때마다 토글
        });




        // 3. 이벤트 리스너 (GameScene에서 보낸 신호를 받음)
        const gameScene = this.scene.get('GameScene');
        
        gameScene.events.on('showPause', () => {
            this.pauseMenu.setVisible(true);
        });

        gameScene.events.on('hidePause', () => {
            this.pauseMenu.setVisible(false);
        });

        gameScene.events.on('showGameOver', (data) => {
            this.scoreText.setText(`SCORE: ${data.score.toLocaleString()}`);
            this.scene.pause('GameScene'); 
            this.gameOverMenu.setVisible(true);
        });

       

        // 점수 업데이트 이벤트 리스너
        // 'changedata-이름' 형식을 사용합니다.
        this.registry.events.off('changedata-score'); // 기존 리스너 제거 (중복 방지)
        this.registry.events.on('changedata-score', (parent, newValue) => {
            this.updateScore(newValue);
        });
        this.registry.events.off('changedata-castleHP');
        this.registry.events.on('changedata-castleHP', (parent, newValue) => {
            this.castleHP = newValue;
            this.drawHealthBar(this.healthBar);
        });
        this.registry.events.off('changedata-maxCastleHP');
        this.registry.events.on('changedata-maxCastleHP', (parent, newValue) => {
            this.maxCastleHP = newValue;
            this.drawHealthBar(this.healthBar);
        });
         // 'gold'라는 키의 데이터가 변할 때마다 showCategory를 다시 실행
        this.registry.events.off('changedata-gold');
        this.registry.events.on('changedata-gold', (parent, newValue) => {
            // 골드가 변경될 때마다 비용 텍스트 업데이트
             this.fcostTxt(newValue);
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
        //점수 및 체력 초기화
        this.hpText = this.add.text(90, 20, 'Castle HP: 100', {
            fontSize: '32px',
            fill: '#ff0000',
            fontStyle: 'bold'
        });
        this.hpText.setDepth(10); // UI 요소보다 위에 표시
        // 체력 바를 그릴 그래픽 객체 생성
        this.healthBar = this.add.graphics();
        this.drawHealthBar(this.healthBar, 90, 50 ); // 위치
        this.healthBar.setDepth(10); // UI 요소보다 위에 표시
           this.scoreText = this.add.text(config.width - 20, 20, 'Score: 0', {
            fontSize: '32px',
            fill: '#000000',
            fontStyle: 'bold'
        }).setOrigin(1, 0); // 기준점을 우측 상단으로 설정하여 글자가 왼쪽으로 늘어나게 함
        this.scoreText.setDepth(8);
        this.updateScore( this.registry.get('score') || 0);
        this.castleHP = this.registry.get('castleHP') || 100;
        this.maxCastleHP = this.registry.get('maxCastleHP') || 100;
        this.drawHealthBar(this.healthBar);
    

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
        

        this.events.once('shutdown', () => {
            this.registry.events.off('changedata-score'); // 기존 리스너 제거 (중복 방지)
            this.registry.events.off('changedata-castleHP');
            this.registry.events.off('changedata-maxCastleHP');
            this.registry.events.off('changedata-playerUpgrades'); // 기존 리스너 제거 (중복 방지)
            this.registry.events.removeAllListeners(); // 혹시 남아있을 수 있는 다른 리스너들도 모두 제거
        });
        
    }
    updateScore(points) {
        this.scoreText.setText('Score: ' + points);
    }
    drawHealthBar(graphics, x=90, y =50) {
        graphics.clear();

        // 1. 배경 (검정색)
        graphics.fillStyle(0x000000);
        graphics.fillRect(x, y, 200, 20);

        // 2. 현재 체력 (빨간색)
        // 체력 비율에 따라 가로 길이를 조절함 (200px * hp/100)
        graphics.fillStyle(0xff0000);
        graphics.fillRect(x, y, 200 * (this.castleHP / this.maxCastleHP), 20);

        // 3. 텍스트 업데이트
        this.hpText.setText(`Castle HP: ${this.castleHP}/${this.maxCastleHP}`);
    }

    createUpgradeWindow() {
        const { width, height } = this.cameras.main;

        // 1. 메인 컨테이너
        this.upgradeWindow = this.add.container(width / 2, height / 2).setVisible(false);
        
        // 배경판
        const bg = this.add.rectangle(0, 0, 800, 500, 0x222222, 0.9).setStrokeStyle(2, 0xffffff);
        this.upgradeWindow.add(bg);

        // 2. 내용이 표시될 서브 컨테이너 (여기에 리스트를 그립니다)
        this.contentArea = this.add.container(0, -50); 
        this.upgradeWindow.add(this.contentArea);

        // 1. 데이터 정의

        const title = this.add.text(0, -220, '업그레이드', { fontSize: '36px', fill: '#ffffff' }).setOrigin(0.5);
        this.upgradeWindow.add(title);

        const costTxt = this.add.text(0, 220, `Cost : ${0}`, { fontSize: '28px', fill: '#ff0' }).setOrigin(0.5);
        this.upgradeWindow.add(costTxt);    
        this.costTxt = costTxt; // 비용 텍스트 객체 저장
        this.fcostTxt(this.registry.get('gold') || 0); // 초기 비용 텍스트 설정
        // 2. 카테고리 이름들만 배열로 추출
        // 결과: ['지휘소', '성당', '궁수양성소', '마술사의 샘']
        // 레지스트리에서 최신 업그레이드 정보 가져오기
        const allUpgrades = this.registry.get('playerUpgrades');
        const categories = Object.keys(allUpgrades);

        // 3. 추출된 이름을 바탕으로 버튼 생성
       categories.forEach((name, index) => {
             if(this.selectedCategory === null) {
                this.selectedCategory = name;
                this.showCategory(name); // 첫 번째 카테고리 자동 선택
            }

            const xPos = -200 + (index * 130); // 130px 간격으로 배치
            const yPos = -170;

            // 1. 배경 사각형 (모두 동일한 120x40 사이즈)
            const bg = this.add.rectangle(xPos, yPos, 120, 40, this.selectedCategory === name ? 0x5555ff : 0x444444).setStrokeStyle(2, 0xffffff)
                .setInteractive({ useHandCursor: true });
                this.buttons.push(bg); // 버튼을 배열에 저장
            // 2. 버튼 텍스트 (사각형 중앙에 배치)
            const txt = this.add.text(xPos, yPos, name, { 
                fontSize: '18px', 
                color: '#ffffff' 
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
        this.upgradeWindow.setDepth(25); // 다른 UI 요소들보다 위에 표시
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
            const yPos = index * 50;

            // 항목 이름 및 레벨 텍스트
            const itemText = this.add.text(-320, yPos, `${item.name}${item.unlock ?  (item.level <= item.maxLevel && item.level>-1? ` (Lv.${item.level}/${item.maxLevel})` : ``): '(해금필요)'}`, {
                fontSize: '32px'
            });

            // 강화 버튼
            let btnName = '';
            let btnColor='#ff0';
            
            if(item.maxLevel>1){
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
            
             
            
            const upBtn = this.add.text(200, yPos, item.level <item.maxLevel ? `[${btnName} ${item.cost.toLocaleString()}]` : `[${btnName}]`, { 
                fontSize: '32px', 
                color:  btnColor
            }).setInteractive({ useHandCursor: true });

            upBtn.on('pointerdown', () => {
                if(item.level < item.maxLevel){
                    //console.log(`${item.name} 강화 클릭!`);
                    // 여기에 강화 로직 처리 (이벤트 emit 등)
                    
                    //console.log(`${item.name} 버튼 클릭! 현재 레벨: ${item.level}, 최대 레벨: ${item.maxLevel}`);
                    this.scene.get('GameScene').events.emit('attempt-upgrade', categoryName,item.tag);
                    this.showCategory(categoryName); // 리스트 새로고침
                }
            });

            // 컨테이너에 추가
            this.contentArea.add([itemText, upBtn]);
        });
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
        // 완전 재시작 
        this.registry.events.removeAllListeners(); // 리스너 싹 청소
        this.registry.reset(); // 데이터 싹 청소
        const gameScene = this.scene.get('GameScene');
        this.scene.stop('UIScene'); // UI 씬도 완전히 재시작
        gameScene.scene.restart(); 
    }
}