const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 720,
    scale:{
        // 창 크기에 맞게 확장 (비율 유지)
        mode: Phaser.Scale.FIT,
        // 화면의 정중앙에 배치
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // 모바일 대응을 위해 너비/높이를 100%로 설정 가능
        width: 1200,
        height: 720,
    },
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



