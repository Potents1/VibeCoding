# AGI Project – AI Coding Agent Instructions

## Project Overview
This codebase is a modular, multi-agent AGI research platform. It includes:
- **Ontology building pipeline** (see `obuilder/`): Large-scale, multi-stage OWL ontology construction (see `obuilder/.github/copilot-instructions.md` for deep details)
- **Agent system** (see `agentsystem/`): Python-based agent orchestration, logging, and tool integration
- **Web dashboard** (see `agent-dashboard/`): React frontend for monitoring and control

## Architecture & Key Patterns
- **Agentsystem**: Entry in `agentsystem/AGI.py`. Agents are Python classes in `agentsystem/agents/`, configured via `agentsystem/config/`.
- **App**: Flask-based backend in `app/`, with `routes.py`, `socket_events.py`, and `extensions.py` for API, real-time, and extension logic.
- **Ontology Pipeline**: See `obuilder/` and its own copilot-instructions for build, config, and data flow details.
- **Models**: ML models and utilities in `models/` (e.g., `llm_factory.py`, `learning_model.joblib`).
- **Data**: Ontologies, RDF, and JSON knowledge in `data/`.

## Developer Workflows
- **Python venv**: Always activate `env/` or `.venv/` before running or installing.
- **Build/Run**: Main entry is `main.py` (or `train_model.py` for ML). For agents, use `agentsystem/AGI.py`.
- **Testing**: Use `pytest` for Python (`python -m pytest tests/`).
- **Frontend**: In `agent-dashboard/`, use `npm start`, `npm run build`, `npm test` (see its README).

## Conventions & Integration
- **Logging**: Use `setup_logging.py` in `agentsystem/` for agent logs. App logs via `app/logging.py`.
- **Config**: Central config in `config.py` and per-module configs (e.g., `agentsystem/config/`).
- **Agent Patterns**: Agents inherit from a base class, use event-driven or queue-based communication (see `app/queue.py`).
- **External Dependencies**: Managed via `requirements.txt` (Python) and `package.json` (Node/React).
- **Data Flow**: Agents communicate via shared state, queues, and socket events. Ontology pipeline is mostly file-driven.

## Key Files & References
- `main.py`, `train_model.py` – Entrypoints
- `agentsystem/AGI.py`, `agentsystem/agents/` – Agent logic
- `app/routes.py`, `app/socket_events.py` – API and real-time
- `models/llm_factory.py` – LLM integration
- `requirements.txt`, `package.json` – Dependencies
- `obuilder/.github/copilot-instructions.md` – Ontology pipeline details

## AI Agent Guidelines
- **Never edit hand-crafted files** (e.g., `obuilder/Roles.owl`)
- **Use structured logging** and follow existing logging patterns
- **Batch memory-intensive operations** (see ontology pipeline)
- **Test changes in isolation** before full builds
- **Check for errors after edits** (especially OWL, ML, or agent config changes)
- **Preserve CSV/JSON seeds** – these are authoritative for structure
- **When in doubt, grep for similar patterns in the monoliths** (e.g., `obuilder.py`, `AGI.py`)

For ontology-specific instructions, see `obuilder/.github/copilot-instructions.md`.
