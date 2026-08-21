'use client';
import React, { useEffect, useState } from 'react';
const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
type Profile = {
  preferredRoles: string[];
  preferredLocations: string[];
  remotePreference: string | null;
  experienceLevel: string | null;
  skills: string[];
  languages: string[];
  careerGoals: string;
  version: number;
};
type Cv = {
  id: string;
  originalFilename: string;
  extractionStatus: string;
  derivedProfile: {
    preferredRoles: string[];
    preferredLocations: string[];
    experienceLevel: string | null;
    skills: string[];
    languages: string[];
    summary: string;
  };
};
export function ProfileWorkspace() {
  const [profile, setProfile] = useState<Profile>();
  const [cvs, setCvs] = useState<Cv[]>([]);
  const [error, setError] = useState('');
  async function load() {
    const [profileResponse, cvResponse] = await Promise.all([
      fetch(`${base}/api/v1/profile`),
      fetch(`${base}/api/v1/profile/cvs`),
    ]);
    if (!profileResponse.ok || !cvResponse.ok)
      throw new Error('Could not load profile');
    setProfile((await profileResponse.json()) as Profile);
    setCvs((await cvResponse.json()) as Cv[]);
  }
  useEffect(() => {
    void load().catch((e: unknown) =>
      setError(e instanceof Error ? e.message : 'Failed'),
    );
  }, []);
  async function save() {
    if (!profile) return;
    const response = await fetch(`${base}/api/v1/profile`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (response.status === 409) {
      setError('Your profile changed elsewhere. Reload before saving.');
      return;
    }
    if (!response.ok) throw new Error('Could not save profile');
    setProfile((await response.json()) as Profile);
  }
  async function upload(file: File) {
    const body = new FormData();
    body.append('file', file);
    const response = await fetch(`${base}/api/v1/profile/cvs`, {
      method: 'POST',
      body,
    });
    if (!response.ok) throw new Error('CV upload failed');
    const cv = (await response.json()) as Cv;
    setCvs((old) => [cv, ...old]);
  }
  async function approve(cv: Cv) {
    if (!profile) return;
    const response = await fetch(
      `${base}/api/v1/profile/cvs/${cv.id}/approve`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          documentId: cv.id,
          fields: cv.derivedProfile,
          expectedVersion: profile.version,
        }),
      },
    );
    if (!response.ok)
      throw new Error('Could not approve extracted information');
    setProfile((await response.json()) as Profile);
    setCvs((old) =>
      old.map((item) =>
        item.id === cv.id ? { ...item, extractionStatus: 'approved' } : item,
      ),
    );
  }
  if (!profile)
    return (
      <main className="profile-shell">
        <h1>Career profile</h1>
        <p>{error || 'Loading…'}</p>
      </main>
    );
  return (
    <main className="profile-shell">
      <header>
        <p className="eyebrow">Your evidence base</p>
        <h1>Career profile</h1>
        <p>
          Confirmed fields guide matching. CV suggestions never overwrite these
          silently.
        </p>
      </header>
      {error && <p role="alert">{error}</p>}
      <div className="profile-grid">
        <label>
          Preferred roles
          <input
            value={profile.preferredRoles.join(', ')}
            onChange={(e) =>
              setProfile({
                ...profile,
                preferredRoles: e.target.value
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <label>
          Locations
          <input
            value={profile.preferredLocations.join(', ')}
            onChange={(e) =>
              setProfile({
                ...profile,
                preferredLocations: e.target.value
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <label>
          Skills
          <input
            value={profile.skills.join(', ')}
            onChange={(e) =>
              setProfile({
                ...profile,
                skills: e.target.value
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <label>
          Languages
          <input
            value={profile.languages.join(', ')}
            onChange={(e) =>
              setProfile({
                ...profile,
                languages: e.target.value
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <label>
          Remote preference
          <select
            value={profile.remotePreference ?? ''}
            onChange={(e) =>
              setProfile({
                ...profile,
                remotePreference: e.target.value || null,
              })
            }
          >
            <option value="">No preference</option>
            <option>remote</option>
            <option>hybrid</option>
            <option>onsite</option>
            <option>flexible</option>
          </select>
        </label>
        <label>
          Experience level
          <select
            value={profile.experienceLevel ?? ''}
            onChange={(e) =>
              setProfile({
                ...profile,
                experienceLevel: e.target.value || null,
              })
            }
          >
            <option value="">Not set</option>
            <option>entry</option>
            <option>mid</option>
            <option>senior</option>
            <option>lead</option>
            <option>executive</option>
          </select>
        </label>
        <label className="wide">
          Career goals
          <textarea
            value={profile.careerGoals}
            onChange={(e) =>
              setProfile({ ...profile, careerGoals: e.target.value })
            }
          />
        </label>
      </div>
      <button
        onClick={() =>
          void save().catch((e: unknown) =>
            setError(e instanceof Error ? e.message : 'Failed'),
          )
        }
      >
        Save confirmed profile
      </button>
      <section>
        <h2>CV review</h2>
        <p>
          PDF or DOCX, up to the configured limit. The original is stored
          outside SQL.
        </p>
        <input
          aria-label="Upload CV"
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
              void upload(file).catch((x: unknown) =>
                setError(x instanceof Error ? x.message : 'Upload failed'),
              );
          }}
        />
        {cvs.map((cv) => (
          <article className="cv-review" key={cv.id}>
            <h3>{cv.originalFilename}</h3>
            <p>Status: {cv.extractionStatus}</p>
            <p>
              <strong>Suggested skills:</strong>{' '}
              {cv.derivedProfile.skills.join(', ') || 'None detected'}
            </p>
            <p>
              <strong>Suggested languages:</strong>{' '}
              {cv.derivedProfile.languages.join(', ') || 'None detected'}
            </p>
            <details>
              <summary>Inspect extracted summary</summary>
              <p>{cv.derivedProfile.summary}</p>
            </details>
            {cv.extractionStatus !== 'approved' && (
              <button
                onClick={() =>
                  void approve(cv).catch((x: unknown) =>
                    setError(
                      x instanceof Error ? x.message : 'Approval failed',
                    ),
                  )
                }
              >
                Approve these extracted fields
              </button>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
