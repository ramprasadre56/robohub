@echo off
cd /d "%~dp0"
echo == npm install
call npm install --no-audit --no-fund || goto :fail
echo == git
git add -A
git commit -q -m "Add # Robotics topic feed: posts, replies and likes stored in Firestore" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_013WBQEcYJRhawP1o2VvLvGK"
git push -q origin main || goto :fail
echo == deploy
call gcloud run deploy robohub --source . --region=asia-south1 --allow-unauthenticated --port=8080 --project=gen-lang-client-0582070671 --account=govindashorticulture@ghnursery.in --quiet || goto :fail
echo ALLDONE
exit /b 0
:fail
echo FAILED