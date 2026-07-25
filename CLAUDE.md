# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

This repository holds a single reference dataset: the internal ICMS (Imposto sobre Circulação de Mercadorias e Serviços) tax rates for each Brazilian state ("UF"). There is no application code, build system, or test suite — it is a data repository.

## Structure

- `aliquotas.csv` — the only file. Semicolon-delimited, 27 rows (one per Brazilian state/federal district, `UF` = 2-letter state abbreviation), plus a header row.
  - Columns: `UF;Aliquota`
  - `UF`: standard 2-letter Brazilian state code (e.g. `SP`, `RJ`, `AC`)
  - `Aliquota`: internal ICMS rate as a percentage, using `.` as the decimal separator (e.g. `20.5`)

## Conventions to preserve when editing `aliquotas.csv`

- Delimiter is `;`, not `,` — keep it consistent with the existing rows.
- Decimal separator is `.` (not `,`), even though this is Brazilian data where `,` is the local convention.
- Rows are ordered alphabetically by `UF` code.
- Keep exactly one row per state (26 states + DF = 27 data rows) plus the header.

## Working in this repository

There are no build, lint, or test commands — changes are direct edits to the CSV data. When updating rates, verify the new value against an authoritative source (state or federal tax authority publication) before committing, since this file appears to serve as ground truth for ICMS rates elsewhere.
