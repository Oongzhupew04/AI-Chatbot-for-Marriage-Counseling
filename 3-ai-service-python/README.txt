cd 3-ai-service-python
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

cd 2-gateway-node
npx ts-node src/server.ts

cd 1-frontend-react
npm run dev

admin@gmail.com
admin123
