# TOX REFERRAL ECONOMIC RULES V003

## Principio
Il programma distingue in modo assoluto **SCONTO SUL CANONE** e **COMMISSIONE CASH**.

### Fascia 1 — referral validi 1–10
- Canone base TOX REAL: **€350/settimana**.
- Ogni referral valido riduce il canone di **€35/settimana**.
- Formula: `WEEKLY_FEE = max(0, 350 - 35 * VALID_DISCOUNT_REFERRALS)`.
- Cap sconto: 10 referral validi.
- Un DEMO_ACTIVE può contribuire temporaneamente allo sconto ma genera **€0 cash commission**.

### Fascia 2 — REAL 11–20
Solo i referral REAL economicamente validi nella fascia commissionale 11–20 possono produrre commissione cash.

## Regola master commissionale
TOX redistribuisce al referrer il **40% del ricavo netto effettivamente incassato e consolidato** attribuibile ai referral commissionabili.

Per `NET_SETTLED_REFERRAL_REVENUE` si intende l'importo realmente incassato da TOX per il referral eleggibile, al netto di IVA/imposte riscosse per conto dell'Erario, rimborsi, chargeback/storni e commissioni del payment processor. Costi generali aziendali non vengono dedotti salvo futura modifica contrattuale esplicita.

Formula per periodo di competenza:
`RAW_COMMISSION = 0.40 * SUM(NET_SETTLED_REFERRAL_REVENUE)`

Cap personale mensile:
`APPROVED_MONTHLY_COMMISSION = min(6000 EUR, RAW_COMMISSION_MONTH)`

L'eccedenza oltre €6.000/mese **non matura, non viene riportata al mese successivo e non crea credito**, salvo futura modifica contrattuale esplicita.

## Condizioni inderogabili
- DEMO = nessuna commissione cash.
- REAL_PENDING_PAYMENT = nessuna commissione.
- REAL_PAYING senza pagamento consolidato = nessuna commissione approvata.
- REAL_SETTLED = può generare commissione se appartiene alla fascia commissionale.
- pagamento fallito, rimborsato o stornato = nessuna commissione o reversal della quota già contabilizzata.
- nessun pagamento effettivamente incassato = nessuna commissione.
- un cliente può avere un solo referrer.
- self-referral vietato.
- conteggi, pricing e commissioni sono sempre autorità server-side.

## Esempio economico teorico
Se 10 referral della fascia commissionale generano ciascuno €350/settimana effettivamente consolidati e l'intero importo è eleggibile, la quota teorica è il 40%, cioè €140 per referral/settimana. Il pagamento effettivo resta comunque soggetto al cap personale di **€6.000 per mese civile** e alle regole di settled revenue.

## Pagamento commissioni
- Periodo: mese civile, timezone Europe/Rome per la UI; contabilizzazione DB in UTC.
- Stato ledger: `PENDING -> APPROVED -> PAID` oppure `REVERSED`.
- `APPROVED` solo su ricavi settled.
- Pagamento cash da attivare solo dopo definizione del metodo di payout, verifica fiscale e completamento del payment stack.

## Claim pubblico
Consentito: **"fino a €6.000/mese extra"** solo accompagnato da una disclosure chiara che si tratta di un limite massimo del programma referral, non di reddito garantito, e che dipende da referral REAL paganti, ricavi effettivamente incassati e condizioni del programma.

Vietato: presentare €6.000/mese come guadagno atteso, garantito o automatico.