(function () {
  "use strict";

  var app = document.getElementById("app");
  var WEEK = ["日", "月", "火", "水", "木", "金", "土"];

  /* ---------- helpers ---------- */
  function h(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") node.className = v;
        else if (k === "text") node.textContent = v;
        else node.setAttribute(k, v === true ? "" : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x) node.appendChild(x); });
      else node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  function getJSON(path) {
    return fetch(path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(path + " (" + r.status + ")");
      return r.json();
    });
  }

  function fmtDate(iso) {
    var p = iso.split("-").map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    return p[1] + "月" + p[2] + "日（" + WEEK[d.getDay()] + "）";
  }

  function fmtDateTime(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return (d.getMonth() + 1) + "月" + d.getDate() + "日 " +
      ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + " 更新";
  }

  function grade(g) {
    return h("span", { class: "grade " + g.toLowerCase().replace(/[^g0-9]/g, "") }, g);
  }

  function setTitle(t) {
    document.title = t ? t + "｜重賞ノート" : "重賞ノート｜G1・G2・G3のAI予想と根拠";
  }

  function setNav(key) {
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      if (a.getAttribute("data-nav") === key) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function mount(nodes) {
    app.innerHTML = "";
    [].concat(nodes).flat(Infinity).forEach(function (n) { if (n) app.appendChild(n); });
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  function showError(err) {
    mount([
      h("h1", { text: "表示できませんでした" }),
      h("p", { class: "lead", text: "データを読み込めませんでした。ページを再読み込みしてください。" }),
      h("p", { class: "muted", text: String(err && err.message ? err.message : err) }),
      h("p", { class: "muted", text: "ファイルを直接開いている場合は、ローカルサーバー（python3 -m http.server）で開くか、GitHub Pages上で確認してください。" })
    ]);
  }

  /* ---------- home ---------- */
  function renderHome() {
    setNav("home");
    setTitle("");
    return getJSON("data/races.json").then(function (data) {
      var byDate = {};
      data.races.forEach(function (r) { (byDate[r.date] = byDate[r.date] || []).push(r); });
      var dates = Object.keys(byDate).sort();

      var days = dates.map(function (d) {
        var rows = byDate[d]
          .sort(function (a, b) { return (a.time || "99").localeCompare(b.time || "99"); })
          .map(function (r) {
            var ready = r.status !== "preparing";
            var meta = [r.venue, r.course, r.time ? r.time + " 発走" : null, r.note].filter(Boolean).join("　");
            var inner = [
              grade(r.grade),
              h("span", { class: "name", text: r.name }),
              h("span", { class: "state " + (ready ? "badge-ready" : "badge-wait"), text: ready ? "予想を見る" : "準備中" }),
              h("span", { class: "meta", text: meta }),
              r.headline ? h("p", { class: "headline", text: r.headline }) : null
            ];
            var li = h("li", { class: "race-row" + (ready ? " is-ready" : "") });
            if (ready) {
              var a = h("a", { class: "row-link", href: "#/race/" + r.id }, inner);
              li.appendChild(a);
            } else {
              inner.forEach(function (n) { if (n) li.appendChild(n); });
            }
            return li;
          });
        return h("section", { class: "day" },
          h("h2", { text: fmtDate(d) }),
          h("ul", { class: "race-list" }, rows));
      });

      mount([
        h("h1", { text: "今週の重賞" }),
        h("p", { class: "lead", text: "G1・G2・G3の予想を、過去の傾向・コース・馬場・オッズから考えて、根拠つきで載せています。" }),
        h("p", { class: "muted", text: fmtDateTime(data.updatedAt) }),
        days
      ]);
    });
  }

  /* ---------- race ---------- */
  function ratingChips(ratings, legend) {
    var keys = ["ability", "fit", "form"];
    var chips = keys.filter(function (k) { return ratings && ratings[k]; }).map(function (k) {
      return h("span", { class: "chip" }, legend[k] || k, h("b", { text: ratings[k] }));
    });
    return chips.length ? h("div", { class: "chips" }, chips) : null;
  }

  function renderRace(id) {
    setNav("home");
    return getJSON("data/" + encodeURIComponent(id) + ".json").then(function (r) {
      setTitle(r.name);
      var legend = r.ratingsLegend || {};

      var head = h("header", { class: "race-head" },
        h("p", { class: "crumb" }, h("a", { href: "#/", text: "今週の重賞に戻る" })),
        h("div", { class: "kicker" },
          grade(r.grade),
          h("span", { text: fmtDate(r.date) + " " + r.venue + r.race + "　" + r.time + " 発走" })),
        h("h1", { text: r.name }),
        h("p", { class: "muted", text: r.course + "　" + r.conditions }),
        r.status === "provisional"
          ? h("p", { class: "status-box", text: "暫定予想です。ハンデ・枠順・馬場・オッズが出たら更新します。（" + fmtDateTime(r.updatedAt) + "）" })
          : null);

      var marks = h("ol", { class: "marks" }, r.picks.map(function (p) {
        var main = p.mark === "◎";
        return h("li", { class: "mark-row" + (main ? " is-main" : "") },
          h("span", { class: "mark-glyph", "aria-label": "印 " + p.mark, text: p.mark }),
          h("div", null,
            h("div", { class: "mark-horse" }, p.horse, h("small", { text: p.jockey })),
            h("p", { class: "mark-sum", text: p.summary }),
            h("details", { class: "why", open: main },
              h("summary", { text: "根拠を見る" }),
              h("ul", null, p.reasons.map(function (t) { return h("li", { text: t }); })))));
      }));

      var verdict = h("section", { class: "verdict" },
        h("p", { class: "lead", text: r.headline }),
        marks);

      var field = h("section", null,
        h("h2", { text: "出走予定馬（登録" + r.field.length + "頭）" }),
        h("div", { class: "field" }, r.field.map(function (f) {
          var main = f.mark === "◎";
          return h("div", { class: "f-row" },
            h("span", { class: "f-mark" + (main ? " is-main" : ""), text: f.mark || "－" }),
            h("span", { class: "f-name" }, f.name, h("small", { text: f.jockey })),
            h("p", { class: "f-note", text: f.note }),
            ratingChips(f.ratings, legend));
        })),
        h("p", { class: "legend", text: "評価はA・B・Cの3段階です。空欄は、まだ調べきれていない項目です。" }));

      var analysis = h("div", { class: "analysis" }, r.sections.map(function (s) {
        return h("section", null,
          h("h2", { text: s.title }),
          s.paragraphs.map(function (t) { return h("p", { text: t }); }),
          s.points ? h("ul", { class: "points" }, s.points.map(function (t) { return h("li", { text: t }); })) : null);
      }));

      var pending = h("section", null,
        h("h2", { text: "まだ確定していないこと" }),
        h("ul", { class: "pending" }, r.pending.map(function (t) { return h("li", { text: t }); })));

      var sources = h("section", null,
        h("h2", { text: "参考にした情報" }),
        h("ol", { class: "sources" }, r.sources.map(function (s) {
          return h("li", null, h("a", { href: s.url, target: "_blank", rel: "noopener noreferrer", text: s.title }));
        })));

      mount([head, verdict, field, analysis, pending, sources]);
    });
  }

  /* ---------- record ---------- */
  function renderRecord() {
    setNav("record");
    setTitle("予想の成績");
    return getJSON("data/record.json").then(function (rec) {
      var body;
      if (!rec.entries.length) {
        body = h("div", { class: "empty" },
          h("p", { text: "まだ結果はありません。" }),
          h("p", { class: "muted", text: "最初のレース（11月8日）が終わったら、予想と結果を追記します。" }));
      } else {
        body = h("table", { class: "rec-table" },
          h("thead", null, h("tr", null,
            ["レース", "予想の印", "結果（1〜3着）", "判定"].map(function (t) { return h("th", { scope: "col", text: t }); }))),
          h("tbody", null, rec.entries.map(function (e) {
            return h("tr", null,
              h("td", { text: e.raceName + "（" + fmtDate(e.date) + "）" }),
              h("td", { text: e.picks.map(function (p) { return p.mark + p.horse; }).join(" ") }),
              h("td", { text: e.result.join(" → ") }),
              h("td", { class: e.hit ? "hit" : "", text: (e.hit ? "的中" : "不的中") + (e.note ? "　" + e.note : "") }));
          })));
      }
      mount([
        h("h1", { text: "予想の成績" }),
        h("p", { class: "lead", text: rec.note }),
        body
      ]);
    });
  }

  /* ---------- about ---------- */
  function renderAbout() {
    setNav("about");
    setTitle("このサイトについて");
    var prose = h("div", { class: "prose" },
      h("h2", { text: "予想の作り方" }),
      h("p", { text: "毎週の重賞（G1・G2・G3）について、次の材料を集めてAIが予想と根拠を書いています。" }),
      h("ul", null,
        ["過去10年のレース結果と人気・配当の傾向",
         "コース（距離・左右回り・坂）と、勝ち時計・ラップ",
         "各馬の近走内容と、同じコースや距離での実績",
         "馬場状態と天気",
         "枠順・ハンデ・オッズ（確定後）"].map(function (t) { return h("li", { text: t }); })),
      h("h2", { text: "印と評価の見方" }),
      h("p", { text: "◎が本命、○が対抗、▲が単穴、△が連下、注が注意の馬です。各馬の評価は、能力・実績、距離・コース適性、近走の内容をA・B・Cの3段階で付けています。" }),
      h("h2", { text: "分からないことは分からないと書きます" }),
      h("p", { text: "調べきれなかった項目は空欄にして、「まだ確定していないこと」に書き出しています。ハンデや枠順、オッズが出てから予想を更新し、更新時刻も載せます。" }),
      h("h2", { text: "成績の公開" }),
      h("p", { text: "当たった予想も外れた予想も、「予想の成績」にそのまま残します。" }),
      h("h2", { text: "ご注意" }),
      h("p", { text: "このサイトの予想は、的中や払い戻しを保証するものではありません。情報には誤りや更新漏れがある可能性があります。出走表・オッズ・結果は、必ずJRAの発表でご確認ください。馬券の購入は自己責任でお願いします。" }));
    mount([h("h1", { text: "このサイトについて" }), prose]);
  }

  /* ---------- router ---------- */
  function route() {
    var hash = location.hash.replace(/^#/, "") || "/";
    var parts = hash.split("/").filter(Boolean);
    var job;
    if (parts[0] === "race" && parts[1]) job = renderRace(parts[1]);
    else if (parts[0] === "record") job = renderRecord();
    else if (parts[0] === "about") job = renderAbout();
    else job = renderHome();
    return Promise.resolve(job).catch(showError);
  }

  window.addEventListener("hashchange", route);
  route();
})();
