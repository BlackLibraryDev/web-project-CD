const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 720,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    // 등록된 클래스 이름을 배열에 넣습니다.
    scene: [PreloadScene, GameScene, UIScene] 
};

// 게임 객체 생성
const game = new Phaser.Game(config);



