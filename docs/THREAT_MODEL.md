# Threat model (honest version)

| Threat | Control | Residual risk |
|---|---|---|
| Forged deed copy | Digital seal: file hash must match a registered `doc_hash`; QR opens the seal page | Someone can still print a fake QR that points to a *different, real* deed. The verify page shows the real deed's owner and plot so a mismatch is visible. Educate users to compare the plot and names |
| Altered record in the database | Append-only triggers; chain re-verification (`/api/integrity`) on every check page | An attacker with database-owner rights can drop triggers; then chain verification and the anchor catch it |
| Fake seller | Rule `NOT_OWNER` blocks; alert recorded | Identity of a *real* owner can be impersonated outside this system (needs digital ID + biometrics in production) |
| Double sale | Plot lock until mutation approval; DB chain guard rejects forks | None inside the system; paper deeds sold outside it are out of scope |
| Double mortgage | One active lien per plot; lien blocks sale | Banks must use the system (policy) |
| Insider with an office key rewrites history | Public Merkle anchor + independent verifier detect it | **Detection, not prevention.** Needs the anchor to be published somewhere the insider cannot edit (newspaper, public site, several offices as witnesses) |
| Key theft | Per-office keys (a stolen key affects one office) | Demo derives keys from a master secret. Production: HSM/smartcard per office, rotation, revocation list |
| Replay of an old valid deed | Marked OUTDATED because a newer block exists | None |
| Injection / XSS | All text via `textContent`; strict CSP (`script-src 'self'`); input validation | Inline styles are allowed by CSP (no script execution) |
| Flooding | Per-client rate limit, 64 KB body cap | Needs a CDN / WAF in production |
| Privacy | Demo data only; public check page shows only dummy fields; IPs hashed in audit log | Production must decide exactly which fields are public (legal review) |
| Demo roles are not authentication | Stated everywhere | Production: national digital ID, MFA, per-office accounts |

Out of scope on purpose: scraping or testing any real government system (forbidden by the rules).
