# Thought-Model-Generator

API for generating learner thought models using Mastery Loop (First Principles + Inversion). Inspired by AAMLE paper for ed-tech.

## Setup
1. Clone: `git clone https://github.com/victordeman/Thought-model-generator.git`
2. `cd Thought-model-generator`
3. `python -m venv venv && source venv/bin/activate`
4. `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and set OPENAI_API_KEY.
6. `uvicorn main:app --reload` → http://localhost:8000/docs

## Deployment
- Render: Create Web Service, set build command `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Docker: `docker build -t thought-gen . && docker run -p 8000:8000 -e OPENAI_API_KEY=yourkey thought-gen`


# Thought-Model-Generator

API for generating learner thought models using Mastery Loop (First Principles + Inversion). Inspired by AAMLE paper for ed-tech.

## Setup
1. Clone: `git clone https://github.com/victordeman/Thought-model-generator.git`
2. `cd Thought-model-generator`
3. `python -m venv venv && source venv/bin/activate`
4. `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and set OPENAI_API_KEY, LANGSMITH_API_KEY, etc.
6. `uvicorn main:app --reload` → http://localhost:8000/docs

## Deployment
- Render: Create Web Service, set build command `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Docker: `docker build -t thought-gen . && docker run -p 8000:8000 -e OPENAI_API_KEY=yourkey thought-gen`

## Tests
`pytest`

## Evaluations with LangSmith
Run offline evals on the Mastery Loop graph:
- `python app/evals/eval_mastery.py`
- View results in LangSmith UI (link printed).
- Dataset: "oop-mastery-eval" with sample codes.
- Evaluator: Custom LLM-as-judge for profile correctness.


