 # Developer Guidelines

 ## 1. Project Overview
 The project provides a migration and authentication platform leveraging edge functions. This document outlines best practices, coding standards, and workflows for contributing.

 ## 2. Code Structure
 - **/src**: core application logic (auth, migration engine).
 - **/tests**: unit and integration tests.
 - **/docs**: project specifications and guides.

 ## 3. Branching and Version Control
 - Use feature branches: `feature/<descriptive-name>`.
 - Rebase frequently on `main` to stay up to date.
 - Write clear commit messages: `<type>(<scope>): <short description>`.
 - Open Pull Requests against `main` with a summary of changes and testing steps.

 ## 4. Coding Standards
 - Follow existing style (e.g., PEP8 for Python, standard JS conventions).
 - Use linters and formatters configured in the repo (run `pre-commit run --all-files`).
 - Keep functions small and focused; document public interfaces with docstrings.

 ## 5. Testing
 - Write unit tests for all new modules (aim for >80% coverage).
 - Include integration tests for auth flows and migration operations.
 - Run tests locally with `npm test` or `pytest` before pushing.
 - Use mock objects for external dependencies when necessary.

 ## 6. Documentation
 - Update or add `.md` files in `/docs` for any new features or changes.
 - Maintain CHANGELOG.md with notable updates.

 ## 7. CI/CD and Deployment
 - Ensure CI passes before merging (lint, tests, build).
 - For deployment, follow `/docs/DEPLOYMENT_GUIDE.md`.
 - Verify deployment by running smoke tests.

 ## 8. Communication and Support
 - Create Jira tickets for all tasks and link to PRs.
 - Join daily standups and update your progress.
 - Ask for help in the #project channel for blockers.

 ## 9. Onboarding Checklist for New Developers
 - [ ] Clone the repo and install dependencies.
 - [ ] Run `pre-commit install` and ensure hooks pass.
 - [ ] Read `/docs/MVP_SPECIFICATION.md` and `/docs/DEPLOYMENT_GUIDE.md`.
 - [ ] Complete a small starter ticket (e.g., fix a typo) to learn the workflow.
