class SaveLoadScene extends Phaser.Scene {
    constructor() {
        super('SaveLoadScene');
    }

    create() {
        this.loadData = null;

        
        const { width, height } = this.cameras.main;
        const backupData = localStorage.getItem( 'projectCD_data');
        console.log(backupData);
        //localStorage.removeItem('projectCD_data3');
        if(backupData){
            localStorage.setItem('projectCD_data1', backupData);
            localStorage.removeItem('projectCD_data');
        }
        this.storageName = 'projectCD_data';
        this.loadGameData = null;
        this.loadOption();
        this.saveOption();


        


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
    }
    saveWindowVisible(visible , key ='dataload'){
        
        if(this.saveWindow!=null){
            this.saveWindow.removeAll(true);
        }
        this.saveWindow = this.add.container(0, 0).setVisible(visible);
        

        if(!visible){
            return;   
        }

        const { width, height } = this.cameras.main;

        // 1. 🖤 뒷배경 어두운 반투명 가림막 생성
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRect(0, 0, width, height);
        bg.setDepth(1); // 배경 뎁스를 낮게 설정
        this.saveWindow.add(bg);
        // 💡 [핵심 해결책] 배경 전체를 마우스 클릭이 가능한 영역으로 선언합니다.
 
        // 💡 클릭 이벤트가 발생했을 때 아무것도 하지 않도록 비워둡니다.
        const screenRect = new Phaser.Geom.Rectangle(0, 0, width, height);
        bg.setInteractive(screenRect, Phaser.Geom.Rectangle.Contains);
        bg.on('pointerdown', (pointer) => {
            // 아무것도 작성하지 않거나, 빈 곳 클릭 시 창이 닫히게 하고 싶다면 기입 가능
            this.saveWindow.setVisible(false);
        });
        
        // 마우스 커서가 뒤쪽 버튼 모양(손가락)으로 변하는 것을 방지하기 위해 기본 화살표로 고정
        //bg.input.cursor = 'default';

        // 타이틀 텍스트
        this.titleTxt = this.add.text(width / 2, 100, '데이터 저장 / 불러오기', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '36px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(2);
        this.saveWindow.add(this.titleTxt);
      
        

        // 세로 슬롯 설정
        const startX = this.cameras.main.width / 2;
        const startY = 200;
        const spacingY = 150;
        const slotWidth = 600;
        const slotHeight = 130;

       
        
        for (let i = 0; i < 3; i++) {
            const slotIndex = i + 1;
            const y = startY + (i * spacingY);

            // 데이터 로드
            const saveData = this.loadSlotData(slotIndex);

            // 2. 🔲 슬롯 베이스 불투명 상자 생성 및 그리기
            const baseBox = this.add.graphics();
            baseBox.setDepth(2); // 💡 [핵심 해결책 2] 배경(bg)보다 무조건 앞으로 나오게 뎁스 설정
            
            // 🔥 [중요] 최초 실행 시 무조건 상자 형태를 강제로 그려줍니다.
            baseBox.fillStyle(0x222222, 0.7); 
            baseBox.fillRect(startX - slotWidth / 2, y - slotHeight / 2, slotWidth, slotHeight);
            baseBox.lineStyle(2, 0xaaaaaa, 1); 
            baseBox.strokeRect(startX - slotWidth / 2, y - slotHeight / 2, slotWidth, slotHeight);

            // 3. 🖱️ 클릭 및 터치 영역 강제 설정
            const hitArea = new Phaser.Geom.Rectangle(startX - slotWidth / 2, y - slotHeight / 2, slotWidth, slotHeight);
            baseBox.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);


            // 4. 📝 텍스트 배치 및 뎁스 고정
            let waveText, infoText, versionText, dayText, xBt;
            const titleStyle = { fontFamily: 'Impact, sans-serif', fontSize: '32px', fill: '#ffcc00' };
            const bodyStyle = { fontFamily: 'Arial, sans-serif', fontSize: '24px', fill: '#ffffff' };
            const verStyle = { fontFamily: 'monospace', fontSize: '14px', fill: '#eeeeee' };
            const dayStyle = { fontFamily: 'Arial, sans-serif', fontSize: '16px', fill: '#ffffff' };
            const xStyle = { fontFamily: 'Arial, Bold', fontSize: '32px', fill: '#ff0000' };

            if (saveData.isEmpty) {
                waveText = this.add.text(startX - slotWidth / 2 + 20, y - 25, `SLOT ${slotIndex}`, titleStyle);
                infoText = this.add.text(startX - slotWidth / 2 + 20, y + 10, `비어 있음`, { ...bodyStyle, fill: '#777777' });
                versionText = this.add.text(startX + slotWidth / 2 - 20, y + slotHeight / 2 - 15, '', verStyle);
                dayText = this.add.text(startX + slotWidth / 2 - 20, y  - 20, '', dayStyle);
                xBt = this.add.text(startX + slotWidth / 2 - 30, y - 35, ``, xStyle);
            } else {
                
                waveText = this.add.text(startX - slotWidth / 2 + 20, y - 25,
                     `WAVE : ${saveData.wave.value}`, titleStyle);
                infoText = this.add.text(startX - slotWidth / 2 + 20, y + 10, 
                    `점수: ${saveData.score} | 💰: ${saveData.gold}G | 🏹: ${saveData.stat.archer} | 🪄: ${saveData.stat.witch}`, bodyStyle);
                versionText = this.add.text(startX + slotWidth / 2 - 10, y +45, `ver. ${saveData.version}`, verStyle);
                dayText = this.add.text(startX - slotWidth / 2 + 20, y +40, `마지막 플레이 시간: ${saveData.lastPlayTime}`, dayStyle);
                xBt = this.add.text(startX + slotWidth / 2 - 30, y - 35, `❎`, xStyle);
            }
            
            // 모든 글씨 객체도 뎁스를 높여서 박스 위로 올림
            waveText.setOrigin(0, 0.5).setDepth(3);
            infoText.setOrigin(0, 0.5).setDepth(3);
            versionText.setOrigin(1, 0.5).setDepth(3);
            dayText.setOrigin(0, 0.5).setDepth(3);
            xBt.setOrigin(0.5).setDepth(3);
            this.saveWindow.add( [baseBox, waveText,infoText,versionText,dayText, xBt]);

            // 5. 🖱️ 마우스 이벤트 리스너 규칙 (오버 시 색상 강제 변경)
            xBt.setInteractive({ useHandCursor: true });
            xBt.on('pointerdown', (pointer, localX, localY, event) => {

                
                // 이게 없으면 삭제를 눌렀는데 불러오기창까지 같이 실행되어 버립니다.
                if (event) event.stopPropagation();

                 this.showConfirmPopup(
                    `${slotIndex}번째 슬롯을 삭제합니다.\n계속하시겠습니까?`, 
                    () => {
                        localStorage.removeItem(`${this.storageName}${slotIndex}`);
                        this.saveWindowVisible(false);
                        // this.saveWindowVisible(true);
                    }
                );
            });
            baseBox.on('pointerdown', () => {
               // console.log(saveData);
                if (key=='savedata'){
                    //저장 확인하기
                    this.showConfirmPopup(
                        `게임 진행 상황이 ${slotIndex}번째 슬롯에 저장됩니다.\n계속하시겠습니까?`, 
                        () => {
                            
                            this.saveWindowVisible(false);
                            this.saveGameRawData(`${this.storageName}${slotIndex}`,  this.scene.get('GameScene').saveGame() );
                           // this.saveWindowVisible(true);
                        }
                        ,
                        () =>{
                            //this.saveWindowVisible(false);
                        }
                    );
                    
                    
                } else if(key == 'dataload') {
                    if(saveData.isEmpty){
                        this.saveWindow.setVisible(false);
                        this.scene.get('MainMenuScene').newGameStart();
                    }else{
                        //데이터가 있는 경우 불러오기
                        this.saveWindow.setVisible(false);
                        this.loadData = saveData;
                        this.loadGameData = `${this.storageName}${slotIndex}`;
                        console.log(`불러온 데이터:`, this.loadData);
                        this.scene.get('MainMenuScene').newGameStart( saveData );
                        //this.loadGameFromSlot(slotIndex);
                    }
                    
                    
                }
            });

            baseBox.on('pointerover', () => {
                baseBox.clear();
                baseBox.fillStyle(0x333333, 1); // 오버 시 밝아짐
                baseBox.fillRect(startX - slotWidth / 2, y - slotHeight / 2, slotWidth, slotHeight);
                baseBox.lineStyle(2, 0xffcc00, 1); 
                baseBox.strokeRect(startX - slotWidth / 2, y - slotHeight / 2, slotWidth, slotHeight);
            });

            baseBox.on('pointerout', () => {
                baseBox.clear();
                baseBox.fillStyle(0x222222, 1); // 원래대로 복구
                baseBox.fillRect(startX - slotWidth / 2, y - slotHeight / 2, slotWidth, slotHeight);
                baseBox.lineStyle(2, 0xaaaaaa, 1); 
                baseBox.strokeRect(startX - slotWidth / 2, y - slotHeight / 2, slotWidth, slotHeight);
            });
        }
        this.saveWindow.setVisible(visible);
        if(key=='dataload'){
            this.titleTxt.setText('불러오기');

        }
        if(key=='savedata'){
            this.titleTxt.setText('저장하기');
        }
    }
    /**
     * 💾 브라우저 LocalStorage에서 특정 슬롯의 데이터를 읽어오는 함수
     */
    loadSlotData(slotIndex) {
        //this.loadGameRawData();
        const rawData = localStorage.getItem(`${this.storageName}${slotIndex}`);
        const data = JSON.parse(rawData);
        ///console.log(data);
        //this.saveGameRawData(`${this.loadGameData}${slotIndex}`, data);
        if (!rawData) {
            return { isEmpty: true };
        }
        try {
            return data; 
        } catch (e) {
            console.error("저장 데이터 파싱 실패", e);
            return { isEmpty: true };
        }
    }


    saveOption(){
        const gameOption ={
            loadGameData: 'projectCD_data'
        }
        localStorage.setItem('projectCD_saveOption', JSON.stringify(gameOption));
    }
    loadOption(){
        const saveOption = localStorage.getItem('projectCD_saveOption');
        if(saveOption){
            const data = JSON.parse(saveOption);
            //저장된 환경설정 변수가 있다면?
            this.loadGameData = data.loadGameData;
            console.log(`환경설정을 불러왔습니다`,data);
        }
    }

   
    /**
     * 📂 저장된 게임 데이터를 불러오는 함수
     */
    loadGameData(){
        return this.loadData;
    }
    loadGameRawData() {
        // 1. 브라우저에서 저장된 데이터가 있는지 가져옵니다.
        const savedData = localStorage.getItem( this.loadGameData );
        if (savedData) {
            // 2. 저장된 데이터가 있다면 문자열을 다시 원래 객체로 파싱합니다.
            const data = JSON.parse(savedData);
            console.log(data);
            return savedData;
        }else{
            return null;
        }
    }
    saveGameRawData(storageName, rawData){
        localStorage.setItem(storageName, JSON.stringify(rawData));
        
        console.log('💾 게임이 안전하게 저장되었습니다!', rawData);
    }

    showConfirmPopup(message, onConfirm, onCancel =null) {
        // 1. 이미 팝업이 떠 있다면 중복 생성 방지
        console.log(111);
        if (this.confirmPopup) return;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 2. 팝업 컨테이너 생성
        this.confirmPopup = this.add.container(0, 0);
        this.confirmPopup.setDepth(50);

        // 3. 뒷배경 클릭 방지용 오버레이
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4);
        overlay.setInteractive();
        
        const box = this.add.rectangle(width / 2, height / 2,  520,200, 0x000000, 1).setStrokeStyle(2, 0xffffff);
        // 4. 타이포그래피 스타일
        const textStyle = {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '28px',
            fill: '#ffffff',
            stroke: '#111111',
            strokeThickness: 5,
            align: 'center'
        };

        // 전달받은 message로 텍스트 생성
        const titleText = this.add.text(width / 2, height * 0.45, message, textStyle).setOrigin(0.5);

        // 버튼 생성
        const yesButton = this.add.text(width / 2 - 80, height * 0.58, '[ YES ]', { ...textStyle, fontSize:'32px', fill: '#ffcc00' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });

        const noButton = this.add.text(width / 2 + 80, height * 0.58, '[ NO ]', { ...textStyle, fontSize:'32px', fill: '#aaaaaa' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.confirmPopup.add([overlay, box, titleText, yesButton, noButton]);

        // 호버 효과
        yesButton.on('pointerover', () => yesButton.setScale(1.1));
        yesButton.on('pointerout', () => yesButton.setScale(1.0));
        noButton.on('pointerover', () => noButton.setScale(1.1));
        noButton.on('pointerout', () => noButton.setScale(1.0));

        // 🟢 YES 클릭 시
        yesButton.on('pointerdown', () => {
            if (onConfirm) onConfirm(); // 💡 전달받은 핵심 기능을 여기서 실행!
            
            this.confirmPopup.destroy();
            this.confirmPopup = null;
        });

        // 🔴 NO 클릭 시
        noButton.on('pointerdown', () => {
            if(onCancel) onCancel();
            this.confirmPopup.destroy();
            this.confirmPopup = null;
        });
    }



}