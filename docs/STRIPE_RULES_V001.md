# TOX STRIPE RULES V001

Stato: **PREPARED — PAYMENT ACTIVATION DEFERRED**.

Account Stripe esistente: account amministrato dal titolare del progetto. Il collegamento del conto bancario aziendale e l'attivazione dei pagamenti REAL vengono eseguiti solo quando il conto aziendale sarà disponibile.

## Regole
1. DEMO gratuita: nessuna carta richiesta, nessun addebito, nessun trial Stripe necessario.
2. Nessun passaggio automatico DEMO -> REAL.
3. REAL richiede scelta esplicita del cliente e pagamento valido.
4. Stati pagamento: `PENDING -> PAID -> SETTLED`; fallimenti/refund/chargeback devono produrre gli stati corrispondenti e aggiornare entitlement/ledger.
5. Le commissioni referral cash possono essere approvate solo su `SETTLED`.
6. `NO PAYMENT = NO COMMISSION`.
7. `FAILED/REFUNDED/CHARGEBACK = NO NEW COMMISSION` e, se necessario, reversal della commissione correlata.
8. Prezzo base commerciale: €350/settimana prima dello sconto referral applicabile.
9. Il pricing engine TOX resta source of truth; Stripe incassa l'importo calcolato server-side, non decide il conteggio referral.
10. Il client/browser non può modificare weekly fee, referral count o commission amount.
11. Webhook Stripe deve essere verificato con signing secret e idempotenza su payment/event ID.
12. Nessun secret Stripe nel browser, GitHub o client distribuito.

## Commissioni rete
Per referral commissionabili REAL 11–20:
`commissione grezza = 40% * ricavo netto settled attribuibile`
con cap personale `€6.000 / mese civile`.

## Attivazione futura
Prima di attivare pagamenti REAL: collegare conto aziendale, completare dati societari/fiscali, definire prodotti/prezzi Stripe, configurare webhook production, impostare env secrets e superare test E2E pagamento + refund + chargeback.