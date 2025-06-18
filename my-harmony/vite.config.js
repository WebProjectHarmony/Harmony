import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  //   server: {
  //   allowedHosts: ['.ngrok-free.app'], // 모든 ngrok-free.app 하위 도메인 허용
  //   host: true, // 외부 접속 허용
  //   port: 5173, // 사용 포트
  // },
})
