Start docker, ollama, deepseek:
.\Start_AI.bat

cd 3-ai-service-python
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

cd 2-gateway-node
npx ts-node src/server.ts

cd 1-frontend-react
npm run dev

admin@gmail.com
admin123


Example AI question for level2_safety_emotional_infidelity.md:
My husband is giving all his intimate emotional energy to an online friend. He shares our secrets with her and constantly complains about me to her. Whenever I get upset, he gaslights me by saying, 'We didn't do anything, we're just friends!' Even though no physical line is crossed, I feel like this emotional abandonment is completely destroying the safety of our marriage.

Example AI question for level2_safety_financial_ruin.md:
My husband hid a $10,000 credit card bill from me.

Example AI question for level4_esteem_stonewalling.md:

Whenever we have the slightest disagreement, she completely shuts down. She will give me the silent treatment and refuse to look at me or speak to me for days at a time.