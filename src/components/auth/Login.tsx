"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./AuthForm.module.css";
import Link from "next/dist/client/link";

const Login = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/apps/auth/merchant-login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });
      const payload: {
        success?: boolean;
        error?: string;
        message?: string;
      } = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error || payload.message || "Email atau password salah",
        );
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Login gagal. Silakan coba kembali.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <Image
          className={styles.brandMark}
          src="/images/ninggrat-cafe-logo.png"
          alt="Ningrat Cafe"
          width={72}
          height={72}
          priority
        />
        <h1 className={styles.title} id="login-title">
          Selamat datang di{" "}
          <span className={styles.brandName}>Ningrat Cafe.</span>
        </h1>
        <p className={styles.subtitle}>
          Silahkan masuk ke akun anda untuk melanjutkan.
        </p>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <div className={styles.inputWrap}>
              <svg
                className={styles.inputIcon}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.input}
                placeholder="Masukkan email"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
                Password
            </label>
            <div className={styles.inputWrap}>
              <svg
                className={styles.inputIcon}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 1 1 8 0v3" />
              </svg>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="Masukkan password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk"}
            {!loading && <span aria-hidden="true">→</span>}
          </button>
          <p className={styles.alternateAction}>
                      Belum punya akun? <Link href="/auth/register">Daftar</Link>
                    </p>
        </form>
      </section>

      <footer className={styles.footer}>
        © {new Date().getFullYear()} - PT. Indonesia Emas
      </footer>
    </main>
  );
};

export default Login;
