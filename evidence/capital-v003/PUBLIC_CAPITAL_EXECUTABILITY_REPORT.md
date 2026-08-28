# TOX CAPITAL EXECUTABILITY EVIDENCE — PUBLIC V003

## Frozen tested configuration
Initial capital EUR 1,000 · leverage 5x · position sizing 5% margin · sizing basis current equity · Capital Management CM V001

CM V001 SHA256: `ba2608d69c60f7534482ffcc4cc7ad47bdbd1de516aff88e136d051067d2b5bd`

## Canonical result
4 canonical datasets tested · 8,779 canonical opportunities reported · 8,779 CM trades · 4.38 average operations/day · 15 maximum simultaneous positions · 10 maximum simultaneous losing positions · 75.15% maximum observed margin utilization · EUR 365.46 minimum observed free margin · EUR -109.64 largest overlapping unrealized loss · 0 capital rejections · 0 simulated liquidation conditions · temporary capital compression YES

## FULL vs CM control
On BCE3 and V12 control paths, FULL reached 20 concurrent positions and 99.4% maximum margin utilization with 1 capital rejection. CM V001 reached 15 concurrent positions, about 75.2% maximum margin utilization and 0 capital rejections.

## Cryptographic verification
V003 certification root: `3e6a0f23e9a2d9555d79d531f8751c0bc95f78bdcb5c483d53468b458455a7d9`

Underlying V003 verifier reported: `INPUT_INTEGRITY = PASS`, `CALCULATION_REPRODUCIBILITY = PASS`, `OUTPUT_INTEGRITY = PASS`.

## Limits
Historical/simulated evidence under the declared account model; not a future guarantee. Simulated liquidation conditions are not certified Bybit liquidation behavior. The V003 mapped HST1 slice starts 2023-08-07 and does not contain the May 2022 Terra/LUNA episode. Proprietary strategy logic and private ledgers are not included in this public report.