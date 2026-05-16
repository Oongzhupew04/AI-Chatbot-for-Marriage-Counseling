cd 3-ai-service-python
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

cd 2-gateway-node
npx ts-node src/server.ts

cd 1-frontend-react
npm run dev

admin@gmail.com
admin123

Check opengauss running:
sudo docker ps -a


Example AI question for Safety_Needs_safety.md:
My husband keeps buying expensive things without telling me and it scares me.

Example AI question for Love_and_belonging_needs_love4.md:
We never cuddle or hold hands anymore. Most days it feels like we are just roommates passing each other in the hallway.

Example AI question for Physical_Needs_physical.md:
We don't fight much, but I just feel empty. We have no shared hobbies, no big goals, and it feels like we are just going through the motions of life without any real purpose.

Example AI question for Safety_Needs_safety.md:
We can barely afford groceries this month and the rent is late. The stress is so bad we just scream at each other the moment we wake up.

Example AI question for Love_and_belonging_needs_love1.md:
Whenever I try to talk about my accomplishments at work, my spouse just rolls their eyes and makes sarcastic comments. I feel completely belittled.