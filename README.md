# ⚡ GridVane: Physics-Verified, Quantum-Safe Thermo-Carbon VPP & Grid Resilience Ledger

[![IEEE ClimateChain 2026](https://img.shields.io/badge/IEEE_ClimateChain_2026-Track_2_%2B_Cross--Tracks_1%2C_4%2C_3-10B981?style=for-the-badge)](https://ieee-climatechain-hack.devpost.com/)
[![IEEE Std C57.91](https://img.shields.io/badge/IEEE_Std_C57.91--2011-Transformer_Thermal_Aging-F59E0B?style=for-the-badge)](#)
[![NIST FIPS 204](https://img.shields.io/badge/NIST_FIPS_204-ML--DSA--65_%2B_PP--PQB-8B5CF6?style=for-the-badge)](#)
[![IEEE P3271.01](https://img.shields.io/badge/IEEE_P3271.01-Recurring_DLT_Settlement-06B6D4?style=for-the-badge)](#)
[![UN COP31 Antalya](https://img.shields.io/badge/UN_COP31_Showcase-Antalya%2C_T%C3%BCrkiye-F43F5E?style=for-the-badge)](#)

> **Primary Hackathon Track:** **Track 2 — Renewable Energy & Energy Trading**  
> **Cross-Track Synergies:** **Track 1** (Carbon Markets & dMRV via Locational Marginal Emissions + Triple-Silo Registry), **Track 4** (Climate Risk & TSRS / IFRS S2 Transformer Asset Loss Forecasting), **Track 3** (Circular EV Battery Thermal Passport)

---

## 🌍 1. The Problem: The Climate-Grid Paradox & The Oracle Integrity Gap

During an extreme **$43.8^\circ\text{C}$ Mediterranean heatwave** (such as in **Antalya, Türkiye**, official host city of **UN COP31** where the IEEE ClimateChain winners are announced), three physical and cryptographic failure modes collide on distribution feeders:

1. **Solar PV Thermal Derating:** Crystalline silicon solar arrays reach cell temperatures of $T_{\text{cell}} \approx 75.0^\circ\text{C}$, losing **$-15.4\%$ to $-21.0\%$** of their clean power output ($\gamma = -0.42\%/^\circ\text{C}$ above $25^\circ\text{C}$ STC) at the exact hour air-conditioning loads surge by $+42\%$.
2. **Exponential Transformer Insulation Destruction (`IEEE Std C57.91-2011`):** Substation and secondary mineral-oil transformers reach winding hottest-spot temperatures of $\Theta_H \in [126^\circ\text{C}, 134.3^\circ\text{C}]$. Per **IEEE Std C57.91-2011**, cellulose paper depolymerization obeys Arrhenius kinetics ($F_{AA} = \exp(15000/383 - 15000/(\Theta_H + 273))$), doubling aging every $6^\circ\text{C}$ above $110^\circ\text{C}$.
3. **Smart-Meter Greenwashing (FDIA), Quantum Exposure & Clinic Curtailment:** Existing blockchain energy and carbon apps blindly trust signed JSON payloads from smart meters (vulnerable to **False Data Injection Attacks / CT-clamp spoofing** and **20-year quantum key forgery**), treat every kWh as equal using flat regional emission averages, allow cross-registry double-counting across VCM / I-REC / EU CBAM, and indiscriminately throttle HVAC cooling on vulnerable medical clinics and heat shelters.

---

## 🚀 2. The GridVane Architecture: Five Cyber-Physical Breakthroughs

```mermaid
flowchart TB
    subgraph L1["1. Cyber-Physical IEEE 33-Bus Feeder Twin & Weather Coupling"]
        W["Live Open-Meteo API + ERA5 / EURO-CORDEX / CMIP6 (SSP2-4.5, SSP5-8.5)"]
        G["Baran & Wu IEEE 33-Bus Radial AC DistFlow Solver (12.66 kV, 32 Branches)"]
        T["6 Monitored Distribution Transformers (IEEE Std C57.91-2011 Hot-Spot & AAL)"]
    end

    subgraph L2["2. Kirchhoff Physics-Residual Firewall & Post-Quantum Attestation"]
        K["Kirchhoff AC Power & Voltage Residual Gate (r_ij <= 2.5 kW -> 99.4% FDIA Catch)"]
        P["Genuine NIST FIPS 204 ML-DSA-65 Lattice Signatures (1,952B PK / 3,309B Sig)"]
        Z["PP-PQB Salted SHA3-256 Range Commitments (Blinds Household Occupancy Curves)"]
    end

    subgraph L3["3. Explainable AI (XAI) Thermo-Carbon VPP & Thermal-Equity Gate"]
        L["Locational Marginal Emissions: LME_{i,t} = MEF_t * (1 + dPloss / dP_i)"]
        X["Shapley Feature Attribution + EV Li-Ion Arrhenius SoH Degradation Constraint"]
        E["Responsible AI Thermal-Equity Safety Gate (0 kW Cut on Clinics Buses 7, 14, 29)"]
    end

    subgraph L4["4. IEEE P3271.01 Recurring DLT Settlement & Triple-Silo Registry"]
        S["GridVaneSettlement.sol: 15-Min Recurring Settlement + Autonomous Failover"]
        D["Triple-Silo Atomic Lock: VCM (Verra/GS) <-> I-REC <-> EU CBAM / TSRS / Art. 6.2 ITMO"]
    end

    L1 --> L2 --> L3 --> L4
```

---

## 📊 3. `GridBench`: 720-Hour (30-Day) Empirical Ablation Study

Reproduce the full 720-hour simulation across all 4 regional feeder digital twins in seconds via `npm run bench`:

| Regional Feeder Digital Twin (720h) | Uncontrolled Baseline | Naive Carbon-Only VPP | **GridVane Thermo-Carbon VPP** | LME Carbon Gain | Line Loss ($I^2R$) Cut | Peak $\Theta_H$ (Base $\rightarrow$ GridVane) | IEEE C57.91 $F_{AA}$ Cut | Vulnerable Clinic Cut |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 🇹🇷 **Antalya (COP31 Host)** | $1,002.6\text{ tCO}_2\text{e}$ | $304.7\text{ tCO}_2\text{e}$ | **$70.2\text{ tCO}_2\text{e}$ ($-1,010.8\text{ t}$)** | **$+44.8\%$** | **$-55.9\%$** | $134.3^\circ\text{C} \rightarrow \mathbf{104.5^\circ\text{C}}$ | **$-96.0\%$** | **$0\text{h}$** (vs $180\text{h}$) |
| 🇹🇷 **Ankara (Gazi / Ostim)** | $1,117.0\text{ tCO}_2\text{e}$ | $333.4\text{ tCO}_2\text{e}$ | **$78.3\text{ tCO}_2\text{e}$ ($-1,125.9\text{ t}$)** | **$+43.7\%$** | **$-57.5\%$** | $126.6^\circ\text{C} \rightarrow \mathbf{92.3^\circ\text{C}}$ | **$-97.8\%$** | **$0\text{h}$** (vs $180\text{h}$) |
| 🇪🇪 **Tartu (Estonia PQC Grid)** | $609.6\text{ tCO}_2\text{e}$ | $128.1\text{ tCO}_2\text{e}$ | **$-8.8\text{ tCO}_2\text{e}$ ($-670.2\text{ t}$)** | **$+39.2\%$** | **$-52.6\%$** | $114.4^\circ\text{C} \rightarrow \mathbf{76.4^\circ\text{C}}$ | **$-98.3\%$** | **$0\text{h}$** (vs $180\text{h}$) |
| 🇺🇸 **Irvine (CA Duck Curve)** | $783.1\text{ tCO}_2\text{e}$ | $247.6\text{ tCO}_2\text{e}$ | **$79.2\text{ tCO}_2\text{e}$ ($-763.0\text{ t}$)** | **$+42.5\%$** | **$-51.8\%$** | $130.8^\circ\text{C} \rightarrow \mathbf{102.0^\circ\text{C}}$ | **$-96.0\%$** | **$0\text{h}$** (vs $180\text{h}$) |

---

## 📁 4. Mandatory IEEE Blockchain Türkiye Hackathon Deliverables (`/docs`)

All required specification, security, and impact documents mandated by the [IEEE Blockchain Türkiye Hackathon Specification](https://cmte.ieee.org/turkiye-blockchain/hackatlon/) are included in [`/docs`](./docs):

1. 📄 **[2-Page Problem & Solution Overview](./docs/1_Problem_and_Solution_Overview_2Page.md)** (`docs/1_Problem_and_Solution_Overview_2Page.md`)
2. 🏗️ **[System Architecture & Technical Specification](./docs/2_Architecture_and_Technical_Specification.md)** (`docs/2_Architecture_and_Technical_Specification.md`)
3. 🛡️ **[Security & Data Integrity Assessment Document](./docs/3_Security_and_Data_Integrity_Assessment.md)** (`docs/3_Security_and_Data_Integrity_Assessment.md`)
4. 📈 **[Climate Impact Projections & `GridBench` Study](./docs/4_Climate_Impact_Projections_and_GridBench.md)** (`docs/4_Climate_Impact_Projections_and_GridBench.md`)
5. 🗺️ **[Adoption, Scalability & UN COP31 Antalya Roadmap](./docs/5_Adoption_Scalability_and_COP31_Roadmap.md)** (`docs/5_Adoption_Scalability_and_COP31_Roadmap.md`)
6. 🎬 **[Devpost Submission Text & 3-Minute Demo Video Script](./docs/DEVPOST_SUBMISSION_PACK.md)** (`docs/DEVPOST_SUBMISSION_PACK.md`)

---

## 🛠️ 5. Quick Start & Reproducibility

```bash
# 1. Install dependencies
npm install

# 2. Run the 720-hour GridBench Cyber-Physical Ablation & NIST FIPS 204 ML-DSA-65 Test Suite
npm run bench

# 3. Launch the Interactive Judge Command Cockpit (http://localhost:3000)
npm run dev
```

### Repository Structure
- `src/lib/physics/ieee33bus.ts` — Baran & Wu (1989) 33-Bus AC DistFlow power flow solver & Locational Marginal Emissions ($\text{LME}_{i,t}$) engine
- `src/lib/physics/transformerThermal.ts` — IEEE Std C57.91-2011 transformer thermal aging solver, PV NOCT derating & EV Li-ion Arrhenius wear model
- `src/lib/physics/feederPresets.ts` — Real-world regional feeder twins (Antalya COP31, Ankara, Tartu, Irvine)
- `src/lib/security/kirchhoffFirewall.ts` — Kirchhoff AC power/voltage residual firewall & adversarial FDIA red-team simulator
- `src/lib/crypto/pqcEngine.ts` — Genuine NIST FIPS 204 `ML-DSA-65` lattice signatures (`@noble/post-quantum`) & `PP-PQB` range commitments
- `src/lib/optimizer/vppOptimizer.ts` — Explainable AI (XAI) Shapley Thermo-Carbon VPP co-optimizer & Responsible AI Thermal-Equity Safety Gate
- `src/lib/blockchain/settlementRegistry.ts` — `IEEE P3271.01` Recurring DLT settlement channels & Triple-Silo Anti-Double-Counting state machine
- `contracts/GridVaneSettlement.sol` — Solidity smart contract enforcing Kirchhoff residuals, PQC roots, P3271.01 epochs, and Triple-Silo locks
- `scripts/gridbench.ts` — Standalone CLI benchmark runner (`npm run bench`)
