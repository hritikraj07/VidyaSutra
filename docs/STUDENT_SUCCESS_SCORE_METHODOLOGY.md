# VidyaSutra — Student Success Score Methodology

## 1. Overview & Core Philosophy
The VidyaSutra **Smart Campus Analytics** engine provides higher education institutions with a deterministic, explainable, and actionable decision-support platform. Rather than treating artificial intelligence or scoring as an opaque "black-box" prediction, VidyaSutra implements an auditable multi-factor formula grounded in verified institutional data.

The system addresses the core challenge: **"Predict, Optimize & Improve Student Success"** through four integrated capabilities:
1. **Multi-Pillar Data Integration**: Synthesizing 7 dimensions of campus life.
2. **Transparent Student Success Score**: Deterministic composite index on a 0–100 scale.
3. **Multi-Indicator Risk Detection**: Explainable risk diagnostics for Academic and Placement outcomes.
4. **Cohort Segmentation & Actionable Insights**: Automatic triage connecting indicators to concrete interventions.

---

## 2. Telemetry Indicators & Normalization

All indicators are normalized to a consistent **0–100 scale** before aggregation:

| Pillar | Raw Indicators | Normalization Function | Target Scale |
| :--- | :--- | :--- | :--- |
| **Academic Performance** | Cumulative GPA (CGPA, 0.0–10.0 scale) | `(CGPA / 10.0) * 100` | 0 – 100 |
| **Attendance** | Real verified attendance percentage | `Clamp(AttendancePct, 0, 100)` | 0 – 100 |
| **Assessment Performance** | Internal & Mid-term assessments | `Clamp((internalMarksAvg * 0.5 + semesterMarksAvg * 0.5), 0, 100)` | 0 – 100 |
| **LMS / Learning Activity** | Assignment completion rate & platform activity score | `(Completed / Total) * 50 + (lmsActivityScore * 0.5)` | 0 – 100 |
| **Campus Engagement** | Events, clubs, hackathons, and certifications | `Clamp((events*15 + clubs*15 + hacks*20 + certs*20), 0, 100)` | 0 – 100 |
| **Placement Readiness** | Aptitude, technical coding, and mock interview scores | `(aptitude * 0.3) + (coding * 0.4) + (mockInterview * 0.3)` | 0 – 100 |
| **Skills & Certifications** | Verified competencies & skill passport badges | `Clamp(verifiedSkillsCount * 20, 0, 100)` (5 skills = 100) | 0 – 100 |

---

## 3. Weighting Model & Success Score Calculation

The baseline weighting model reflects academic priorities and career readiness:

$$\text{Success Score} = \sum (\text{Component Score}_i \times \text{Weight}_i)$$

- **Academic Performance**: **30%** (0.30)
- **Attendance**: **20%** (0.20)
- **Assessment Performance**: **15%** (0.15)
- **LMS / Learning Activity**: **10%** (0.10)
- **Campus Engagement**: **10%** (0.10)
- **Placement Readiness**: **10%** (0.10)
- **Skills & Certifications**: **5%** (0.05)
- **Total**: **100%** (1.00)

### Score Bands
Scores map to clear, constructive institutional bands:
- **80 – 100**: `Strong` (Optimal academic standing and high career readiness)
- **60 – 79**: `Stable` (Consistent on-track performance; minor targeted refinements)
- **40 – 59**: `Needs Attention` (Early warning indicators detected; remediation suggested)
- **0 – 39**: `High Risk` (Critical deficits requiring immediate faculty/mentor intervention)

---

## 4. Safe Handling of Missing Data (Dynamic Weight Re-Normalization)

In higher education, freshmen (1st-year students) or students enrolled in early semesters often lack placement assessment records or final semester transcripts.
**Blindly assigning 0 to missing values would unfairly penalize new students and misclassify them as "High Risk".**

VidyaSutra employs **Dynamic Weight Re-Normalization**:
1. When an indicator has no recorded telemetry, its weight is temporarily removed from the evaluation set.
2. The remaining available indicators are re-normalized so their weights sum to 1.00:

$$W'_i = \frac{W_i}{\sum_{k \in \text{Available}} W_k}$$

$$\text{Success Score} = \sum_{i \in \text{Available}} (\text{Component Score}_i \times W'_i)$$

This ensures 1st-year students with high GPA and perfect attendance receive a fair `Strong` score, while upperclassmen are evaluated against comprehensive placement benchmarks.

---

## 5. Multi-Indicator Risk Logic & Explainability

Risk identification does **NOT** rely solely on the overall score. A student might maintain an average score of 72 while carrying 3 backlogs or attendance below the statutory 75% exam threshold.

VidyaSutra evaluates two specific risk axes:

### A. Academic Risk
Triggers and reason generation:
- **Low CGPA**: CGPA < 6.0 adds `CGPA of X.XX is below the institutional 6.0 minimum academic threshold`.
- **Active Backlogs**: Backlogs > 0 adds `Student currently has N active uncleared backlog(s)`.
- **Attendance Deficit**: Attendance < 75% adds `Attendance is X% (mandatory exam hall-ticket rule requires 75%+)`.
- **Declining Performance**: Trend = `'declining'` adds `Academic assessment trajectory shows a declining semester trend`.
- **Internal Assessment Deficit**: Internal marks < 50 adds `Internal assessment average (X/100) indicates acute subject struggle`.

Classification:
- **High**: Multiple critical conditions, backlogs $\ge 2$, or CGPA < 5.0.
- **Moderate**: 1 backlog, attendance between 70–75%, or declining trend.
- **Low**: Satisfactory academic standing.

### B. Placement Risk
Triggers and reason generation:
- **Coding Assessment Deficit**: Coding score < 50 adds `Coding assessment score (X/100) is below hiring standards`.
- **Aptitude Deficit**: Aptitude score < 50 adds `Aptitude assessment score (X/100) falls below company shortlisting cutoffs`.
- **Mock Interview Deficit**: Interview score < 50 adds `Mock technical interview score (X/100) requires vocal communication refinement`.
- **Insufficient Skills**: Verified skills < 2 adds `Only N verified skill badge(s) recorded in Skills Passport`.
- **Placement Participation**: Status `'not_started'` adds `Placement preparation not initiated`.

Classification:
- **High**: Critical placement deficits with readiness < 45%.
- **Moderate**: Readiness between 45–65%.
- **Low**: High placement readiness ($\ge 65\%$).

---

## 6. Student Segmentation Logic

VidyaSutra dynamically classifies each student into one of **7 distinct behavioral segments**:

1. **High Academic / Low Placement Readiness**:
   - `Academic Score >= 75` AND `Placement Score < 60`
   - *Profile*: Excellent in examinations but lacking competitive coding or interview practice.
   - *Target Intervention*: Mock technical interviews, coding hackathons, aptitude bootcamps.

2. **High Academic / High Placement Readiness**:
   - `Academic Score >= 75` AND `Placement Score >= 70`
   - *Profile*: Exceptional all-round performance.
   - *Target Intervention*: Tier-1 dream company placement drives and leadership opportunities.

3. **Low Academic / Low Attendance**:
   - `Academic Score < 60` AND `Attendance < 75`
   - *Profile*: Disengaged student facing double jeopardy of debarment and academic failure.
   - *Target Intervention*: Mandatory academic counseling and attendance warning protocol.

4. **Strong Attendance / Weak Academic Performance**:
   - `Attendance >= 80` AND `Academic Score < 60`
   - *Profile*: Highly disciplined and present, but struggling with subject comprehension.
   - *Target Intervention*: Remedial tutoring, peer study circles, and faculty office hours.

5. **Strong Academic / Low Engagement**:
   - `Academic Score >= 75` AND `Engagement Score < 40`
   - *Profile*: Exam-oriented student lacking extracurriculars, club leadership, or hackathons.
   - *Target Intervention*: Encourage club leadership, open-source projects, and technical symposiums.

6. **At-Risk Students**:
   - `Overall Risk == High Risk`
   - *Profile*: Severe deficit across multiple telemetry indicators.
   - *Target Intervention*: Comprehensive cross-functional intervention.

7. **Overall Strong Performers**:
   - `Overall Score >= 75` across balanced indicators.
   - *Profile*: Steady, balanced performance across all campus facets.

---

## 7. Actionable Insights Engine

Moving beyond static dashboards, the system converts raw metrics into structured **Actionable Insight Cards** featuring:
- **Condition Detected**: Exact telemetry trigger that fired.
- **Why It Matters**: Pedagogical and institutional significance.
- **Suggested Action**: Practical, constructive recommendation for faculty or the student.

*Example*:
> **Attendance + Academic Intervention Recommended**  
> *Trigger*: Attendance is 68.5% and academic marks are declining.  
> *Why It Matters*: Risk of exam debarment combined with subject failure.  
> *Suggested Action*: Issue formal attendance remediation letter and schedule 1-on-1 subject tutorial.

---

## 8. Role-Based Access & Data Privacy Architecture

- **Students**: Strictly limited to viewing their own personal score, radar drivers, strengths, and areas to improve. Cannot view classmates' metrics.
- **Faculty / Teachers**: Scoped strictly to their assigned course allotments and section rosters. Cannot access sensitive college-wide metrics outside their remit.
- **Administrators**: Campus-wide visibility with full interactive filters, aggregate distributions, and live telemetry editing privileges.
