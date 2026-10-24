"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import styles from "./AuthForm.module.css";

type Region = {
  id: string;
  apiId: string;
  name: string;
};

type FormData = {
  fullname: string;
  email: string;
  password: string;
  bank_name: string;
  bank_no: string;
  merchant_name: string;
  merchant_email: string;
  address: string;
  province_id: string;
  regency_id: string;
  district_id: string;
  village_id: string;
};

const initialForm: FormData = {
  fullname: "",
  email: "",
  password: "",
  bank_name: "",
  bank_no: "",
  merchant_name: "",
  merchant_email: "",
  address: "",
  province_id: "",
  regency_id: "",
  district_id: "",
  village_id: "",
};

const regionLevels = [
  "provinces",
  "regencies",
  "districts",
  "villages",
] as const;

type RegionLevel = (typeof regionLevels)[number];

const parseRegions = (payload: unknown): Region[] => {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];

  return data
    .map(item => {
      if (!item || typeof item !== "object") return null;
      const region = item as { id?: unknown; code?: unknown; name?: unknown };
      const apiId = region.id;
      const name = region.name;
      return typeof apiId !== "undefined" && typeof name === "string"
        ? { id: String(apiId), apiId: String(apiId), name }
        : null;
    })
    .filter((region): region is Region => region !== null);
};

const Register = () => {
  const router = useRouter();
  const [formData, setFormData] = useState(initialForm);
  const [regions, setRegions] = useState<Record<RegionLevel, Region[]>>({
    provinces: [],
    regencies: [],
    districts: [],
    villages: [],
  });
  const [loadingLevel, setLoadingLevel] = useState<RegionLevel | null>(
    "provinces",
  );
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const loadRegions = async (
    level: RegionLevel,
    parentId = "",
  ): Promise<Region[]> => {
    const params = new URLSearchParams({ level, parent_id: parentId });
    const response = await fetch(`/api/apps/auth/merchant-regions?${params}`);
    const payload: { data?: unknown; error?: string } = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Gagal memuat data wilayah.");
    }
    return parseRegions(payload);
  };

  useEffect(() => {
    let active = true;

    loadRegions("provinces")
      .then(provinces => {
        if (active) setRegions(current => ({ ...current, provinces }));
      })
      .catch(loadError => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Gagal memuat provinsi.",
          );
        }
      })
      .finally(() => active && setLoadingLevel(null));

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData(current => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setError("");
  };

  const selectRegion = async (
    level: RegionLevel,
    field: "province_id" | "regency_id" | "district_id" | "village_id",
    value: string,
  ) => {
    const next: Partial<FormData> = { [field]: value };
    if (field === "province_id") {
      next.regency_id = "";
      next.district_id = "";
      next.village_id = "";
    } else if (field === "regency_id") {
      next.district_id = "";
      next.village_id = "";
    } else if (field === "district_id") {
      next.village_id = "";
    }

    setFormData(current => ({ ...current, ...next }));
    setRegions(current => ({
      ...current,
      ...(field === "province_id"
        ? { regencies: [], districts: [], villages: [] }
        : field === "regency_id"
          ? { districts: [], villages: [] }
          : field === "district_id"
            ? { villages: [] }
            : {}),
    }));

    if (field === "village_id") return;

    const levelToLoad =
      field === "province_id"
        ? "regencies"
        : field === "regency_id"
          ? "districts"
          : field === "district_id"
            ? "villages"
            : null;

    if (!levelToLoad || !value) return;

    setLoadingLevel(levelToLoad);
    setError("");
    try {
      const options = await loadRegions(levelToLoad, value);
      setRegions(current => ({ ...current, [levelToLoad]: options }));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat data wilayah.",
      );
    } finally {
      setLoadingLevel(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const emptyRequired = Object.entries(formData).find(([, value]) =>
      !value.trim()
    );
    if (emptyRequired) {
      setError("Seluruh field wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/apps/auth/merchant-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const payload: { error?: string; message?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(payload.error || payload.message || "Registrasi gagal.");
      }

      setSuccess(true);
    } catch (registerError) {
      setError(
        registerError instanceof Error
          ? registerError.message
          : "Registrasi merchant gagal.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!success) return;

    const redirectTimer = window.setTimeout(() => {
      setSuccess(false);
      router.replace("/auth/login");
      router.refresh();
    }, 1800);

    return () => window.clearTimeout(redirectTimer);
  }, [router, success]);

  const regionField = (
    level: RegionLevel,
    field: "province_id" | "regency_id" | "district_id" | "village_id",
    label: string,
    placeholder: string,
    disabled: boolean,
  ) => (
    <div className={styles.field}>
      <label htmlFor={field} className={styles.label}>
        {label}
      </label>
      <select
        id={field}
        name={field}
        value={formData[field]}
        onChange={event =>
          void selectRegion(level, field, event.target.value)
        }
        className={styles.input}
        disabled={disabled || loadingLevel === level}
        required
      >
        <option value="">{placeholder}</option>
        {regions[level].map(region => (
          <option key={region.id} value={region.id}>
            {region.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <main className={styles.page}>
      <section
        className={`${styles.card} ${styles.registerCard}`}
        aria-labelledby="register-title"
      >
        <Image
          className={styles.brandMark}
          src="/images/ninggrat-cafe-logo.png"
          alt="Ningrat Cafe"
          width={72}
          height={72}
          priority
        />
        <h1 className={styles.title} id="register-title">
          Registrasi <span className={styles.brandName}>Merchant.</span>
        </h1>
        <p className={styles.subtitle}>
          Lengkapi data pemilik, merchant, rekening, dan wilayah.
        </p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className={`${styles.form} ${styles.registerForm}`}
        >
          <div className={styles.field}>
            <label htmlFor="fullname" className={styles.label}>
              Nama Pemilik
            </label>
            <input
              id="fullname"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              className={styles.input}
              placeholder="Masukkan nama pemilik"
              autoComplete="name"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email Akun
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="owner@merchant.com"
              autoComplete="email"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              placeholder="Masukkan password"
              autoComplete="new-password"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="merchant_name" className={styles.label}>
              Nama Merchant
            </label>
            <input
              id="merchant_name"
              name="merchant_name"
              value={formData.merchant_name}
              onChange={handleChange}
              className={styles.input}
              placeholder="Masukkan nama merchant"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="merchant_email" className={styles.label}>
              Email Merchant
            </label>
            <input
              id="merchant_email"
              name="merchant_email"
              type="email"
              value={formData.merchant_email}
              onChange={handleChange}
              className={styles.input}
              placeholder="merchant@email.com"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="bank_name" className={styles.label}>
              Nama Bank
            </label>
            <input
              id="bank_name"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              className={styles.input}
              placeholder="Contoh: Bank BCA"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="bank_no" className={styles.label}>
              Nomor Rekening
            </label>
            <input
              id="bank_no"
              name="bank_no"
              value={formData.bank_no}
              onChange={handleChange}
              className={styles.input}
              inputMode="numeric"
              placeholder="Masukkan nomor rekening"
              required
            />
          </div>
          {regionField(
            "provinces",
            "province_id",
            "Provinsi",
            "Pilih provinsi",
            false,
          )}
          {regionField(
            "regencies",
            "regency_id",
            "Kabupaten/Kota",
            "Pilih kabupaten/kota",
            !formData.province_id,
          )}
          {regionField(
            "districts",
            "district_id",
            "Kecamatan",
            "Pilih kecamatan",
            !formData.regency_id,
          )}
          {regionField(
            "villages",
            "village_id",
            "Desa/Kelurahan",
            "Pilih desa/kelurahan",
            !formData.district_id,
          )}
          <div className={styles.field}>
            <label htmlFor="address" className={styles.label}>
              Alamat Lengkap
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={styles.input}
              placeholder="Masukkan alamat lengkap"
              rows={3}
              required
            />
          </div>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitting || loadingLevel !== null}
          >
            {submitting ? "Memproses..." : "Daftar Merchant"}
          </button>
          <p className={styles.alternateAction}>
            Sudah punya akun? <Link href="/auth/login">Masuk</Link>
          </p>
        </form>
      </section>
      <footer className={styles.footer}>
        © {new Date().getFullYear()} PT. Indonesia Emas. Seluruh hak cipta
        dilindungi.
      </footer>

      {success && (
        <div className={styles.modalBackdrop}>
          <section
            className={styles.successModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-success-title"
            aria-describedby="register-success-description"
          >
            <div className={styles.successIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="m7 12.5 3.2 3.2L17.5 8.5" />
              </svg>
            </div>
            <h2 className={styles.successTitle} id="register-success-title">
              Register Berhasil
            </h2>
            <p
              className={styles.successDescription}
              id="register-success-description"
            >
              Merchant telah terdaftar, silahkan login
            </p>
          </section>
        </div>
      )}
    </main>
  );
};

export default Register;
