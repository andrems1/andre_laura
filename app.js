const data = window.CHAT_STORY;

const fmt = new Intl.NumberFormat("pt-BR");
const shortFmt = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const START_DATE = new Date("2026-04-21T18:52:00-03:00");
const CAROUSEL_INTERVAL = 3200;
const BIBLE_VERSES = [
  {
    text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
    ref: "João 3:16",
  },
  {
    text: "Aquele que não ama não conhece a Deus, porque Deus é amor.",
    ref: "1 João 4:8",
  },
  {
    text: "Nós amamos porque ele nos amou primeiro.",
    ref: "1 João 4:19",
  },
  {
    text: "Nem a morte, nem a vida, nem os anjos, nem os principados, nem as coisas presentes, nem as coisas futuras, nem os poderes, nem a altura, nem a profundidade, nem qualquer outra criatura nos poderá separar do amor de Deus, que está em Cristo Jesus, nosso Senhor.",
    ref: "Romanos 8:38-39",
  },
  {
    text: "Eu te amei com amor eterno; por isso com benignidade te atraí.",
    ref: "Jeremias 31:3",
  },
  {
    text: "O Senhor, teu Deus, está no meio de ti, poderoso para salvar; ele se deleitará em ti com alegria; renovará o seu amor e se regozijará sobre ti com júbilo.",
    ref: "Sofonias 3:17",
  },
  {
    text: "Quão precioso é o teu amor, ó Deus! Por isso os filhos dos homens se abrigam à sombra das tuas asas.",
    ref: "Salmos 36:7",
  },
  {
    text: "O amor é sofredor, é benigno; o amor não é invejoso, não se vangloria, não se ensoberbece, não se porta inconvenientemente, não busca os seus próprios interesses, não se irrita, não guarda rancor. Não se alegra com a injustiça, mas se alegra com a verdade. Tudo sofre, tudo crê, tudo espera, tudo suporta. O amor nunca falha.",
    ref: "1 Coríntios 13:4-8",
  },
  {
    text: "Arraigados e alicerçados em amor, possais compreender qual é a largura, e o comprimento, e a altura, e a profundidade, e conhecer o amor de Cristo, que excede todo o entendimento, para que sejais tomados de toda a plenitude de Deus.",
    ref: "Efésios 3:17-19",
  },
  {
    text: "Rendei graças ao Senhor, porque ele é bom, porque a sua misericórdia dura para sempre.",
    ref: "Salmos 107:1",
  },
  {
    text: "Confiai nele em todo o tempo, ó povo; derramai diante dele o vosso coração; Deus é o nosso refúgio.",
    ref: "Salmos 62:8",
  },
  {
    text: "Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas lhes serão acrescentadas.",
    ref: "Mateus 6:33",
  },
];

const $ = (selector) => document.querySelector(selector);

let photoIndex = 0;
let memoryCards = [];
let openedCards = [];
let matchedCards = 0;
let currentNote = "";
let currentVerseIndex = -1;
let lightboxIndex = 0;
let lastFocusedElement = null;
let victoryShown = false;
let memoryPreviewing = false;
let memoryStarted = false;
let flipToken = "";
let lightboxListenersReady = false;

function setText(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value;
}

function create(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function number(value) {
  return fmt.format(value || 0);
}

function compact(value) {
  return shortFmt.format(value || 0);
}

function percent(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

function duration(minutes) {
  if (minutes === null || minutes === undefined) return "Sem dados";
  if (minutes < 1) return "Menos de 1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins ? `${hours} h ${mins} min` : `${hours} h`;
}

function topPhrase(key) {
  return data.phrases.find((item) => item.name === key)?.count || 0;
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function renderHero() {
  setText("#heroTitle", "André + Laura");
  setText(
    "#heroSubtitle",
    "Amor, fiz esse cantinho para guardar um pouquinho da nossa história. Cada mensagem, cada um áudio, cada encontro, cada risada que eu não consigo descrever. Espero que você goste."
  );

  const stats = [
    [number(data.summary.totalMessages), "Mensagens"],
    [number(data.summary.activeDays), "Dias conversando"],
    [number(data.media.totals.audio || 0), "Áudios enviados"],
    [number(topPhrase("Eu te amo")), 'Vezes que falamos "eu te amo"'],
  ];

  $("#headlineStats").replaceChildren(
    ...stats.map(([value, label]) => {
      const card = create("article", "hero-stat");
      card.append(create("strong", "", value), create("span", "", label));
      return card;
    })
  );

  renderHeroCarousel();
}

function renderLoveTimer() {
  const now = new Date();
  let diff = Math.max(0, now - START_DATE);
  const days = Math.floor(diff / 86_400_000);
  diff -= days * 86_400_000;
  const hours = Math.floor(diff / 3_600_000);
  diff -= hours * 3_600_000;
  const minutes = Math.floor(diff / 60_000);
  diff -= minutes * 60_000;
  const seconds = Math.floor(diff / 1000);

  const values = [
    ["Dias", days],
    ["Horas", hours],
    ["Minutos", minutes],
    ["Segundos", seconds],
  ];
  $("#loveTimer").replaceChildren(
    ...values.map(([label, value], index) => {
      const card = create("article", `timer-card${index === 3 ? " timer-seconds" : ""}`);
      card.append(create("strong", "", number(value)), create("span", "", label));
      return card;
    })
  );
}

function renderVerse() {
  let next = Math.floor(Math.random() * BIBLE_VERSES.length);
  if (BIBLE_VERSES.length > 1) {
    while (next === currentVerseIndex) {
      next = Math.floor(Math.random() * BIBLE_VERSES.length);
    }
  }
  currentVerseIndex = next;
  const verse = BIBLE_VERSES[next];
  const textEl = $("#verseText");
  const refEl = $("#verseRef");
  if (!textEl) return;

  const applyVerse = () => {
    textEl.textContent = verse.text;
    if (refEl) refEl.textContent = verse.ref;
    textEl.classList.remove("is-changing", "is-fresh");
    void textEl.offsetWidth;
    textEl.classList.add("is-fresh");
  };

  if (!textEl.textContent.trim()) {
    applyVerse();
    return;
  }

  textEl.classList.add("is-changing");
  window.setTimeout(applyVerse, 180);
}

function renderStoryStats() {
  const stats = [
    [number(data.summary.totalMessages), "Quantas mensagens a gente trocou"],
    [number(data.summary.activeDays), "Dias conversando"],
    [number(data.media.totals.audio || 0), "Áudios enviados"],
    [number(data.media.totals.sticker || 0), "Figurinhas enviadas"],
    [number(data.summary.laughMessages), "Vezes que rimos com 'kkkkkkkk'"],
    [number(topPhrase("Eu te amo")), "Vezes que falamos 'eu te amo'"],
  ];

  $("#storyStats").replaceChildren(
    ...stats.map(([value, label]) => {
      const card = create("article", "stat-card");
      card.append(create("strong", "", value), create("span", "", label));
      return card;
    })
  );
  renderStickers();
}

function renderTopics() {
  const sorted = [...data.topics].sort((a, b) => b.count - a.count);
  const max = Math.max(...sorted.map((topic) => topic.count), 1);
  $("#topicList").replaceChildren(
    ...sorted.map((topic) => {
      const row = create("div", "topic-row");
      const head = create("div", "row-head");
      head.append(create("span", "", `${topic.icon} ${topic.name}`), create("strong", "", number(topic.count)));
      const meter = create("div", "meter");
      const fill = create("span");
      fill.style.width = `${Math.max(4, percent(topic.count, max))}%`;
      meter.append(fill);
      row.append(head, meter);
      return row;
    })
  );
}

function renderStickers() {
  const container = $("#stickerFavorites");
  const stickers = data.topStickers || [];
  if (!stickers.length) {
    container.replaceChildren(create("p", "soft-copy", "As figurinhas favoritas aparecem aqui quando o ZIP tiver stickers exportados."));
    return;
  }
  container.replaceChildren(
    ...stickers.map((item, index) => {
      const card = create("article", "sticker-card");
      const img = create("img");
      img.src = item.src;
      img.alt = `Figurinha favorita ${index + 1}`;
      img.loading = "lazy";
      card.append(img, create("span", "", `${number(item.count)} vezes`));
      return card;
    })
  );
}

function renderPhrases() {
  const icons = {
    "Eu te amo": "♥",
    "Bom dia": "☀",
    "Boa noite": "☾",
    Amor: "♡",
    Saudade: "✦",
    "Risadas compactadas": "☺",
  };
  const captions = {
    "Eu te amo": "Pra não deixar duvidas",
    "Bom dia": "Começando o dia bem",
    "Boa noite": "A vontade e conversar a noite toda",
    Amor: "Autoexplicativo",
    Saudade: "Dias que não passavam nunca",
  };

  const container = $("#phraseGrid");
  if (!container) return;
  const phrases = (data.phrases || []).filter((phrase) => phrase.name !== "Risadas compactadas");
  container.replaceChildren(
    ...phrases.map((phrase) => {
      const card = create("article", "phrase-card");
      card.append(
        create("span", "phrase-icon", icons[phrase.name] || "♥"),
        create("strong", "", number(phrase.count)),
        create("span", "", captions[phrase.name] || "vezes")
      );
      const title = create("p", "phrase-name");
      title.textContent = `"${phrase.name}"`;
      card.append(title);
      return card;
    })
  );
}

function renderWords() {
  const maxWord = Math.max(...data.topWords.map((word) => word.count), 1);
  $("#wordCloud").replaceChildren(
    ...data.topWords.map((item, index) => {
      const chip = create("span", `chip ${index === 0 ? "champion-chip" : ""}`);
      const size = 0.92 + Math.min(0.68, item.count / maxWord);
      chip.style.fontSize = `${size.toFixed(2)}rem`;
      chip.append(document.createTextNode(item.word), create("small", "", number(item.count)));
      return chip;
    })
  );
}

function renderRhythm() {
  const monthly = data.timeline.monthly;
  const maxMonth = Math.max(...monthly.map((item) => item.count), 1);
  const chart = $("#monthlyChart");
  chart.style.setProperty("--bar-count", monthly.length);
  chart.replaceChildren(
    ...monthly.map((item) => {
      const bar = create("div", "bar");
      const value = create("strong", "bar-value", number(item.count));
      const fill = create("div", "bar-fill");
      fill.style.height = `${Math.max(4, percent(item.count, maxMonth))}%`;
      fill.title = `${item.month}: ${number(item.count)} mensagens`;
      bar.append(value, fill, create("label", "", item.month));
      return bar;
    })
  );

  const maxHour = Math.max(...data.timeline.hours.map((item) => item.count), 1);
  $("#hourGrid").replaceChildren(
    ...data.timeline.hours.map((item) => {
      const cell = create("div", "hour-cell");
      cell.style.setProperty("--heat", (0.08 + (item.count / maxHour) * 0.62).toFixed(2));
      cell.append(document.createTextNode(`${String(item.hour).padStart(2, "0")}h`), create("span", "", compact(item.count)));
      return cell;
    })
  );

  const maxWeekday = Math.max(...data.timeline.weekdays.map((item) => item.count), 1);
  $("#weekdayList").replaceChildren(
    ...data.timeline.weekdays.map((item) => {
      const row = create("div", "weekday-row");
      const head = create("div", "row-head");
      head.append(create("span", "", item.weekday), create("strong", "", number(item.count)));
      const meter = create("div", "meter");
      const fill = create("span");
      fill.style.width = `${Math.max(4, percent(item.count, maxWeekday))}%`;
      meter.append(fill);
      row.append(head, meter);
      return row;
    })
  );

  $("#busiestDays").replaceChildren(
    ...data.timeline.busiestDays.map((item, index) => {
      const row = create("div", "busiest-row");
      const head = create("div", "row-head");
      head.append(create("span", "", `${index + 1}. ${item.date}`), create("strong", "", number(item.count)));
      const meter = create("div", "meter");
      const fill = create("span");
      fill.style.width = `${Math.max(4, percent(item.count, data.timeline.busiestDays[0].count))}%`;
      meter.append(fill);
      row.append(head, meter);
      return row;
    })
  );
}

function renderHeroCarousel() {
  const photos = data.photos || [];
  const stage = $("#heroPhoto");
  if (!stage) return;

  if (!photos.length) {
    stage.replaceChildren(create("div", "photo-placeholder", "Aqui entram as nossas fotos, amor."));
    return;
  }

  photoIndex = (photoIndex + photos.length) % photos.length;
  const photo = photos[photoIndex];
  const figure = create("figure", "photo-slide");
  const image = create("img");
  image.src = photo.src;
  image.alt = photo.title || "Foto nossa";
  image.loading = photoIndex === 0 ? "eager" : "lazy";
  image.decoding = "async";
  image.fetchPriority = photoIndex === 0 ? "high" : "auto";
  const caption =
    photo.title && photo.title !== `Foto ${photoIndex + 1}`
      ? photo.title
      : `${photoIndex + 1} de ${photos.length}`;
  figure.append(image, create("figcaption", "", caption));

  const progress = create("div", "hero-carousel-progress", "");
  progress.setAttribute("aria-label", `${photoIndex + 1} de ${photos.length}`);
  progress.style.setProperty("--photo-count", photos.length);
  progress.style.setProperty("--story-duration", `${CAROUSEL_INTERVAL}ms`);
  progress.replaceChildren(
    ...photos.map((_, index) => {
      const item = create("span", index === photoIndex ? "active" : "");
      item.style.setProperty("--progress", index < photoIndex ? "1" : "0");
      return item;
    })
  );
  stage.replaceChildren(figure, progress);
  setupHeroSwipe(stage, photos.length);

  window.clearInterval(window._carouselTimer);
  if (photos.length > 1 && !prefersReducedMotion()) {
    window._carouselTimer = window.setInterval(() => {
      photoIndex += 1;
      renderHeroCarousel();
    }, CAROUSEL_INTERVAL);
  }
  stage.onmouseenter = () => window.clearInterval(window._carouselTimer);
  stage.onmouseleave = () => {
    if (photos.length > 1 && !prefersReducedMotion()) {
      window._carouselTimer = window.setInterval(() => {
        photoIndex += 1;
        renderHeroCarousel();
      }, CAROUSEL_INTERVAL);
    }
  };
}

function setupHeroSwipe(stage, total) {
  if (total < 2) return;
  let startX = 0;
  let startY = 0;
  let dragging = false;

  stage.onpointerdown = (event) => {
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    stage.setPointerCapture?.(event.pointerId);
    window.clearInterval(window._carouselTimer);
  };

  stage.onpointerup = (event) => {
    if (!dragging) return;
    dragging = false;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (Math.abs(deltaX) > 44 && Math.abs(deltaX) > Math.abs(deltaY)) {
      photoIndex += deltaX < 0 ? 1 : -1;
      renderHeroCarousel();
      return;
    }
    renderHeroCarousel();
  };

  stage.onpointercancel = () => {
    dragging = false;
    renderHeroCarousel();
  };
}

function renderPhotoGallery() {
  const photos = data.photos || [];
  const grid = $("#photoGallery");
  if (!grid) return;

  if (!photos.length) {
    grid.replaceChildren(create("p", "soft-copy", "As fotos entram aqui quando você colocar na pasta assets/nossas-fotos/."));
    return;
  }

  const items = photos.map((photo, index) => {
      const button = create("button", "gallery-item", "");
      button.type = "button";
      button.setAttribute("aria-label", `Abrir ${photo.title || `Foto ${index + 1}`}`);
      const image = create("img");
      image.src = photo.src;
      image.alt = photo.title || `Foto ${index + 1}`;
      image.loading = "lazy";
      image.decoding = "async";
      button.append(image);
      button.addEventListener("click", () => openLightbox(index));
      return button;
    });

  grid.replaceChildren(...items);

  if (!lightboxListenersReady) {
    const lightbox = $("#lightbox");
    $("#lightboxClose")?.addEventListener("click", closeLightbox);
    $("#lightboxPrev")?.addEventListener("click", () => {
      lightboxIndex = (lightboxIndex - 1 + photos.length) % photos.length;
      updateLightbox();
    });
    $("#lightboxNext")?.addEventListener("click", () => {
      lightboxIndex = (lightboxIndex + 1) % photos.length;
      updateLightbox();
    });
    lightbox?.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (event) => {
      if (!lightbox?.classList.contains("open")) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "Tab") trapLightboxFocus(event);
      if (event.key === "ArrowLeft") {
        lightboxIndex = (lightboxIndex - 1 + photos.length) % photos.length;
        updateLightbox();
      }
      if (event.key === "ArrowRight") {
        lightboxIndex = (lightboxIndex + 1) % photos.length;
        updateLightbox();
      }
    });
    lightboxListenersReady = true;
  }
}

function openLightbox(index) {
  lastFocusedElement = document.activeElement;
  lightboxIndex = index;
  updateLightbox();
  $("#lightbox")?.classList.add("open");
  document.body.style.overflow = "hidden";
  $("#lightboxClose")?.focus();
}

function closeLightbox() {
  $("#lightbox")?.classList.remove("open");
  document.body.style.overflow = "";
  const image = $("#lightboxImg");
  if (image) image.removeAttribute("src");
  lastFocusedElement?.focus?.();
  lastFocusedElement = null;
}

function updateLightbox() {
  const photos = data.photos || [];
  const photo = photos[lightboxIndex];
  if (!photo) return;
  const image = $("#lightboxImg");
  const caption = $("#lightboxCaption");
  if (image) {
    image.src = photo.src;
    image.alt = photo.title || "Foto";
    image.decoding = "async";
  }
  if (caption) {
    caption.textContent =
      photo.title && photo.title !== `Foto ${lightboxIndex + 1}`
        ? `${photo.title} — ${lightboxIndex + 1} de ${photos.length}`
        : `${lightboxIndex + 1} de ${photos.length}`;
  }
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function trapLightboxFocus(event) {
  const lightbox = $("#lightbox");
  if (!lightbox) return;
  const focusable = [...lightbox.querySelectorAll("button, [href], [tabindex]:not([tabindex='-1'])")].filter(
    (element) => !element.disabled && element.offsetParent !== null
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function setupMemoryGame() {
  const board = $("#memoryBoard");
  const startButton = $("#restartMemory");
  const photos = (data.photos || []).slice(0, 8);
  openedCards = [];
  matchedCards = 0;
  victoryShown = false;
  memoryPreviewing = false;
  memoryStarted = false;
  flipToken = "";

  if (photos.length < 2) {
    memoryCards = [];
    board.replaceChildren(...Array.from({ length: 8 }, (_, index) => create("div", "memory-card locked", index % 2 ? "♡" : "♥")));
    if (startButton) startButton.disabled = true;
    setText("#memoryStatus", "Quando as fotos entrarem, esse jogo vira memória de verdade, não só de baralho.");
    return;
  }

  if (startButton) {
    startButton.disabled = false;
    startButton.textContent = "Começar";
    startButton.hidden = true;
  }
  memoryCards = shuffle([...photos, ...photos].map((photo, index) => ({ ...photo, uid: `${photo.src}-${index}`, matched: false, open: false })));
  setText("#memoryStatus", "Clique em começar. Eu mostro as fotos rapidinho e depois é contigo.");
  renderMemoryBoard();
}

function startMemoryGame() {
  const startButton = $("#restartMemory");
  const photos = (data.photos || []).slice(0, 8);
  if (photos.length < 2 || memoryPreviewing) return;

  openedCards = [];
  matchedCards = 0;
  victoryShown = false;
  memoryStarted = false;
  memoryPreviewing = true;
  flipToken = "";
  memoryCards = shuffle([...photos, ...photos].map((photo, index) => ({ ...photo, uid: `${photo.src}-${index}`, matched: false, open: true })));
  if (startButton) {
    startButton.disabled = true;
    startButton.textContent = "Memoriza...";
    startButton.hidden = true;
  }
  setText("#memoryStatus", "Olha bem, amor. As lembranças já vão virar de costas.");
  renderMemoryBoard();

  window.setTimeout(() => {
    memoryCards.forEach((card) => {
      card.open = false;
      card.matched = false;
    });
    memoryPreviewing = false;
    memoryStarted = true;
    if (startButton) {
      startButton.disabled = false;
      startButton.textContent = "Embaralhar";
      startButton.hidden = false;
    }
    setText("#memoryStatus", "Agora sim: encontre os pares. Cada acerto é uma lembrança.");
    renderMemoryBoard();
  }, 1800);
}

function renderMemoryBoard() {
  const board = $("#memoryBoard");
  const shouldShowStartLayer = !memoryStarted && !memoryPreviewing && memoryCards.length >= 2;
  board.replaceChildren(
    ...memoryCards.map((card, index) => {
      const isVisible = card.open || card.matched;
      const classes = [
        "memory-card",
        isVisible ? "open" : "",
        card.uid === flipToken ? "is-flipping" : "",
        !memoryStarted && !memoryPreviewing ? "not-started" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const button = create("button", classes, "");
      button.type = "button";
      button.disabled = card.matched || memoryPreviewing || !memoryStarted;
      button.setAttribute("aria-label", isVisible ? "Carta aberta" : "Carta fechada");
      if (isVisible) {
        const image = create("img");
        image.src = card.src;
        image.alt = card.title || "Foto do jogo";
        image.decoding = "async";
        button.append(image);
      } else {
        button.textContent = "♥";
      }
      button.addEventListener("click", () => flipMemoryCard(index));
      return button;
    })
  );

  if (shouldShowStartLayer) {
    const layer = create("div", "memory-start-layer", "");
    const button = create("button", "memory-start-button", "Começar");
    button.type = "button";
    button.addEventListener("click", startMemoryGame);
    layer.append(button);
    board.append(layer);
  }
}

function flipMemoryCard(index) {
  const card = memoryCards[index];
  if (!memoryStarted || memoryPreviewing || !card || card.open || card.matched || openedCards.length >= 2) return;

  card.open = true;
  flipToken = card.uid;
  openedCards.push(index);
  renderMemoryBoard();
  window.setTimeout(() => {
    if (flipToken === card.uid) flipToken = "";
  }, 460);

  if (openedCards.length !== 2) return;
  const [firstIndex, secondIndex] = openedCards;
  const first = memoryCards[firstIndex];
  const second = memoryCards[secondIndex];
  if (first.src === second.src) {
    first.matched = true;
    second.matched = true;
    matchedCards += 2;
    openedCards = [];
    const finished = matchedCards === memoryCards.length;
    setText("#memoryStatus", finished ? "Acabou!!!Você é incrível. ♥" : "Boaaa!!!. ♥");
    renderMemoryBoard();
    if (finished) showMemoryVictory();
    return;
  }

  setText("#memoryStatus", "Quase!!! Tente de novo.");
  window.setTimeout(() => {
    first.open = false;
    second.open = false;
    openedCards = [];
    renderMemoryBoard();
  }, 800);
}

function showMemoryVictory() {
  if (victoryShown) return;
  victoryShown = true;
  document.querySelector(".memory-victory")?.remove();

  const overlay = create("div", "memory-victory", "");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Vitória no jogo de memória");

  const sparkleField = create("div", "victory-sparkles", "");
  for (let index = 0; index < 28; index += 1) {
    const sparkle = create("span", "", index % 3 === 0 ? "✦" : "♥");
    sparkle.style.setProperty("--x", `${Math.random() * 100}%`);
    sparkle.style.setProperty("--y", `${Math.random() * 100}%`);
    sparkle.style.setProperty("--delay", `${Math.random() * 0.45}s`);
    sparkleField.append(sparkle);
  }

  const popup = create("div", "victory-popup", "");
  popup.append(
    create("strong", "", "Você arrasa muito!!!"),
    create("p", "", "Maldito dom...")
  );
  const close = create("button", "note-button secondary", "Fechar");
  close.type = "button";
  close.addEventListener("click", () => overlay.remove());
  popup.append(close);

  overlay.append(sparkleField, popup);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  document.body.append(overlay);
}

function renderMilestones() {
  $("#milestones").replaceChildren(
    ...data.milestones.map((item) => {
      const article = create("article", "milestone");
      article.append(create("time", "", item.date));
      const body = create("div");
      body.append(create("h3", "", item.title), create("p", "", item.body));
      article.append(body);
      return article;
    })
  );
}

function renderNote() {
  const notes = [
"Amor, se cada vez que eu pensasse em você virasse uma linha de código, esse site aqui seria o maior sistema do mundo.",
"Você é a única pessoa que me faz sorrir para a tela do celular feito um bobo no meio de um lugar lotado.",
"Laura, você não é Wi-Fi, mas eu sinto uma conexão surreal toda vez que a gente se fala.",
"Eu juro que tentei achar um defeito em você, mas acho que o seu único defeito é não estar aqui comigo agora.",
"Amor, minha parte favorita da rotina é aquele momento em que a gente joga conversa fora e eu esqueço do resto.",
"Não sou previsão do tempo, mas posso garantir que o meu dia esquenta toda vez que você sorri pra mim.",
"Você é o tipo de notificação que eu nunca vou querer silenciar no meu celular.",
"Amor, eu gosto tanto de você que até os seus áudios longos eu escuto sem acelerar.",
"Até as aulas mais chatas e cansativas passam mais rápido quando eu fico lembrando de você.",
"Eu não ligo se é clichê, mas desde que você chegou, até as músicas românticas antigas começaram a fazer sentido.",
"Amor, eu queria ser um gatinho, só pra ter a desculpa de passar umas sete vidas inteiras do seu lado.",
"Você é a desculpa perfeita que o meu cérebro arruma para me distrair de qualquer outra coisa que eu devesse estar fazendo.",
"De todas as variáveis que existem na minha vida hoje, você é a única que eu faço questão que seja para sempre.",
"Eu não ligo de morar longe de tudo se, no final das contas, a minha casa for qualquer lugar que tenha você.",
"Amor, eu não sei fazer mágica, mas desde que a gente começou a se falar, todos os meus problemas parecem menores.",
"Se o meu abraço fosse um lugar de verdade, eu faria de tudo para você nunca mais querer se mudar de lá.",
"Você tem o monopólio dos meus pensamentos, e eu não estou nem um pouco a fim de reclamar disso.",
"Laura, a sua voz podia ser vendida na farmácia como remédio pra acalmar qualquer dia ruim meu.",
"Amor, eu descobri que a minha música favorita no mundo inteiro é o som da sua risada.",
"Eu não sei qual é a senha do seu coração, mas prometo que não vou parar de tentar adivinhar."
  ];
  let nextNote = notes[Math.floor(Math.random() * notes.length)];
  if (notes.length > 1) {
    while (nextNote === currentNote) {
      nextNote = notes[Math.floor(Math.random() * notes.length)];
    }
  }

  const note = $("#loveNote");
  if (!note) return;

  const section = note.closest(".note-section");
  const applyNote = () => {
    currentNote = nextNote;
    note.textContent = nextNote;
    note.classList.remove("is-changing", "is-fresh");
    void note.offsetWidth;
    note.classList.add("is-fresh");
  };

  section?.classList.remove("note-bloom");
  void section?.offsetWidth;
  section?.classList.add("note-bloom");

  if (!note.textContent.trim()) {
    applyNote();
    return;
  }

  note.classList.add("is-changing");
  window.setTimeout(applyNote, 180);
}

function setupFavicon() {
  const favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.href = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">♥</text></svg>')}`;
  document.head.appendChild(favicon);
}

function setupActiveNav() {
  const sections = document.querySelectorAll("section[id], .hero[id]");
  const navLinks = document.querySelectorAll(".nav a");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.remove("active"));
        document.querySelector(`.nav a[href="#${entry.target.id}"]`)?.classList.add("active");
      });
    },
    { rootMargin: "-40% 0px -50% 0px" }
  );
  sections.forEach((section) => observer.observe(section));
}

function setupRevealAnimations() {
  const targets = document.querySelectorAll(".section-heading, .stat-card, .panel, .milestone, .hero-stat, .phrase-card, .gallery-item, .verse-card");
  targets.forEach((element) => element.classList.add("reveal"));
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }),
    { threshold: 0.1 }
  );
  targets.forEach((element) => observer.observe(element));
}

function boot() {
  if (!data) {
    document.body.innerHTML = "<main class='section'><h1>Dados não encontrados</h1><p>Rode o gerador para criar o arquivo data.js.</p></main>";
    return;
  }
  setupFavicon();
  renderHero();
  renderLoveTimer();
  window.setInterval(renderLoveTimer, 1000);
  renderVerse();
  renderStoryStats();
  renderPhrases();
  renderTopics();
  renderWords();
  renderRhythm();
  renderPhotoGallery();
  setupMemoryGame();
  renderMilestones();
  renderNote();
  setText("#generatedAt", `Atualizado em ${data.generatedAt}`);

  $("#verseButton")?.addEventListener("click", renderVerse);
  $("#noteButton")?.addEventListener("click", renderNote);
  $("#restartMemory")?.addEventListener("click", startMemoryGame);
  setupActiveNav();
  setupRevealAnimations();
}

boot();
