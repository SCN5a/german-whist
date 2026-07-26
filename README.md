# German Whist — a due telefoni

Gioco di carte German Whist per due giocatori, ognuno sul proprio telefono.
Nessun server e nessun account: i due telefoni si parlano direttamente
(WebRTC via PeerJS); la pagina è servita da GitHub Pages.

**Gioca:** apri il sito, uno crea la stanza e l'altra si unisce col codice
di 4 lettere (o col link d'invito condiviso).

- `index.html` — la partita online (stanza, codice, riconnessione).
- `passplay.html` — variante passa-il-telefono per giocare in due su un
  solo dispositivo.
- `game-logic.js` — logica di gioco pura; sviluppata e testata in un
  workspace separato (regole di presa, obbligo di seme, fasi, 200 partite
  simulate con controllo di invarianti).
- `peerjs.min.js` — PeerJS 1.5.4 (vendored da npm).

## Regole in breve

52 carte, Asso alto, 13 a testa, tallone di 26. La prima carta del tallone,
scoperta, fissa la briscola. Fase 1: chi vince la presa prende la carta
scoperta, chi perde pesca coperta. Fase 2 (tallone esaurito): ogni presa
vale un punto; vince chi ne fa almeno 7. Obbligo di rispondere al seme.
