const headerSlot = document.querySelector("#site-header");
const footerSlot = document.querySelector("#site-footer");

if (headerSlot) {
  headerSlot.innerHTML = `
    <div class="utility-bar"><div class="utility-inner">
      <a class="utility-link" href="mailto:reservations@ifly.co.ke"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"></rect><path d="m4 7 8 6 8-6"></path></svg>Contacts</a>
      <a class="utility-link" href="mailto:reservations@ifly.co.ke?subject=Agent%20access" title="Email reservations about agent access"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v16h-6M10 16l4-4-4-4M14 12H3"></path></svg>Agent Login</a>
    </div></div>
    <header class="site-header">
      <a class="brand" href="index.html" aria-label="iFly home"><img class="brand-logo" src="https://ifly.co.ke/wp-content/uploads/2023/02/iFly-logo.png" alt="iFly Airlines"></a>
      <button class="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="main-nav"><span></span><span></span></button>
      <nav class="main-nav" id="main-nav" aria-label="Main navigation">
        <a href="destinations.html">Fly to</a><a href="travel.html">Our services</a><a href="about.html">About us</a><a href="travel.html">Travel information</a>
      </nav>
      <div class="header-actions"><a class="search-link" href="index.html#book" aria-label="Search flights"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.4"></circle><path d="m16 16 4.5 4.5"></path></svg></a><a class="header-link" href="index.html#book">Book Flight <span aria-hidden="true">↗</span></a></div>
    </header>`;

  const menuToggle = headerSlot.querySelector(".menu-toggle");
  const mainNav = headerSlot.querySelector(".main-nav");
  const currentPage = location.pathname.split("/").pop() || "index.html";
  mainNav.querySelectorAll("a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) link.setAttribute("aria-current", "page");
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      mainNav.classList.remove("open");
    });
  });
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    mainNav.classList.toggle("open", !isOpen);
  });
}

if (footerSlot) {
  footerSlot.innerHTML = `
    <footer class="site-footer">
      <div class="footer-main">
        <div class="footer-brand-block"><a class="brand footer-brand" href="index.html" aria-label="iFly home"><img class="brand-logo" src="https://ifly.co.ke/wp-content/uploads/2023/02/ifly-logo-white-transpernt.png" alt="iFly Airlines"></a><p>Fly with us for business or leisure, our priority is your safety and comfort.</p></div>
        <div class="footer-column"><h2>Contact</h2><p>HQ: Aerlink Building<br>Wilson Airport, Nairobi</p><a href="tel:+254736989645">Hotline: 0736 989 645</a><a href="tel:+254111051990">Hotline: 0111 051 990</a><a href="mailto:reservations@ifly.co.ke">Email: reservations@ifly.co.ke</a></div>
        <div class="footer-column"><h2>Get to know us</h2><a href="about.html">About us</a><a href="schedule.html">Flight timetable</a><a href="https://ifly.co.ke/csr/">CSR</a><a href="https://ifly.co.ke/about-us/our-fleet/">Fleet</a></div>
        <div class="footer-column footer-social-column"><h2>Connect with us</h2><div class="social-links"><a href="https://web.facebook.com/FlyIFlyAir/?locale=eo_EO&_rdc=1&_rdr" aria-label="Facebook">f</a><a href="https://twitter.com/i_FlyAir" aria-label="Twitter">x</a><a href="https://www.youtube.com/@iflyair5484" aria-label="YouTube">▶</a><a href="https://www.instagram.com/ifly_air/?hl=en" aria-label="Instagram">ig</a></div></div>
      </div>
      <div class="footer-bottom"><span>Privacy Policy - iFly © 2026 - All Rights Reserved.</span><span>Powered by <a href="https://ifly.co.ke/">iFly Air Limited.</a></span></div>
    </footer>`;
}

const whatsappLink = document.createElement("a");
whatsappLink.className = "whatsapp-float";
whatsappLink.href = "https://wa.me/254736989645";
whatsappLink.target = "_blank";
whatsappLink.rel = "noreferrer";
whatsappLink.setAttribute("aria-label", "Chat with iFly on WhatsApp");
whatsappLink.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.1 11.7a8.3 8.3 0 0 1-12.3 7.2L4 20l1.1-3.6a8.3 8.3 0 1 1 15-4.7Z"></path><path d="M8.1 7.8c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4-.1.6l-.6.7c-.2.2-.2.4 0 .6.4.7 1.2 1.5 2.1 1.9.2.1.4.1.6-.1l.8-.9c.2-.2.4-.2.7-.1l1.7.8c.3.1.4.3.4.5 0 .3-.2 1.1-.7 1.5-.5.5-1.2.7-1.9.6-1.1-.2-2.4-.8-3.8-2.1-1.2-1.1-2-2.5-2.2-3.5-.2-.8.1-1.6.5-2.2Z"></path></svg>';
document.body.append(whatsappLink);