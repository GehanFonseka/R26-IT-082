# Run Backend and Frontend

Use two separate integrated terminals: one opened in the `backend` folder and one opened in the `ta` folder.

## 1. Run the Backend

1. Open VS Code.
2. In the file explorer, right-click the `backend` folder.
3. Click **Open in Integrated Terminal**.
4. Run these commands:

```bash
source .venv/bin/activate
uvicorn app.main:app --reload
```

The backend should run at:

```text
http://127.0.0.1:8000
```



 


If the virtual environment does not exist, create it first:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Then run the backend again:

```bash
uvicorn app.main:app --reload
```

## 2. Run the Frontend

1. Open another integrated terminal.
2. In the file explorer, right-click the `ta` folder.
3. Click **Open in Integrated Terminal**.
4. Run:

```bash
npm run dev
```

The frontend should run at:

```text
http://localhost:5173
```

Open that URL in your browser.

If `node_modules` is missing or dependencies are not installed, run:

```bash
npm install
npm run dev
```

## 3. Important Notes

- Keep both terminals open while using the app.
- Start the backend first, then start the frontend.
- The frontend expects the backend at `http://127.0.0.1:8000`.
- If the frontend shows API errors, check that the backend terminal is still running.
- To stop either server, click the terminal and press `Ctrl + C`.

## Demo Login Details

Use these seeded accounts after the backend starts:

```text
Admin:     admin@talentai.local / Admin123!
HR:        hr@talentai.local / Recruiter123!
Candidate: candidate@talentai.local / Candidate123!
```
