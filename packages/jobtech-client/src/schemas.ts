import { z } from 'zod';

const nullableText = z.string().nullish();
const taxonomyItem = z
  .object({
    concept_id: nullableText,
    label: nullableText,
  })
  .nullish();

const address = z
  .object({
    municipality: nullableText,
    region: nullableText,
    country: nullableText,
    city: nullableText,
  })
  .nullish();

const requirement = z
  .object({
    skills: z.array(taxonomyItem.unwrap()).default([]),
  })
  .nullish();

export const upstreamJobSchema = z.object({
  id: z.string().min(1),
  headline: z.string().nullish(),
  webpage_url: nullableText,
  application_deadline: nullableText,
  publication_date: nullableText,
  number_of_vacancies: z.number().int().nonnegative().nullish(),
  description: z
    .object({
      text: nullableText,
    })
    .nullish(),
  employer: z
    .object({
      name: nullableText,
    })
    .nullish(),
  application_details: z
    .object({
      url: nullableText,
    })
    .nullish(),
  occupation: taxonomyItem,
  employment_type: taxonomyItem,
  working_hours_type: taxonomyItem,
  workplace_address: address,
  salary_description: nullableText,
  must_have: requirement,
  nice_to_have: requirement,
});

export const upstreamSearchResponseSchema = z.object({
  total: z.object({ value: z.number().int().nonnegative() }),
  hits: z.array(upstreamJobSchema),
});

export const upstreamAutocompleteResponseSchema = z.object({
  typeahead: z.array(
    z.object({
      value: z.string(),
      type: z.string(),
      occurrences: z.number().int().nonnegative(),
    }),
  ),
});

export type UpstreamJob = z.infer<typeof upstreamJobSchema>;
