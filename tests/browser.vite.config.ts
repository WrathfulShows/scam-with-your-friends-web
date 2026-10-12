import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// UI fixtures stub their own requests; this preview deliberately has no Worker or service secrets.
export default defineConfig({ plugins:[react(),{name:'guide-indexes',configureServer(server){server.middlewares.use((req,_res,next)=>{if(req.url&&/^\/guide(?:\/[a-z-]+)?\/$/.test(req.url))req.url+='index.html';next();});}}], server:{host:'127.0.0.1',port:5175,strictPort:true} });
