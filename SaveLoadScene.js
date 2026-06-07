class SaveLoadScene extends Phaser.Scene {
    constructor() {
        super('SaveLoadScene');
    }

    create() {
        this.loadData = null;

        this.bgm;
        
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

        this.gameOption = null;
        this.loadOption();
        this.saveOption();

        this.playBGM('bgm_main');

        this.registry.set('optionData', this.gameOption  );

        this.noticeData = [
            { date: "2026.06.07", title: "업데이트 - 침묵의 소음(silent noise)",
                 content: "* 대부분의 효과음이 추가되었습니다\n* 파쿠리해온 BGM을 넣었습니다. 이후 교체 예정입니다\n* 스킬 창의 약간의 UI개선\n* 플레이 가이드와 환경설정 추가" },
            { date: "2026.05.28", title: "업데이트 - 숙련된 기술(skilful skill)",
                 content: "* 집중사격(일제사)이 추가되었습니다. 모든 궁수가 적에게 집중 사격합니다\n* 마나 및 마녀의 스킬이 추가되었습니다\n* 저주와 강제 개종이 추가되었습니다.\n* 마녀가 많을수록 마녀 회복량이 늘고 쿨다운이 감소합니다." },
            { date: "2026.05.26", title: "업데이트 - 세이브 더 월드(Save the World)", 
                content: "* 저장 슬롯이 3개로 늘었습니다." },
            { date: "2026.05.22", title: "업데이트 - 주둔군(Garrison)", 
                content: "* 적 궁병과 거인의 공격은 일정 확률로 주둔군을 살해합니다\n* 축성술로 주둔군의 부상 확률을 낮출 수 있습니다\n* 난이도, 결과창 UI 조절\n* 모바일 유저를 위한 전체화면 버튼 지원" },
            { date: "2026.05.21", title: "업데이트 - 거인의 반격", 
                content: "* 거인이 추가되었습니다. 거인은 드래그되지 않습니다.\n* 거인은 공격 시 일정 확률로 성에 주둔중인 유닛(궁사)을 살해합니다\n* 업그레이드 창의 UI 개선" }
        ];

        // 2️⃣ 🖤 [빈 배경] 클릭 시 창이 닫히는 거대한 반투명 블랙 스크린
        // Rectangle 방식은 setInteractive() 한 줄로 에러 없이 완벽하게 클릭 영역이 잡힙니다.
        this.closeBackground = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4);
        this.closeBackground.setInteractive();
        this.closeBackground.on('pointerdown', () => {
            console.log("빈 배경 클릭 ➔ 공지사항 닫기");
            this.closeNoticeWindow();
        });

        // 3️⃣ 📦 [공지창 메인 컨테이너] 화면 중앙 배치
        const winW = 560;
        const winH = 400;
        this.noticeWindow = this.add.container(width / 2, height / 2);

        // 4️⃣ 🟫 [공지창 배경 박스] 에러 없는 Rectangle 방식으로 생성 및 테두리 설정
        const bg = this.add.rectangle(0, 0, winW, winH, 0x111111, 0.95);
        bg.setStrokeStyle(3, 0xffffff, 1); // 두께 3px, 흰색 테두리 설정

        // 💡 [방어 코드] 공지창 안쪽을 누를 땐 뒤의 'closeBackground'로 클릭이 뚫고 가지 않도록 차단
        bg.setInteractive();
        bg.on('pointerdown', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation(); // 클릭 이벤트 전파 완전 차단
        });
        this.noticeWindow.add(bg);

        // 5️⃣ 🔤 [타이틀 텍스트] 
        const titleTxt = this.add.text(0, -winH / 2 + 25, "Notice", { 
            fontSize: '24px', 
            fill: '#ffffff', 
            fontWeight: 'bold' 
        }).setOrigin(0.5);
        this.noticeWindow.add(titleTxt);

        // 6️⃣ 📜 [공지 목록 컨테이너] 실제 글자들이 누적되어 담기고 움직일 상자
        // 위치는 공지창의 좌상단 여백(X: -230, Y: -140)을 기준으로 잡습니다.
        this.listContainer = this.add.container(width / 2 - winW / 2 + 20, height / 2 - winH / 2 + 60);

        // 7️⃣ 🎭 [원형/사각형 마스크 영역] 창문 밖으로 튀어나간 텍스트 가리기
        // 마스크 판정은 여전히 Graphics가 가장 안정적이므로, 체이닝 없이 안전하게 생성합니다.
        const maskGraphics = this.add.graphics();
        maskGraphics.setVisible(false);
        maskGraphics.fillStyle(0xffffff, 1);
        // 공지가 노출될 네모 창틀 영역 그리기
        maskGraphics.fillRect(width / 2 - winW / 2 + 15, height / 2 - winH / 2 + 55, winW - 30, winH - 85);
        
        const contentMask = maskGraphics.createGeometryMask();
        this.listContainer.setMask(contentMask);

        // 8️⃣ ✍️ [공지사항 출력] 데이터를 화면에 리스트 형태로 쌓기
        this.drawNoticeList();

        // 9️⃣ 🖱️ [스크롤 이벤트] 마우스 휠 작동
        this.input.on('pointerwheel', (pointer, over, deltaX, deltaY, deltaZ) => {
            // 마우스 커서가 공지창 내부 영역에 있을 때만 스크롤 작동시킴
            if (pointer.x > (width/2 - winW/2) && pointer.x < (width/2 + winW/2) &&
                pointer.y > (height/2 - winH/2) && pointer.y < (height/2 + winH/2)) {
                
                this.listContainer.y -= deltaY * 0.5; // 스크롤 속도 조절

                // 🛑 위아래 스크롤 오버플로우 한계선 고정
                const minY = height / 2 - winH / 2 + 60; // 최초 Y 위치
                const maxY = minY + Math.max(0, this.totalListHeight - (winH - 100));

                if (this.listContainer.y > minY) this.listContainer.y = minY;
                if (this.listContainer.y < -maxY + (height / 2)) this.listContainer.y = -maxY + (height / 2);
            }
        });
        this.closeNoticeWindow();

         //option
        this.optionWindow = this.add.container(0, 0).setVisible(false);

        //howto
        this.howToWindow = this.add.container(0, 0).setVisible(false);
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


    
/**
     * 📝 공지사항 데이터를 세로 방향으로 누적하여 그려주는 함수
     */
    drawNoticeList() {
        this.listContainer.removeAll(true); // 기존 컴포넌트 청소

        let currentY = 0; // 아래로 유동적으로 더해질 Y축 누적 변수
        const listWidth = 560;

        this.noticeData.forEach((data) => {
            // 개별 공지 한 덩어리를 묶을 임시 아이템 컨테이너
            const itemBox = this.add.container(0, currentY);

            // 날짜 표시 (파란색 강조)
            const dateTxt = this.add.text(0, 0, `[${data.date}]`, { fontSize: '14px', fill: '#0076d7', fontWeight: 'bold' });
            // 제목 표시
            const titleTxt = this.add.text(110, 0, data.title, { fontSize: '16px', fill: '#ffffff', fontWeight: 'bold' });
            
            // 본문 표시 (창 크기에 맞춰 자동 줄바꿈)
            const contentTxt = this.add.text(10, 25, data.content, { 
                fontSize: '14px', 
                fill: '#cccccc',
                wordWrap: { width: listWidth - 20 } 
            });

            // 점선/구분선 대용 사각형 라인 (Rectangle 방식으로 안전하게 드로잉)
            const lineY = contentTxt.y + contentTxt.displayHeight + 15;
            const line = this.add.rectangle(listWidth / 2, lineY, listWidth, 1, 0x444444, 0.8);

            // 묶음 세트에 추가
            itemBox.add([dateTxt, titleTxt, contentTxt, line]);
            this.listContainer.add(itemBox);

            // 🔥 [누적의 핵심] 현재 공지사항 총 높이 + 마진만큼 다음 공지 시작점을 밑으로 밀어냄
            currentY += lineY + 15;
        });

        // 스크롤 계산용 총 세로 길이 저장
        this.totalListHeight = currentY;
    }
    openNoticeWindow() {
        this.closeBackground.setVisible(true);
        this.noticeWindow.setVisible(true);
        this.listContainer.setVisible(true);
        
        // 창이 다시 열릴 때 스크롤 위치를 항상 최상단(처음 위치)으로 리셋해 줍니다.
        const winH = 400;
        this.listContainer.y = this.cameras.main.height / 2 - winH / 2 + 60;
    }
    /**
     * 🚪 공지사항 창 전체를 화면에서 숨기는 함수
     */
    closeNoticeWindow() {
        this.closeBackground.setVisible(false);
        this.noticeWindow.setVisible(false);
        this.listContainer.setVisible(false);
    }

    /**
     * 🚀 외부에서 새로운 공지를 실시간으로 밀어 넣고 싶을 때 사용하는 함수
     */
    addNewNotice(title, content) {
        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
        
        // 배열 가장 첫 번째에 추가하여 항상 최상단에 누적되도록 함
        this.noticeData.unshift({ date: dateStr, title: title, content: content });
        
        // 화면 리프레시 리드로잉
        this.drawNoticeList();
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

    drawOptionList(visible =true ){
        // 1️⃣ 기존 컨테이너 및 리스너 완전 청소 (메모리 누수 방지)
        if (this.optionWindow) {
            this.optionWindow.destroy();
        }
        if(!visible){
            return;   
        }
        this.optionWindow = this.add.container(0, 0).setVisible(visible);
        const { width, height } = this.cameras.main;

        // 1. 🖤 뒷배경 어두운 반투명 가림막 생성
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.9);
        bg.fillRect(0, 0, width, height);
        bg.setDepth(1); // 배경 뎁스를 낮게 설정
        this.optionWindow.add(bg);
        const screenRect = new Phaser.Geom.Rectangle(0, 0, width, height);
        bg.setInteractive(screenRect, Phaser.Geom.Rectangle.Contains);
        bg.on('pointerdown', (pointer) => {
            // 아무것도 작성하지 않거나, 빈 곳 클릭 시 창이 닫히게 하고 싶다면 기입 가능
            //this.optionWindow.setVisible(false);
        });
         this.titleTxt = this.add.text(width / 2, 100, 'Setting', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '36px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(2);
        this.optionWindow.add(this.titleTxt);

        // ==========================================
        // 🔊 5️⃣ 볼륨 슬라이더 생성 구역
        // ==========================================
        
        // 현재 게임 시스템의 볼륨 값을 가져옵니다. (없다면 기본값 0.5)
        // 실제 Phaser 사운드 매니저와 연동하려면 초기값을 기입해 둡니다.

        // 슬라이더 배치 함수 정의 (BGM용 하나, SFX용 하나를 그리기 위함)
        const createVolumeSlider = (yPos, label, currentVolumeType) => {
            const sliderX = width / 2 - 100; // 슬라이더 바 시작 X 좌표
            const sliderWidth = 200;         // 슬라이더 총 가로 길이

            // 텍스트 라벨 (BGM 또는 SFX)
            const txt = this.add.text(sliderX - 50, yPos, label, { fontSize: '24px', fill: '#ffffff', fontWeight: 'bold' }).setOrigin(1, 0.5);
            
            // 퍼센트 표시 텍스트 (예: 50%)
            const currentVolValue = currentVolumeType === 'bgm' ? this.gameOption.bgmVolume : this.gameOption.soundVolume;
            const percentTxt = this.add.text(sliderX + sliderWidth + 30, yPos, `${Math.round(currentVolValue * 100)}%`, { fontSize: '24px', fill: '#3498db' }).setOrigin(0, 0.5);

            // 슬라이더 배경 바 (회색)
            const track = this.add.graphics();
            track.fillStyle(0x444444, 1);
            track.fillRect(sliderX, yPos - 15, sliderWidth, 30);

            // 슬라이더 게이지 바 (청색 - 현재 볼륨만큼 채워짐)
            const fill = this.add.graphics();
            const updateFill = (vol) => {
                fill.clear();
                fill.fillStyle(0x3498db, 1);
                fill.fillRect(sliderX, yPos - 15, sliderWidth * vol, 30);
            };
            updateFill(currentVolValue);

            // 조절 손잡이 (하얀색 네모 버튼)
            // 현재 볼륨에 위치하도록 초기 X값 설정
            const handleX = sliderX + (sliderWidth * currentVolValue);
            const handle = this.add.rectangle(handleX, yPos, 20, 35, 0xffffff);
            handle.setInteractive({ useHandCursor: true });
            
            // 드래그 기능 활성화
            this.input.setDraggable(handle);

            // 드래그 이벤트 리스너 등록
            handle.on('drag', (pointer, dragX, dragY) => {
                // 손잡이가 슬라이더 바 범위를 벗어나지 못하도록 제한(Clamp)
                const minX = sliderX;
                const maxX = sliderX + sliderWidth;
                handle.x = Phaser.Math.Clamp(dragX, minX, maxX);

                // X 좌표 기반으로 0.0 ~ 1.0 사이의 볼륨 비율 계산
                const newVolume = (handle.x - sliderX) / sliderWidth;
                
                // 텍스트 및 게이지 실시간 업데이트
                percentTxt.setText(`${Math.round(newVolume * 100)}%`);
                updateFill(newVolume);

                // 실제 Phaser 오디오 매니저에 볼륨 적용
                if (currentVolumeType === 'bgm') {
                    this.gameOption.bgmVolume = Math.ceil(newVolume*100)/100 ;
                    // 배경음 사운드 객체가 실제로 작동 중이라면 실시간 반영
                    // if (this.bgmMusic) this.bgmMusic.setVolume(newVolume);
                    if (this.bgm && this.bgm.isPlaying) {
                        this.bgm.setVolume(this.gameOption.bgmVolume);
                    }
                    //console.log("BGM 볼륨 변경:", this.gameOption.bgmVolume);
                } else {
                    this.gameOption.soundVolume = Math.ceil(newVolume*100)/100 ;
                    // 효과음 볼륨도 시스템 전체에 반영 가능
                    // this.sound.volume = newVolume; 
                    //console.log("SFX 볼륨 변경:", this.gameOption.soundVolume);
                }
            });

            // 컨테이너에 UI 부품들 몽땅 집어넣기
            this.optionWindow.add([txt, percentTxt, track, fill, handle]);
        };

        // 6️⃣ 원하는 Y 높이에 볼륨바 배치 실행
        createVolumeSlider(height / 2 - 30, 'BGM', 'bgm'); // 상단에 BGM 슬라이더
        createVolumeSlider(height / 2 + 50, 'SFX', 'sfx'); // 하단에 SFX 슬라이더

        const posX = 130;
        const posY = 240;

        const itemContainer =this.add.container(0,0).setDepth(3);

        const bt1 = this.makeButton(160,50,posX, posY +0, "사운드");
        bt1.on('pointerdown', (pointer) => {
            itemContainer.removeAll(true);
        });
        this.optionWindow.add(bt1);

        const xbt = this.makeButton(120,50, width/2 +90, height-50, "취소");
        xbt.on('pointerdown', (pointer) => {
            this.loadOption();
            this.bgm.setVolume(this.gameOption.bgmVolume);
            itemContainer.removeAll(true);
            this.drawOptionList(false);
        });
        this.optionWindow.add(xbt);

        const savebt = this.makeButton(200,50, width/2-90, height-50, "💾저장 후 닫기");
        savebt.on('pointerdown', (pointer) => {
            this.saveOption();
            this.bgm.setVolume(this.gameOption.bgmVolume);
            itemContainer.removeAll(true);
            this.drawOptionList(false);
        });
        this.optionWindow.add(savebt);

    }


    drawHowToList(visible =true ){
        this.howToWindow.visible = visible;
        this.howToWindow.removeAll(true);
        if(!visible){
            return;   
        }
        this.howToWindow = this.add.container(0, 0).setVisible(visible);
        const { width, height } = this.cameras.main;

        // 1. 🖤 뒷배경 어두운 반투명 가림막 생성
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.9);
        bg.fillRect(0, 0, width, height);
        bg.setDepth(1); // 배경 뎁스를 낮게 설정
        this.howToWindow.add(bg);
        const screenRect = new Phaser.Geom.Rectangle(0, 0, width, height);
        bg.setInteractive(screenRect, Phaser.Geom.Rectangle.Contains);
        bg.on('pointerdown', (pointer) => {
            // 아무것도 작성하지 않거나, 빈 곳 클릭 시 창이 닫히게 하고 싶다면 기입 가능
            //this.howToWindow.setVisible(false);
        });
         this.titleTxt = this.add.text(width / 2, 100, 'How to Play?', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '36px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(2);
        this.howToWindow.add(this.titleTxt);

        const posX = 130;
        const posY = 240;
        const listWidth = 920;
        

        const txt0 = 
`플레이어는 몹을 잡아다 일정 높이에서 떨어트리거나 위로 집어던져 
중력으로 적을 처치합니다.

일정 웨이브가 지나면 드래그가 되지 않는 기믹의 적이 등장합니다.
이러한 적을 대비하게 위해 🙏개종을 통해 👥예비인력을 미리 충원하고 
🏹궁수와 🪄마녀 같은 주둔군을 기용하여 방어를 도모합니다.

게임이 끝난 후 획득한 💰재화로 업그레이드를 진행합니다.
업그레이드는 총 4개의 카테고리가 있으며 업그레이드를 해금하거나 등급을 상승시킵니다.`
        
        const txt = this.add.text( posX*2 +20, posY-20, txt0,{ 
            fontSize: '24px', 
            fill: '#ffffff',
            padding: { x: 5, y: 5 },
            lineSpacing: 10,
            wordWrap: { width: listWidth - 20 } 
        }).setOrigin(0,0);
        this.howToWindow.add(txt);

        const itemContainer =this.add.container(0,0).setDepth(3);

        const bt1 = this.makeButton(160,50,posX, posY +0, "기본");
        bt1.on('pointerdown', (pointer) => {
            itemContainer.removeAll(true);
            txt.setText(txt0);
        });
        this.howToWindow.add(bt1);

        const bt2 = this.makeButton(160,50,posX,posY +80, "주둔군");
        bt2.on('pointerdown', (pointer) => {
            itemContainer.removeAll(true);
            const cath = this.add.sprite(360,260 ,'cathedral').setDisplaySize(128,128); 
            cath.anims.play('cathedral_fire', true);
            itemContainer.add(cath);
        
            txt.setText( 
`            ⛪대성당 에서 🙏개종을 해금하거나 🪄마녀의 ⚡현혹술 로 
             적을 아군으로 포섭할 수 있습니다. 
             아군으로 포섭하게 되면 👥예비인력이 생깁니다.

주둔군을 고용하게 되면 💸유지비가 소모되며, 💸유지비를 내지 못할 경우 주둔군을 해고하게 됩니다.`);
        });
        this.howToWindow.add(bt2);

        const bt2_1 = this.makeButton(180,40,posX+20,posY +140, "주둔군-🏹궁수");
        bt2_1.on('pointerdown', (pointer) => {
            itemContainer.removeAll(true);
            const archer = this.add.sprite(900, 330, 'archer');
            archer.anims.play('archer_fire', true);
            itemContainer.add(archer);
            txt.setText( `🏹훈련소 에서 👥예비인력을 소모하여 🏹궁수를 훈련할 수 있습니다.
🏹궁수는 일정 시간마다 화살을 쏘아 적에게 랜덤 대미지를 입힙니다.

 * 계산식 : random(0~1) < 적 HP 이면 사망,
         그외에는 random 값 만큼 적 HP 누적 감소 

⚡집중사격 스킬로 처치하기 곤란한 적에게 화살을 퍼부어 제거할 수 있습니다
`);
        });
        this.howToWindow.add(bt2_1);

        const bt2_2 = this.makeButton(180,40,posX+20,posY +195, "주둔군-🪄마녀");
        bt2_2.on('pointerdown', (pointer) => {
            itemContainer.removeAll(true);
            txt.setText( `🪄마녀의 샘 에서 👥예비인력을 소모하여 🪄마녀를 채용할 수 있습니다.

🪄마녀는 마나를 이용해 적에게 특별한 마술을 구사합니다.
🪄마녀가 많을수록 더 빠르게 마나가 차오르고 스킬의 준비시간이 짧아집니다.

⚡저주 는 적을 즉사시킵니다
⚡현혹술 은 적을 강제로 개종하여 👥예비인력으로 기용합니다.
`);
        });
        this.howToWindow.add(bt2_2);

        const bt3 = this.makeButton(160,50,posX,posY +270, "축성술");
        bt3.on('pointerdown', (pointer) => {
            itemContainer.removeAll(true);
            const castle0 = this.add.sprite(width *0.37, 440, 'castleSprite').setScale(0.8);
            castle0.anims.play('castle0');

            const castle1 = this.add.sprite(width *0.5, 440, 'castleSprite').setScale(0.9);
            castle1.anims.play('castle1');

            const castle2 = this.add.sprite(width *0.65, 440, 'castleSprite').setScale(1);
            castle2.anims.play('castle2');
            itemContainer.add([castle0,castle1,castle2]);
            txt.setText( 
`🛡️축성술 연구 는 성벽의 재료를 변경하여 🛡️방어력을 높이고 주둔군을 보호합니다.
 * 대미지 감소 : 적 대미지 - 🛡️방어력 (최솟값 1) 
 * 주둔군이 입을 피해 확률 감소 : 🛡️방어력 x 4% 감소 효과






성채보강 은 성벽의 최대 내구도를 증가시킵니다.

                `);
        });
        this.howToWindow.add(bt3);

        const xbt = this.makeButton(160,50, width/2, height-50, "닫기");
        xbt.on('pointerdown', (pointer) => {
            itemContainer.removeAll(true);
            this.drawHowToList(false);
        });
        this.howToWindow.add(xbt);

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
            const titleStyle = { fontFamily: 'Impact, sans-serif', fontSize: '36px', fill: '#ffcc00' };
            const bodyStyle = { fontFamily: 'Arial, sans-serif', fontSize: '24px', fill: '#ffffff' };
            const verStyle = { fontFamily: 'monospace', fontSize: '14px', fill: '#eeeeee' };
            const dayStyle = { fontFamily: 'Arial, sans-serif', fontSize: '16px', fill: '#ffffff' };
            const xStyle = { fontFamily: 'Arial, Bold', fontSize: '32px', fill: '#ff0000' };

            if (saveData.isEmpty) {
                waveText = this.add.text(startX - slotWidth / 2 + 20, y - 30, `SLOT ${slotIndex}`, titleStyle);
                infoText = this.add.text(startX - slotWidth / 2 + 20, y + 10, `비어 있음`, { ...bodyStyle, fill: '#777777' });
                versionText = this.add.text(startX + slotWidth / 2 - 20, y + slotHeight / 2 - 15, '', verStyle);
                dayText = this.add.text(startX + slotWidth / 2 - 20, y  - 20, '', dayStyle);
                xBt = this.add.text(startX + slotWidth / 2 - 30, y - 35, ``, xStyle);
            } else {
                
                waveText = this.add.text(startX - slotWidth / 2 + 20, y - 30,
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
                    if(saveData.isEmpty){
                        //빈 슬롯에 바로 저장
                        this.saveWindowVisible(false);
                        this.saveGameRawData(`${this.storageName}${slotIndex}`,  this.scene.get('GameScene').saveGame() );
                            
                    }else{
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
                    }
                    
                    
                } else if(key == 'dataload') {
                    if(saveData.isEmpty){
                        this.saveWindow.setVisible(false);
                        this.scene.get('MainMenuScene').newGameStart();
                    }else{
                        //데이터가 있는 경우 불러오기
                        this.saveWindow.setVisible(false);
                        this.loadData = saveData;
                        this.loadGameData = `${this.storageName}${slotIndex}`;
                        //console.log(`불러온 데이터:`, this.loadData);
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
        /*
        const gameOption ={
            loadGameData: 'projectCD_data',
            autoSkillHold:true,
            bgmVolume:0,
            soundVolume:0
        }*/
        localStorage.setItem('projectCD_saveOption', JSON.stringify(this.gameOption));
    }
    loadOption(){
        const saveOption = localStorage.getItem('projectCD_saveOption');
        if(saveOption){
            const data = JSON.parse(saveOption);
            //저장된 환경설정 변수가 있다면?
            if(data.loadGameData ==null) data.loadGameData ='projectCD_data1';
            if(data.autoSkillHold ==null) data.autoSkillHold=true;
            if(data.bgmVolume ==null) data.bgmVolume =0;
            if(data.soundVolume==null) data.soundVolume = 0;
            if(data.arrowEfCount ==null) data.arrowEfCount = 10;
                        
            this.autoSkillHold = data.autoSkillHold;
            this.loadGameData = data.loadGameData;
            this.gameOption = data;
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
    showOkPopup(message, onConfirm){
        if (this.okPopup) return;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        // 2. 팝업 컨테이너 생성
        this.okPopup = this.add.container(0, 0);
        this.okPopup.setDepth(50);

        // 3. 뒷배경 클릭 방지용 오버레이
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4);
        const screenRect = new Phaser.Geom.Rectangle(0, 0, width, height);
        overlay.setInteractive(screenRect, Phaser.Geom.Rectangle.Contains);
        overlay.on('pointerdown', (pointer) => {
            // 아무것도 작성하지 않거나, 빈 곳 클릭 시 창이 닫히게 하고 싶다면 기입 가능
            this.okPopup.destroy();
            this.okPopup = null;
        });

        
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
        // 💡 클릭 이벤트가 발생했을 때 아무것도 하지 않도록 비워둡니다.
        

        // 전달받은 message로 텍스트 생성
        const titleText = this.add.text(width / 2, height * 0.45, message, textStyle).setOrigin(0.5);
        console.log(message);

        const yesButton = this.add.text(width / 2 , height * 0.58, '[ Confirm ]', { ...textStyle, fontSize:'32px', fill: '#ffffff' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.okPopup.add([overlay, box, titleText, yesButton]);

        yesButton.on('pointerdown', () => {
            if (onConfirm) onConfirm(); // 💡 전달받은 핵심 기능을 여기서 실행!
            
            this.okPopup.destroy();
            this.okPopup = null;
        });

        /*
        this.time.delayedCall(1800 , () => {
                if(this.okPopup){
                this.okPopup.destroy();
                this.okPopup = null;
            }
        });
        */
    }
    showConfirmPopup(message, onConfirm, onCancel =null) {
        // 1. 이미 팝업이 떠 있다면 중복 생성 방지
        if (this.confirmPopup) return;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 2. 팝업 컨테이너 생성
        this.confirmPopup = this.add.container(0, 0);
        this.confirmPopup.setDepth(50);

        // 3. 뒷배경 클릭 방지용 오버레이
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4);
        const screenRect = new Phaser.Geom.Rectangle(0, 0, width, height);
        overlay.setInteractive(screenRect, Phaser.Geom.Rectangle.Contains);
        overlay.on('pointerdown', () => {
            this.confirmPopup.destroy();
            this.confirmPopup = null;
        });
        
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

    playSound(name, randomIndex =-1, hasDetune=true){
        const randomDetune = hasDetune==true? Phaser.Math.Between(-150, 150) : 0 ;
        const num = randomIndex<0? '' : Phaser.Math.Between(0, randomIndex-1);
        this.sound.play(`${name}${num}`, {volume:this.gameOption.soundVolume, detune: randomDetune});
    }
    playBGM2(name, isloop=true){
        const bgmConfig = {
            mute: false,         // 음소거 여부
            volume: this.gameOption.bgmVolume,       // 볼륨 (0.0 ~ 1.0)
            rate: 1,            // 재생 속도 (1이 배속)
            detune: 0,          // 음정 조절
            seek: 0,            // 시작 재생 위치 (초 단위)
            loop: isloop,         // 🔄 무한 반복 여부
            delay: 0            // 재생 전 대기 시간
        };

        // 사운드 매니저에 BGM을 등록하고 바로 플레이합니다.
        this.bgm2 = this.sound.add(name, bgmConfig);
        this.bgm2.play();
    }
    playBGM(name, isloop=true){
        const bgmConfig = {
            mute: false,         // 음소거 여부
            volume: this.gameOption.bgmVolume,       // 볼륨 (0.0 ~ 1.0)
            rate: 1,            // 재생 속도 (1이 배속)
            detune: 0,          // 음정 조절
            seek: 0,            // 시작 재생 위치 (초 단위)
            loop: isloop,         // 🔄 무한 반복 여부
            delay: 0            // 재생 전 대기 시간
        };

        // 사운드 매니저에 BGM을 등록하고 바로 플레이합니다.
        this.bgm = this.sound.add(name, bgmConfig);
        this.bgm.play();
    }
    setBGMfadeout() {
        if(this.bgm !=null && this.bgm.isPlaying==false){
            console.log('false');
            return;
        }
    const vol0 = this.gameOption.bgmVolume;
    let vol = 1;
    
    // 🌟 화살표 함수를 사용하므로, 내부에서 스스로를 지우기 위해 
    // 클래스 변수(this.fadeout) 형태로 타이머를 선언합니다.
    this.fadeout = this.time.addEvent({
        delay: 100,
        callback: () => { // ⭕ function() 대신 화살표 함수 구문 사용!
            vol -= 0.05;
            this.bgm.setVolume(vol * vol0); 
            
            if (vol <= 0) {
                // 1️⃣ 볼륨 감소용 타이머 이벤트를 확실하게 파괴하여 루프를 멈춥니다.
                this.fadeout.destroy(); 
                this.bgm.stop(); 
                console.log("BGM 페이드아웃 완료");
            }
        },
        loop: true
    });
}
}