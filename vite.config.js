// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    define: {
        // 빌드/실행하는 순간의 현재 시간을 게임 내 전역 변수로 주입
        'window.GAME_VERSION': JSON.stringify(new Date().toLocaleString('ko-KR'))
    },
    server: {
        port: 5500 // 개발 서버 포트 설정 (선택)
    }
});