class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        //아이콘 :  💾저장 🏰건축소',⛪대성당',🏹훈련소',🪄마녀의 샘' 💸 유지비  💀 주둔군 💰 골드 👥 개종
        // 1. 간단한 로딩 텍스트 표시
        let width = this.cameras.main.width;
        let height = this.cameras.main.height;
        let loadingText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: 'Loading...',
            style: { font: '20px monospace', fill: '#ffffff' }
        }).setOrigin(0.5);

        // 2. 모든 리소스 로드

        // 1. TSV(또는 CSV) 파일을 일반 텍스트 파일로 로드합니다.
        this.load.text('langTable', 'assets/data/localization.tsv');
        
        this.load.image('radarGlow', 'assets/radarGlow.png');
        
        this.load.image('menu_bg', 'assets/bg1.png');

        this.load.image('background1', 'assets/bg1.png');
        this.load.image('background1_dark', 'assets/bg1_dark.png');

        //this.load.image('castle', 'assets/castle1.png');
        this.load.spritesheet('castleSprite','assets/castleSprite.png', { frameWidth: 128, frameHeight: 128 });

        this.load.spritesheet('flag','assets/flag.png', { frameWidth: 128, frameHeight: 512});

        this.load.spritesheet('arrow', 'assets/arrow.png', { frameWidth: 48, frameHeight: 12});
        this.load.spritesheet('archer', 'assets/archer.png', { frameWidth: 128, frameHeight: 128 });

        this.load.spritesheet('cathedral', 'assets/cathedral.png', { frameWidth: 128, frameHeight: 128 });

        this.load.spritesheet('meteorSprite', 'assets/meteo.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('explosionSprite','assets/bomb.png', { frameWidth: 256, frameHeight: 200 });

        this.load.spritesheet('mobsprite1', 'assets/mobsprite1.png', { frameWidth: 128, frameHeight: 128});
        this.load.spritesheet('mobsprite2', 'assets/mobsprite2.png', { frameWidth: 128, frameHeight: 128});
        
        this.load.spritesheet('mobsprite3', 'assets/mobsprite3.png', { frameWidth: 128, frameHeight: 128});
        this.load.spritesheet('mobsprite3_fire', 'assets/mobsprite3_fire.png', { frameWidth: 128, frameHeight: 128});

         this.load.spritesheet('mobsprite4', 'assets/mobsprite4.png', { frameWidth: 128, frameHeight: 128});

        this.load.spritesheet('mobsprite10', 'assets/mobsprite10.png', { frameWidth: 128, frameHeight: 128});
        //this.load.image('wall', 'assets/wall.png');
        // 사운드나 폰트도 여기서 로드
        this.load.audio('bgm_main', 'sfx/Noddinagushpa_far.ogg');
        this.load.audio('bgm_start0','sfx/coh2bb_stingers_level_up.ogg');
        this.load.audio('bgm_waveEnd','sfx/stageEnd.ogg');
        this.load.audio('bgm_defeat', 'sfx/defeat_stinger.ogg');
        this.load.audio('callToArms', 'sfx/call-to-arms.mp3');

        this.load.audio('arrowfire0', 'sfx/arrow_pass_by_2.wav');
        this.load.audio('arrowfire1', 'sfx/arrow_pass_by_3.wav');
        this.load.audio('arrowfire2', 'sfx/arrow_pass_by_4.wav');
        this.load.audio('hit0', 'sfx/hit0.wav');
        this.load.audio('hit1', 'sfx/hit1.wav');
        this.load.audio('hit2', 'sfx/hit2.wav');
        this.load.audio('hit3', 'sfx/hit3.wav');

        this.load.audio('dead0', 'sfx/dead0.ogg');
        this.load.audio('dead1', 'sfx/dead1.ogg');
        this.load.audio('dead2', 'sfx/dead2.ogg');

        this.load.audio('wallhit0','sfx/wood_crate_impact_hard2.wav');
        this.load.audio('wallhit1','sfx/wood_crate_impact_hard3.wav');
        this.load.audio('wallhit2','sfx/wood_crate_impact_soft1.wav');

        this.load.audio('holy','sfx/holy-spell-aura.mp3');
        this.load.audio('curse0','sfx/yodguard1.mp3');
        this.load.audio('curse1','sfx/yodguard2.mp3');
        this.load.audio('curse2','sfx/yodguard3.mp3');

        this.load.audio('meteo_bomb0','sfx/meteo_bomb1.wav');
        this.load.audio('meteo_bomb1','sfx/meteo_bomb2.wav');
        this.load.audio('meteo_fire0','sfx/meteo_fire1.wav');
        this.load.audio('meteo_fire1','sfx/meteo_fire2.wav');
        // 3. 로딩이 완료되면 실행될 이벤트
        this.load.on('complete', () => {
            loadingText.destroy();
            //this.scene.start('GameScene'); // 로딩 완료 후 게임씬으로 이동
        });
    }
    create(){

         const saveOption = localStorage.getItem('projectCD_saveOption');
         let lang = 'ko';
        if(saveOption){
             const data = JSON.parse(saveOption);
             if(data.currentLang==null){
                lang = 'ko';
             }else{
                lang = data.currentLang;
             }

        }
        // 2. 로드된 텍스트 데이터를 가져옵니다.
        const tsvData = this.cache.text.get('langTable');
        
        // 3. 데이터를 전역에서 쓸 수 있도록 파싱하여 저장합니다.
        // 현재 설정된 언어 코드를 함께 지정합니다 (예: 'ko' 또는 'en')
        this.registry.set('currentLang', lang ); 
        this.registry.set('langDict', this.parseTSV(tsvData));


        this.anims.create({
            key: 'castle0',
            frames: this.anims.generateFrameNumbers('castleSprite', { start: 0, end: 1 }), // 스프라이트 시트의 0번부터 1번 프레임까지 사용
            frameRate: 6, 
            repeat: -1
        });
        this.anims.create({
            key: 'castle1',
            frames: this.anims.generateFrameNumbers('castleSprite', { start: 2, end: 3 }), // 스프라이트 시트의 0번부터 1번 프레임까지 사용
            frameRate: 6, 
            repeat: -1
        });
         this.anims.create({
            key: 'castle2',
            frames: this.anims.generateFrameNumbers('castleSprite', { start: 4, end: 5 }), // 스프라이트 시트의 0번부터 1번 프레임까지 사용
            frameRate: 6, 
            repeat: -1
        });
        this.anims.create({
            key: 'archer_fire',
            frames: this.anims.generateFrameNumbers('archer', { start: 0, end: 3 }),
            frameRate: 20, 
            repeat: 0
        });
        this.anims.create({
            key: 'cathedral_idle',
            frames: this.anims.generateFrameNumbers('cathedral', { start: 0, end: 0 }),
            frameRate: 10, 
            repeat: 0
        });
        this.anims.create({
            key: 'cathedral_fire',
            frames: this.anims.generateFrameNumbers('cathedral', { start: 1, end: 3 }),
            frameRate: 10, 
            repeat: -1
        });
        this.anims.create({
            key: 'meteo_anim',
            frames: this.anims.generateFrameNumbers('meteorSprite', { start: 0, end: 1 }),
            frameRate: 20, 
            repeat: 0
        });
        this.anims.create({
            key: 'explosion_anim',
            frames: this.anims.generateFrameNumbers('explosionSprite', { start: 0, end: 11 }),
            frameRate: 15, 
            repeat: 0
        });


        this.anims.create({
            key: 'mob1_walk',
            frames: this.anims.generateFrameNumbers('mobsprite1', { start: 0, end: 1 }),
            frameRate: 3, 
            repeat: -1
        });
        this.anims.create({
            key: 'mob2_walk',
            frames: this.anims.generateFrameNumbers('mobsprite2', { start: 0, end: 1 }),
            frameRate: 4, 
            repeat: -1
        });
        this.anims.create({
            key: 'mob3_walk',
            frames: this.anims.generateFrameNumbers('mobsprite3', { start: 0, end: 1 }),
            frameRate: 4, 
            repeat: -1
        });
        this.anims.create({
            key: 'mob3_fire',
            frames: this.anims.generateFrameNumbers('mobsprite3_fire', { start: 0, end: 3 }),
            frameRate: 20, 
            repeat: 0
        });

        this.anims.create({
            key: 'mob4_walk',
            frames: this.anims.generateFrameNumbers('mobsprite4', { start: 0, end: 1 }),
            frameRate: 4, 
            repeat: -1
        });
         this.anims.create({
            key: 'mob10_walk',
            frames: this.anims.generateFrameNumbers('mobsprite10', { start: 0, end: 1 }),
            frameRate: 4, 
            repeat: -1
        });
        // 4. 애니메이션 생성이 끝난 직후 다음 씬으로 이동합니다.
        this.scene.start('MainMenuScene');
        //this.scene.start('GameScene');
    }
    

    // 🛠️ TSV 텍스트를 JavaScript 객체(딕셔너리)로 변환하는 핵심 파서
    parseTSV(text) {
        const lines = text.split('\n');
        const headers = lines[0].replace('\r', '').split('\t'); // 첫 줄 (key, ko, en...)
        
        const dict = {};

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // 빈 줄 패스

            const currentLine = lines[i].replace('\r', '').split('\t');
            const key = currentLine[0]; // 식별 키 (예: game_title)

            dict[key] = {};
            for (let j = 1; j < headers.length; j++) {
                const langCode = headers[j];     // 언어 코드 (ko, en)
                const translation = currentLine[j]; // 번역된 문장
                dict[key][langCode] = translation.replace('//','\n');
            }
        }
        
        // 결과 구조: { game_title: { ko: "디펜스 성 지키기", en: "Defense Castle" }, ... }
        return dict;
    }
}