class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
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
        this.load.image('background1', 'assets/bg1.png');
        this.load.image('background1_dark', 'assets/bg1_dark.png');

        this.load.image('castle1', 'assets/castle1.png');

    

        this.load.spritesheet('mobsprite1', 'assets/mobsprite1.png', { frameWidth: 128, frameHeight: 128});
        this.load.spritesheet('mobsprite2', 'assets/mobsprite2.png', { frameWidth: 128, frameHeight: 128});
        //this.load.image('wall', 'assets/wall.png');
        // 사운드나 폰트도 여기서 로드
        
        // 3. 로딩이 완료되면 실행될 이벤트
        this.load.on('complete', () => {
            loadingText.destroy();
            //this.scene.start('GameScene'); // 로딩 완료 후 게임씬으로 이동
        });
    }
    create(){
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
        // 4. 애니메이션 생성이 끝난 직후 다음 씬으로 이동합니다.
        this.scene.start('GameScene');
    }
    
}