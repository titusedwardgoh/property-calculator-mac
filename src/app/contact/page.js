"use client";

import React, { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Mail, Send, CheckCircle, ChevronDown } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 3000], [0, -200]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    category: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e) => {
    if (submitError) setSubmitError("");
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          category: formData.category,
          message: formData.message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(
          typeof data.error === "string"
            ? data.error
            : "Something went wrong. Please try again."
        );
        return;
      }
      setIsSubmitted(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        category: "",
        message: "",
      });
    } catch {
      setSubmitError("Network error. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 border border-primary rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all";

  const drop = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay, ease: "easeOut" },
  });

  /** Tight stagger — same order, a touch snappier */
  const t = {
    intro: 0.05,
    email: 0.13,
    before: 0.21,
    names: 0.29,
    formEmail: 0.37,
    message: 0.45,
    send: 0.53,
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Desktop parallax background — hidden on mobile */}
      <motion.div
        className="fixed left-0 right-0 top-[-10vh] h-[120vh] z-0 pointer-events-none hidden md:block"
        style={{
          y: parallaxY,
          backgroundImage: "url('/test11.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden="true"
      />
      {/* Mobile static background — hidden on desktop */}
      <div
        className="fixed left-0 right-0 top-[-10vh] h-[120vh] z-0 pointer-events-none md:hidden"
        style={{
          backgroundImage: "url('/test11.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden="true"
      />

      <main className="relative z-10">
        <section className="relative min-h-screen">
          <div
            className="absolute inset-0 z-0 bg-white/30 backdrop-blur-md"
            aria-hidden="true"
          />
          <div className="relative z-10 container mx-auto px-4 pt-20 pb-12 md:pt-24 md:pb-16 lg:pt-28 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="max-w-5xl mx-auto bg-white/100 backdrop-blur-sm border border-white/80 rounded-3xl shadow-lg p-8 md:p-12 lg:p-14"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 lg:items-stretch">
            {/* Left: intro + contact — bottom card aligns with form / Send on large screens */}
            <div className="flex flex-col gap-8 lg:h-full lg:min-h-0 lg:pr-4 text-center md:text-left">
              <motion.div {...drop(t.intro)}>
                <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  Get in touch
                </h1>
                <p className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                  We&apos;d like to hear from you
                </p>
                <p className="text-gray-600 leading-relaxed">
                  If you have questions, feedback, or just want to say hello, use
                  the form and we&apos;ll get back to you as soon as we can.
                </p>
              </motion.div>

              <motion.div
                className="flex flex-col items-center text-center gap-3 sm:flex-row sm:items-start sm:text-left"
                {...drop(t.email)}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="w-5 h-5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Email</p>
                  <a
                    href="mailto:support@auspropertycalc.com"
                    className="text-gray-900 hover:text-primary transition-colors break-all"
                  >
                    support@auspropertycalc.com
                  </a>
                  <p className="text-sm text-gray-500 mt-1">
                    We typically respond within 24 hours
                  </p>
                </div>
              </motion.div>

            </div>

            {/* Right: form */}
            <div className="lg:border-l lg:border-base-300 lg:pl-14">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="text-center py-10 lg:py-16"
                >
                  <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Message sent
                  </h2>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    Thank you—we&apos;ll reply when we can.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setSubmitError("");
                    }}
                    className="text-primary hover:text-primary-focus cursor-pointer font-medium transition-colors"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    {...drop(t.names)}
                  >
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        First name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className={inputClass}
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Last name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className={inputClass}
                        placeholder="Last name"
                      />
                    </div>
                  </motion.div>

                  <motion.div {...drop(t.formEmail)}>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="email"
                      autoComplete="off"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="your.email@example.com"
                      pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                      title="Enter a valid email address"
                    />
                  </motion.div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="category"
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleChange}
                        className={`${inputClass} appearance-none cursor-pointer`}
                      >
                        <option value="" disabled>Select a category...</option>
                        <option value="technical">Technical Issue</option>
                        <option value="calculation">Calculation Query</option>
                        <option value="feedback">General Feedback</option>
                        <option value="feature">Feature Request</option>
                        <option value="privacy">Privacy or Data Enquiry</option>
                        <option value="terms">Terms of Service</option>
                        <option value="partnership">Partnership or Press</option>
                        <option value="other">Other</option>
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                        aria-hidden
                      />
                    </div>
                  </div>

                  <motion.div {...drop(t.message)}>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={7}
                      className={`${inputClass} resize-none min-h-[160px]`}
                      placeholder="Tell us what is on your mind..."
                    />
                  </motion.div>

                  {submitError ? (
                    <p
                      className="text-sm text-error rounded-lg bg-error/10 border border-error/30 px-4 py-3"
                      role="alert"
                    >
                      {submitError}
                    </p>
                  ) : null}

                  <motion.div
                    className="flex justify-stretch sm:justify-end pt-2"
                    {...drop(t.send)}
                  >
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={isSubmitting ? undefined : { scale: 1.02 }}
                      whileTap={isSubmitting ? undefined : { scale: 0.98 }}
                      className="inline-flex w-full sm:w-auto items-center cursor-pointer justify-center gap-2 px-8 py-3 bg-primary hover:bg-primary-focus text-secondary rounded-full font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-60 disabled:pointer-events-none"
                    >
                      <Send className="w-4 h-4" />
                      {isSubmitting ? "Sending…" : "Send"}
                    </motion.button>
                  </motion.div>
                </form>
              )}

              <motion.div
                className="rounded-2xl bg-primary/20 border border-warning p-5 mt-6 text-center md:text-left"
                {...drop(t.before)}
              >
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  Before you reach out
                </h2>
                <ul className="text-gray-700 text-sm space-y-2 leading-relaxed">
                  <li>
                    Check the{" "}
                    <Link
                      href="/faq"
                      className="text-primary hover:text-primary-focus underline"
                    >
                      FAQ
                    </Link>{" "}
                    for quick answers.
                  </li>
                  <li>
                    Figures from the calculator are estimates—confirm with your
                    conveyancer or adviser.
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.36, ease: "easeOut" }}
          className="max-w-3xl mx-auto mt-8 text-center text-sm text-white/90 leading-relaxed px-2"
        >
          For information about the limitations of our calculations, see our{" "}
          <Link
            href="/disclaimer"
            className="text-white hover:underline  font-medium"
          >
            Disclaimer
          </Link>
          .
        </motion.p>
          </div>
        </section>
      </main>
    </div>
  );
}
