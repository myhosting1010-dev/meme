# Deployment

Phase 0 status: deferred. The owner requires a deployable application and GitHub Actions CI/CD; no provider, repository, environment or deployment target is selected.

Later planning must establish a runtime compatible with Next.js and Mongoose, isolated environments, protected environment secrets, applicable lint/test/build gates, database backup/restore procedures and rollback. Do not put production credentials in source or documentation.

Phase 1 now provides a local Next.js foundation. See the root README for npm install, development, lint/test/build and production startup commands. Startup and build require no live database. No CI workflow, hosting resource, database resource or deployment was created; provider selection remains deferred.
