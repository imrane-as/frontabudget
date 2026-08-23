"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Camera, Save, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import ProfileAvatar from "@/components/ProfileAvatar";
import { createClient } from "@/lib/supabase/client";

type EmploymentStatus =
  | "employee"
  | "self_employed"
  | "student"
  | "job_seeker"
  | "retired"
  | "other";

type Props = {
  initialFullName: string;
  initialBirthYear: number | null;
  initialHouseholdSize: number;
  initialEmploymentStatus: EmploymentStatus | null;
  initialSkills: string;
  initialGroceryBudgetWeekly: number | null;
  initialHasAvatar: boolean;
  profileVersion?: string | null;
};

const currentYear = new Date().getFullYear();

type SupabaseError = {
  code?: string;
  message?: string;
  details?: string;
};

function profileSaveError(error: SupabaseError) {
  const diagnostic = `${error.message || ""} ${error.details || ""}`.toLowerCase();
  const missingColumn = error.message?.match(/Could not find the '([^']+)' column/i)?.[1];

  if (error.code === "PGRST204" || diagnostic.includes("schema cache")) {
    return missingColumn
      ? `Le champ « ${missingColumn} » manque dans Supabase. Applique la dernière migration de réparation, puis actualise cette page.`
      : "Supabase n’a pas encore actualisé les champs du profil. Applique la dernière migration de réparation, puis actualise cette page.";
  }
  if (error.code === "42501" || diagnostic.includes("row-level security")) {
    return "La règle de sécurité bloque la mise à jour de ton profil. La migration 0010 répare cette autorisation.";
  }
  if (error.code === "23514") {
    return "Une valeur du profil ne respecte pas les limites autorisées. Vérifie les champs puis réessaie.";
  }

  return `Le profil n’a pas pu être enregistré${error.code ? ` (erreur ${error.code})` : ""}.`;
}

export default function ProfileEditor({
  initialFullName,
  initialBirthYear,
  initialHouseholdSize,
  initialEmploymentStatus,
  initialSkills,
  initialGroceryBudgetWeekly,
  initialHasAvatar,
  profileVersion
}: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [birthYear, setBirthYear] = useState(
    initialBirthYear ? String(initialBirthYear) : ""
  );
  const [householdSize, setHouseholdSize] = useState(initialHouseholdSize);
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus | "">(
    initialEmploymentStatus || ""
  );
  const [skills, setSkills] = useState(initialSkills);
  const [groceryBudget, setGroceryBudget] = useState(
    initialGroceryBudgetWeekly === null ? "" : String(initialGroceryBudgetWeekly)
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasAvatar, setHasAvatar] = useState(initialHasAvatar);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function chooseAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setError(null);

    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choisis une image JPG, PNG ou WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("La photo doit faire moins de 2 Mo.");
      event.target.value = "";
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const parsedBirthYear = birthYear ? Number(birthYear) : null;
    const parsedGroceryBudget = groceryBudget ? Number(groceryBudget) : null;

    if (!fullName.trim() || fullName.trim().length > 100) {
      setError("Le nom doit contenir entre 1 et 100 caractères.");
      setLoading(false);
      return;
    }
    if (
      parsedBirthYear !== null &&
      (!Number.isInteger(parsedBirthYear) || parsedBirthYear < 1900 || parsedBirthYear > currentYear)
    ) {
      setError("L’année de naissance est invalide.");
      setLoading(false);
      return;
    }
    if (!Number.isInteger(householdSize) || householdSize < 1 || householdSize > 12) {
      setError("La taille du foyer doit être comprise entre 1 et 12.");
      setLoading(false);
      return;
    }
    if (
      parsedGroceryBudget !== null &&
      (!Number.isFinite(parsedGroceryBudget) || parsedGroceryBudget < 0 || parsedGroceryBudget > 10000)
    ) {
      setError("Le budget courses doit être compris entre 0 et 10 000 €.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setError("Ta session a expiré.");
      setLoading(false);
      return;
    }

    const avatarPath = `${user.id}/avatar`;
    if (avatarFile) {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(avatarPath, avatarFile, {
          cacheControl: "300",
          contentType: avatarFile.type,
          upsert: true
        });

      if (uploadError) {
        setError(
          `La photo n’a pas pu être enregistrée${uploadError.name ? ` (${uploadError.name})` : ""}. Vérifie la migration 0010.`
        );
        setLoading(false);
        return;
      }
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        birth_year: parsedBirthYear,
        household_size: householdSize,
        employment_status: employmentStatus || null,
        skills: skills.trim() || null,
        grocery_budget_weekly: parsedGroceryBudget,
        ...(avatarFile ? { avatar_path: avatarPath } : {}),
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)
      .select("id")
      .maybeSingle();

    if (updateError) {
      setError(profileSaveError(updateError));
      setLoading(false);
      return;
    }

    if (!updatedProfile) {
      setError("Aucun profil n’est associé à ce compte. Applique la migration 0010 pour le recréer.");
      setLoading(false);
      return;
    }

    if (avatarFile) setHasAvatar(true);
    setAvatarFile(null);
    setMessage("Profil enregistré. Les conseils sont maintenant mieux personnalisés.");
    setLoading(false);
    router.refresh();
  }

  async function removeAvatar() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setError("Ta session a expiré.");
      setLoading(false);
      return;
    }

    await supabase.storage.from("avatars").remove([`${user.id}/avatar`]);
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_path: null, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("id")
      .maybeSingle();

    if (updateError) {
      setError(profileSaveError(updateError));
    } else if (!updatedProfile) {
      setError("Aucun profil n’est associé à ce compte. Applique la migration 0010 pour le recréer.");
    } else {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setAvatarFile(null);
      setHasAvatar(false);
      setMessage("Photo de profil supprimée.");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form className="form profile-editor" onSubmit={save}>
      <div className="profile-photo-panel">
        <div className="profile-photo-preview">
          {previewUrl ? (
            <Image src={previewUrl} alt="Aperçu de la photo" fill unoptimized />
          ) : (
            <ProfileAvatar
              label={fullName || "Profil"}
              hasAvatar={hasAvatar}
              version={profileVersion}
              size="large"
            />
          )}
        </div>
        <div>
          <strong>Photo de profil</strong>
          <p>JPG, PNG ou WebP · 2 Mo maximum. La photo reste privée.</p>
          <div className="profile-photo-actions">
            <label className="btn btn-compact profile-upload-button">
              <Camera size={15} /> Choisir une photo
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAvatar} />
            </label>
            {(hasAvatar || previewUrl) && (
              <button type="button" className="btn btn-compact" onClick={removeAvatar} disabled={loading}>
                <Trash2 size={14} /> Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="profile-fields-grid">
        <label>
          Nom complet
          <input required maxLength={100} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
        </label>
        <label>
          Année de naissance
          <input type="number" min="1900" max={currentYear} inputMode="numeric" placeholder="Ex. 1995" value={birthYear} onChange={(event) => setBirthYear(event.target.value)} />
        </label>
        <label>
          Taille du foyer
          <input type="number" min="1" max="12" value={householdSize} onChange={(event) => setHouseholdSize(Number(event.target.value))} />
        </label>
        <label>
          Situation professionnelle
          <select value={employmentStatus} onChange={(event) => setEmploymentStatus(event.target.value as EmploymentStatus | "")}>
            <option value="">Non renseignée</option>
            <option value="employee">Salarié</option>
            <option value="self_employed">Indépendant</option>
            <option value="student">Étudiant</option>
            <option value="job_seeker">En recherche d’emploi</option>
            <option value="retired">Retraité</option>
            <option value="other">Autre</option>
          </select>
        </label>
        <label>
          Budget courses par semaine
          <div className="input-with-unit"><input type="number" min="0" max="10000" step="1" inputMode="decimal" placeholder="Ex. 90" value={groceryBudget} onChange={(event) => setGroceryBudget(event.target.value)} /><span>€</span></div>
        </label>
        <label className="profile-skills-field">
          Compétences ou activités
          <input maxLength={400} placeholder="Ex. informatique, bricolage, coiffure, sport…" value={skills} onChange={(event) => setSkills(event.target.value)} />
          <small>Utilisé uniquement pour proposer des pistes de revenus adaptées.</small>
        </label>
      </div>

      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}

      <button className="btn btn-primary save-profile" disabled={loading}>
        {loading ? <UserRound size={16} /> : <Save size={16} />}
        {loading ? "Enregistrement..." : "Enregistrer mon profil"}
      </button>
    </form>
  );
}
