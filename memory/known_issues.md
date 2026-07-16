# Known Issues / Required Inputs

- Docs 00-05 are now populated; the API and database design docs remain pending.
- Tasks 3, 4, and 5 remain pending until the human team supplies the Customer, Tutor, and Mission Agent prompts called out in `current_tasks.md`.
- Existing local database files created before Module 5 will need a migration or reset before they include the new gameplay inventory and progress columns.
- Agent framework is not yet connected to a sync or gameplay endpoint. Live OpenAI calls require `SMARTDUKA_OPENAI_API_KEY`; tests use local provider doubles and make no network calls.
