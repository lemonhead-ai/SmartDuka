# Known Issues / Required Inputs

- Docs 00-05 are now populated; the API and database design docs remain pending.
- Tasks 3, 4, and 5 remain pending until the human team supplies the Customer, Tutor, and Mission Agent prompts called out in `current_tasks.md`.
- Existing local SQLite demo databases receive safe additive upgrades at startup. Schema changes that rename or remove columns will still require a managed migration before production.
- The agent bundle is connected to gameplay and sync. It uses Featherless Chat Completions with `zai-org/GLM-5.2`.
- The repository-wide Ruff check has pre-existing style violations outside this increment; the backend test suite and frontend type/build checks pass.
