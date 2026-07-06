# guest-nickname-generator Specification

## Purpose

TBD - created by archiving change 'add-guest-nickname-generator'. Update Purpose after archive.

## Requirements

### Requirement: Guest nickname generation pool

The guest login nickname generator SHALL use exactly 50 configured prefix strings and exactly 50 configured suffix strings. Each configured prefix MUST contain no more than 4 Chinese characters. Each configured suffix SHALL be a Chinese noun label. The generator SHALL expose 2500 base nickname combinations by concatenating one prefix with one suffix.

#### Scenario: Generator exposes 2500 base combinations

- **WHEN** the guest nickname generator configuration is inspected
- **THEN** it contains exactly 50 prefixes and exactly 50 suffixes
- **THEN** the base combination count is 2500

##### Example: combination count

- **GIVEN** 50 prefixes and 50 suffixes
- **WHEN** the base combination count is calculated
- **THEN** the result is 2500

#### Scenario: Generated nickname uses configured parts

- **WHEN** the guest nickname generator returns a nickname
- **THEN** the nickname is the concatenation of one configured prefix and one configured suffix
- **THEN** the nickname is not empty

---
### Requirement: Guest login uses generated nicknames

The guest login modal SHALL initialize the nickname input with a generated nickname when the modal component is created. The guest login modal SHALL generate a new nickname when the user activates the random nickname button. The guest login modal MUST preserve manual nickname editing, empty nickname validation, the configured input maximum length, and the existing guest player creation flow.

#### Scenario: Modal opens with generated nickname

- **WHEN** the guest login modal is created
- **THEN** the nickname input contains a generated nickname from the configured prefix and suffix pools

#### Scenario: Random nickname button generates nickname

- **WHEN** the user activates the random nickname button
- **THEN** the nickname input is replaced with a generated nickname from the configured prefix and suffix pools
- **THEN** any previous nickname validation error is cleared

#### Scenario: Manual nickname entry is preserved

- **WHEN** the user manually enters a non-empty nickname and submits the guest login form
- **THEN** the guest player creation request uses the manually entered nickname as the username

---
### Requirement: Rolled combinations are not tracked

The guest nickname generator SHALL NOT persist or otherwise track previously generated combinations. Repeated calls to the generator SHALL be allowed to return the same nickname combination. The system SHALL NOT use localStorage, backend storage, or database lookups to exclude previously rolled or previously registered names during generation.

#### Scenario: Repeated generation does not require uniqueness state

- **WHEN** the random nickname button is activated multiple times
- **THEN** the frontend does not read or write any persisted rolled-name history
- **THEN** the generated nickname is selected from the same 2500 base combinations each time

#### Scenario: Existing backend uniqueness behavior remains authoritative

- **WHEN** a generated or manually entered guest nickname is submitted
- **THEN** the existing guest player creation API remains responsible for accepting the username or returning the existing duplicate-name error
