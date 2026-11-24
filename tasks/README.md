# Work management

Tasks are the unit of assignment and acceptance. The Tech Lead creates focused tasks, assigns them dynamically, and records dependencies. Developers update the task as work progresses and leave a handover before completion.

## Directories

- `active/` — assigned or in-progress work.
- `completed/` — accepted work with a handover and evidence.
- `blocked/` — work paused by a documented dependency or decision.

Move a task only when its status and handover support the move. Do not delete task history.

## Task specification template

See [`task-template.md`](task-template.md). Every task must include ID/title, objective, context/requirements, scope and out-of-scope, dependencies, files/components, acceptance criteria, testing requirements, and expected deliverables.

See [`backlog.md`](backlog.md) for the current prioritized implementation backlog. Tasks in `blocked/` require explicit decisions or technical prerequisites; tasks in `completed/` retain their acceptance evidence and handover.
