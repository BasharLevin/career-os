import { BadRequestException, Injectable } from '@nestjs/common';
import {
  extractedProfileSchema,
  type ExtractedProfile,
} from '@career-os/contracts';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

const skillVocabulary = [
  'typescript',
  'javascript',
  'react',
  'next.js',
  'node.js',
  'nestjs',
  'azure',
  'sql',
  'python',
  'java',
  'c#',
  'docker',
  'kubernetes',
  'git',
];
const languages = [
  'english',
  'swedish',
  'svenska',
  'engelska',
  'german',
  'french',
  'spanish',
];

@Injectable()
export class CvExtractor {
  async text(mediaType: string, bytes: Buffer): Promise<string> {
    let text: string;
    try {
      if (mediaType === 'application/pdf') {
        const parser = new PDFParse({ data: bytes });
        try {
          text = (await parser.getText()).text;
        } finally {
          await parser.destroy();
        }
      } else {
        text = (await mammoth.extractRawText({ buffer: bytes })).value;
      }
    } catch {
      throw new BadRequestException('The CV could not be parsed');
    }
    const normalized = text
      .replace(/\0/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim();
    if (normalized.length < 40)
      throw new BadRequestException(
        'The CV contains too little extractable text',
      );
    return normalized.slice(0, 200_000);
  }

  derive(text: string): ExtractedProfile {
    const factualText = text
      .split(/(?<=[.!?])\s+|\n+/)
      .filter(
        (line) =>
          !/\b(ignore|system instruction|invent|claim|pretend|tool call)\b/i.test(
            line,
          ),
      )
      .join(' ');
    const lower = factualText.toLocaleLowerCase('en');
    const skills = skillVocabulary.filter((skill) => lower.includes(skill));
    const foundLanguages = languages.filter((language) =>
      lower.includes(language),
    );
    const senior = /\b(senior|lead|principal)\b/i
      .exec(factualText)?.[1]
      ?.toLowerCase();
    return extractedProfileSchema.parse({
      preferredRoles: [],
      preferredLocations: [],
      experienceLevel:
        senior === 'lead' || senior === 'principal'
          ? 'lead'
          : senior === 'senior'
            ? 'senior'
            : null,
      skills,
      languages: [
        ...new Set(
          foundLanguages.map((value) =>
            value === 'svenska'
              ? 'Swedish'
              : value === 'engelska'
                ? 'English'
                : value[0]!.toUpperCase() + value.slice(1),
          ),
        ),
      ],
      summary: factualText.slice(0, 1000),
    });
  }
}
