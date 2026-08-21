import { Injectable } from '@nestjs/common';
import {
  matchAssessmentSchema,
  type MatchAssessment,
} from '@career-os/contracts';
import type { Principal } from '../auth/principal.js';
import { ProfileRepository } from './profile.repository.js';

const LOGIC_VERSION = 'deterministic-evidence-v1';

@Injectable()
export class MatchingService {
  constructor(private readonly profiles: ProfileRepository) {}

  async compare(
    principal: Principal,
    externalId: string,
  ): Promise<MatchAssessment> {
    const { profile, job } = await this.profiles.persistedJob(
      principal,
      externalId,
    );
    const snapshot = JSON.parse(String(job.snapshot_json)) as Record<
      string,
      unknown
    >;
    const skills = (profile.skills as string[]).map((value) =>
      value.toLocaleLowerCase('en'),
    );
    const description =
      typeof snapshot.description === 'string'
        ? snapshot.description.toLocaleLowerCase('en')
        : '';
    const structured = [
      ...this.labels(snapshot.mustHaveSkills),
      ...this.labels(snapshot.niceToHaveSkills),
    ];
    const requirements = [
      ...new Set(
        structured.length
          ? structured
          : skills.filter((skill) => description.includes(skill)),
      ),
    ];
    const matching = requirements.filter((requirement) =>
      skills.includes(requirement.toLocaleLowerCase('en')),
    );
    const missing = requirements.filter(
      (requirement) => !skills.includes(requirement.toLocaleLowerCase('en')),
    );
    const evidence = (requirement: string, present: boolean) => ({
      requirement,
      profileEvidence: present
        ? [`Confirmed profile skill: ${requirement}`]
        : [],
      jobEvidence: [`Job listing requirement: ${requirement}`],
      provenance: 'source_fact' as const,
    });
    const preferredLocations = profile.preferredLocations as string[];
    const location = snapshot.location as Record<string, unknown> | undefined;
    const locationLabel = [
      location?.city,
      location?.municipality,
      location?.region,
      location?.country,
    ]
      .filter(Boolean)
      .join(', ');
    const locationCompatibility =
      preferredLocations.length === 0
        ? 'uncertain'
        : preferredLocations.some((value) =>
              locationLabel
                .toLocaleLowerCase('en')
                .includes(value.toLocaleLowerCase('en')),
            )
          ? 'compatible'
          : 'incompatible';
    const score = requirements.length
      ? Math.round(
          (matching.length / requirements.length) * 80 +
            (locationCompatibility === 'compatible'
              ? 20
              : locationCompatibility === 'uncertain'
                ? 10
                : 0),
        )
      : 50;
    const assessment = matchAssessmentSchema.parse({
      overallScore: Math.min(100, score),
      matchingRequirements: matching.map((item) => evidence(item, true)),
      missingRequirements: missing.map((item) => evidence(item, false)),
      uncertainRequirements: requirements.length
        ? []
        : [
            {
              requirement: 'No structured requirements were available',
              profileEvidence: [],
              jobEvidence: [],
              provenance: 'deterministic_inference',
            },
          ],
      experienceCompatibility: profile.experienceLevel
        ? 'uncertain'
        : 'uncertain',
      locationCompatibility,
      recommendation:
        score >= 75
          ? 'strong_match'
          : score >= 45
            ? 'possible_match'
            : 'weak_match',
      rationale: `${matching.length} of ${requirements.length} explicit requirements match confirmed profile skills. Location is ${locationCompatibility}.`,
      logicVersion: LOGIC_VERSION,
      profileVersion: Number(profile.version),
      jobRefreshedAt: new Date(String(job.last_refreshed_at)).toISOString(),
      model: null,
      configuration: { skillWeight: 80, locationWeight: 20 },
      calculatedAt: new Date().toISOString(),
    });
    const stored = await this.profiles.storeMatch(
      principal,
      externalId,
      assessment,
    );
    return matchAssessmentSchema.parse(stored);
  }

  private labels(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const labels: string[] = [];
    const items: unknown[] = value;
    for (const item of items) {
      if (typeof item === 'string') labels.push(item);
      else if (item !== null && typeof item === 'object' && 'label' in item) {
        const label: unknown = item.label;
        if (typeof label === 'string') labels.push(label);
      }
    }
    return labels;
  }
}
