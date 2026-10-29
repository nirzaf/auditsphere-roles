# AuditSphere team access setup

This page prepares access requests; it does not grant access or deliver requests automatically.

## Run and check

```sh
npm install
npm run dev
npm test
npm run build
```

## Administrator handoff

Set `VITE_ACCESS_ADMIN_EMAIL` to a real, monitored administrator mailbox at build time. Without it, the page explicitly asks the firm to obtain the delivery address from their setup coordinator. Example-domain addresses are not used as delivery destinations.

The only customer handoff is **add people → review team → download reviewed CSV → send the attachment to the administrator**. The CSV includes firm/requester details, the exact application role, coverage type and target in separate columns, expiry requests and notes. Downloading is not submission or approval. Administrators must verify identity, coverage, staffing and independent approvals in AuditSphere's assignment workflow.

Drafts start empty, remain only in page memory and are lost on refresh. No names or email addresses are automatically persisted to browser storage or D1. The existing server recording functions and migrations remain in the repository but are not called by this page. They do not constitute a completed review queue or notification service.

## Keeping content aligned

`src/data/rolesData.ts` supplies the eleven supported roles and allowed coverage choices used by the role cards, comparison, selector, validation and exports. `src/utils/roleAssessor.test.ts` covers catalogue mappings, allowed coverage, dates, request identity, scope-aware warnings and CSV safety. The role summaries follow the supplied review of AuditSphere commit `1abc670151c4b9c76f448f8137e3f50c852fdc60`; they are not a substitute for server authorization checks.

Use **Print roles guide** for the current catalogue (or save as PDF in the print dialog). Legacy PDFs, training components and technical reference data are not presented as customer downloads; they require a separate maintainer review before republication.
