import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { siteConfig } from "@/config/site";
import type { ModelViewerElement } from "@/types/model-viewer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${siteConfig.name} — Mood baik, dimulai dari MacMood` },
      {
        name: "description",
        content:
          "Mac and cheese creamy dengan pilihan chicken katsu dan kentang. Comfort food untuk bikin hari terasa lebih baik.",
      },
      { property: "og:title", content: "MacMood — Mood baik, dimulai dari MacMood" },
      {
        property: "og:description",
        content:
          "Mac and cheese creamy hangat dengan pilihan chicken katsu dan kentang renyah.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  useEffect(() => {
    const OWNER_WHATSAPP = "";
    const currency = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // Mobile nav toggle
    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");
    const onToggleClick = () => {
      if (!menuToggle || !navLinks) return;
      const open = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Tutup navigasi" : "Buka navigasi");
      menuToggle.textContent = open ? "×" : "☰";
      navLinks.classList.toggle("is-open", open);
    };

    const onNavLinkClick = () => {
      if (!menuToggle || !navLinks) return;
      navLinks.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Buka navigasi");
      menuToggle.textContent = "☰";
    };

    if (menuToggle) menuToggle.addEventListener("click", onToggleClick);
    const navAnchors = navLinks ? navLinks.querySelectorAll("a") : [];
    navAnchors.forEach((link) => link.addEventListener("click", onNavLinkClick));

    // Reveal animations
    const reveals = document.querySelectorAll("[data-reveal]");
    let revealObserver: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window && !reduceMotion.matches) {
      revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      reveals.forEach((el) => revealObserver?.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add("is-visible"));
    }

    // Scroll engine & 3D bowl transition
    const progress = document.getElementById("scroll-progress");
    const storySection = document.getElementById("cerita");
    const heroSection = document.getElementById("hero");
    const heroModelSlot = document.getElementById("hero-model-slot");
    const storyModelSlot = document.querySelector(".story-model-slot");
    const sharedFoodStage = document.getElementById("shared-food-stage");
    const sharedFoodModel = document.getElementById("shared-food-model") as ModelViewerElement | null;
    const storySteps = Array.from(document.querySelectorAll("[data-story-step]"));
    const partnerWrap = document.getElementById("partner-model-wrap");
    const partnerSection = document.getElementById("mitra");
    const partnerModel = document.getElementById("partner-model") as ModelViewerElement | null;

    let scrollQueued = false;
    let sharedSceneStartAt = 0;
    let autoRotateTimer = 0;

    function clamp(value: number, min: number, max: number) {
      return Math.min(max, Math.max(min, value));
    }

    function updateSharedFoodPosition() {
      if (!heroModelSlot || !storyModelSlot || !sharedFoodStage || !heroSection || !storySection) {
        return;
      }
      const source = heroModelSlot.getBoundingClientRect();
      const destination = storyModelSlot.getBoundingClientRect();
      const header = document.querySelector(".site-header");
      const headerHeight = header ? header.getBoundingClientRect().height : 82;
      const isSmallScreen = window.innerWidth <= 760;

      if (isSmallScreen) {
        const heroRect = heroSection.getBoundingClientRect();
        const heroOpacity = clamp((heroRect.bottom - headerHeight) / 90, 0, 1);
        sharedFoodStage.style.left = "0px";
        sharedFoodStage.style.top = "0px";
        sharedFoodStage.style.transform = `translate3d(${source.left.toFixed(2)}px, ${source.top.toFixed(2)}px, 0)`;
        sharedFoodStage.style.width = source.width.toFixed(2) + "px";
        sharedFoodStage.style.height = source.height.toFixed(2) + "px";
        sharedFoodStage.style.opacity = heroOpacity.toFixed(3);
        sharedFoodStage.classList.add("is-ready");
        return;
      }

      const stickyTop = isSmallScreen ? headerHeight : window.innerHeight * 0.3;
      const targetTop = destination.top;
      const targetLeft = destination.left;
      const startAt = source.top + window.scrollY - headerHeight;
      sharedSceneStartAt = startAt;
      const storySectionPageTop = storySection.getBoundingClientRect().top + window.scrollY;
      const destinationPageTop = storySectionPageTop - stickyTop;
      const endAt = Math.max(startAt + 1, destinationPageTop);
      let t = clamp((window.scrollY - startAt) / (endAt - startAt), 0, 1);
      if (reduceMotion.matches) t = t < 0.5 ? 0 : 1;
      const x = source.left + (targetLeft - source.left) * t;
      const y = source.top + (targetTop - source.top) * t;
      const width = source.width + (destination.width - source.width) * t;
      const height = source.height + (destination.height - source.height) * t;
      const storySectionBottom = storySection.getBoundingClientRect().bottom;
      const fadeRange = Math.max(100, window.innerHeight * 0.16);
      const sceneOpacity = clamp((storySectionBottom - headerHeight) / fadeRange, 0, 1);

      sharedFoodStage.style.left = "0px";
      sharedFoodStage.style.top = "0px";
      sharedFoodStage.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      sharedFoodStage.style.width = width.toFixed(2) + "px";
      sharedFoodStage.style.height = height.toFixed(2) + "px";
      sharedFoodStage.style.opacity = sceneOpacity.toFixed(3);
      sharedFoodStage.classList.add("is-ready");
    }

    function updateScrollScenes() {
      scrollQueued = false;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) {
        progress.style.transform =
          "scaleX(" + (maxScroll > 0 ? window.scrollY / maxScroll : 0) + ")";
      }
      updateSharedFoodPosition();

      const storyModelWrap = document.getElementById("story-model-wrap");
      if (storyModelWrap) {
        const storyModelRect = storyModelWrap.getBoundingClientRect();
        const header = document.querySelector(".site-header");
        const headerHeight = header ? header.getBoundingClientRect().height : 82;
        const focusY =
          window.innerWidth <= 760
            ? headerHeight + window.innerHeight * 0.5
            : storyModelRect.top + storyModelRect.height * 0.5;
        let index = 0;
        let nearestDistance = Infinity;
        storySteps.forEach((step, i) => {
          const rect = step.getBoundingClientRect();
          const distance = Math.abs((rect.top + rect.bottom) / 2 - focusY);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            index = i;
          }
        });
        storySteps.forEach((step, i) => step.classList.toggle("is-active", i === index));
      }

      if (!reduceMotion.matches) {
        if (sharedFoodModel && sharedFoodModel.modelIsVisible) {
          let bowlProgress = 0;
          if (window.innerWidth <= 760) {
            const header = document.querySelector(".site-header");
            const headerHeight = header ? header.getBoundingClientRect().height : 82;
            const heroRect = heroSection?.getBoundingClientRect();
            if (heroRect && heroSection) {
              bowlProgress = clamp(
                (headerHeight - heroRect.top) /
                  Math.max(1, heroSection.offsetHeight - window.innerHeight),
                0,
                1
              );
            }
          } else {
            const lastStoryStep = storySteps[storySteps.length - 1]?.getBoundingClientRect();
            const storyEndAt = lastStoryStep ? lastStoryStep.bottom + window.scrollY : window.scrollY;
            bowlProgress = clamp(
              (window.scrollY - sharedSceneStartAt) /
                Math.max(1, storyEndAt - sharedSceneStartAt),
              0,
              1
            );
          }
          const yaw = 20 + bowlProgress * 125;
          const orbit = yaw.toFixed(1) + "deg 64deg 6.6m";
          sharedFoodModel.cameraOrbit = orbit;
        }

        if (partnerWrap && partnerModel && partnerModel.modelIsVisible && partnerSection) {
          const header = document.querySelector(".site-header");
          const headerHeight = header ? header.getBoundingClientRect().height : 82;
          const sectionTop = partnerSection.getBoundingClientRect().top;
          const scrollFromSectionStart = headerHeight - sectionTop;
          const yaw = clamp(scrollFromSectionStart * 0.34, -35, 145);
          const prog = clamp(
            scrollFromSectionStart / Math.max(1, partnerSection.offsetHeight),
            0,
            1
          );
          partnerModel.cameraOrbit =
            yaw.toFixed(1) +
            "deg " +
            (65 + Math.sin(prog * Math.PI) * 7).toFixed(1) +
            "deg 6.2m";
        }
      }
    }

    function pauseIdleRotation() {
      if (reduceMotion.matches || !sharedFoodModel) return;
      sharedFoodModel.removeAttribute("auto-rotate");
      window.clearTimeout(autoRotateTimer);
      // Only resume gentle auto-rotate if the user is stationary at the top of the hero section for 1.2s
      if (window.scrollY <= 20) {
        autoRotateTimer = window.setTimeout(() => {
          if (window.scrollY <= 20 && !reduceMotion.matches && sharedFoodModel) {
            sharedFoodModel.setAttribute("auto-rotate", "");
          }
        }, 1200);
      }
    }

    function requestScrollUpdate() {
      pauseIdleRotation();
      if (!scrollQueued) {
        scrollQueued = true;
        window.requestAnimationFrame(updateScrollScenes);
      }
    }

    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate, { passive: true });
    window.addEventListener("pageshow", requestScrollUpdate);

    // Sync directly with Lenis smooth scroll engine
    const lenis = (window as unknown as { __lenis?: { on: (event: string, callback: () => void) => void; off: (event: string, callback: () => void) => void } }).__lenis;
    if (lenis) {
      lenis.on("scroll", requestScrollUpdate);
    }

    // If models are already loaded or trigger load
    sharedFoodModel?.addEventListener?.("load", requestScrollUpdate);
    partnerModel?.addEventListener?.("load", requestScrollUpdate);

    updateScrollScenes();

    // Profit Simulator
    const avgOrder = document.getElementById("avg-order") as HTMLInputElement | null;
    const ordersDay = document.getElementById("orders-day") as HTMLInputElement | null;
    const openDays = document.getElementById("open-days") as HTMLInputElement | null;
    const margin = document.getElementById("margin") as HTMLInputElement | null;
    const monthlyCost = document.getElementById("monthly-cost") as HTMLInputElement | null;
    const simInputs = [avgOrder, ordersDay, openDays, margin, monthlyCost].filter(Boolean) as HTMLInputElement[];

    function updateSimulation() {
      if (!avgOrder || !ordersDay || !openDays || !margin || !monthlyCost) return;
      const average = Number(avgOrder.value);
      const orders = Number(ordersDay.value);
      const days = Number(openDays.value);
      const marginRate = Number(margin.value) / 100;
      const cost = Number(monthlyCost.value);
      const revenue = average * orders * days;
      const profit = revenue * marginRate - cost;

      const avgOrderVal = document.getElementById("avg-order-value");
      const ordersDayVal = document.getElementById("orders-day-value");
      const openDaysVal = document.getElementById("open-days-value");
      const marginVal = document.getElementById("margin-value");
      const monthlyCostVal = document.getElementById("monthly-cost-value");
      const monthlyRevenue = document.getElementById("monthly-revenue");
      const monthlyProfit = document.getElementById("monthly-profit");
      const simMath = document.getElementById("sim-math");

      if (avgOrderVal) avgOrderVal.textContent = currency.format(average);
      if (ordersDayVal) ordersDayVal.textContent = orders + " transaksi";
      if (openDaysVal) openDaysVal.textContent = days + " hari";
      if (marginVal) marginVal.textContent = Math.round(marginRate * 100) + "%";
      if (monthlyCostVal) monthlyCostVal.textContent = currency.format(cost);
      if (monthlyRevenue) monthlyRevenue.textContent = currency.format(revenue);
      if (monthlyProfit) monthlyProfit.textContent = currency.format(profit);
      if (simMath) {
        simMath.textContent = `${orders} transaksi/hari × ${days} hari × ${currency.format(average)} rata-rata transaksi. Estimasi laba: omzet × ${Math.round(marginRate * 100)}% margin − ${currency.format(cost)} biaya bulanan.`;
      }
    }

    simInputs.forEach((input) => input.addEventListener("input", updateSimulation));

    // Contact form
    const form = document.getElementById("contact-form") as HTMLFormElement | null;
    const contactStatus = document.getElementById("contact-status");
    const onFormSubmit = (event: SubmitEvent) => {
      event.preventDefault();
      if (!form || !contactStatus) return;
      if (!/^\d{8,15}$/.test(OWNER_WHATSAPP)) {
        contactStatus.textContent =
          "Nomor WhatsApp owner belum dikonfigurasi. Pesan belum dikirim.";
        return;
      }
      const values = new FormData(form);
      const body = [
        "Halo MacMood, aku mau menghubungi owner.",
        "Nama: " + values.get("name"),
        "Nomor WhatsApp: " + values.get("phone"),
        "Keperluan: " + values.get("interest"),
        "Pesan: " + values.get("message"),
      ].join("\n");
      const url = "https://wa.me/" + OWNER_WHATSAPP + "?text=" + encodeURIComponent(body);
      window.open(url, "_blank", "noopener,noreferrer");
      contactStatus.textContent = "WhatsApp terbuka dengan pesan yang sudah disiapkan.";
    };

    if (form) form.addEventListener("submit", onFormSubmit as EventListener);

    // Interest click handlers
    const interestLinks = document.querySelectorAll("[data-interest]");
    const onInterestClick = (event: Event) => {
      const link = event.currentTarget as HTMLElement;
      const interest = link.getAttribute("data-interest");
      if (interest) {
        const selector = document.getElementById("contact-interest") as HTMLSelectElement | null;
        if (selector) {
          const hasExactOption = Array.from(selector.options).some(
            (option) => option.value === interest || option.textContent === interest
          );
          selector.value = hasExactOption
            ? interest
            : interest.startsWith("Kemitraan")
              ? "Kemitraan"
              : interest;
        }
      }
    };
    interestLinks.forEach((link) => link.addEventListener("click", onInterestClick));

    if (reduceMotion.matches && sharedFoodModel) {
      sharedFoodModel.removeAttribute("auto-rotate");
    }

    const onMotionChange = (event: MediaQueryListEvent) => {
      if (!sharedFoodModel) return;
      if (event.matches) sharedFoodModel.removeAttribute("auto-rotate");
      else sharedFoodModel.setAttribute("auto-rotate", "");
    };

    reduceMotion.addEventListener?.("change", onMotionChange);

    // Initial simulation compute
    updateSimulation();

    // Cleanup
    return () => {
      if (menuToggle) menuToggle.removeEventListener("click", onToggleClick);
      navAnchors.forEach((link) => link.removeEventListener("click", onNavLinkClick));
      revealObserver?.disconnect();
      window.removeEventListener("scroll", requestScrollUpdate);
      window.removeEventListener("resize", requestScrollUpdate);
      window.removeEventListener("pageshow", requestScrollUpdate);
      sharedFoodModel?.removeEventListener?.("load", requestScrollUpdate);
      partnerModel?.removeEventListener?.("load", requestScrollUpdate);
      window.clearTimeout(autoRotateTimer);
      simInputs.forEach((input) => input.removeEventListener("input", updateSimulation));
      if (form) form.removeEventListener("submit", onFormSubmit as EventListener);
      interestLinks.forEach((link) => link.removeEventListener("click", onInterestClick));
      reduceMotion.removeEventListener?.("change", onMotionChange);
    };
  }, []);

  return (
    <div className="macmood-landing-root">
      <a className="skip-link" href="#main-content">
        Lewati ke konten
      </a>
      <div className="progress-line" id="scroll-progress" aria-hidden="true" />
      <header className="site-header">
        <div className="nav-wrap">
          <a className="brand" href="#hero" aria-label="MacMood, kembali ke awal">
            <img src="/assets/macmood-logo.png?v=2" alt="" />
            <span className="brand-copy">
              <strong>MACMOOD</strong>
              <small>MAC AND CHEESE, MADE HAPPY</small>
            </span>
          </a>
          <button
            className="menu-toggle"
            id="menu-toggle"
            type="button"
            aria-label="Buka navigasi"
            aria-expanded="false"
            aria-controls="nav-links"
          >
            ☰
          </button>
          <nav className="nav-links" id="nav-links" aria-label="Navigasi utama">
            <a href="#cerita">Cerita kami</a>
            <a href="#menu">Menu</a>
            <a href="#mitra">Paket mitra</a>
            <a href="#simulasi">Simulasi</a>
          </nav>
          <a className="nav-cta" href="#kontak">
            Yuk ngobrol <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="hero" aria-labelledby="hero-title">
          <div className="hero-inner">
            <div className="hero-copy" data-reveal="">
              <p className="eyebrow eyebrow-light">A little comfort for your day</p>
              <h1 id="hero-title">
                Mood baik,<span>dimulai dari MacMood.</span>
              </h1>
              <p className="hero-lede">
                Mac and cheese creamy dengan pilihan chicken katsu dan kentang—teman cheesy buat
                nemenin cerita seru hari ini.
              </p>
              <div className="hero-actions">
                <a
                  className="button button-primary"
                  href="#kontak"
                  data-interest="Pesan menu / PO"
                >
                  Pesan sekarang <span aria-hidden="true">↗</span>
                </a>
                <a className="button button-secondary" href="#cerita">
                  Kenalan dulu <span aria-hidden="true">↓</span>
                </a>
              </div>
              <p className="hero-footnote">
                Pilihan mac and cheese hangat, siap bikin jeda hari terasa lebih enak.
              </p>
              <a className="hero-scroll" href="#cerita">
                <span aria-hidden="true">↓</span> Ikuti ceritanya
              </a>
            </div>
            <div className="hero-visual" aria-label="Bowl MacMood 3D">
              <div className="hero-orbit" aria-hidden="true" />
              <div className="hero-model-slot" id="hero-model-slot" aria-hidden="true" />
              <div className="model-sticker" aria-hidden="true">
                <strong>Cheesy comfort</strong>
                <span>made for your mood</span>
              </div>
            </div>
          </div>
        </section>

        <div className="ticker" aria-label="MacMood: mac and cheese made happy">
          <div className="ticker-track" aria-hidden="true">
            <span>Mac and cheese, made happy</span>
            <span>Semangkuk comfort food</span>
            <span>Chicken katsu, kentang, makaroni</span>
            <span>Mood baik dimulai dari MacMood</span>
            <span>Mac and cheese, made happy</span>
            <span>Semangkuk comfort food</span>
            <span>Chicken katsu, kentang, makaroni</span>
            <span>Mood baik dimulai dari MacMood</span>
          </div>
        </div>

        <section className="mood-section" id="cerita" aria-labelledby="mood-title">
          <div className="container mood-grid">
            <div className="mood-copy" data-reveal="">
              <p className="eyebrow eyebrow-light">Lebih dari sekadar makan</p>
              <h2 className="section-title" id="mood-title">
                Hari panjang?{" "}
                <span style={{ color: "var(--yellow-400)" }}>Kasih jeda yang cheesy.</span>
              </h2>
              <p className="section-copy">
                Ada hari yang butuh teman ngobrol, ada juga yang cukup ditemani semangkuk mac and
                cheese. MacMood hadir membawa comfort food yang sederhana, hangat, dan bikin
                senyum balik lagi.
              </p>
              <div className="mood-points">
                <div className="mood-point">
                  <i>✓</i>
                  <span>Makaroni dengan saus keju creamy</span>
                </div>
                <div className="mood-point">
                  <i>✓</i>
                  <span>Pilihan pendamping chicken katsu dan kentang</span>
                </div>
                <div className="mood-point">
                  <i>✓</i>
                  <span>Dibuat untuk momen kecil yang bikin mood naik</span>
                </div>
              </div>
            </div>
            <div className="mood-story" id="mood-story">
              <div className="story-model-wrap" id="story-model-wrap" aria-hidden="true">
                <div className="story-model-slot" />
              </div>
              <div className="story-steps">
                <article className="story-step is-active" data-story-step="0">
                  <span className="step-count">01 / COMFORT</span>
                  <h3>Mulai dari saus keju yang creamy.</h3>
                  <p>Hangat, lembut, dan melapisi makaroni di setiap suapan.</p>
                </article>
                <article className="story-step" data-story-step="1">
                  <span className="step-count">02 / CRUNCH</span>
                  <h3>Tambah tekstur, tambah cerita.</h3>
                  <p>Chicken katsu dan kentang melengkapi semangkuk mac and cheese MacMood.</p>
                </article>
                <article className="story-step" data-story-step="2">
                  <span className="step-count">03 / GOOD MOOD</span>
                  <h3>Satu mangkuk kecil, jeda yang berarti.</h3>
                  <p>Temani obrolan, waktu istirahat, atau hadiah kecil buat diri sendiri.</p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="menu-section" id="menu" aria-labelledby="menu-title">
          <div className="container">
            <div className="section-heading menu-heading-row" data-reveal="">
              <div>
                <p className="eyebrow">Temukan mangkuk favoritmu</p>
                <h2 className="section-title" id="menu-title">
                  Cheesy, crispy, <em>happy.</em>
                </h2>
                <p className="menu-note">
                  Kenalan dengan pilihan MacMood dari materi menu yang kamu kirim.
                </p>
              </div>
              <a className="button button-light menu-link" href="#kontak">
                Tanya menu hari ini <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="menu-grid">
              <article className="menu-card" data-reveal="">
                <div className="menu-photo">
                  <img
                    src="/assets/menu-super-mac-reference.png"
                    alt="Super Mac dengan makaroni, chicken katsu dan saus keju."
                    loading="lazy"
                  />
                  <span className="menu-number">01 · Crowd fave</span>
                </div>
                <div className="menu-card-body">
                  <h3>Super Mac</h3>
                  <p>
                    Mac and cheese creamy dengan chicken katsu dan kentang untuk suapan yang lebih
                    lengkap.
                  </p>
                  <div className="menu-meta">
                    <span className="menu-price">Rp20.000</span>
                    <a className="menu-order" href="#kontak" aria-label="Tanya tentang Super Mac">
                      ↗
                    </a>
                  </div>
                </div>
              </article>
              <article className="menu-card delay-1" data-reveal="">
                <div className="menu-photo">
                  <img
                    src="/assets/menu-potato-mac-reference.png"
                    alt="Potato Mac dengan makaroni dan kentang."
                    loading="lazy"
                  />
                  <span className="menu-number">02 · Crunch time</span>
                </div>
                <div className="menu-card-body">
                  <h3>Potato Mac</h3>
                  <p>
                    Makaroni bersaus keju creamy bertemu kentang renyah dalam satu mangkuk hangat.
                  </p>
                  <div className="menu-meta">
                    <span className="menu-price">Rp15.000</span>
                    <a className="menu-order" href="#kontak" aria-label="Tanya tentang Potato Mac">
                      ↗
                    </a>
                  </div>
                </div>
              </article>
              <article className="menu-card delay-2" data-reveal="">
                <div className="menu-photo">
                  <img
                    src="/assets/menu-classic-mac-reference.png"
                    alt="Classic Mac and cheese MacMood."
                    loading="lazy"
                  />
                  <span className="menu-number">03 · Keep it classic</span>
                </div>
                <div className="menu-card-body">
                  <h3>Classic Mac</h3>
                  <p>Comfort food klasik dengan makaroni dan saus keju creamy khas MacMood.</p>
                  <div className="menu-meta">
                    <span className="menu-price">Rp10.000</span>
                    <a className="menu-order" href="#kontak" aria-label="Tanya tentang Classic Mac">
                      ↗
                    </a>
                  </div>
                </div>
              </article>
            </div>
            <p className="menu-disclaimer">
              Harga Potato Mac dan Classic Mac mengikuti konfirmasi owner. Harga Super Mac,
              komposisi, dan ketersediaan menu perlu dipastikan sebelum landing page dipublikasikan.
            </p>
          </div>
        </section>

        <section className="quote-section" aria-label="Pesan MacMood">
          <div className="container quote-content" data-reveal="">
            <blockquote>
              Good food, <span>better mood.</span>
              <br />
              That’s the MacMood feeling.
            </blockquote>
            <div className="quote-sign" aria-hidden="true">
              ✳
            </div>
          </div>
        </section>

        <section className="partner-section" id="mitra" aria-labelledby="partner-title">
          <div className="container">
            <div className="partner-top">
              <div className="partner-copy" data-reveal="">
                <p className="eyebrow eyebrow-light">Bawa comfort lebih jauh</p>
                <h2 className="section-title" id="partner-title">
                  Ada tempat untuk MacMood di ceritamu.
                </h2>
                <p className="section-copy">
                  Punya ide lokasi, pengalaman di bidang kuliner, atau mau mulai ngobrol soal kerja
                  sama? Kita bisa mulai dari skala yang paling cocok buat kamu.
                </p>
                <div className="hero-actions">
                  <a
                    className="button button-primary"
                    href="#kontak"
                    data-interest="Kemitraan"
                  >
                    Bahas peluang mitra <span aria-hidden="true">↗</span>
                  </a>
                  <a className="button button-secondary" href="#simulasi">
                    Coba simulasi <span aria-hidden="true">↓</span>
                  </a>
                </div>
              </div>
              <div
                className="partner-model-wrap"
                id="partner-model-wrap"
                aria-label="Model booth MacMood 3D"
              >
                <model-viewer
                  className="partner-model"
                  id="partner-model"
                  src="/assets/macmood-partner-booth.glb?v=2"
                  poster="/assets/macmood-partner-booth-preview.png?v=2"
                  alt="Booth kemitraan MacMood dengan kanopi hijau dan krem, gerobak, serta tiga sajian."
                  loading="lazy"
                  reveal="auto"
                  camera-controls=""
                  touch-action="pan-y"
                  shadow-intensity="0.6"
                  exposure="1"
                  camera-orbit="24deg 67deg 6.2m"
                  interaction-prompt="none"
                />
                <div className="partner-floating-note">
                  <strong>MACMOOD, ON THE MOVE</strong>
                  Bayangkan gerainya di lokasimu.
                </div>
              </div>
            </div>
            <div className="package-intro" data-reveal="">
              <p className="eyebrow eyebrow-light">Pilih paket kemitraan</p>
              <h3>Tiga cara memulai bersama MacMood.</h3>
              <div className="package-plan-grid">
                <article className="package-plan-card">
                  <span className="plan-index">PAKET 01 · TANPA BOOTH</span>
                  <h4>MacMood Mulai</h4>
                  <p className="plan-summary">
                    Untuk mulai jualan dari rumah atau memakai gerai milik sendiri.
                  </p>
                  <div className="plan-prices">
                    <span className="plan-normal">
                      Harga normal <s>Rp2.900.000</s>
                    </span>
                    <strong className="plan-price">Rp1.900.000</strong>
                  </div>
                  <ul className="plan-includes">
                    <li>Brand kit MacMood untuk materi jualan</li>
                    <li>Panduan menu, persiapan, dan SOP dasar</li>
                    <li>Starter kit bahan awal</li>
                    <li>Panduan promosi dan mulai jualan</li>
                    <li>Konsultasi awal bersama tim MacMood</li>
                  </ul>
                  <a
                    className="plan-cta"
                    href="#kontak"
                    data-interest="Kemitraan — MacMood Mulai"
                  >
                    Bahas paket ini <span aria-hidden="true">↗</span>
                  </a>
                </article>
                <article className="package-plan-card is-featured">
                  <span className="plan-ribbon">Paling dipilih</span>
                  <span className="plan-index">PAKET 02 · DENGAN BOOTH</span>
                  <h4>MacMood Gerai</h4>
                  <p className="plan-summary">
                    Paket gerai ringkas beridentitas MacMood, siap untuk penjualan take-away.
                  </p>
                  <div className="plan-prices">
                    <span className="plan-normal">
                      Harga normal <s>Rp4.400.000</s>
                    </span>
                    <strong className="plan-price">Rp2.900.000</strong>
                  </div>
                  <ul className="plan-includes">
                    <li>Booth standar dengan warna dan branding MacMood</li>
                    <li>Perlengkapan usaha awal</li>
                    <li>Brand kit dan materi menu</li>
                    <li>Starter kit bahan awal</li>
                    <li>SOP operasional dan panduan promosi</li>
                    <li>Panduan persiapan gerai dan mulai jualan</li>
                  </ul>
                  <a
                    className="plan-cta"
                    href="#kontak"
                    data-interest="Kemitraan — MacMood Gerai"
                  >
                    Bahas paket ini <span aria-hidden="true">↗</span>
                  </a>
                </article>
                <article className="package-plan-card">
                  <span className="plan-index">PAKET 03 · BOOTH PREMIUM</span>
                  <h4>MacMood Gerai Plus</h4>
                  <p className="plan-summary">
                    Gerai lebih menonjol dengan tambahan perlengkapan dan materi peluncuran.
                  </p>
                  <div className="plan-prices">
                    <span className="plan-normal">
                      Harga normal <s>Rp7.900.000</s>
                    </span>
                    <strong className="plan-price">Rp5.400.000</strong>
                  </div>
                  <ul className="plan-includes">
                    <li>Booth premium MacMood dengan kanopi dan lampu</li>
                    <li>Perlengkapan usaha lebih lengkap</li>
                    <li>Branding gerai, menu, dan materi promosi</li>
                    <li>Starter kit bahan awal</li>
                    <li>SOP operasional dan panduan pemasaran</li>
                    <li>Sesi konsultasi awal bersama tim MacMood</li>
                  </ul>
                  <a
                    className="plan-cta"
                    href="#kontak"
                    data-interest="Kemitraan — MacMood Gerai Plus"
                  >
                    Bahas paket ini <span aria-hidden="true">↗</span>
                  </a>
                </article>
              </div>
              <div className="package-formats">
                <p className="eyebrow eyebrow-light">Format kemitraan</p>
                <h4>Atau mulai dari format yang lebih fleksibel.</h4>
                <div className="package-grid">
                  <article className="package-card">
                    <span className="pkg-index">FORMAT 04</span>
                    <h4>Pop-up / Event</h4>
                    <p>Untuk tes pasar, bazar, atau aktivasi singkat.</p>
                    <a href="#kontak" data-interest="Kemitraan — Pop-up / Event">
                      Diskusikan format <span aria-hidden="true">↗</span>
                    </a>
                  </article>
                  <article className="package-card">
                    <span className="pkg-index">FORMAT 05</span>
                    <h4>Booth / Kiosk</h4>
                    <p>Untuk lokasi dengan alur take-away yang praktis.</p>
                    <a href="#kontak" data-interest="Kemitraan — Booth / Kiosk">
                      Diskusikan format <span aria-hidden="true">↗</span>
                    </a>
                  </article>
                  <article className="package-card">
                    <span className="pkg-index">FORMAT 06</span>
                    <h4>Outlet partner</h4>
                    <p>Untuk rencana kerja sama jangka panjang.</p>
                    <a href="#kontak" data-interest="Kemitraan — Outlet partner">
                      Diskusikan format <span aria-hidden="true">↗</span>
                    </a>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sim-section" id="simulasi" aria-labelledby="sim-title">
          <div className="container sim-layout">
            <div className="sim-intro" data-reveal="">
              <p className="eyebrow">Rencanakan dengan realistis</p>
              <h2 className="section-title" id="sim-title">
                Coba hitung skenarionya.
              </h2>
              <p className="section-copy">
                Geser asumsi di bawah untuk melihat contoh omzet dan laba operasional bulanan.
                Semua nilai bisa kamu ubah sesuai rencana lokasi.
              </p>
              <p className="menu-disclaimer">
                Angka contoh bukan proyeksi MacMood, janji keuntungan, atau penawaran resmi.
              </p>
            </div>
            <div className="sim-panel" data-reveal="">
              <span className="sim-badge">
                <span aria-hidden="true">✳</span> Simulasi ilustratif
              </span>
              <div className="sim-controls">
                <div className="sim-control">
                  <label htmlFor="avg-order">Rata-rata nilai transaksi</label>
                  <output id="avg-order-value" htmlFor="avg-order">
                    Rp22.000
                  </output>
                  <input
                    id="avg-order"
                    type="range"
                    min="15000"
                    max="50000"
                    step="1000"
                    defaultValue="22000"
                  />
                </div>
                <div className="sim-control">
                  <label htmlFor="orders-day">Transaksi per hari</label>
                  <output id="orders-day-value" htmlFor="orders-day">
                    35 transaksi
                  </output>
                  <input
                    id="orders-day"
                    type="range"
                    min="5"
                    max="150"
                    step="1"
                    defaultValue="35"
                  />
                </div>
                <div className="sim-control">
                  <label htmlFor="open-days">Hari operasional per bulan</label>
                  <output id="open-days-value" htmlFor="open-days">
                    26 hari
                  </output>
                  <input
                    id="open-days"
                    type="range"
                    min="10"
                    max="31"
                    step="1"
                    defaultValue="26"
                  />
                </div>
                <div className="sim-control">
                  <label htmlFor="margin">Margin kotor ilustratif</label>
                  <output id="margin-value" htmlFor="margin">
                    45%
                  </output>
                  <input
                    id="margin"
                    type="range"
                    min="20"
                    max="70"
                    step="1"
                    defaultValue="45"
                  />
                </div>
                <div className="sim-control">
                  <label htmlFor="monthly-cost">Biaya operasional per bulan</label>
                  <output id="monthly-cost-value" htmlFor="monthly-cost">
                    Rp8.000.000
                  </output>
                  <input
                    id="monthly-cost"
                    type="range"
                    min="2000000"
                    max="30000000"
                    step="500000"
                    defaultValue="8000000"
                  />
                </div>
              </div>
              <div className="sim-result" aria-live="polite">
                <div className="result-card">
                  <span>Perkiraan omzet bulanan</span>
                  <strong id="monthly-revenue">Rp20.020.000</strong>
                </div>
                <div className="result-card is-profit">
                  <span>Estimasi laba operasional*</span>
                  <strong id="monthly-profit">Rp1.009.000</strong>
                </div>
              </div>
              <p className="sim-math" id="sim-math">
                35 transaksi/hari × 26 hari × Rp22.000 rata-rata transaksi. Estimasi laba: omzet ×
                45% margin − Rp8.000.000 biaya bulanan.
              </p>
              <p className="sim-warning">
                *Belum memasukkan pajak, biaya modal, gaji, sewa, promo, susut bahan, dan faktor
                lain. Hasil aktual dapat berbeda dan tidak dijamin.
              </p>
            </div>
          </div>
        </section>

        <section className="join-section" id="cara-bergabung" aria-labelledby="join-title">
          <div className="container">
            <div className="join-head" data-reveal="">
              <div>
                <p className="eyebrow">Cara bergabung</p>
                <h2 className="section-title" id="join-title">
                  4 langkah menuju gerai MacMood.
                </h2>
              </div>
              <p className="join-intro">
                Mulai dari obrolan sederhana, lalu susun kebutuhan dan rencana jualanmu bersama
                MacMood.
              </p>
            </div>
            <div className="join-steps" aria-label="Empat langkah bergabung dengan MacMood">
              <article className="join-step" data-reveal="">
                <span className="join-step-number">01</span>
                <h3>Konsultasi</h3>
                <p>Ceritakan lokasi, pengalaman, dan rencana jualanmu lewat form kontak.</p>
              </article>
              <article className="join-step delay-1" data-reveal="">
                <span className="join-step-number">02</span>
                <h3>Pilih model</h3>
                <p>
                  Tentukan paket tanpa booth, booth MacMood, booth premium, atau format fleksibel.
                </p>
              </article>
              <article className="join-step delay-1" data-reveal="">
                <span className="join-step-number">03</span>
                <h3>Susun rencana</h3>
                <p>
                  Bahas kebutuhan gerai, perlengkapan, bahan awal, dan langkah operasional.
                </p>
              </article>
              <article className="join-step delay-2" data-reveal="">
                <span className="join-step-number">04</span>
                <h3>Siap mulai</h3>
                <p>
                  Siapkan lokasi dan perlengkapan, lalu tentukan rencana mulai jualan bersama.
                </p>
              </article>
            </div>
            <div className="join-cta-row" data-reveal="">
              <a
                className="button button-primary"
                href="#kontak"
                data-interest="Kemitraan"
              >
                Mulai konsultasi <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>

        <section className="contact-section" id="kontak" aria-labelledby="contact-title">
          <div className="container contact-layout">
            <div className="contact-copy" data-reveal="">
              <p className="eyebrow eyebrow-light">Ada yang mau ditanyain?</p>
              <h2 className="section-title" id="contact-title">
                Ngobrol dulu, yuk.
              </h2>
              <p className="section-copy">
                Untuk order, acara, peluang mitra, atau kerja sama lain—tinggalkan pesan. Form ini
                akan menyiapkan pesan WhatsApp setelah nomor owner dikonfigurasi.
              </p>
              <div className="contact-lines">
                <span>✳ Order dan pertanyaan menu</span>
                <span>✳ Peluang kemitraan</span>
                <span>✳ Kolaborasi / kerja sama lain</span>
              </div>
            </div>
            <form className="contact-form" id="contact-form" data-reveal="">
              <div className="form-row">
                <div className="field">
                  <label htmlFor="contact-name">Nama</label>
                  <input
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    placeholder="Nama kamu"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="contact-phone">Nomor WhatsApp</label>
                  <input
                    id="contact-phone"
                    name="phone"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="08xx xxxx xxxx"
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="contact-interest">Keperluan</label>
                <select id="contact-interest" name="interest">
                  <option>Pesan menu / PO</option>
                  <option>Kemitraan</option>
                  <option>Kemitraan — MacMood Mulai</option>
                  <option>Kemitraan — MacMood Gerai</option>
                  <option>Kemitraan — MacMood Gerai Plus</option>
                  <option>Kerja sama lain</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="contact-message">Pesan</label>
                <textarea
                  id="contact-message"
                  name="message"
                  placeholder="Ceritain kebutuhanmu..."
                  required
                />
              </div>
              <button className="button button-primary contact-submit" type="submit">
                Siapkan pesan WhatsApp <span aria-hidden="true">↗</span>
              </button>
              <p className="contact-status" id="contact-status" role="status" aria-live="polite" />
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-about">
              <a className="footer-brand" href="#hero">
                <img src="/assets/macmood-logo.png?v=2" alt="" />
                MACMOOD
              </a>
              <p>
                Comfort food mac and cheese dengan pilihan chicken katsu dan kentang. MacMood,
                teman cheesy buat bikin mood hari ini lebih baik.
              </p>
            </div>
            <nav className="footer-column" aria-label="Navigasi footer">
              <h2>Navigasi</h2>
              <ul>
                <li>
                  <a href="#cerita">Cerita kami</a>
                </li>
                <li>
                  <a href="#menu">Menu</a>
                </li>
                <li>
                  <a href="#mitra">Paket mitra</a>
                </li>
                <li>
                  <a href="#simulasi">Simulasi</a>
                </li>
                <li>
                  <a href="#cara-bergabung">Cara bergabung</a>
                </li>
              </ul>
            </nav>
            <nav className="footer-column" aria-label="Paket kemitraan">
              <h2>Paket</h2>
              <ul>
                <li>
                  <a href="#mitra" data-interest="Kemitraan — MacMood Mulai">
                    MacMood Mulai
                  </a>
                </li>
                <li>
                  <a href="#mitra" data-interest="Kemitraan — MacMood Gerai">
                    MacMood Gerai
                  </a>
                </li>
                <li>
                  <a href="#mitra" data-interest="Kemitraan — MacMood Gerai Plus">
                    MacMood Gerai Plus
                  </a>
                </li>
              </ul>
            </nav>
            <nav className="footer-column" aria-label="Kontak MacMood">
              <h2>Kontak</h2>
              <ul>
                <li>
                  <a href="#kontak" data-interest="Pesan menu / PO">
                    Pesan menu / PO
                  </a>
                </li>
                <li>
                  <a href="#kontak" data-interest="Kemitraan">
                    Peluang kemitraan
                  </a>
                </li>
                <li>
                  <a href="#kontak" data-interest="Kerja sama lain">
                    Kerja sama lain
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          <div className="footer-bottom">
            <p>
              © <span id="year">2026</span> MacMood · Mac and cheese, made happy.
            </p>
            <a className="footer-back-top" href="#hero">
              Kembali ke atas ↑
            </a>
          </div>
        </div>
      </footer>

      {/* Shared Traveling 3D Food Model Layer */}
      <div className="shared-food-layer">
        <div className="shared-food-stage" id="shared-food-stage">
          <model-viewer
            className="shared-food-model"
            id="shared-food-model"
            src="/assets/macmood-hero.glb"
            poster="/assets/macmood-hero-poster.png"
            alt="Semangkuk mac and cheese dengan makaroni, chicken katsu, dan kentang."
            loading="eager"
            reveal="auto"
            auto-rotate=""
            auto-rotate-delay="0"
            rotation-per-second="18deg"
            shadow-intensity="0.7"
            exposure="1.05"
            camera-orbit="28deg 64deg 6.6m"
            camera-target="0m 0.48m 0m"
            interpolation-decay="45"
            interaction-prompt="none"
          />
          <svg
            className="steam-overlay"
            viewBox="0 0 200 120"
            role="presentation"
            focusable="false"
            aria-hidden="true"
          >
            <path d="M36 112 C18 88 55 77 37 53 C24 34 44 23 39 7" />
            <path d="M101 115 C78 91 119 77 98 55 C80 36 112 25 101 6" />
            <path d="M165 112 C144 88 180 75 161 53 C145 34 174 24 164 8" />
          </svg>
        </div>
      </div>
    </div>
  );
}
